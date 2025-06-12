
import React, { useState, useEffect } from 'react';
import { useAnnotationStore } from '@/lib/useAnnotationStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#EAB308', // yellow
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
];

export function EditBoxModal() {
  const {
    showEditModal,
    editingBoxId,
    boundingBoxes,
    closeEditModal,
    updateBoundingBox,
  } = useAnnotationStore();

  const [label, setLabel] = useState('');
  const [color, setColor] = useState('#3B82F6');

  const editingBox = boundingBoxes.find(box => box.id === editingBoxId);

  useEffect(() => {
    if (editingBox) {
      setLabel(editingBox.label);
      setColor(editingBox.color);
    }
  }, [editingBox]);

  const handleSave = () => {
    if (editingBoxId) {
      updateBoundingBox(editingBoxId, {
        label,
        color,
      });
      closeEditModal();
    }
  };

  return (
    <Dialog open={showEditModal} onOpenChange={closeEditModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Annotation</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Enter label..."
            />
          </div>
          
          <div>
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {COLORS.map((colorOption) => (
                <button
                  key={colorOption}
                  className={`w-8 h-8 rounded-md border-2 ${
                    color === colorOption ? 'border-gray-800' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: colorOption }}
                  onClick={() => setColor(colorOption)}
                />
              ))}
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={closeEditModal}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
