// src/components/map/LayerPanel.tsx
import React, { useState, useRef } from 'react';
import { Plus, Trash2, Eye, EyeOff, Edit2, GripHorizontal } from 'lucide-react';
import { Layer } from '../../types/map';

interface LayerPanelProps {
  layers: Layer[];
  onAddLayer: () => void;
  onDeleteLayer: (id: string) => void;
  onToggleLayer: (id: string) => void;
  onRenameLayer: (id: string, name: string) => void;
  onChangeLayerColor: (id: string, color: string) => void; // <-- Added
  activeLayer: string | null;
  setActiveLayer: (id: string | null) => void;
}


const LayerItem: React.FC<{
  layer: Layer;
  isActive: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onRename: (name: string) => void;
  onChangeColor: (color: string) => void; // <-- Added
  onClick: () => void;
  isEditing: boolean;
  setEditing: (editing: boolean) => void;
}> = ({
  layer,
  isActive,
  onToggle,
  onDelete,
  onRename,
  onChangeColor,
  onClick,
  isEditing,
  setEditing
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChangeColor(e.target.value);
  };

  const handleColorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  return (
    <div
      className={`
        group relative rounded-lg border p-3 cursor-pointer
        transition-all duration-200 ease-in-out
        hover:shadow-md
        ${isActive 
          ? 'border-jl-teal bg-jl-sage/30' 
          : 'border-jl-sage hover:border-jl-sage bg-jl-cream'
        }
      `}
      onClick={handleClick}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 cursor-grab">
          <GripHorizontal className="text-jl-sage" size={16} />
        </div>

        {/* Color Box */}
        <div
          className="w-6 h-6 rounded border border-jl-sage cursor-pointer flex-shrink-0 relative"
          style={{ backgroundColor: layer.color }}
          onClick={handleColorClick}
        >
          <input
            type="color"
            value={layer.color}
            onChange={handleColorChange}
            ref={fileInputRef}
            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>

        <div className="flex-grow min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={layer.name}
              onChange={(e) => onRename(e.target.value)}
              onBlur={() => setEditing(false)}
              onClick={(e) => e.stopPropagation()}
              className="w-full px-2 py-1 border rounded focus:border-jl-teal focus:ring-1 focus:ring-jl-teal"
              autoFocus
            />
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-medium text-black">{layer.name}</span> {/* Removed truncate */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditing(true);
                }}
                className="opacity-0 group-hover:opacity-100 text-jl-sage hover:text-jl-teal"
              >
                <Edit2 size={14} />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className={`p-1.5 rounded-md transition-colors ${
              layer.visible 
                ? 'text-jl-teal hover:bg-jl-sage' 
                : 'text-jl-sage hover:bg-jl-sage'
            }`}
          >
            {layer.visible ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 rounded-md text-jl-sage hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

const LayerPanel: React.FC<LayerPanelProps> = ({
  layers,
  onAddLayer,
  onDeleteLayer,
  onToggleLayer,
  onRenameLayer,
  onChangeLayerColor, // Added
  activeLayer,
  setActiveLayer,
}) => {
  const [editingLayer, setEditingLayer] = useState<string | null>(null);

  return (
    <div className="h-full flex flex-col bg-jl-cream">
      <div className="flex-none p-4 border-b border-jl-sage bg-jl-cream">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-display font-bold text-black">Layers</h3> {/* Changed to text-black */}
          <button
            onClick={onAddLayer}
            className="px-3 py-1.5 bg-jl-salmon text-white rounded-curved hover:bg-jl-salmon/90 transition-colors flex items-center gap-1.5 font-display"
          >
            <Plus size={16} />
            <span className="text-sm font-medium">New Layer</span>
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 p-4 overflow-y-auto">
        <div className="space-y-2">
          {layers.map((layer) => (
            <LayerItem
              key={layer.id}
              layer={layer}
              isActive={layer.id === activeLayer}
              onToggle={() => onToggleLayer(layer.id)}
              onDelete={() => onDeleteLayer(layer.id)}
              onRename={(name) => onRenameLayer(layer.id, name)}
              onChangeColor={(color) => onChangeLayerColor(layer.id, color)} // <-- Added
              onClick={() => setActiveLayer(layer.id)}
              isEditing={editingLayer === layer.id}
              setEditing={(editing) => setEditingLayer(editing ? layer.id : null)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LayerPanel;
