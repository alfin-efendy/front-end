import { AnnotationClient } from "@/types/annotation";
import { CanvasSize } from "@/types/canvas";
import { useState, useCallback } from "react"

// Define a history entry type
type HistoryEntry = {
  annotations: AnnotationClient[];
  selectedAnnotation: string | null;
};

export function useAnnotations(initialCanvasSize: CanvasSize) {
  const [annotations, setAnnotations] = useState<AnnotationClient[]>([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(
    null
  );
const [selectedLabel, setSelectedLabel] = useState<string | null>(null)
const [canvasSize, setCanvasSize] = useState<CanvasSize>(initialCanvasSize)

  // History for undo/redo
  const [history, setHistory] = useState<HistoryEntry[]>([{ annotations: [], selectedAnnotation: null }])
  const [historyIndex, setHistoryIndex] = useState(0)

  
  // Add a new history entry
  const addHistoryEntry = useCallback(
    (newAnnotations: AnnotationClient[], newSelectedAnnotation: string | null) => {
      setHistory((prev) => {
        // Remove any future history if we're not at the end
        const newHistory = prev.slice(0, historyIndex + 1)
        // Add the new entry
        return [...newHistory, { annotations: [...newAnnotations], selectedAnnotation: newSelectedAnnotation }]
      })
      setHistoryIndex((prev) => prev + 1)
    },
    [historyIndex],
  )

  // Undo function
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      const historyEntry = history[newIndex]
      setAnnotations(historyEntry.annotations)
      setSelectedAnnotation(historyEntry.selectedAnnotation)
      setHistoryIndex(newIndex)
    }
  }, [history, historyIndex])

  // Redo function
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      const historyEntry = history[newIndex]
      setAnnotations(historyEntry.annotations)
      setSelectedAnnotation(historyEntry.selectedAnnotation)
      setHistoryIndex(newIndex)
    }
  }, [history, historyIndex])

  const addAnnotation = useCallback(
    (annotation: AnnotationClient) => {
      // Create the annotation without automatically assigning a label
      const newAnnotation = {
        ...annotation,
        tmpId: Date.now().toString(), // Temporary ID for the new annotation
        label: selectedLabel || "", // Use selected label if available
        visible: true, // Visible by default
        locked: false, // Unlocked by default
      }

      // If the annotation is being assigned a label, make sure no other annotation has this label
      let newAnnotations = [...annotations]

      if (newAnnotation.label) {
        // Remove the label from any other annotation that might be using it
        newAnnotations = newAnnotations.map((ann) => (ann.labelName === newAnnotation.label ? { ...ann, label: "" } : ann))
      }

      // Add the new annotation
      newAnnotations = [...newAnnotations, newAnnotation]
      setAnnotations(newAnnotations)

      // Add to history
      addHistoryEntry(newAnnotations, newAnnotation.tmpId)

      setSelectedAnnotation(newAnnotation.tmpId)
    },
    [annotations, selectedLabel, addHistoryEntry],
  )

  const updateAnnotation = useCallback(
    (id: string, updates: Partial<AnnotationClient>) => {
      let newAnnotations = [...annotations]

      newAnnotations = newAnnotations.map((ann) => {
        // If annotation is locked and we're trying to update properties other than 'locked' or 'visible', don't update
        if (ann.id === id && ann.locked && !(updates.hasOwnProperty("locked") || updates.hasOwnProperty("visible"))) {
          return ann
        }
        // Otherwise, update normally
        return ann.id === id ? { ...ann, ...updates } : ann
      })

      setAnnotations(newAnnotations)

      // Only add to history for significant changes (not for visibility/lock toggles)
      if (!updates.hasOwnProperty("visible") && !updates.hasOwnProperty("locked")) {
        addHistoryEntry(newAnnotations, selectedAnnotation)
      }
    },
    [annotations, selectedAnnotation, addHistoryEntry],
  )

  const deleteAnnotation = useCallback(
    (id: string) => {
      // Check if annotation is locked before deleting
      const annotation = annotations.find((ann) => ann.id === id)
      if (annotation && annotation.locked) {
        return // Don't delete locked annotations
      }

      const newAnnotations = annotations.filter((ann) => ann.id !== id)
      setAnnotations(newAnnotations)

      // Add to history
      addHistoryEntry(newAnnotations, id === selectedAnnotation ? null : selectedAnnotation)

      if (selectedAnnotation === id) {
        setSelectedAnnotation(null)
      }
    },
    [selectedAnnotation, annotations, addHistoryEntry],
  )

  const deleteSelectedAnnotation = useCallback(() => {
    if (selectedAnnotation) {
      deleteAnnotation(selectedAnnotation)
    }
  }, [selectedAnnotation, deleteAnnotation])

  const moveSelectedAnnotation = useCallback(
    (direction: "up" | "down" | "left" | "right", amount = 1) => {
      if (!selectedAnnotation) return

      const index = annotations.findIndex((ann) => ann.id === selectedAnnotation)
      if (index === -1) return

      // Check if annotation is locked
      if (annotations[index].locked) return

      const ann = { ...annotations[index] }

      switch (direction) {
        case "up":
          ann.y = Math.max(0, ann.y - amount)
          break
        case "down":
          ann.y = Math.min(canvasSize.height - ann.height, ann.y + amount)
          break
        case "left":
          ann.x = Math.max(0, ann.x - amount)
          break
        case "right":
          ann.x = Math.min(canvasSize.width - ann.width, ann.x + amount)
          break
      }

      updateAnnotation(selectedAnnotation, ann)
    },
    [selectedAnnotation, annotations, canvasSize, updateAnnotation],
  )

  return {
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
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
  }
}
