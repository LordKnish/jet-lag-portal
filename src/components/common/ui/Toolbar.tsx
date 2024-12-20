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

interface ToolbarProps {
  onToolChange?: (tool: string) => void;
  onFillStyleChange?: (style: 'solid' | 'hashed') => void;
  onUndo?: () => void;
  onRedo?: () => void;
  activeTool?: string;
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
    disabled={disabled}
  >
    <div className="w-6 h-6 flex items-center justify-center">
      {icon}
    </div>
  </button>
);

const Toolbar: React.FC<ToolbarProps> = ({
  onToolChange,
  onFillStyleChange,
  onUndo,
  onRedo,
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
              icon={<Hand weight="fill" />}
              label="Pan Tool"
              onClick={() => onToolChange?.('pan')}
              active={activeTool === 'pan'}
              disabled={disabled}
            />
            <ToolButton
              icon={<Pencil weight="fill" />}
              label="Free Draw"
              onClick={() => onToolChange?.('draw')}
              active={activeTool === 'draw'}
              disabled={disabled}
            />
            <ToolButton
              icon={<Eraser size={24} weight="duotone" />}
              label="Erase"
              onClick={() => onToolChange?.('erase')}
              active={activeTool === 'erase'}
              disabled={disabled}
            />
          </div>

          {/* Shape Tools Group */}
          <div className="flex items-center gap-1 px-3 border-r border-jl-sage/30">
            <ToolButton
              icon={<Circle size={24} weight="duotone" />}
              label="Radar Circle"
              onClick={() => onToolChange?.('radar')}
              active={activeTool === 'radar'}
              disabled={disabled}
            />
            <ToolButton
              icon={<Square size={24} weight="duotone" />}
              label="Rectangle"
              onClick={() => onToolChange?.('rectangle')}
              active={activeTool === 'rectangle'}
              disabled={disabled}
            />
            <ToolButton
              icon={<SelectionAll size={24} weight="duotone" />}
              label="Selection"
              onClick={() => onToolChange?.('select')}
              active={activeTool === 'select'}
              disabled={disabled}
            />
          </div>

          {/* Fill Tools Group */}
          <div className="flex items-center gap-1 px-3 border-r border-jl-sage/30">
            <ToolButton
              icon={<PaintBucket size={24} weight="duotone" />}
              label="Solid Fill"
              onClick={() => {
                onToolChange?.('fill');
                onFillStyleChange?.('solid');
              }}
              active={activeTool === 'fill-solid'}
              disabled={disabled}
            />
            <ToolButton
              icon={<Hash size={24} weight="duotone" />}
              label="Hashed Fill (Uncertain Area)"
              onClick={() => {
                onToolChange?.('fill');
                onFillStyleChange?.('hashed');
              }}
              active={activeTool === 'fill-hashed'}
              disabled={disabled}
            />
          </div>

          {/* Measurement Tools Group */}
          <div className="flex items-center gap-1 px-3 border-r border-jl-sage/30">
            <ToolButton
              icon={<Ruler size={24} weight="duotone" />}
              label="Measure"
              onClick={() => onToolChange?.('measure')}
              active={activeTool === 'measure'}
              disabled={disabled}
            />
            <ToolButton
              icon={<CirclesFour size={24} weight="duotone" />}
              label="Distance Rings"
              onClick={() => onToolChange?.('rings')}
              active={activeTool === 'rings'}
              disabled={disabled}
            />
            <ToolButton
              icon={<MapPin size={24} weight="duotone" />}
              label="Place Marker"
              onClick={() => onToolChange?.('marker')}
              active={activeTool === 'marker'}
              disabled={disabled}
            />
          </div>

          {/* History Controls Group */}
          <div className="flex items-center gap-1 ml-auto">
            <ToolButton
              icon={<ArrowCounterClockwise size={24} weight="duotone" />}
              label="Undo"
              onClick={onUndo}
              disabled={disabled}
            />
            <ToolButton
              icon={<ArrowClockwise size={24} weight="duotone" />}
              label="Redo"
              onClick={onRedo}
              disabled={disabled}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;