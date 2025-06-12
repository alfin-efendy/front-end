
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
            newY = Math.max(0, proposedY);
            newHeight = Math.max(10, Math.min(proposedHeight + (proposedY - newY), startBox.y + startBox.height));
          }
          if (direction.includes('s')) {
            newHeight = Math.max(10, Math.min(startBox.height + deltaY, loadedImage.height - startBox.y));
          }
          if (direction.includes('w')) {
            const proposedX = startBox.x + deltaX;
            const proposedWidth = startBox.width - deltaX;
            newX = Math.max(0, proposedX);
            newWidth = Math.max(10, Math.min(proposedWidth + (proposedX - newX), startBox.x + startBox.width));
          }
          if (direction.includes('e')) {
            newWidth = Math.max(10, Math.min(startBox.width + deltaX, loadedImage.width - startBox.x));
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
        setIsDragging(false);
        setDragStart(null);
        dragRef.current = null;
      }
      if (resizeRef.current) {
        setIsResizing(false);
        resizeRef.current = null;
      }
    };
    
    if (dragRef.current || resizeRef.current) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [box.id, selectedBoxId, zoomLevel, updateBoundingBox, setIsDragging, setIsResizing, setDragStart]);
  
  return (
    <div
      className={`absolute cursor-move group ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      style={{
        left: `${box.x}px`,
        top: `${box.y}px`,
        width: `${box.width}px`,
        height: `${box.height}px`,
        borderColor: box.color,
        backgroundColor: `${box.color}20`,
        zIndex: isSelected ? 20 : 10,
      }}
      onMouseDown={handleMouseDown}
    >
      <div 
        className="absolute inset-0 border-2"
        style={{ borderColor: box.color }}
      />
      
      {/* Label */}
      <div 
        className="absolute -top-6 left-0 px-2 py-1 text-xs text-white rounded whitespace-nowrap"
        style={{ backgroundColor: box.color }}
      >
        <span>{box.label}</span>
        <span className="ml-1 opacity-75">#{box.id.slice(-3)}</span>
      </div>
      
      {/* Resize handles - only show when selected */}
      {isSelected && (
        <>
          <div 
            className="absolute -top-2 -left-2 w-4 h-4 bg-white border-2 rounded-sm shadow-sm cursor-nw-resize"
            style={{ borderColor: box.color }}
            onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
          />
          <div 
            className="absolute -top-2 -right-2 w-4 h-4 bg-white border-2 rounded-sm shadow-sm cursor-ne-resize"
            style={{ borderColor: box.color }}
            onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
          />
          <div 
            className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border-2 rounded-sm shadow-sm cursor-sw-resize"
            style={{ borderColor: box.color }}
            onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
          />
          <div 
            className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 rounded-sm shadow-sm cursor-se-resize"
            style={{ borderColor: box.color }}
            onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
          />
        </>
      )}
    </div>
  );
}
