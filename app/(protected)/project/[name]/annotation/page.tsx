"use client";

import React from 'react';
import { useAnnotationStore } from '@/lib/useAnnotationStore';
import { CanvasContainer } from '@/components/CanvasContainer';
import { Sidebar } from '@/components/Sidebar';
import { EditBoxModal } from '@/components/EditBoxModal';
import { Toolbar, ToolType } from '@/components/toolbar';
import { getAnnotation } from "./actions";
import { useEffect, useState } from "react";
import { useSearchParams } from 'next/navigation';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

export default function AnnotationPage() {
  const {
    imageUrl,
    zoomLevel,
    selectedBoxId,
    boundingBoxes,
    setImageUrl,
    loadImage,
    zoomIn,
    zoomOut,
    resetView,
    deleteBoundingBox,
    selectBoundingBox,
    setZoomLevel,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useAnnotationStore();

  const [selectedTool, setSelectedTool] = useState<ToolType>("select");
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  // Load initial data
  useEffect(() => {
    const taskId = searchParams.get('task');
    if (taskId) {
      getAnnotation(Number(taskId)).then(({ data, error }) => {
        if (error) {
          setError(error);
        } else if (data) {
          setData(data);
          // Load the image from the data
          if (data.urlFile) {
            loadImage(data.urlFile);
          }
        }
      });
    } else {
      setError("Task Id Not Found");
    }
  }, [searchParams, loadImage]);

  const handleZoomChange = (newZoom: number) => {
    setZoomLevel(newZoom);
  };

  const handleToolChange = (tool: ToolType) => {
    setSelectedTool(tool);
  };

  const handleUndo = () => {
    undo();
  };

  const handleRedo = () => {
    redo();
  };

  // Global keyboard shortcuts
  React.useEffect(() => {
    const handleKeyboardShortcuts = (e: KeyboardEvent) => {
      // Delete key for removing selected box
      if (e.key === 'Delete' && selectedBoxId) {
        deleteBoundingBox(selectedBoxId);
        selectBoundingBox(null);
      }

      // Tool shortcuts
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setSelectedTool('select');
      }

      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        setSelectedTool('pan');
      }

      // Shortcuts with Ctrl/Cmd
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' || e.key === 'Z') {
          e.preventDefault();
          if (e.shiftKey) {
            redo(); // Ctrl+Shift+Z for redo
          } else {
            undo(); // Ctrl+Z for undo
          }
        } else if (e.key === 'y' || e.key === 'Y') {
          e.preventDefault();
          redo(); // Ctrl+Y for redo
        } else if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          zoomIn();
        } else if (e.key === '-') {
          e.preventDefault();
          zoomOut();
        } else if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          resetView();
        }
      }
    };

    document.addEventListener('keydown', handleKeyboardShortcuts);
    return () => document.removeEventListener('keydown', handleKeyboardShortcuts);
  }, [selectedBoxId, deleteBoundingBox, selectBoundingBox, zoomIn, zoomOut, resetView, undo, redo]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <ResizablePanelGroup
        className="flex flex-row"
        direction="horizontal"
      >
        <ResizablePanel defaultSize={85} className="flex flex-col w-full">
          {/* Toolbar */}
          <div className="flex flex-row border-b">
            <Toolbar
              selectedTool={selectedTool}
              onToolChange={handleToolChange}
              zoomLevel={zoomLevel}
              onZoomChange={handleZoomChange}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={canUndo()}
              canRedo={canRedo()}
              className="w-auto flex-shrink-0"
            />

            {/* Labels Display */}
            {data?.labels && (
              <div className="overflow-auto w-full flex flex-row items-center content-start space-x-3 p-2">
                {data.labels.map((label: any) => (
                  <div
                    key={label.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/json', JSON.stringify(label));
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium shadow min-w-16 text-white cursor-grab active:cursor-grabbing hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: label.color }}
                  >
                    {label.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Canvas Area */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full relative">
              <CanvasContainer selectedTool={selectedTool} />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Sidebar */}
        <ResizablePanel defaultSize={15}>
          <Sidebar />
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Edit Modal */}
      <EditBoxModal />
    </div>
  );
}