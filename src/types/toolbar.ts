// src/types/toolbar.ts
export type MapMode = 'draw' | 'measure' | null;

export interface ToolbarProps {
  onToolChange: (tool: MapMode) => void;
  activeTool: MapMode;
  disabled?: boolean;
}