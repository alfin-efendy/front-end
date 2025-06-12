
import { create } from 'zustand';

export interface BoundingBox {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

interface HistoryEntry {
  boundingBoxes: BoundingBox[];
  selectedBoxId: string | null;
}

interface AnnotationState {
  // Image state
  imageUrl: string;
  loadedImage: HTMLImageElement | null;
  isImageLoading: boolean;
  
  // Canvas state
  zoomLevel: number;
  panOffset: { x: number; y: number };
  
  // Bounding boxes
  boundingBoxes: BoundingBox[];
  selectedBoxId: string | null;
  
  // History for undo/redo
  history: HistoryEntry[];
  historyIndex: number;
  
  // Interaction state
  isCreatingBox: boolean;
  isDragging: boolean;
  isResizing: boolean;
  dragStart: { x: number; y: number } | null;
  previewBox: { x: number; y: number; width: number; height: number } | null;
  
  // Modal state
  showEditModal: boolean;
  editingBoxId: string | null;
  
  // Actions
  setImageUrl: (url: string) => void;
  loadImage: (url: string) => Promise<void>;
  setZoomLevel: (level: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  setPanOffset: (offset: { x: number; y: number }) => void;
  
  // Bounding box actions
  addBoundingBox: (box: Omit<BoundingBox, 'id'>) => void;
  updateBoundingBox: (id: string, updates: Partial<BoundingBox>) => void;
  deleteBoundingBox: (id: string) => void;
  selectBoundingBox: (id: string | null) => void;
  
  // Modal actions
  openEditModal: (boxId: string) => void;
  closeEditModal: () => void;
  
  // Interaction actions
  setIsCreatingBox: (creating: boolean) => void;
  setIsDragging: (dragging: boolean) => void;
  setIsResizing: (resizing: boolean) => void;
  setDragStart: (start: { x: number; y: number } | null) => void;
  setPreviewBox: (box: { x: number; y: number; width: number; height: number } | null) => void;
  
  // History actions
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  addToHistory: () => void;
}

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

export const useAnnotationStore = create<AnnotationState>((set, get) => ({
  // Initial state
  imageUrl: '',
  loadedImage: null,
  isImageLoading: false,
  zoomLevel: 1,
  panOffset: { x: 0, y: 0 },
  boundingBoxes: [],
  selectedBoxId: null,
  history: [{ boundingBoxes: [], selectedBoxId: null }],
  historyIndex: 0,
  isCreatingBox: false,
  isDragging: false,
  isResizing: false,
  dragStart: null,
  previewBox: null,
  showEditModal: false,
  editingBoxId: null,
  
  // Actions
  setImageUrl: (url) => set({ imageUrl: url }),
  
  loadImage: async (url) => {
    set({ isImageLoading: true, imageUrl: url });
    
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });
      
      set({ 
        loadedImage: img, 
        isImageLoading: false,
        boundingBoxes: [], // Clear existing boxes when loading new image
        selectedBoxId: null,
        previewBox: null,
        zoomLevel: 1,
        panOffset: { x: 0, y: 0 },
        history: [{ boundingBoxes: [], selectedBoxId: null }],
        historyIndex: 0
      });
    } catch (error) {
      console.error('Failed to load image:', error);
      set({ isImageLoading: false, loadedImage: null });
    }
  },
  
  setZoomLevel: (level) => set({ zoomLevel: Math.max(0.1, Math.min(5, level)) }),
  
  zoomIn: () => {
    const { zoomLevel } = get();
    set({ zoomLevel: Math.min(zoomLevel * 1.2, 5) });
  },
  
  zoomOut: () => {
    const { zoomLevel } = get();
    set({ zoomLevel: Math.max(zoomLevel / 1.2, 0.1) });
  },
  
  resetView: () => set({ zoomLevel: 1, panOffset: { x: 0, y: 0 } }),
  
  setPanOffset: (offset) => set({ panOffset: offset }),
  
  addBoundingBox: (box) => {
    const { boundingBoxes, addToHistory } = get();
    const id = Date.now().toString();
    const colorIndex = boundingBoxes.length % COLORS.length;
    const newBox: BoundingBox = {
      ...box,
      id,
      color: box.color || COLORS[colorIndex],
    };
    set({ 
      boundingBoxes: [...boundingBoxes, newBox]
    });
    addToHistory();
  },
  
  updateBoundingBox: (id, updates) => {
    const { boundingBoxes, addToHistory } = get();
    set({
      boundingBoxes: boundingBoxes.map(box =>
        box.id === id ? { ...box, ...updates } : box
      ),
    });
    addToHistory();
  },
  
  deleteBoundingBox: (id) => {
    const { boundingBoxes, selectedBoxId, addToHistory } = get();
    set({
      boundingBoxes: boundingBoxes.filter(box => box.id !== id),
      selectedBoxId: selectedBoxId === id ? null : selectedBoxId,
    });
    addToHistory();
  },
  
  selectBoundingBox: (id) => set({ selectedBoxId: id }),
  
  openEditModal: (boxId) => set({ showEditModal: true, editingBoxId: boxId }),
  
  closeEditModal: () => set({ showEditModal: false, editingBoxId: null }),
  
  setIsCreatingBox: (creating) => set({ isCreatingBox: creating }),
  
  setIsDragging: (dragging) => set({ isDragging: dragging }),
  
  setIsResizing: (resizing) => set({ isResizing: resizing }),
  
  setDragStart: (start) => set({ dragStart: start }),
  
  setPreviewBox: (box) => set({ previewBox: box }),
  
  // History actions
  addToHistory: () => {
    const { boundingBoxes, selectedBoxId, history, historyIndex } = get();
    // Remove any future history if we're not at the end
    const newHistory = history.slice(0, historyIndex + 1);
    // Add the new entry
    newHistory.push({ 
      boundingBoxes: [...boundingBoxes], 
      selectedBoxId 
    });
    set({ 
      history: newHistory, 
      historyIndex: newHistory.length - 1 
    });
  },
  
  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const historyEntry = history[newIndex];
      set({
        boundingBoxes: [...historyEntry.boundingBoxes],
        selectedBoxId: historyEntry.selectedBoxId,
        historyIndex: newIndex
      });
    }
  },
  
  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const historyEntry = history[newIndex];
      set({
        boundingBoxes: [...historyEntry.boundingBoxes],
        selectedBoxId: historyEntry.selectedBoxId,
        historyIndex: newIndex
      });
    }
  },
  
  canUndo: () => {
    const { historyIndex } = get();
    return historyIndex > 0;
  },
  
  canRedo: () => {
    const { history, historyIndex } = get();
    return historyIndex < history.length - 1;
  },
}));
