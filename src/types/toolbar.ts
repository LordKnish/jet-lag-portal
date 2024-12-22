// src/types/toolbar.ts
export type MapMode = 
  | 'pan' 
  | 'draw' 
  | 'erase' 
  | 'radar' 
  | 'rectangle' 
  | 'circle'
  | 'select' 
  | 'fill' 
  | 'measure' 
  | 'rings' 
  | 'marker'
  | 'move'      // Added 'move' mode
  | 'edit'      // Added 'edit' mode
  | null;

export type FillStyle = 'solid' | 'hashed';

export interface ToolbarProps {
  onToolChange?: (tool: MapMode) => void;
  activeTool?: MapMode;
  disabled?: boolean;
}