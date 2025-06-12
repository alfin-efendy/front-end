
import React, { useCallback, useRef } from 'react';
import { useAnnotationStore } from '@/lib/useAnnotationStore';
import type { BoundingBox as BoundingBoxType } from '@/lib/useAnnotationStore';

interface BoundingBoxProps {
  box: BoundingBoxType;
  zoomLevel: number;
}

export function BoundingBox({ box, zoomLevel }: BoundingBoxProps) {
  const {
    selectedBoxId,
    selectBoundingBox,
    updateBoundingBox,
    setIsDragging,
    setIsResizing,
    setDragStart,
  } = useAnnotationStore();
  
  const dragRef = useRef<{ startX: number; startY: number; startBoxX: number; startBoxY: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; direction: string; startBox: BoundingBoxType } | null>(null);
  
  const isSelected = selectedBoxId === box.id;
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    selectBoundingBox(box.id);
    setIsDragging(true);
    
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startBoxX: box.x,
      startBoxY: box.y,
    };
    
    setDragStart({ x: e.clientX, y: e.clientY });
  }, [box.id, box.x, box.y, selectBoundingBox, setIsDragging, setDragStart]);
  
  const handleResizeMouseDown = useCallback((e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    selectBoundingBox(box.id);
    setIsResizing(true);
    
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      direction,
      startBox: { ...box },
    };
  }, [box, selectBoundingBox, setIsResizing]);
  
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragRef.current && selectedBoxId === box.id) {
        const deltaX = (e.clientX - dragRef.current.startX) / zoomLevel;
        const deltaY = (e.clientY - dragRef.current.startY) / zoomLevel;
        
        // Get image dimensions from the store
        const { loadedImage } = useAnnotationStore.getState();
        
        if (loadedImage) {
          const newX = dragRef.current.startBoxX + deltaX;
          const newY = dragRef.current.startBoxY + deltaY;
          
          // Constrain to image boundaries
          const constrainedX = Math.max(0, Math.min(newX, loadedImage.width - box.width));
          const constrainedY = Math.max(0, Math.min(newY, loadedImage.height - box.height));
          
          updateBoundingBox(box.id, {
            x: constrainedX,
            y: constrainedY,
          });
        }
      }
      
      if (resizeRef.current && selectedBoxId === box.id) {
        const deltaX = (e.clientX - resizeRef.current.startX) / zoomLevel;
        const deltaY = (e.clientY - resizeRef.current.startY) / zoomLevel;
        const { direction, startBox } = resizeRef.current;
        
        // Get image dimensions from the store
        const { loadedImage } = useAnnotationStore.getState();
        
        if (loadedImage) {
          let newX = startBox.x;
          let newY = startBox.y;
          let newWidth = startBox.width;
          let newHeight = startBox.height;
          
          if (direction.includes('n')) {
            const proposedY = startBox.y + deltaY;
            const proposedHeight = startBox.height - deltaY;
            if (proposedY >= 0 && proposedHeight >= 10) {
              newY = proposedY;
              newHeight = proposedHeight;
            }
          }
          
          if (direction.includes('s')) {
            const proposedHeight = startBox.height + deltaY;
            if (startBox.y + proposedHeight <= loadedImage.height && proposedHeight >= 10) {
              newHeight = proposedHeight;
            }
          }
          
          if (direction.includes('w')) {
            const proposedX = startBox.x + deltaX;
            const proposedWidth = startBox.width - deltaX;
            if (proposedX >= 0 && proposedWidth >= 10) {
              newX = proposedX;
              newWidth = proposedWidth;
            }
          }
          
          if (direction.includes('e')) {
            const proposedWidth = startBox.width + deltaX;
            if (startBox.x + proposedWidth <= loadedImage.width && proposedWidth >= 10) {
              newWidth = proposedWidth;
            }
          }
          
          updateBoundingBox(box.id, {
            x: newX,
            y: newY,
            width: newWidth,
            height: newHeight,
          });
        }
      }
    };
    
    const handleMouseUp = () => {
      if (dragRef.current) {
        dragRef.current = null;
        setIsDragging(false);
      }
      
      if (resizeRef.current) {
        resizeRef.current = null;
        setIsResizing(false);
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [selectedBoxId, box.id, box.width, box.height, zoomLevel, updateBoundingBox, setIsDragging, setIsResizing]);
  
  // Resize handles
  const resizeHandles = [
    { direction: 'nw', cursor: 'nw-resize', className: 'top-0 left-0 -translate-x-1/2 -translate-y-1/2' },
    { direction: 'n', cursor: 'n-resize', className: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2' },
    { direction: 'ne', cursor: 'ne-resize', className: 'top-0 right-0 translate-x-1/2 -translate-y-1/2' },
    { direction: 'e', cursor: 'e-resize', className: 'top-1/2 right-0 translate-x-1/2 -translate-y-1/2' },
    { direction: 'se', cursor: 'se-resize', className: 'bottom-0 right-0 translate-x-1/2 translate-y-1/2' },
    { direction: 's', cursor: 's-resize', className: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2' },
    { direction: 'sw', cursor: 'sw-resize', className: 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2' },
    { direction: 'w', cursor: 'w-resize', className: 'top-1/2 left-0 -translate-x-1/2 -translate-y-1/2' },
  ];
  
  return (
    <div className="relative w-full h-full">
      {/* Main bounding box */}
      <div
        className={`
          w-full h-full border-2 cursor-move
          ${isSelected ? 'border-blue-500' : 'border-gray-400'}
          ${isSelected ? 'bg-blue-500 bg-opacity-10' : 'bg-transparent'}
        `}
        style={{ borderColor: box.color }}
        onMouseDown={handleMouseDown}
      >
        {/* Label */}
        <div
          className="absolute -top-6 left-0 px-1 py-0.5 text-xs text-white rounded"
          style={{ backgroundColor: box.color, fontSize: `${Math.max(10, 2 / zoomLevel)}px` }}
        >
          {box.label}
        </div>
      </div>
      
      {/* Resize handles - only show when selected */}
      {isSelected && (
        <>
          {resizeHandles.map(({ direction, cursor, className }) => (
            <div
              key={direction}
              className={`absolute w-2 h-2 bg-blue-500 border border-white cursor-${cursor} ${className}`}
              style={{ 
                width: `${Math.max(6, 2 / zoomLevel)}px`, 
                height: `${Math.max(6, 2 / zoomLevel)}px` 
              }}
              onMouseDown={(e) => handleResizeMouseDown(e, direction)}
            />
          ))}
        </>
      )}
    </div>
  );
}
