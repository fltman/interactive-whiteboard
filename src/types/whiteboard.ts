export type ToolType = 'select' | 'pen' | 'eraser' | 'rectangle' | 'ellipse' | 'line' | 'arrow' | 'text' | 'sticky' | 'image' | 'ai-image' | 'ai-web';

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface ObjectStyle {
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  opacity: number;
  fontSize?: number;
  fontFamily?: string;
}

export interface WhiteboardObject {
  id: string;
  type: 'path' | 'shape' | 'text' | 'sticky' | 'image' | 'web';
  position: Point;
  size?: Size;
  style: ObjectStyle;
  layerId: string;
  locked: boolean;
  rotation: number;
  data: PathData | ShapeData | TextData | StickyData | ImageData | WebData;
}

export interface PathData {
  points: Point[];
  tool: 'pen' | 'eraser';
}

export interface ShapeData {
  shapeType: 'rectangle' | 'ellipse' | 'line' | 'arrow';
  endPoint?: Point;
}

export interface TextData {
  content: string;
  fontSize: number;
  fontFamily: string;
}

export interface StickyData {
  content: string;
  backgroundColor: string;
}

export interface ImageData {
  src: string;
  originalSize: Size;
}

export interface WebData {
  html: string;
  prompt?: string;
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  order: number;
}

export interface WhiteboardState {
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
}

export const DEFAULT_STYLE: ObjectStyle = {
  strokeColor: '#000000',
  fillColor: 'transparent',
  strokeWidth: 2,
  opacity: 1,
  fontSize: 16,
  fontFamily: 'sans-serif',
};
