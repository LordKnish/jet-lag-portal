// src/pages/GameMap.tsx
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Polygon,
  Circle, 
  ZoomControl,
  useMap,
  ScaleControl,
  FeatureGroup
} from 'react-leaflet';
import L, { LatLngBounds, LatLng, LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertCircle } from 'lucide-react';
import SquareDrawingControl from '../components/map/SquareDrawingControl';
import Toolbar from '../components/common/ui/Toolbar';
import ObjectPanel from '../components/map/ObjectPanel';
import DrawingControl from '../components/map/DrawingControl';
import CircleDrawingControl from '../components/map/CircleDrawingControl';
import { Layer, Coordinate, latLngToCoordinate, PolygonData, CircleData, RectangleData } from '../types/map';
import { MapMode } from '../types/toolbar';

const parseWKTPolygon = (wkt: string): Coordinate[] => {
  const coordsString = wkt
    .replace(/POLYGON\s*\(\((.*)\)\)/i, '$1')
    .trim();

  return coordsString.split(', ').map(coord => {
    const [lng, lat] = coord.split(' ').map(Number);
    return [lat, lng];
  });
};

const GameMap: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [boundary, setBoundary] = useState<Coordinate[]>([]);
  const [objects, setObjects] = useState<Layer[]>([]);
  const objectLayerRef = useRef<L.FeatureGroup | null>(null); // FeatureGroup reference
  const [activeObject, setActiveObject] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<MapMode>(null);
  const [fillStyle, setFillStyle] = useState<'solid' | 'hashed'>('solid');

  const defaultCenter: Coordinate = useMemo(() => [32.0700, 34.7674], []);

  const handleAddObject = useCallback(
    (type: 'polygon' | 'circle' | 'rectangle', data: PolygonData | CircleData | RectangleData) => {
      const count = objects.filter(obj => obj.type === type).length + 1;
      const newObject: Layer = {
        id: `object-${Date.now()}`,
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${count}`,
        visible: true,
        color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
        opacity: 0.4, // Default opacity
        type: type,
        data: data,
      };      
      setObjects(prev => [...prev, newObject]);
    },
    [objects]
  );

  const handleDeleteObject = useCallback((id: string) => {
    setObjects(prev => prev.filter(obj => obj.id !== id));
  }, []);

  const handleToggleObject = useCallback((id: string) => {
    setObjects(prev =>
      prev.map(obj =>
        obj.id === id
          ? {
              ...obj,
              opacity: obj.visible ? 0 : (obj.opacity ?? 0.4), // Use object's opacity or default
              visible: !obj.visible, // Toggle visibility
            }
          : obj
      )
    );
  }, []);
  
  
  

  const handleRenameObject = useCallback((id: string, name: string) => {
    setObjects(prev => prev.map(obj => obj.id === id ? { ...obj, name } : obj));
  }, []);

  const handleChangeObjectColor = useCallback((id: string, color: string) => {
    setObjects(prev => prev.map(obj => obj.id === id ? { ...obj, color } : obj));
  }, []);

  useEffect(() => {
    const loadBoundary = async () => {
      try {
        const response = await fetch('/data/game-boundary.csv');
        if (!response.ok) {
          throw new Error('Failed to fetch boundary data');
        }
        const text = await response.text();
        const lines = text.split('\n');
        if (lines.length >= 2) {
          const wktDataMatch = lines[1].match(/"([^"]+)"/);
          if (wktDataMatch && wktDataMatch[1]) {
            const coordinates = parseWKTPolygon(wktDataMatch[1]);
            setBoundary(coordinates);
          } else {
            throw new Error('Invalid boundary data format');
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load game boundary';
        setError(`${errorMessage}. Please try refreshing the page.`);
        setIsLoading(false);
      }
    };

    loadBoundary();
  }, []);

  useEffect(() => {
    if (objectLayerRef.current) {
      const layerGroup = objectLayerRef.current; // Safely reference the current value
      layerGroup.clearLayers(); // Clear existing layers
    
      objects.forEach(obj => {
        if (!obj.visible || !obj.data) {
          return;
        } // Skip invalid objects
    
        let layer: L.Layer | null = null;
    
        // Handle polygons and rectangles
        if (obj.type === 'polygon' || obj.type === 'rectangle') {
          const positions = Array.isArray(obj.data)
            ? (obj.data as [number, number][]).map(coord => [coord[0], coord[1]] as LatLngExpression)
            : [];
        
          layer = L.polygon(positions, {
            color: obj.color,
            weight: 2,
            fillOpacity: 0.4,
          });
        }
    
        // Handle circles
        if (obj.type === 'circle') {
          const circleData = obj.data as CircleData; // Explicit cast
          layer = L.circle(circleData.center as LatLngExpression, {
            radius: circleData.radius,
            color: obj.color,
            weight: 2,
            fillOpacity: 0.4,
          });
        }
    
        // Add the layer safely
        if (layer) {
          layerGroup.addLayer(layer); // Uses safe reference
        }
      });
    }
    
  }, [objects]); // Re-run when objects change

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden relative">
      <Toolbar
        onToolChange={setMapMode}
        onFillStyleChange={setFillStyle}
        fillStyle={fillStyle}
        activeTool={mapMode}
        disabled={isLoading || !!error}
      />
      <div className="flex-1 flex overflow-hidden w-full">
        <div className="flex-1 relative w-full">
          <MapContainer center={defaultCenter} zoom={14} className="h-full w-full" zoomControl={false}>
            <FeatureGroup ref={objectLayerRef}></FeatureGroup> {/* Add FeatureGroup */}
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            <ZoomControl position="bottomright" />
            <ScaleControl position="bottomleft" />
            {boundary.length > 0 && (
              <Polygon
                positions={boundary as LatLngExpression[]}
                pathOptions={{
                  color: '#000000',
                  weight: 4,
                  fillOpacity: 0,
                  dashArray: '5, 5', // Make it visually distinct
                }}
                interactive={false} // Make it un-editable
                pane="tilePane"
              />
            )}
            {objects.map(obj => {
              if (obj.type === 'polygon' || obj.type === 'rectangle') {
                const positions = Array.isArray(obj.data)
                  ? (obj.data as [number, number][]).map(coord => [coord[0], coord[1]] as LatLngExpression)
                  : [];
              
                return (
                  <Polygon
                    key={obj.id}
                    positions={positions}
                    pathOptions={{
                      color: obj.color,
                      weight: 2,
                      opacity: obj.opacity,       // Controls border opacity
                      fillOpacity: obj.opacity,   // Controls fill opacity
                    }}
                  />
                );
              }
              
              // Handle circles
              if (obj.type === 'circle') {
                const circleData = obj.data as CircleData; // Explicit cast
                return (
                  <Circle
                    key={obj.id}
                    center={circleData.center as LatLngExpression}
                    radius={circleData.radius}
                    pathOptions={{
                      color: obj.color,
                      weight: 2,
                      opacity: obj.opacity,       // Controls border opacity
                      fillOpacity: obj.opacity,   // Controls fill opacity
                    }}
                  />
                );
              }
    
              return null; // Fallback for unsupported object types
            })}
            <DrawingControl onDrawComplete={(data) => handleAddObject('polygon', data)} isDrawingMode={mapMode === 'draw'} boundary={boundary} />
            <CircleDrawingControl 
              onCircleComplete={(center, radius) => 
                handleAddObject('circle', { center: [center.lat, center.lng], radius }) // Convert LatLng to tuple
              }
              isEnabled={mapMode === 'circle'} 
              boundary={boundary} 
            />
            <SquareDrawingControl onSquareComplete={(coordinates) => handleAddObject('rectangle', coordinates)} isEnabled={mapMode === 'rectangle'} boundary={boundary} />
          </MapContainer>
        </div>
        <div className="w-80 flex-none border-l border-jl-sage/30 bg-jl-cream">
          <ObjectPanel
            objects={objects}
            onDeleteObject={handleDeleteObject}
            onToggleObject={handleToggleObject}
            onRenameObject={handleRenameObject}
            onChangeObjectColor={handleChangeObjectColor}
            activeObject={activeObject}
            setActiveObject={setActiveObject}
          />
        </div>
      </div>
    </div>
  );
};

export default GameMap;
