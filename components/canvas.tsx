"use client";

import type React from "react";
import { useEffect, useCallback } from "react";

interface DocumentCanvasProps {
  image: string | null;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  canvasContainerRef: React.RefObject<HTMLDivElement | null>;
  handleMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleMouseUp: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  zoomLevel?: number;
  onCanvasResize?: () => void;
  onZoomChange?: (zoom: number) => void;
}

export function DocumentCanvas({
  image,
  canvasRef,
  canvasContainerRef,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  zoomLevel = 1,
  onCanvasResize,
  onZoomChange,
}: DocumentCanvasProps) {
  // Handle mouse wheel zoom
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (!onZoomChange || !image) return;

      // Only zoom if Ctrl key is pressed
      if (!e.ctrlKey) return;

      // Prevent default browser behavior (page scrolling)
      e.preventDefault();

      // Calculate new zoom level with 5% increments
      const delta = e.deltaY < 0 ? 0.05 : -0.05; // 5% increment or decrement
      const newZoom = Math.max(0.1, Math.min(5, zoomLevel + delta));

      // Only update if the zoom level actually changed
      if (newZoom !== zoomLevel) {
        // Apply new zoom level
        onZoomChange(newZoom);
      }
    },
    [onZoomChange, zoomLevel, image]
  );

  // Add wheel event listener
  useEffect(() => {
    const container = canvasContainerRef?.current;
    if (container && onZoomChange) {
      container.addEventListener("wheel", handleWheel, { passive: false });
      return () => {
        container.removeEventListener("wheel", handleWheel);
      };
    }
  }, [canvasContainerRef, handleWheel, onZoomChange]);

  // Update canvas when zoom level changes
  useEffect(() => {
    if (onCanvasResize) {
      onCanvasResize();
    }
  }, [zoomLevel, onCanvasResize]);

  return (
    <div
      ref={canvasContainerRef}
      className="relative overflow-auto h-full"
    >
      <div
        style={{
          transform: `scale(${zoomLevel})`,
          transformOrigin: "top left",
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
    </div>
  );
}
