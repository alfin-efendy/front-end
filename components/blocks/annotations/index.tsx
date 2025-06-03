"use client";

import { useRef, useState } from "react";
import { DocumentCanvas } from "@/components/canvas";
import { useCanvas } from "@/hooks/useCanvas";
import { useAnnotations } from "@/hooks/useAnnotations";
import { InitialAnnotationData } from "@/types/annotation";
import { useKeyboard } from "@/hooks/useKeyboard"
import { Toolbar, ToolType } from "@/components/toolbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = {
  data: InitialAnnotationData;
};

export const AnnotationsPage = ({ data }: Props) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedTool, setSelectedTool] = useState<"select" | "pan">("select");
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const handleZoomChange = (newZoom: number) => {
    setZoomLevel(newZoom);
  };

  // Handle tool change
  const handleToolChange = (tool: ToolType) => {
    setSelectedTool(tool);
  };

  const toggleHelp = () => {
    setShowHelp(!showHelp);
  };

  const {
    annotations,
    selectedAnnotation,
    setAnnotations,
    setSelectedAnnotation,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    deleteSelectedAnnotation,
    moveSelectedAnnotation,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useAnnotations({ width: 0, height: 0 });

  const {
    canvasRef,
    canvasContainerRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    resizeCanvas,
  } = useCanvas({
    image: data?.urlFile ?? null,
    annotations: annotations,
    selectedAnnotation,
    currentLabel: "",
    imageRef,
    addAnnotation,
    setSelectedAnnotation,
    updateAnnotation,
    selectedTool,
    zoomLevel,
  });

    useKeyboard({
    selectedAnnotation,
    deleteSelectedAnnotation,
    moveSelectedAnnotation,
    zoomLevel,
    setZoomLevel: handleZoomChange,
    selectedTool,
    setSelectedTool: handleToolChange,
  })

  return (
    <div className="w-full h-full max-w-full max-h-full flex flex-col">
      <Card className="flex flex-col w-full h-full">
        <CardHeader className="flex-shrink-0">
          <Toolbar
            selectedTool={selectedTool}
            onToolChange={handleToolChange}
            zoomLevel={zoomLevel}
            onZoomChange={handleZoomChange}
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
            onShowHelp={toggleHelp}
          />
        </CardHeader>
        <CardContent className="flex-1 relative">
          <DocumentCanvas
            image={data?.urlFile || ""}
            canvasRef={canvasRef}
            canvasContainerRef={canvasContainerRef}
            handleMouseDown={handleMouseDown}
            handleMouseMove={handleMouseMove}
            handleMouseUp={handleMouseUp}
            zoomLevel={zoomLevel}
            onCanvasResize={resizeCanvas}
            onZoomChange={handleZoomChange}
          />
        </CardContent>
      </Card>
    </div>
  );
};
