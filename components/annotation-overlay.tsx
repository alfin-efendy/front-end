
"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { AnnotationClient } from "@/types/annotation";

interface AnnotationBoxProps {
  annotation: AnnotationClient;
  isSelected: boolean;
  isDrawing?: boolean;
  canvasWidth: number;
  canvasHeight: number;
  zoomLevel: number;
  onSelect: () => void;
  onStartResize: (handle: string, e: React.MouseEvent) => void;
  onStartDrag: (e: React.MouseEvent) => void;
}

export function AnnotationBox({
  annotation,
  isSelected,
  isDrawing = false,
  canvasWidth,
  canvasHeight,
  zoomLevel,
  onSelect,
  onStartResize,
  onStartDrag,
}: AnnotationBoxProps) {
  const hasLabel = annotation.labelName && annotation.labelName.trim() !== "";
  const isLocked = annotation.locked;

  // Calculate position and size
  const style = {
    left: `${annotation.x * zoomLevel}px`,
    top: `${annotation.y * zoomLevel}px`,
    width: `${annotation.width * zoomLevel}px`,
    height: `${annotation.height * zoomLevel}px`,
  };

  // Determine colors based on state
  const getColors = () => {
    if (isSelected) {
      return {
        border: "border-red-500",
        bg: "bg-red-500/20",
        text: "text-red-500",
      };
    } else if (!hasLabel) {
      return {
        border: "border-orange-500",
        bg: "bg-orange-500/20",
        text: "text-orange-500",
      };
    } else {
      return {
        border: "border-green-500",
        bg: "bg-green-500/20",
        text: "text-green-500",
      };
    }
  };

  const colors = getColors();

  // Handle resize handles
  const renderResizeHandles = () => {
    if (!isSelected || isLocked) return null;

    const handleSize = 14;
    const handles = [
      { position: "top-left", cursor: "nw-resize", x: -handleSize/2, y: -handleSize/2 },
      { position: "top-right", cursor: "ne-resize", x: annotation.width * zoomLevel - handleSize/2, y: -handleSize/2 },
      { position: "bottom-left", cursor: "sw-resize", x: -handleSize/2, y: annotation.height * zoomLevel - handleSize/2 },
      { position: "bottom-right", cursor: "se-resize", x: annotation.width * zoomLevel - handleSize/2, y: annotation.height * zoomLevel - handleSize/2 },
      { position: "top", cursor: "n-resize", x: (annotation.width * zoomLevel)/2 - handleSize/2, y: -handleSize/2 },
      { position: "bottom", cursor: "s-resize", x: (annotation.width * zoomLevel)/2 - handleSize/2, y: annotation.height * zoomLevel - handleSize/2 },
      { position: "left", cursor: "w-resize", x: -handleSize/2, y: (annotation.height * zoomLevel)/2 - handleSize/2 },
      { position: "right", cursor: "e-resize", x: annotation.width * zoomLevel - handleSize/2, y: (annotation.height * zoomLevel)/2 - handleSize/2 },
    ];

    return handles.map((handle) => (
      <div
        key={handle.position}
        className="absolute w-[14px] h-[14px] bg-white border-2 border-red-500 rounded-full cursor-pointer"
        style={{
          left: `${handle.x}px`,
          top: `${handle.y}px`,
          cursor: handle.cursor,
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          onStartResize(handle.position, e);
        }}
      />
    ));
  };

  // Handle title rendering
  const renderTitle = () => {
    if (annotation.titlePosition === "Hide" || !hasLabel) return null;

    const titleStyle: React.CSSProperties = {
      position: "absolute",
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      color: "white",
      padding: "2px 5px",
      fontSize: "12px",
      fontFamily: "Arial",
      borderRadius: "2px",
      whiteSpace: "nowrap",
      pointerEvents: "none",
    };

    // Calculate position based on titlePosition
    switch (annotation.titlePosition) {
      case "Top Left":
        titleStyle.top = `${-20 * zoomLevel}px`;
        titleStyle.left = "0px";
        break;
      case "Top Right":
        titleStyle.top = `${-20 * zoomLevel}px`;
        titleStyle.right = "0px";
        break;
      case "Top Center":
        titleStyle.top = `${-20 * zoomLevel}px`;
        titleStyle.left = "50%";
        titleStyle.transform = "translateX(-50%)";
        break;
      case "Left":
        titleStyle.left = `${-100 * zoomLevel}px`;
        titleStyle.top = "50%";
        titleStyle.transform = "translateY(-50%)";
        break;
      case "Right":
        titleStyle.right = `${-100 * zoomLevel}px`;
        titleStyle.top = "50%";
        titleStyle.transform = "translateY(-50%)";
        break;
      case "Bottom Left":
        titleStyle.bottom = `${-20 * zoomLevel}px`;
        titleStyle.left = "0px";
        break;
      case "Bottom Right":
        titleStyle.bottom = `${-20 * zoomLevel}px`;
        titleStyle.right = "0px";
        break;
      case "Bottom Center":
        titleStyle.bottom = `${-20 * zoomLevel}px`;
        titleStyle.left = "50%";
        titleStyle.transform = "translateX(-50%)";
        break;
    }

    return (
      <div style={titleStyle}>
        {annotation.labelName}
      </div>
    );
  };

  return (
    <div
      className={cn(
        "absolute border-2 cursor-pointer select-none",
        colors.border,
        colors.bg,
        isLocked && "border-dashed cursor-not-allowed",
        isDrawing && "border-blue-500 bg-blue-500/20"
      )}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        if (!isLocked) {
          onSelect();
        }
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        if (!isLocked && !isDrawing) {
          onStartDrag(e);
        }
      }}
    >
      {renderTitle()}
      {renderResizeHandles()}
    </div>
  );
}

interface AnnotationOverlayProps {
  annotations: AnnotationClient[];
  selectedAnnotation: string | null;
  currentAnnotation: Partial<AnnotationClient> | null;
  isDrawing: boolean;
  canvasWidth: number;
  canvasHeight: number;
  zoomLevel: number;
  onSelectAnnotation: (id: string) => void;
  onStartResize: (handle: string, e: React.MouseEvent) => void;
  onStartDrag: (annotation: AnnotationClient, e: React.MouseEvent) => void;
}

export function AnnotationOverlay({
  annotations,
  selectedAnnotation,
  currentAnnotation,
  isDrawing,
  canvasWidth,
  canvasHeight,
  zoomLevel,
  onSelectAnnotation,
  onStartResize,
  onStartDrag,
}: AnnotationOverlayProps) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Render existing annotations */}
      {annotations.map((annotation) => {
        if (!annotation.visible) return null;

        return (
          <div key={annotation.id || annotation.tmpId} className="pointer-events-auto">
            <AnnotationBox
              annotation={annotation}
              isSelected={selectedAnnotation === (annotation.id || annotation.tmpId)}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
              zoomLevel={zoomLevel}
              onSelect={() => onSelectAnnotation(annotation.id || annotation.tmpId)}
              onStartResize={onStartResize}
              onStartDrag={(e) => onStartDrag(annotation, e)}
            />
          </div>
        );
      })}

      {/* Render current drawing annotation */}
      {isDrawing && currentAnnotation && (
        <div className="pointer-events-none">
          <AnnotationBox
            annotation={currentAnnotation as AnnotationClient}
            isSelected={false}
            isDrawing={true}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            zoomLevel={zoomLevel}
            onSelect={() => {}}
            onStartResize={() => {}}
            onStartDrag={() => {}}
          />
        </div>
      )}
    </div>
  );
}
