// src/components/common/ui/Toolbar.tsx
import React from 'react';
import { 
  PencilLine,
  Eraser,
  CirclesFour,
  Ruler,
  PaintBucket,
  ArrowCounterClockwise,
  ArrowClockwise,
  Hand,
  Circle,
  Square,
  SelectionAll,
  MapPin,
  Hash,
  ArrowsOutCardinal,
  Polygon
} from "@phosphor-icons/react";
import { MapMode } from '../../../types/toolbar';

interface ToolbarProps {
  onToolChange?: (tool: MapMode) => void;
  onFillStyleChange?: (style: 'solid' | 'hashed') => void;
  fillStyle?: 'solid' | 'hashed'; // Add this line
  onUndo?: () => void;
  onRedo?: () => void;
  activeTool?: MapMode;
  disabled?: boolean;
}


const ToolButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
}> = ({ icon, label, onClick, active, disabled }) => (
  <button
    className={`
      h-10 w-10 rounded-curved flex items-center justify-center
      transition-all duration-200 ease-in-out font-display
      disabled:opacity-50 disabled:cursor-not-allowed
      ${active 
        ? 'bg-jl-salmon text-white hover:bg-jl-salmon/90' 
        : 'bg-white/10 text-white hover:bg-white/20'
      }
    `}
    onClick={onClick}
    title={label}
    disabled={false}
  >
    <div className="w-6 h-6 flex items-center justify-center">
      {icon}
    </div>
  </button>
);

const Toolbar: React.FC<ToolbarProps> = ({
  onToolChange,
  onFillStyleChange,
  fillStyle, 
  onUndo,
  onRedo,
  activeTool,
  disabled
}) => {

  return (
    <div className="w-full bg-jl-teal border-b border-jl-sage/30 shadow-md">
      <div className="w-full">
        <div className="flex items-center h-14 gap-1 px-2">
          {/* Navigation Tools Group */}
          <div className="flex items-center gap-1 pr-3 border-r border-jl-sage/30">
            <ToolButton
              icon={<Hand size={24} weight="bold" />}
              label="Pan Tool"
              onClick={() => onToolChange?.('pan')}
              active={activeTool === 'pan'}
              disabled={false}
            />
          </div>

          {/* Drawing Tools Group */}
          <div className="flex items-center gap-1 px-3 border-r border-jl-sage/30">
            <ToolButton
              icon={<Polygon size={24} weight="bold" />}
              label="Draw Polygon"
              onClick={() => onToolChange?.('draw')}
              active={activeTool === 'draw'}
              disabled={false}
            />
            <ToolButton
              icon={<Circle size={24} weight="duotone" />}
              label="Draw Circle"
              onClick={() => onToolChange?.('circle')}
              active={activeTool === 'circle'}
              disabled={false}
            />
            <ToolButton
              icon={<Square size={24} weight="duotone" />}
              label="Draw Rectangle"
              onClick={() => onToolChange?.('rectangle')}
              active={activeTool === 'rectangle'}
              disabled={false}
            />
          </div>

          {/* Shape Manipulation Tools */}
          <div className="flex items-center gap-1 px-3 border-r border-jl-sage/30">
            <ToolButton
              icon={<SelectionAll size={24} weight="duotone" />}
              label="Selection"
              onClick={() => onToolChange?.('select')}
              active={activeTool === 'select'}
              disabled={false}
            />
            <ToolButton
              icon={<ArrowsOutCardinal size={24} weight="bold" />}
              label="Move Shape"
              onClick={() => onToolChange?.('move')}
              active={activeTool === 'move'}
              disabled={false}
            />
            <ToolButton
              icon={<PencilLine size={24} weight="bold" />}
              label="Edit Shape"
              onClick={() => onToolChange?.('edit')}
              active={activeTool === 'edit'}
              disabled={false}
            />
          </div>

          {/* Measurement Tools */}
          <div className="flex items-center gap-1 px-3 border-r border-jl-sage/30">
            <ToolButton
              icon={<Ruler size={24} weight="duotone" />}
              label="Measure Distance"
              onClick={() => onToolChange?.('measure')}
              active={activeTool === 'measure'}
              disabled={false}
            />
            <ToolButton
              icon={<CirclesFour size={24} weight="duotone" />}
              label="Distance Rings"
              onClick={() => onToolChange?.('rings')}
              active={activeTool === 'rings'}
              disabled={false}
            />
            <ToolButton
              icon={<MapPin size={24} weight="duotone" />}
              label="Place Marker"
              onClick={() => onToolChange?.('marker')}
              active={activeTool === 'marker'}
              disabled={false}
            />
          </div>

          {/* History Controls */}
          <div className="flex items-center gap-1 ml-auto">
            <ToolButton
              icon={<ArrowCounterClockwise size={24} weight="bold" />}
              label="Undo"
              onClick={onUndo}
              disabled={false}
            />
            <ToolButton
              icon={<ArrowClockwise size={24} weight="bold" />}
              label="Redo"
              onClick={onRedo}
              disabled={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
