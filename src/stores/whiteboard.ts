import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  WhiteboardObject,
  Layer,
  ToolType,
  ObjectStyle,
  Point,
  DEFAULT_STYLE,
} from '../types/whiteboard';

interface WhiteboardStore {
  objects: WhiteboardObject[];
  layers: Layer[];
  activeLayerId: string;
  selectedObjectIds: string[];
  activeTool: ToolType;
  currentStyle: ObjectStyle;
  canvasOffset: Point;
  zoom: number;
  history: WhiteboardObject[][];
  historyIndex: number;

  // Actions
  setActiveTool: (tool: ToolType) => void;
  setCurrentStyle: (style: Partial<ObjectStyle>) => void;
  addObject: (object: Omit<WhiteboardObject, 'id' | 'layerId'>) => void;
  updateObject: (id: string, updates: Partial<WhiteboardObject>) => void;
  deleteObject: (id: string) => void;
  selectObjects: (ids: string[]) => void;
  selectObject: (id: string, addToSelection?: boolean) => void;
  clearSelection: () => void;
  setCanvasOffset: (offset: Point) => void;
  setZoom: (zoom: number) => void;
  undo: () => void;
  redo: () => void;
  saveToHistory: () => void;
  addLayer: (name: string) => void;
  deleteLayer: (id: string) => void;
  setActiveLayer: (id: string) => void;
  toggleLayerVisibility: (id: string) => void;
  // Z-order
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
}

const DEFAULT_LAYER: Layer = {
  id: 'default',
  name: 'Lager 1',
  visible: true,
  locked: false,
  order: 0,
};

export const useWhiteboardStore = create<WhiteboardStore>((set) => ({
  objects: [],
  layers: [DEFAULT_LAYER],
  activeLayerId: 'default',
  selectedObjectIds: [],
  activeTool: 'pen',
  currentStyle: DEFAULT_STYLE,
  canvasOffset: { x: 0, y: 0 },
  zoom: 1,
  history: [[]],
  historyIndex: 0,

  setActiveTool: (tool) => set({ activeTool: tool }),

  setCurrentStyle: (style) =>
    set((state) => ({
      currentStyle: { ...state.currentStyle, ...style },
    })),

  addObject: (object) =>
    set((state) => {
      const newObject: WhiteboardObject = {
        ...object,
        id: uuidv4(),
        layerId: state.activeLayerId,
      };
      return { objects: [...state.objects, newObject] };
    }),

  updateObject: (id, updates) =>
    set((state) => ({
      objects: state.objects.map((obj) =>
        obj.id === id ? { ...obj, ...updates } : obj
      ),
    })),

  deleteObject: (id) =>
    set((state) => ({
      objects: state.objects.filter((obj) => obj.id !== id),
      selectedObjectIds: state.selectedObjectIds.filter((sid) => sid !== id),
    })),

  selectObjects: (ids) => set({ selectedObjectIds: ids }),

  selectObject: (id, addToSelection = false) =>
    set((state) => ({
      selectedObjectIds: addToSelection
        ? state.selectedObjectIds.includes(id)
          ? state.selectedObjectIds.filter((sid) => sid !== id)
          : [...state.selectedObjectIds, id]
        : [id],
    })),

  clearSelection: () => set({ selectedObjectIds: [] }),

  setCanvasOffset: (offset) => set({ canvasOffset: offset }),

  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(5, zoom)) }),

  saveToHistory: () =>
    set((state) => {
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push([...state.objects]);
      return {
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }),

  undo: () =>
    set((state) => {
      if (state.historyIndex > 0) {
        const newIndex = state.historyIndex - 1;
        return {
          objects: [...state.history[newIndex]],
          historyIndex: newIndex,
        };
      }
      return state;
    }),

  redo: () =>
    set((state) => {
      if (state.historyIndex < state.history.length - 1) {
        const newIndex = state.historyIndex + 1;
        return {
          objects: [...state.history[newIndex]],
          historyIndex: newIndex,
        };
      }
      return state;
    }),

  addLayer: (name) =>
    set((state) => {
      const newLayer: Layer = {
        id: uuidv4(),
        name,
        visible: true,
        locked: false,
        order: state.layers.length,
      };
      return { layers: [...state.layers, newLayer] };
    }),

  deleteLayer: (id) =>
    set((state) => {
      if (state.layers.length <= 1) return state;
      const newLayers = state.layers.filter((l) => l.id !== id);
      const newActiveLayer =
        state.activeLayerId === id ? newLayers[0].id : state.activeLayerId;
      return {
        layers: newLayers,
        activeLayerId: newActiveLayer,
        objects: state.objects.filter((obj) => obj.layerId !== id),
      };
    }),

  setActiveLayer: (id) => set({ activeLayerId: id }),

  toggleLayerVisibility: (id) =>
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === id ? { ...layer, visible: !layer.visible } : layer
      ),
    })),

  // Z-order functions
  bringToFront: (id) =>
    set((state) => {
      const obj = state.objects.find((o) => o.id === id);
      if (!obj) return state;
      const others = state.objects.filter((o) => o.id !== id);
      return { objects: [...others, obj] };
    }),

  sendToBack: (id) =>
    set((state) => {
      const obj = state.objects.find((o) => o.id === id);
      if (!obj) return state;
      const others = state.objects.filter((o) => o.id !== id);
      return { objects: [obj, ...others] };
    }),

  bringForward: (id) =>
    set((state) => {
      const index = state.objects.findIndex((o) => o.id === id);
      if (index === -1 || index === state.objects.length - 1) return state;
      const newObjects = [...state.objects];
      [newObjects[index], newObjects[index + 1]] = [newObjects[index + 1], newObjects[index]];
      return { objects: newObjects };
    }),

  sendBackward: (id) =>
    set((state) => {
      const index = state.objects.findIndex((o) => o.id === id);
      if (index <= 0) return state;
      const newObjects = [...state.objects];
      [newObjects[index], newObjects[index - 1]] = [newObjects[index - 1], newObjects[index]];
      return { objects: newObjects };
    }),
}));
