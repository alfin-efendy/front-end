"use client";

import React, { memo } from "react";
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

export const AnnotationBox = memo(function AnnotationBoxComponent({
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

  // Calculate position and size with proper rounding to prevent sub-pixel rendering
  const style = {
    left: `${Math.round(annotation.x)}px`,
    top: `${Math.round(annotation.y)}px`,
    width: `${Math.round(annotation.width)}px`,
    height: `${Math.round(annotation.height)}px`,
  };

  // Determine colors based on state
  const getColors = () => {
    if (isSelected) {
      return {
        border: "border-blue-500",
        bg: "bg-blue-500/10",
        handle: "bg-blue-500",
      };
    } else if (!hasLabel) {
      return {
        border: "border-orange-400",
        bg: "bg-orange-400/10",
        handle: "bg-orange-400",
      };
    } else {
      return {
        border: "border-green-500",
        bg: "bg-green-500/10",
        handle: "bg-green-500",
      };
    }
  };

  const colors = getColors();

  // Handle resize handles
  const renderResizeHandles = () => {
    if (!isSelected || isLocked || isDrawing) return null;

    const handleSize = 8;
    const handles = [
      { position: "nw-resize", style: { top: -4, left: -4 } },
      { position: "n-resize", style: { top: -4, left: "50%", transform: "translateX(-50%)" } },
      { position: "ne-resize", style: { top: -4, right: -4 } },
      { position: "w-resize", style: { top: "50%", left: -4, transform: "translateY(-50%)" } },
      { position: "e-resize", style: { top: "50%", right: -4, transform: "translateY(-50%)" } },
      { position: "sw-resize", style: { bottom: -4, left: -4 } },
      { position: "s-resize", style: { bottom: -4, left: "50%", transform: "translateX(-50%)" } },
      { position: "se-resize", style: { bottom: -4, right: -4 } },
    ];

    return handles.map((handle, index) => (
      <div
        key={index}
        className={`absolute ${colors.handle} border border-white cursor-${handle.position}`}
        style={{
          ...handle.style,
          width: handleSize,
          height: handleSize,
          borderRadius: "50%",
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          onStartResize(handle.position.split("-")[0], e);
        }}
      />
    ));
  };

  // Render label
  const renderLabel = () => {
    if (!hasLabel || annotation.titlePosition === "Hide") return null;

    const labelStyle = {
      fontSize: "12px",
      fontWeight: "500",
      color: "#fff",
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      padding: "2px 6px",
      borderRadius: "3px",
      whiteSpace: "nowrap" as const,
    };

    let labelPosition = {};

    switch (annotation.titlePosition) {
      case "Top Left":
        labelPosition = { top: -24, left: 0 };
        break;
      case "Top Right":
        labelPosition = { top: -24, right: 0 };
        break;
      case "Top Center":
        labelPosition = { top: -24, left: "50%", transform: "translateX(-50%)" };
        break;
      case "Bottom Left":
        labelPosition = { bottom: -24, left: 0 };
        break;
      case "Bottom Right":
        labelPosition = { bottom: -24, right: 0 };
        break;
      case "Bottom Center":
        labelPosition = { bottom: -24, left: "50%", transform: "translateX(-50%)" };
        break;
      case "Left":
        labelPosition = { top: "50%", right: "100%", marginRight: "4px", transform: "translateY(-50%)" };
        break;
      case "Right":
        labelPosition = { top: "50%", left: "100%", marginLeft: "4px", transform: "translateY(-50%)" };
        break;
      default:
        labelPosition = { top: -24, left: 0 };
    }

    return (
      <div
        className="absolute z-10 pointer-events-none"
        style={{
          ...labelPosition,
          ...labelStyle,
        }}
      >
        {annotation.labelName}
      </div>
    );
  };

  return (
    <div
      className={`absolute border-2 ${colors.border} ${colors.bg} ${
        isLocked ? "border-dashed" : "border-solid"
      } ${isSelected ? "z-20" : "z-10"} ${
        !isDrawing && !isLocked ? "cursor-move hover:shadow-lg" : ""
      } transition-all duration-200`}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onMouseDown={(e) => {
        if (!isLocked && !isDrawing) {
          onStartDrag(e);
        }
      }}
    >
      {renderLabel()}
      {renderResizeHandles()}
    </div>
  );
});

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

export const AnnotationOverlay = memo(function AnnotationOverlayComponent({
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
});