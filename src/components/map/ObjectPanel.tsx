import React, { useState, useRef } from 'react';
import { Trash2, Eye, EyeOff } from 'lucide-react';
import { CircleData, Coordinate, Layer, RectangleData } from '../../types/map';
import Chrome from '@uiw/react-color-chrome';

interface ObjectPanelProps {
  objects: Layer[];
  onDeleteObject: (id: string) => void;
  onToggleObject: (id: string) => void;
  onRenameObject: (id: string, name: string) => void;
  onChangeObjectColor: (id: string, color: string, opacity: number) => void;
  activeObject: string | null;
  setActiveObject: (id: string | null) => void;
}

const ObjectItem: React.FC<{
  object: Layer;
  isActive: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onRename: (name: string) => void;
  onChangeColor: (color: string, opacity: number) => void;
  onClick: () => void;
  isEditing: boolean;
  setEditing: (editing: boolean) => void;
}> = ({
  object,
  isActive,
  onToggle,
  onDelete,
  onRename,
  onChangeColor,
  onClick,
  isEditing,
  setEditing,
}) => {
  const [displayColorPicker, setDisplayColorPicker] = useState(false);
  const [color, setColor] = useState(object.color || '#5F9EA0');
  const [opacity, setOpacity] = useState(object.opacity || 1);

  const handleColorChange = (newColor: any) => {
    setColor(newColor.hexa);
    setOpacity(newColor.rgb.a || 1);
    onChangeColor(newColor.hexa, newColor.rgb.a || 1);
  };

  const toggleColorPicker = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDisplayColorPicker(!displayColorPicker);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
    setEditing(true); // Enable editing mode directly on click
  };

  // Helper function to get size description
  const getObjectSizeDescription = (object: Layer) => {
    if (!object.data) {
      return ''; // Handle case where data is null
    }
  
    // Circle - Display radius
    if (object.type === 'circle' && 'radius' in object.data) {
      const circleData = object.data as CircleData;
      return `Radius: ${circleData.radius} m`;
    }
  
    // Polygon and Rectangle - Calculate area
    if (object.type === 'polygon' || object.type === 'rectangle') {
      const polygonData = object.data as Coordinate[]; // Treat as array of coordinates
  
      // Shoelace formula to calculate area
      const calculateArea = (coords: Coordinate[]) => {
        let area = 0;
        const n = coords.length;
        for (let i = 0; i < n; i++) {
          const [lat1, lng1] = coords[i];
          const [lat2, lng2] = coords[(i + 1) % n]; // Next vertex (wraps around)
          area += (lng1 * lat2 - lng2 * lat1); // Shoelace formula
        }
        return Math.abs(area * 0.5 * 111320 * 110540); // Convert lat/lng degrees to meters²
      };
  
      const area = calculateArea(polygonData);
      return `Area: ${area.toFixed(1)} m²`;
    }
  
    return ''; // Default for unsupported types
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

        {/* Color Picker with Chrome Picker */}
        <div
          className="w-6 h-6 rounded border border-jl-sage cursor-pointer flex-shrink-0 relative"
          style={{ backgroundColor: color, opacity: opacity }}
          onClick={toggleColorPicker}
        ></div>

        {displayColorPicker && (
          <div className="absolute z-50 top-full mt-2 shadow-lg">
            <Chrome
              color={color}
              onChange={handleColorChange}
              showAlpha={true}
              className="shadow-md rounded-lg"
            />
          </div>
        )}

        <div className="flex-grow min-w-0 flex items-center gap-2">
          {isEditing ? (
            <input
              type="text"
              value={object.name}
              onChange={(e) => onRename(e.target.value)}
              onBlur={() => setEditing(false)}
              className="w-full px-2 py-1 border rounded focus:border-jl-teal focus:ring-1 focus:ring-jl-teal"
              autoFocus
            />
          ) : (
            <div className="flex flex-col">
              <span className="font-medium text-black truncate">{object.name}</span>
              <span className="text-xs text-gray-500">
                {getObjectSizeDescription(object)}
              </span>
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
              object.visible 
                ? 'text-jl-teal hover:bg-jl-sage' 
                : 'text-jl-sage hover:bg-jl-sage'
            }`}
          >
            {object.visible ? <Eye size={16} /> : <EyeOff size={16} />}
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

const ObjectPanel: React.FC<ObjectPanelProps> = ({
  objects,
  onDeleteObject,
  onToggleObject,
  onRenameObject,
  onChangeObjectColor,
  activeObject,
  setActiveObject,
}) => {
  const [editingObject, setEditingObject] = useState<string | null>(null);

  return (
    <div className="h-full flex flex-col bg-jl-cream">
      <div className="flex-none p-4 border-b border-jl-sage bg-jl-cream">
        <h3 className="text-lg font-display font-bold text-black">Objects</h3>
      </div>

      <div className="flex-1 min-h-0 p-4 overflow-y-auto">
        <div className="space-y-2">
          {objects.map((object) => (
            <ObjectItem
              key={object.id}
              object={object}
              isActive={object.id === activeObject}
              onToggle={() => onToggleObject(object.id)}
              onDelete={() => onDeleteObject(object.id)}
              onRename={(name) => onRenameObject(object.id, name)}
              onChangeColor={(color, opacity) => onChangeObjectColor(object.id, color, opacity)}
              onClick={() => setActiveObject(object.id)}
              isEditing={editingObject === object.id}
              setEditing={(editing) => setEditingObject(editing ? object.id : null)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ObjectPanel;
