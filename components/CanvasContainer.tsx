import React, { useCallback, useRef, useState } from 'react';
import { useAnnotationStore } from '@/lib/useAnnotationStore';
import { BoundingBox } from './BoundingBox';

interface CanvasContainerProps {
  selectedTool?: 'select' | 'pan';
}

export function CanvasContainer({ selectedTool = 'select' }: CanvasContainerProps) {
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
    setPanOffset,
  } = useAnnotationStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPanning, setIsPanning] = React.useState(false);
  const [panStart, setPanStart] = React.useState<{ x: number; y: number } | null>(null);

  // Get canvas coordinates from screen coordinates
  const getCanvasCoordinates = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current || !loadedImage) return { x: 0, y: 0 };

    const rect = containerRef.current.getBoundingClientRect();
    // Convert screen coordinates to image coordinates accounting for pan and zoom
    const x = (clientX - rect.left - panOffset.x) / zoomLevel;
    const y = (clientY - rect.top - panOffset.y) / zoomLevel;

    // Ensure coordinates are within image bounds
    const constrainedX = Math.max(0, Math.min(x, loadedImage.width));
    const constrainedY = Math.max(0, Math.min(y, loadedImage.height));

    return { x: constrainedX, y: constrainedY };
  }, [zoomLevel, panOffset, loadedImage]);

  // Get screen coordinates from canvas coordinates
  const getScreenCoordinates = useCallback((canvasX: number, canvasY: number) => {
    return {
      x: canvasX * zoomLevel + panOffset.x,
      y: canvasY * zoomLevel + panOffset.y
    };
  }, [zoomLevel, panOffset]);

  // Handle mouse down
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!loadedImage) return;

    const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);

    if (selectedTool === 'pan') {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    // Handle select tool - start creating bounding box
    if (selectedTool === 'select') {
      // Only start creating if clicking within image bounds
      if (x >= 0 && y >= 0 && x <= loadedImage.width && y <= loadedImage.height) {
        setIsCreatingBox(true);
        setDragStart({ x, y });
        setPreviewBox({ x, y, width: 0, height: 0 });
        selectBoundingBox(null); // Deselect any selected box
      }
    }
  }, [loadedImage, selectedTool, getCanvasCoordinates, setIsCreatingBox, setDragStart, setPreviewBox, selectBoundingBox]);

  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!loadedImage) return;

    if (isPanning && panStart) {
      const deltaX = e.clientX - panStart.x;
      const deltaY = e.clientY - panStart.y;
      setPanOffset({
        x: panOffset.x + deltaX,
        y: panOffset.y + deltaY
      });
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    if (isCreatingBox && dragStart) {
      const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);
      const newBox = {
        x: Math.min(dragStart.x, x),
        y: Math.min(dragStart.y, y),
        width: Math.abs(x - dragStart.x),
        height: Math.abs(y - dragStart.y)
      };
      setPreviewBox(newBox);
    }
  }, [loadedImage, isPanning, panStart, panOffset, isCreatingBox, dragStart, getCanvasCoordinates, setPanOffset, setPreviewBox]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      setPanStart(null);
    }

    if (isCreatingBox && previewBox && previewBox.width > 5 && previewBox.height > 5) {
      addBoundingBox({
        label: '', //New bounding box don't have labels by default
        x: previewBox.x,
        y: previewBox.y,
        width: previewBox.width,
        height: previewBox.height,
        color: '#3B82F6'
      });
    }

    setIsCreatingBox(false);
    setDragStart(null);
    setPreviewBox(null);
  }, [isPanning, isCreatingBox, previewBox, addBoundingBox, setIsCreatingBox, setDragStart, setPreviewBox]);

  // Handle wheel for zooming
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      if (e.deltaY < 0) {
        zoomIn();
      } else {
        zoomOut();
      }
    }
  }, [zoomIn, zoomOut]);

  // Prevent browser zoom on Ctrl+wheel globally
  React.useEffect(() => {
    const preventBrowserZoom = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };

    // Add the event listener to the document
    document.addEventListener('wheel', preventBrowserZoom, { passive: false });

    return () => {
      document.removeEventListener('wheel', preventBrowserZoom);
    };
  }, []);

  // Update cursor based on tool
  const getCursor = () => {
    if (selectedTool === 'pan') {
      return isPanning ? 'grabbing' : 'grab';
    }
    return 'crosshair';
  };

  // Handle drag over to allow drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const label = e.dataTransfer.getData("text/plain");
    const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);

    // Find if dropped inside a bounding box and update the label
    boundingBoxes.forEach(box => {
      if (x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height) {
        //Here you would dispatch an action to update the label of the bounding box.
        //Example: dispatch(updateBoundingBoxLabel(box.id, label));
        console.log(`Dropped label "${label}" inside bounding box ${box.id}`);
      }
    });
  }, [boundingBoxes, getCanvasCoordinates]);

  if (isImageLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading image...</div>
      </div>
    );
  }

  if (!loadedImage) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">No image loaded</div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-primary-foreground"
      style={{ cursor: getCursor() }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Image */}
      <img
        src={loadedImage.src}
        alt="Annotation target"
        className="absolute select-none"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
          transformOrigin: '0 0',
          maxWidth: 'none',
          maxHeight: 'none'
        }}
        draggable={false}
      />

      {/* Bounding boxes */}
      <div className="absolute inset-0 pointer-events-none">
        {boundingBoxes.map((box) => {
          const screenCoords = getScreenCoordinates(box.x, box.y);
          return (
            <div
              key={box.id}
              className="absolute pointer-events-auto"
              style={{
                left: screenCoords.x,
                top: screenCoords.y,
                width: box.width * zoomLevel,
                height: box.height * zoomLevel,
              }}
            >
              <BoundingBox
                box={box}
                zoomLevel={zoomLevel}
              />
            </div>
          );
        })}
      </div>

      {/* Preview box while creating */}
      {previewBox && isCreatingBox && (
        <div
          className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-20 pointer-events-none"
          style={{
            left: getScreenCoordinates(previewBox.x, previewBox.y).x,
            top: getScreenCoordinates(previewBox.x, previewBox.y).y,
            width: previewBox.width * zoomLevel,
            height: previewBox.height * zoomLevel,
          }}
        />
      )}
    </div>
  );
}