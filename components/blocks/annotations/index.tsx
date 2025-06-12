"use client";

import { useEffect, useRef, useState } from "react";
import { DocumentCanvas } from "@/components/canvas";
import { useCanvas } from "@/hooks/useCanvas";
import { useAnnotations } from "@/hooks/useAnnotations";
import { InitialAnnotationData } from "@/types/annotation";
import { useKeyboard } from "@/hooks/useKeyboard";
import { Toolbar, ToolType } from "@/components/toolbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { CanvasSize } from "@/types/canvas";
import { Task } from "@/types/task";
import { Separator } from "@/components/ui/separator";
import { useRouter, useSearchParams } from "next/navigation";
import { color } from "framer-motion";
import { useImageLoader } from "@/hooks/useImageLoader";
import { Skeleton } from "@/components/ui/skeleton";
import { AnnotationOverlay } from "@/components/annotation-overlay";

type Props = {
  data: InitialAnnotationData;
};

export const AnnotationsPage = ({ data }: Props) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedTool, setSelectedTool] = useState<"select" | "pan">("select");
  const [image, setImage] = useState<string>(data.urlFile);
  const [showHelp, setShowHelp] = useState(false);
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({
    width: 0,
    height: 0,
  });
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTaskId = searchParams.get("task");

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
    dataUrl,
    imageRef,
    loading: imgLoading,
    error: imgError,
  } = useImageLoader(image);

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
    scaleAnnotations,
    canUndo,
    canRedo,
  } = useAnnotations({ width: 0, height: 0 });

  const {
    canvasRef,
    canvasContainerRef,
    canvasSize: canvasDimensions,
    isDrawing,
    isDragging,
    isResizing,
    currentAnnotation,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleAnnotationResize,
    handleAnnotationDrag,
    renderCanvas,
    resizeCanvas,
  } = useCanvas({
    image: dataUrl || "",
    annotations,
    selectedAnnotation,
    currentLabel: "label",
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
  });

  const handleLayoutSizeChange = () => {
    if (canvasRef.current && imageRef.current && imageRef.current.complete) {
      const oldSize = { ...canvasSize };
      const newSize = resizeCanvas();
      if (
        newSize &&
        (oldSize.width !== newSize.width || oldSize.height !== newSize.height)
      ) {
        scaleAnnotations(oldSize, newSize);
        setCanvasSize(newSize);
      }
    }
  };

  const handleChangeImage = async (id: string, imageUrl: string) => {
    const params = new URLSearchParams(searchParams.toString());

    params.set("task", String(id));
    router.push(`?${params.toString()}`, { scroll: false });

    setImage(imageUrl);
  };

  return (
    <div className="flex flex-col">
      <ResizablePanelGroup
        className="flex flex-row"
        direction="horizontal"
        onLayout={handleLayoutSizeChange}
      >
        <ResizablePanel defaultSize={90} className="flex flex-col w-full">
          <div className="flex flex-row">
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
              className="w-auto flex-shrink-0"
            />
            <div className="overflow-auto w-full flex flex-row items-center content-start space-x-3">
              {data.labels.map((item) => (
                <div
                  key={item.id}
                  className={
                    "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium shadow min-w-16"
                  }
                  style={{ backgroundColor: item.color }}
                >
                  {item.name}
                </div>
              ))}
            </div>
          </div>
          <div className="h-full max-h-[calc(100vh-9.55rem)] overflow-auto">
            {imgLoading ? (
              <Skeleton className="rounded-lg w-full h-full" />
            ) : (
              <div className="relative">
                <DocumentCanvas
                  image={dataUrl}
                  canvasRef={canvasRef}
                  canvasContainerRef={canvasContainerRef}
                  handleMouseDown={handleMouseDown}
                  handleMouseMove={handleMouseMove}
                  handleMouseUp={handleMouseUp}
                  zoomLevel={zoomLevel}
                  onCanvasResize={resizeCanvas}
                  onZoomChange={handleZoomChange}
                  className="border border-gray-300"
                />
                <AnnotationOverlay
                  annotations={annotations}
                  selectedAnnotation={selectedAnnotation}
                  currentAnnotation={currentAnnotation}
                  isDrawing={isDrawing}
                  canvasWidth={canvasDimensions.width}
                  canvasHeight={canvasDimensions.height}
                  zoomLevel={zoomLevel}
                  onSelectAnnotation={setSelectedAnnotation}
                  onStartResize={handleAnnotationResize}
                  onStartDrag={handleAnnotationDrag}
                />
              </div>
            )}
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={10}>
          <div className="h-full max-h-[calc(100vh-6.5rem)] space-y-2 p-2 overflow-auto ">
            {data.tasks.map((task) => {
              const isActive = String(task.id) === activeTaskId;
              return (
                <img
                  key={task.id}
                  src={task.urlFile}
                  className={`
                    w-full object-contain cursor-pointer rounded-md border-4
                    ${isActive ? "border-blue-500" : "border-muted"}
                  `}
                  onClick={() =>
                    handleChangeImage(String(task.id), task.urlFile)
                  }
                />
              );
            })}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
      <div className="h-9 w-full bg-teal-500 shrink-0">submit</div>
    </div>
  );
};