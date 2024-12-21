// src/types/toolbar.ts
export type MapMode = 
  | 'pan' 
  | 'draw' 
  | 'erase' 
  | 'radar' 
  | 'rectangle' 
  | 'select' 
  | 'fill' 
  | 'measure' 
  | 'rings' 
  | 'marker'
  | null;

export type FillStyle = 'solid' | 'hashed';

export interface ToolbarProps {
  onToolChange?: (tool: MapMode) => void;
  activeTool?: MapMode;
  disabled?: boolean;
}