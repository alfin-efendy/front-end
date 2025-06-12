
import React, { useCallback, useRef } from 'react';
import { useAnnotationStore } from '@/lib/useAnnotationStore';
import { BoundingBox } from './BoundingBox';

export function CanvasContainer() {
  const {
    loadedImage,
    isImageLoading,
    zoomLevel,
    panOffset,
    boundingBoxes,
    isCreatingBox,
    isDragging,
    isResizing,
    dragStart,
    previewBox,
    addBoundingBox,
    setIsCreatingBox,
    setDragStart,
    setPreviewBox,
    selectBoundingBox,
    zoomIn,
    zoomOut,
  } = useAnnotationStore();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const createBoxRef = useRef<{ startX: number; startY: number } | null>(null);
  
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (!loadedImage || isDragging || isResizing) return;
    
    // Get the image element to calculate proper coordinates
    const imageElement = e.currentTarget.querySelector('img') as HTMLImageElement;
    if (!imageElement) return;
    
    const imageRect = imageElement.getBoundingClientRect();
    const x = (e.clientX - imageRect.left) / zoomLevel;
    const y = (e.clientY - imageRect.top) / zoomLevel;
    
    // Only start creating if clicking on the image
    if (x >= 0 && y >= 0 && x <= loadedImage.width && y <= loadedImage.height) {
      // Deselect any selected box first
      selectBoundingBox(null);
      
      // Start creating new bounding box
      setIsCreatingBox(true);
      createBoxRef.current = { startX: x, startY: y };
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  }, [loadedImage, isDragging, isResizing, zoomLevel, selectBoundingBox, setIsCreatingBox, setDragStart]);
  
  const handleWheel = useCallback((e: React.WheelEvent) => {
    // Only zoom if Ctrl key is pressed
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      
      if (e.deltaY < 0) {
        zoomIn();
      } else {
        zoomOut();
      }
    }
  }, [zoomIn, zoomOut]);
  
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isCreatingBox && createBoxRef.current && containerRef.current && loadedImage) {
        // Get the image element for proper coordinate calculation
        const imageElement = containerRef.current.querySelector('img') as HTMLImageElement;
        if (!imageElement) return;
        
        const imageRect = imageElement.getBoundingClientRect();
        const currentX = (e.clientX - imageRect.left) / zoomLevel;
        const currentY = (e.clientY - imageRect.top) / zoomLevel;
        
        // Calculate preview box dimensions
        const startX = Math.min(createBoxRef.current.startX, currentX);
        const startY = Math.min(createBoxRef.current.startY, currentY);
        const width = Math.abs(currentX - createBoxRef.current.startX);
        const height = Math.abs(currentY - createBoxRef.current.startY);
        
        // Constrain to image boundaries
        const constrainedX = Math.max(0, Math.min(startX, loadedImage.width));
        const constrainedY = Math.max(0, Math.min(startY, loadedImage.height));
        const constrainedWidth = Math.min(width, loadedImage.width - constrainedX);
        const constrainedHeight = Math.min(height, loadedImage.height - constrainedY);
        
        setPreviewBox({
          x: constrainedX,
          y: constrainedY,
          width: constrainedWidth,
          height: constrainedHeight,
        });
      }
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      if (isCreatingBox && createBoxRef.current && containerRef.current && loadedImage) {
        // Get the image element for proper coordinate calculation
        const imageElement = containerRef.current.querySelector('img') as HTMLImageElement;
        if (!imageElement) return;
        
        const imageRect = imageElement.getBoundingClientRect();
        const endX = (e.clientX - imageRect.left) / zoomLevel;
        const endY = (e.clientY - imageRect.top) / zoomLevel;
        
        const startX = Math.min(createBoxRef.current.startX, endX);
        const startY = Math.min(createBoxRef.current.startY, endY);
        const width = Math.abs(endX - createBoxRef.current.startX);
        const height = Math.abs(endY - createBoxRef.current.startY);
        
        // Constrain bounding box to image boundaries
        const constrainedX = Math.max(0, Math.min(startX, loadedImage.width - 10));
        const constrainedY = Math.max(0, Math.min(startY, loadedImage.height - 10));
        const constrainedWidth = Math.min(width, loadedImage.width - constrainedX);
        const constrainedHeight = Math.min(height, loadedImage.height - constrainedY);
        
        // Only create box if it has meaningful size and is within image bounds
        if (constrainedWidth > 10 && constrainedHeight > 10) {
          const newBoxId = Date.now().toString();
          addBoundingBox({
            label: `Annotation ${boundingBoxes.length + 1}`,
            x: constrainedX,
            y: constrainedY,
            width: constrainedWidth,
            height: constrainedHeight,
            color: '#3B82F6',
          });
          // The addBoundingBox function automatically selects the new box, so we don't need to do it here
        }
        
        setIsCreatingBox(false);
        setDragStart(null);
        setPreviewBox(null);
        createBoxRef.current = null;
      }
    };
    
    if (isCreatingBox) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isCreatingBox, zoomLevel, addBoundingBox, boundingBoxes.length, setIsCreatingBox, setDragStart, setPreviewBox, loadedImage]);
  
  if (isImageLoading) {
    return (
      <div className="absolute inset-4 overflow-auto bg-gray-50 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading image...</p>
        </div>
      </div>
    );
  }
  
  if (!loadedImage) {
    return (
      <div className="absolute inset-4 overflow-auto bg-gray-50 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-lg font-medium mb-2">Load an image to start annotating</p>
          <p className="text-sm">Enter an image URL above and click "Load Image"</p>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      ref={containerRef}
      className="absolute inset-4 overflow-auto bg-gray-50 rounded-lg cursor-crosshair"
      onMouseDown={handleCanvasMouseDown}
      onWheel={handleWheel}
    >
      <div 
        className="relative inline-block min-w-full min-h-full"
        style={{
          transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
          transformOrigin: '0 0',
        }}
      >
        <img 
          src={loadedImage.src}
          alt="Loaded image for annotation"
          className="block max-w-none"
          draggable={false}
        />
        
        {/* Bounding boxes overlay */}
        <div className="absolute inset-0">
          {boundingBoxes.map((box) => (
            <BoundingBox 
              key={box.id} 
              box={box} 
              zoomLevel={zoomLevel}
            />
          ))}
          
          {/* Preview box while creating */}
          {previewBox && (
            <div
              className="absolute border-2 border-dashed border-blue-500 bg-blue-500 bg-opacity-10 pointer-events-none"
              style={{
                left: `${previewBox.x}px`,
                top: `${previewBox.y}px`,
                width: `${previewBox.width}px`,
                height: `${previewBox.height}px`,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
