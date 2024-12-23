// src/pages/GameMap.tsx

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Polygon,
  Circle,
  ZoomControl,
  FeatureGroup,
  LayersControl,
  ScaleControl,
} from 'react-leaflet';
import L, { LatLng, LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Toolbar from '../components/common/ui/Toolbar';
import ObjectPanel from '../components/map/ObjectPanel';
import DrawingControl from '../components/map/DrawingControl';
import SquareDrawingControl from '../components/map/SquareDrawingControl';
import CircleDrawingControl from '../components/map/CircleDrawingControl';
import MoveTool from '../components/map/MoveTool';
import MapClickHandler from '../components/map/MapClickHandler';
import { Layer, Coordinate, PolygonData, CircleData, RectangleData } from '../types/map';
import { MapMode } from '../types/toolbar';
import MeasurementControl from '../components/map/MeasurementControl';
import GpsControl from '../components/map/GpsControl';

const parseWKTPolygon = (wkt: string): Coordinate[] => {
  const coordsString = wkt.replace(/POLYGON\s*\(\((.*)\)\)/i, '$1').trim();
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
  const objectLayerRef = useRef<L.FeatureGroup | null>(null);
  const [activeObject, setActiveObject] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<MapMode>(null);
  const [fillStyle, setFillStyle] = useState<'solid' | 'hashed'>('solid');
  const apiKey = import.meta.env.VITE_THUNDERFOREST_API_KEY || '';
  const defaultCenter: Coordinate = useMemo(() => [32.07, 34.7674], []);
  const [gpsEnabled, setGpsEnabled] = useState(false); // Separate GPS state
  const [userLocation, setUserLocation] = useState<L.LatLng | null>(null);

  // Create new shape object
  const handleAddObject = useCallback(
    (
      type: 'polygon' | 'circle' | 'rectangle',
      data: PolygonData | CircleData | RectangleData
    ) => {
      const count = objects.filter(obj => obj.type === type).length + 1;
      const newObject: Layer = {
        id: `object-${Date.now()}`,
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${count}`,
        visible: true,
        color: `#${Math.floor(Math.random() * 16777215)
          .toString(16)
          .padStart(6, '0')}`,
        opacity: 0.4,
        type,
        data,
      };
      setObjects(prev => [...prev, newObject]);
    },
    [objects]
  );

  // Update shape data
  const handleUpdateObject = useCallback(
    (id: string, newData: Coordinate[] | CircleData | null) => {
      if (!newData) {
        return;
      }
      setObjects(prev =>
        prev.map(obj => {
          if (obj.id === id) {
            // If it's a circle, we expect { center, radius }
            if (obj.type === 'circle' && 'center' in newData) {
              return { ...obj, data: { center: newData.center, radius: newData.radius } };
            }
            // Otherwise, treat as array of coordinates (polygon/rectangle)
            return { ...obj, data: newData as Coordinate[] };
          }
          return obj;
        })
      );
    },
    []
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
              opacity: obj.visible ? 0 : obj.opacity ?? 0.4,
              visible: !obj.visible,
            }
          : obj
      )
    );
  }, []);

  const handleRenameObject = useCallback((id: string, name: string) => {
    setObjects(prev => prev.map(obj => (obj.id === id ? { ...obj, name } : obj)));
  }, []);

  const handleChangeObjectColor = useCallback((id: string, color: string) => {
    setObjects(prev => prev.map(obj => (obj.id === id ? { ...obj, color } : obj)));
  }, []);

  // Load boundary from CSV / WKT
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
        setIsLoading(false);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load game boundary';
        setError(`${errorMessage}. Please try refreshing the page.`);
        setIsLoading(false);
      }
    };
    loadBoundary();
  }, []);

  // Re-draw objects into the FeatureGroup each time `objects` changes
  useEffect(() => {
    if (objectLayerRef.current) {
      const layerGroup = objectLayerRef.current;
      layerGroup.clearLayers();

      objects.forEach(obj => {
        if (!obj.visible || !obj.data) {
          return;
        }
        let layer: L.Layer | null = null;

        if (obj.type === 'polygon' || obj.type === 'rectangle') {
          const positions = Array.isArray(obj.data)
            ? (obj.data as [number, number][]).map(
                ([lat, lng]) => [lat, lng] as LatLngExpression
              )
            : [];
          layer = L.polygon(positions, {
            color: obj.color,
            weight: 2,
            fillOpacity: 0.4,
          });
        } else if (obj.type === 'circle') {
          const circleData = obj.data as CircleData;
          layer = L.circle(circleData.center as LatLngExpression, {
            radius: circleData.radius,
            color: obj.color,
            weight: 2,
            fillOpacity: 0.4,
          });
        }
        if (layer) {
          layerGroup.addLayer(layer);
        }
      });
    }
  }, [objects]);

  // Handle tool changes
  const handleToolChange = (tool: MapMode | null) => {
    if (tool === 'gps') {
      setGpsEnabled(prev => !prev); // Toggle GPS state
    } else {
      setMapMode(tool);
    }
  };

  // Handle GPS toggle
  const handleGpsToggle = useCallback(() => {
    setGpsEnabled(prev => {
      const newState = !prev;
      return newState;
    });
  }, []); // Empty dependency array ensures stable callback
  
  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation(L.latLng(latitude, longitude));
      },
      (error) => console.error('GPS Error:', error.message),
      { enableHighAccuracy: true }
    );
  
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);
  

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden relative">
      <Toolbar
        onToolChange={handleToolChange}
        activeTool={mapMode}
        gpsEnabled={gpsEnabled} // Pass state
        onGpsToggle={handleGpsToggle} // Pass callback explicitly
        disabled={isLoading || !!error}
        onUndo={() => console.log('Undo action triggered')}
        onRedo={() => console.log('Redo action triggered')}
        onFillStyleChange={(style) => setFillStyle(style)}
        fillStyle={fillStyle}
      />



      <div className="flex-1 flex overflow-hidden w-full">
        <div className="flex-1 relative w-full">
          <MapContainer center={defaultCenter} zoom={14} className="h-full w-full" zoomControl={false}>
            <FeatureGroup ref={objectLayerRef} />

            {/* Handles map clicks for shape selection, etc. */}
            <MapClickHandler
              mapMode={mapMode}
              objects={objects}
              setActiveObject={setActiveObject}
            />

            {/* MoveTool only when we're in 'move' mode */}
            {mapMode === 'move' && (
              <MoveTool
                activeTool={mapMode}
                selectedObject={objects.find(obj => obj.id === activeObject) || null}
                onUpdateObject={handleUpdateObject}
                boundary={boundary}
              />
            )}

            <LayersControl position="topright">
              <LayersControl.BaseLayer checked name="Default Map">
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />
              </LayersControl.BaseLayer>

              <LayersControl.BaseLayer name="OpenCycleMap">
                <TileLayer
                  url={`https://tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey=${apiKey}`}
                  attribution="&copy; Thunderforest & OpenStreetMap contributors"
                />
              </LayersControl.BaseLayer>

              <LayersControl.BaseLayer name="Transport">
                <TileLayer
                  url={`https://tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=${apiKey}`}
                  attribution="&copy; Thunderforest & OpenStreetMap contributors"
                />
              </LayersControl.BaseLayer>

              <LayersControl.BaseLayer name="Outdoors">
                <TileLayer
                  url={`https://tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey=${apiKey}`}
                  attribution="&copy; Thunderforest & OpenStreetMap contributors"
                />
              </LayersControl.BaseLayer>
            </LayersControl>

            <ZoomControl position="bottomright" />
            <ScaleControl position="bottomleft" />

            {/* Game boundary polygon (optional) */}
            {boundary.length > 0 && (
              <Polygon
                positions={boundary as LatLngExpression[]}
                pathOptions={{
                  color: '#000000',
                  weight: 4,
                  fillOpacity: 0,
                  dashArray: '5, 5',
                }}
                interactive={false}
                pane="tilePane"
              />
            )}

            {/* Direct rendering of objects (optional if not using FeatureGroup) */}
            {objects.map(obj => {
              if (!obj.visible || !obj.data) {
                return null;
              }

              if (obj.type === 'polygon' || obj.type === 'rectangle') {
                const positions = (obj.data as Coordinate[]).map(
                  ([lat, lng]) => [lat, lng] as LatLngExpression
                );
                return (
                  <Polygon
                    key={obj.id}
                    positions={positions}
                    pathOptions={{
                      color: obj.color,
                      weight: 2,
                      opacity: obj.opacity,
                      fillOpacity: obj.opacity,
                    }}
                  />
                );
              }
              if (obj.type === 'circle') {
                const circleData = obj.data as CircleData;
                return (
                  <Circle
                    key={obj.id}
                    center={circleData.center as LatLngExpression}
                    radius={circleData.radius}
                    pathOptions={{
                      color: obj.color,
                      weight: 2,
                      opacity: obj.opacity,
                      fillOpacity: obj.opacity,
                    }}
                  />
                );
              }
              return null;
            })}

            {/* Drawing Controls */}
            <DrawingControl
              onDrawComplete={data => handleAddObject('polygon', data)}
              isDrawingMode={mapMode === 'draw'}
              boundary={boundary}
            />

            <SquareDrawingControl
              onSquareComplete={coordinates => handleAddObject('rectangle', coordinates)}
              isEnabled={mapMode === 'rectangle'}
              boundary={boundary}
            />

            <CircleDrawingControl
              onCircleComplete={(center: L.LatLng, radius: number) =>
                handleAddObject('circle', { center: [center.lat, center.lng], radius })
              }
              isEnabled={mapMode === 'circle'}
              boundary={boundary}
              gpsEnabled={gpsEnabled} // Pass GPS toggle state
              userLocation={userLocation} // Pass GPS coordinates
            />


            <MeasurementControl isEnabled={mapMode === 'measure'} />
            <GpsControl gpsEnabled={gpsEnabled} />
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
