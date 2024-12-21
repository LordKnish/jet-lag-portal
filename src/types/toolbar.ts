// src/components/common/ui/Toolbar.tsx
import { MapMode } from '../../../types/toolbar';

export interface ToolbarProps {
  onToolChange: (tool: MapMode) => void;
  activeTool: MapMode;
  disabled?: boolean;
}