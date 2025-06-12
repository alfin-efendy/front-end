
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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Edit, ChevronUp, ChevronDown } from 'lucide-react';

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
    openEditModal,
  } = useAnnotationStore();

  const [selectedTool, setSelectedTool] = useState<ToolType>("select");
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnnotationListCollapsed, setIsAnnotationListCollapsed] = useState(false);
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

  const handleTaskChange = (taskId: string, urlFile: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('task', taskId);
    window.history.pushState({}, '', url.toString());
    loadImage(urlFile);
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
        <ResizablePanel defaultSize={85}>
          <ResizablePanelGroup direction="vertical" className="flex flex-col">
            <ResizablePanel defaultSize={85} className="flex flex-col">
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

            {/* Collapsible Annotation List at Bottom */}
            <div className={`bg-white border-t border-gray-200 flex flex-col ${isAnnotationListCollapsed ? 'h-auto' : 'h-64'}`}>
                {/* Header with collapse button */}
                <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-lg font-semibold">
                    Annotations ({boundingBoxes.length})
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAnnotationListCollapsed(!isAnnotationListCollapsed)}
                    className="h-8 w-8 p-0"
                  >
                    {isAnnotationListCollapsed ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {/* Annotation list content */}
                {!isAnnotationListCollapsed && (
                  <div className="flex-1 overflow-y-auto p-3">
                    {boundingBoxes.length === 0 ? (
                      <p className="text-gray-500 text-sm">No annotations yet. Click and drag on the image to create one.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {boundingBoxes.map((box) => (
                          <div
                            key={box.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              selectedBoxId === box.id 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => selectBoundingBox(box.id)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <div 
                                  className="w-3 h-3 rounded-sm"
                                  style={{ backgroundColor: box.color }}
                                />
                                <span className="font-medium text-sm">
                                  {box.label || 'Unlabeled'}
                                </span>
                              </div>
                              <div className="flex space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditModal(box.id);
                                  }}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteBoundingBox(box.id);
                                  }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">
                              x: {Math.round(box.x)}, y: {Math.round(box.y)}, 
                              w: {Math.round(box.width)}, h: {Math.round(box.height)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </ResizablePanelGroup>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Sidebar - Task List */}
        <ResizablePanel defaultSize={15} className="bg-white border-l border-gray-200">
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Tasks</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {data?.tasks ? (
                <div className="space-y-3">
                  {data.tasks.map((task: any) => {
                    const isActive = String(task.id) === searchParams.get('task');
                    return (
                      <div
                        key={task.id}
                        className={`border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${
                          isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                        onClick={() => handleTaskChange(String(task.id), task.urlFile)}
                      >
                        <div className="aspect-video relative mb-2">
                          <img
                            src={task.urlFile}
                            alt={`Task ${task.id}`}
                            className="w-full h-full object-contain rounded border"
                          />
                        </div>
                        <div className="text-sm">
                          <div className="font-medium">Task #{task.id}</div>
                          <div className={`text-xs px-2 py-1 rounded mt-1 inline-block ${
                            task.status === 'completed' 
                              ? 'bg-green-100 text-green-800'
                              : task.status === 'in_progress'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {task.status}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-gray-500 text-sm">
                  Loading tasks...
                </div>
              )}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Edit Modal */}
      <EditBoxModal />
    </div>
  );
}
