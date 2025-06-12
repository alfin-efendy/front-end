import React, { useCallback, useRef, useEffect } from 'react';
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
    const x = (clientX - rect.left - panOffset.x) / zoomLevel;
    const y = (clientY - rect.top - panOffset.y) / zoomLevel;

    return { x, y };
  }, [zoomLevel, panOffset, loadedImage]);

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
      setIsCreatingBox(true);
      setDragStart({ x, y });
      setPreviewBox({ x, y, width: 0, height: 0 });
    }
  }, [loadedImage, selectedTool, getCanvasCoordinates, setIsCreatingBox, setDragStart, setPreviewBox]);

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
      setPreviewBox({
        x: Math.min(dragStart.x, x),
        y: Math.min(dragStart.y, y),
        width: Math.abs(x - dragStart.x),
        height: Math.abs(y - dragStart.y)
      });
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
        label: 'New Label',
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
      if (e.deltaY < 0) {
        zoomIn();
      } else {
        zoomOut();
      }
    }
  }, [zoomIn, zoomOut]);

  // Update cursor based on tool
  const getCursor = () => {
    if (selectedTool === 'pan') {
      return isPanning ? 'grabbing' : 'grab';
    }
    return 'crosshair';
  };

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
      className="relative w-full h-full overflow-hidden bg-gray-100"
      style={{ cursor: getCursor() }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Image */}
      <img
        src={loadedImage.src}
        alt="Annotation target"
        className="absolute"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
          transformOrigin: '0 0',
          maxWidth: 'none',
          maxHeight: 'none'
        }}
        draggable={false}
      />

      {/* Bounding boxes */}
      {boundingBoxes.map((box) => (
        <BoundingBox
          key={box.id}
          box={box}
          zoomLevel={zoomLevel}
        />
      ))}

      {/* Preview box while creating */}
      {previewBox && isCreatingBox && (
        <div
          className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-20 pointer-events-none"
          style={{
            left: previewBox.x * zoomLevel + panOffset.x,
            top: previewBox.y * zoomLevel + panOffset.y,
            width: previewBox.width * zoomLevel,
            height: previewBox.height * zoomLevel,
          }}
        />
      )}
    </div>
  );
}