
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
    // Implement undo functionality if needed
    console.log('Undo action');
  };

  const handleRedo = () => {
    // Implement redo functionality if needed
    console.log('Redo action');
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
      
      // Zoom shortcuts
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
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
  }, [selectedBoxId, deleteBoundingBox, selectBoundingBox, zoomIn, zoomOut, resetView]);

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
              canUndo={false} // Set to true when undo functionality is implemented
              canRedo={false} // Set to true when redo functionality is implemented
              className="w-auto flex-shrink-0"
            />
            
            {/* Labels Display */}
            {data?.labels && (
              <div className="overflow-auto w-full flex flex-row items-center content-start space-x-3 p-2">
                {data.labels.map((label: any) => (
                  <div
                    key={label.id}
                    className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium shadow min-w-16 text-white"
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
