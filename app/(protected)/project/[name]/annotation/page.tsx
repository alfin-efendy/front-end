
"use client";

import React from 'react';
import { useAnnotationStore } from '@/lib/useAnnotationStore';
import { CanvasContainer } from '@/components/CanvasContainer';
import { Sidebar } from '@/components/Sidebar';
import { EditBoxModal } from '@/components/EditBoxModal';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getAnnotation } from "./actions";
import { useEffect, useState } from "react";
import { useSearchParams } from 'next/navigation';

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
  } = useAnnotationStore();
  
  const [urlInput, setUrlInput] = React.useState('');
  const [data, setData] = useState(null);
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
            setUrlInput(data.urlFile);
          }
        }
      });
    } else {
      setError("Task Id Not Found");
    }
  }, [searchParams, loadImage]);
  
  const handleLoadImage = () => {
    if (urlInput.trim()) {
      loadImage(urlInput.trim());
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLoadImage();
    }
  };
  
  // Global keyboard shortcuts
  React.useEffect(() => {
    const handleKeyboardShortcuts = (e: KeyboardEvent) => {
      // Delete key for removing selected box
      if (e.key === 'Delete' && selectedBoxId) {
        deleteBoundingBox(selectedBoxId);
        selectBoundingBox(null);
      }
      
      // Zoom shortcuts
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          zoomIn();
        } else if (e.key === '-') {
          e.preventDefault();
          zoomOut();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyboardShortcuts);
    return () => document.removeEventListener('keydown', handleKeyboardShortcuts);
  }, [selectedBoxId, deleteBoundingBox, selectBoundingBox, zoomIn, zoomOut]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header/Toolbar */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900">Canvas Annotation Editor</h1>
            <div className="flex items-center space-x-2">
              <Input
                type="url"
                placeholder="Enter image URL..."
                className="w-80"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <Button onClick={handleLoadImage}>
                Load Image
              </Button>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Zoom Controls */}
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={zoomOut}
                className="p-2 hover:bg-white"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="px-3 py-1 text-sm font-medium text-gray-700 min-w-[60px] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={zoomIn}
                className="p-2 hover:bg-white"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Reset View */}
            <Button
              variant="ghost"
              size="sm"
              onClick={resetView}
              className="p-2 text-gray-600 hover:text-gray-900"
              title="Reset View"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>
      
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas Area */}
        <main className="flex-1 p-6 overflow-hidden">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 h-full min-h-[600px] relative">
            <CanvasContainer />
          </div>
        </main>
        
        {/* Sidebar */}
        <Sidebar />
      </div>
      
      {/* Edit Modal */}
      <EditBoxModal />
    </div>
  );
}
