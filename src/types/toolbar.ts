// src/types/toolbar.ts
export type MapMode = 
  | 'pan' 
  | 'draw' 
  | 'erase' 
  | 'radar' 
  | 'rectangle' 
  | 'circle'
  | 'select' 
  | 'delete' 
  | 'measure' 
  | 'rings' 
  | 'marker'
  | 'move'    
  | 'edit'  
  | 'gps'   
  | null;

export type FillStyle = 'solid' | 'hashed';

export interface ToolbarProps {
  onToolChange?: (tool: MapMode) => void;
  activeTool?: MapMode;
  disabled?: boolean;
}