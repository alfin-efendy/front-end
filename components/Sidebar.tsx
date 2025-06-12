
import React from 'react';
import { useAnnotationStore } from '@/lib/useAnnotationStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Edit } from 'lucide-react';

export function Sidebar() {
  const {
    boundingBoxes,
    selectedBoxId,
    selectBoundingBox,
    deleteBoundingBox,
    openEditModal,
  } = useAnnotationStore();

  return (
    <aside className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Annotations ({boundingBoxes.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {boundingBoxes.length === 0 ? (
            <p className="text-gray-500 text-sm">No annotations yet. Click and drag on the image to create one.</p>
          ) : (
            boundingBoxes.map((box) => (
              <div
                key={box.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedBoxId === box.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => selectBoundingBox(box.id)}
              >
                <div className="flex items-center justify-between">
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
                <div className="text-xs text-gray-500 mt-1">
                  x: {Math.round(box.x)}, y: {Math.round(box.y)}, 
                  w: {Math.round(box.width)}, h: {Math.round(box.height)}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </aside>
  );
}
