// src/components/common/ui/Toolbar.tsx
import React from 'react';
import { 
  Pencil,
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
  Hash
} from "@phosphor-icons/react";
import { MapMode } from '../../../types/toolbar';

interface ToolbarProps {
  onToolChange: (tool: MapMode) => void;
  activeTool: MapMode;
  disabled?: boolean;
}

interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
}

const ToolButton: React.FC<ToolButtonProps> = ({ 
  icon, 
  label, 
  onClick, 
  active, 
  disabled 
}) => (
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
    disabled={disabled}
  >
    <div className="w-6 h-6 flex items-center justify-center">
      {icon}
    </div>
  </button>
);

const Toolbar: React.FC<ToolbarProps> = ({
  onToolChange,
  activeTool,
  disabled
}) => {
  return (
    <div className="w-full bg-jl-teal border-b border-jl-sage/30 shadow-md">
      <div className="w-full">
        <div className="flex items-center h-14 gap-1 px-2">
          {/* Drawing Tools Group */}
          <div className="flex items-center gap-1 pr-3 border-r border-jl-sage/30">
            <ToolButton
              icon={<Pencil weight="fill" />}
              label="Draw"
              onClick={() => onToolChange('draw')}
              active={activeTool === 'draw'}
              disabled={disabled}
            />
          </div>

          {/* Measurement Tools Group */}
          <div className="flex items-center gap-1 px-3 border-r border-jl-sage/30">
            <ToolButton
              icon={<Ruler size={24} weight="duotone" />}
              label="Measure"
              onClick={() => onToolChange('measure')}
              active={activeTool === 'measure'}
              disabled={disabled}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;