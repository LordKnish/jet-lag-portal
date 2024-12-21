// src/components/map/LayerPanel.tsx
import React, { useState, useCallback } from 'react';
import { Plus, Trash2, Eye, EyeOff, Edit2, GripHorizontal } from 'lucide-react';
import { Layer } from '../../types/layer';

interface LayerPanelProps {
    layers: Layer[];
    onAddLayer: () => void;
    onDeleteLayer: (id: string) => void;
    onToggleLayer: (id: string) => void;
    onRenameLayer: (id: string, name: string) => void;
    activeLayer: string | null;
    setActiveLayer: (id: string | null) => void;
  }

const LayerItem: React.FC<{
  layer: Layer;
  isActive: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onRename: (name: string) => void;
  onClick: () => void;
  isEditing: boolean;
  setEditing: (editing: boolean) => void;
}> = ({
  layer,
  isActive,
  onToggle,
  onDelete,
  onRename,
  onClick,
  isEditing,
  setEditing
}) => {
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  }, [onClick]);

  return (
    <div
      className={`
        group relative rounded-lg border p-3 cursor-pointer
        transition-all duration-200 ease-in-out
        hover:shadow-md
        ${isActive 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 hover:border-gray-300 bg-white'
        }
      `}
      onClick={handleClick}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 cursor-grab">
          <GripHorizontal size={16} className="text-gray-400" />
        </div>
        
        <div className="flex-grow min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={layer.name}
              onChange={(e) => onRename(e.target.value)}
              onBlur={() => setEditing(false)}
              onClick={(e) => e.stopPropagation()}
              className="w-full px-2 py-1 border rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{layer.name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditing(true);
                }}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600"
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
                ? 'text-blue-500 hover:bg-blue-50' 
                : 'text-gray-400 hover:bg-gray-50'
            }`}
          >
            {layer.visible ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
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
  onReorderLayers,
  activeLayer,
  setActiveLayer,
}) => {
  const [editingLayer, setEditingLayer] = useState<string | null>(null);

  return (
    <div className="h-full flex flex-col bg-jl-cream">
      {/* Header */}
      <div className="flex-none p-4 border-b border-jl-sage/30 bg-jl-cream">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-display font-bold text-jl-teal">Layers</h3>
          <button
            onClick={onAddLayer}
            className="px-3 py-1.5 bg-jl-salmon text-white rounded-curved hover:bg-jl-salmon/90 transition-colors flex items-center gap-1.5 font-display"
          >
            <Plus size={16} />
            <span className="text-sm font-medium">New Layer</span>
          </button>
        </div>
      </div>

      {/* Layer List */}
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
              onClick={() => setActiveLayer(layer.id)}
              isEditing={editingLayer === layer.id}
              setEditing={(editing) => setEditingLayer(editing ? layer.id : null)}
            />
          ))}
        </div>
      </div>

      {/* Drawing Tools */}
      {activeLayer && (
        <div className="flex-none p-4 bg-white border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Drawing Tools</h4>
          <div className="grid grid-cols-4 gap-2">
            {/* Placeholder for drawing tool buttons */}
            {[1, 2, 3, 4].map((i) => (
              <button
                key={i}
                className="h-8 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LayerPanel;