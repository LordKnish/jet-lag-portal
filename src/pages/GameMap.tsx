// src/pages/GameMap.tsx

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Polygon,
  Circle,
  ZoomControl,
  FeatureGroup,
  LayersControl,
  ScaleControl,
  Marker,
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
import { Layer, EditableLayer, Coordinate, CircleData, RectangleData, MarkerData, PolygonData } from '../types/map';
import { MapMode } from '../types/toolbar';
import MeasurementControl from '../components/map/MeasurementControl';
import GpsControl from '../components/map/GpsControl';
import MarkerControl from '../components/map/MarkerControl';
import SetMaxBounds from '../components/map/SetMaxBounds';
import { ChevronUp, ChevronDown } from 'lucide-react';
import UndoRedoManager from '../utils/UndoRedoManager';
import EditTool from '../components/map/EditTool';

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
  const [isPanelVisible, setPanelVisible] = useState(false);
  const undoRedoManager = useRef(new UndoRedoManager(10)); // Limit to 10 states
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const togglePanel = useCallback(() => {
    setPanelVisible(prev => !prev);
  }, []);

  // Debugging: Log activeObject and objects
  useEffect(() => {
    console.log('Active Object ID:', activeObject);
    console.log('Objects:', objects);
  }, [activeObject, objects]);

  let shapeForEdit: EditableLayer | null = null;
  const found = objects.find(obj => obj.id === activeObject);
  console.log('Found object for editing:', found);
  if (
    found &&
    (found.type === 'circle' || found.type === 'polygon' || found.type === 'rectangle')
  ) {
    shapeForEdit = found as EditableLayer; // Type assertion to EditableLayer
  }

  const saveStateToUndoRedo = useCallback((newState: Layer[]) => {
    console.log('Saving state to UndoRedoManager:', newState);
    // Convert our Layer[] to the narrow EditableLayer[] if needed
    undoRedoManager.current.addState(
      newState.map(obj => ({
        id: obj.id,
        name: obj.name,
        type: obj.type as 'rectangle' | 'circle' | 'marker' | 'polygon',
        data: obj.data,
        color: obj.color,
        opacity: obj.opacity,
        visible: obj.visible,
      }))
    );
    // Update canUndo/canRedo after adding a new snapshot
    setCanUndo(undoRedoManager.current.canUndo());
    setCanRedo(undoRedoManager.current.canRedo());
    console.log('Can Undo:', canUndo, 'Can Redo:', canRedo);
  }, [canUndo, canRedo]);

  // Create new shape object
  const handleAddObject = useCallback(
    (
      type: 'polygon' | 'circle' | 'rectangle',
      data: PolygonData | CircleData | RectangleData
    ) => {
      setObjects(prev => {
        const count = prev.filter(obj => obj.type === type).length + 1;
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
        const updated = [...prev, newObject];
        console.log(`Adding new ${type}:`, newObject);
        // Immediately save the new state to Undo/Redo for reliability
        saveStateToUndoRedo(updated);
        return updated;
      });
    },
    [saveStateToUndoRedo]
  );

  // Update shape data
  const handleUpdateObject = useCallback(
    (id: string, newData: Coordinate[] | CircleData | null) => {
      console.log('handleUpdateObject CALLED with:', { id, newData });
      if (!newData) return;

      setObjects(prev => {
        const updated = prev.map(obj => {
          if (obj.id !== id) return obj;

          if (obj.type === 'circle') {
            const circleData = newData as CircleData;

            // Make sure we have exactly two numbers: [LAT, LNG]
            const [possibleLat, possibleLng] = circleData.center;

            // OPTIONAL: Debug logs to confirm what we are storing
            console.log('Updating circle:', {
              id,
              lat: possibleLat,
              lng: possibleLng,
              radius: circleData.radius,
            });

            // Ensure the center has exactly two numbers
            const safeCenter: [number, number] = [possibleLat, possibleLng];

            return {
              ...obj,
              data: {
                center: safeCenter,
                radius: circleData.radius,
              },
            };
          }

          // For polygons/rectangles
          // Ensure new reference for coordinates => triggers re-render
          return {
            ...obj,
            data: Array.isArray(newData) ? [...newData] : newData,
          };
        });

        // Log the final updated array for debugging
        console.log('Updated objects array:', updated);

        saveStateToUndoRedo(updated);

        // Return a fresh array
        return [...updated];
      });
    },
    [saveStateToUndoRedo]
  );

  const handleDeleteObject = useCallback((id: string) => {
    console.log(`Deleting object with ID: ${id}`);
    setObjects(prev => {
      const updated = prev.filter(obj => obj.id !== id);
      saveStateToUndoRedo(updated); // <-- capture deletion for undo/redo
      return updated;
    });
  }, [saveStateToUndoRedo]);

  const handleToggleObject = useCallback((id: string) => {
    console.log(`Toggling visibility for object ID: ${id}`);
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

  const handleUndo = useCallback(() => {
    if (mapMode === 'circle') {
      setMapMode(null);
    }
    const prevState = undoRedoManager.current.undo();
    if (prevState) {
      console.log('Performing Undo:', prevState);
      // Convert from stored state to the local `Layer` type
      setObjects(
        prevState.map(obj => ({
          ...obj,
          type: obj.type as Layer['type'],
        }))
      );
    }
    // Always refresh the canUndo/canRedo flags
    setCanUndo(undoRedoManager.current.canUndo());
    setCanRedo(undoRedoManager.current.canRedo());
  }, []);

  const handleRedo = useCallback(() => {
    const nextState = undoRedoManager.current.redo();
    if (nextState) {
      console.log('Performing Redo:', nextState);
      setObjects(
        nextState.map(obj => ({
          ...obj,
          type: obj.type as 'rectangle' | 'circle' | 'marker' | 'polygon', // Explicit cast
        }))
      );
      setCanUndo(undoRedoManager.current.canUndo());
      setCanRedo(undoRedoManager.current.canRedo());
    }
  }, []);

  const handleRenameObject = useCallback((id: string, name: string) => {
    console.log(`Renaming object ID: ${id} to ${name}`);
    setObjects(prev => prev.map(obj => (obj.id === id ? { ...obj, name } : obj)));
  }, []);

  const handleChangeObjectColor = useCallback((id: string, color: string) => {
    console.log(`Changing color for object ID: ${id} to ${color}`);
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
            console.log('Loaded boundary:', coordinates);
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
        console.error(errorMessage);
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
            ? (obj.data as Coordinate[]).map(
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
      console.log('Re-drew objects on the map:', objects);
    }
  }, [objects]);

  // Handle tool changes
  const handleToolChange = (tool: MapMode | null) => {
    console.log(`Tool changed to: ${tool}`);
    if (tool === 'gps') {
      setGpsEnabled(prev => !prev); // Toggle GPS state
    } else {
      setMapMode(tool);
    }
  };

  // Handle GPS toggle
  const handleGpsToggle = useCallback(() => {
    setGpsEnabled(prev => {
      console.log(`GPS Enabled: ${!prev}`);
      return !prev;
    });
  }, []);

  // GPS Position Watch
  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation(L.latLng(latitude, longitude));
        console.log('User location updated:', [latitude, longitude]);
      },
      (error) => {
        console.error('GPS Error:', error.message);
        setError(`GPS Error: ${error.message}`);
      },
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const paddedBoundary = useMemo(() => {
    if (boundary.length === 0) {
      return null;
    }

    const latLngBoundary = boundary.map(([lat, lng]) => L.latLng(lat, lng));
    const latLngBounds = L.latLngBounds(latLngBoundary);
    return latLngBounds.pad(0.1);
  }, [boundary]);

  // Ensure the default center is within the boundary if available
  const initialCenter = useMemo(() => {
    if (paddedBoundary) {
      return paddedBoundary.getCenter();
    }
    return defaultCenter;
  }, [paddedBoundary, defaultCenter]);

  const handleMarkerCreate = useCallback((markerData: MarkerData) => {
    console.log('Creating new marker:', markerData);
    setObjects(prev => {
      const newObject: Layer = {
        id: `marker-${Date.now()}`,
        name: markerData.label,
        visible: true,
        color: markerData.color,
        opacity: 0.4,
        type: 'marker',
        data: markerData,
      };
      const updated = [...prev, newObject];
      saveStateToUndoRedo(updated); // <-- capture new marker creation for undo/redo
      return updated;
    });
  }, [saveStateToUndoRedo]);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden relative bg-white">
      <Toolbar
        onToolChange={handleToolChange}
        activeTool={mapMode}
        gpsEnabled={gpsEnabled}
        onGpsToggle={handleGpsToggle}
        disabled={isLoading || !!error}
        onUndo={handleUndo} // Linked
        onRedo={handleRedo} // Linked
        canUndo={canUndo} // Dynamic state
        canRedo={canRedo} // Dynamic state
        onFillStyleChange={(style) => setFillStyle(style)}
        fillStyle={fillStyle}
      />

      <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden">
        {/* Map Container */}
        <div className={`relative flex-1 transition-all duration-300 ease-in-out z-0 overflow-hidden
          ${isPanelVisible ? 'h-[70vh]' : 'h-full'}
          md:h-full`}>
          <MapContainer
            center={initialCenter} // Use the calculated initial center
            zoom={14}
            className="h-full w-full"
            zoomControl={false}
            maxZoom={18} // Optionally set a max zoom level
            minZoom={12}
          >
            <SetMaxBounds bounds={paddedBoundary} /> {/* Add the custom component */}

            <FeatureGroup ref={objectLayerRef} />

            {/* Handles map clicks for shape selection, etc. */}
            <MapClickHandler
              mapMode={mapMode}
              objects={objects}
              setActiveObject={setActiveObject}
              onDeleteObject={handleDeleteObject} // Pass the deletion callback
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
              if (obj.type === 'marker' && 'position' in obj.data) {
                const markerData = obj.data as MarkerData;
                return (
                  <Marker
                    key={obj.id}
                    position={markerData.position as LatLngExpression}
                    icon={L.divIcon({
                      className: 'custom-marker-icon',
                      html: `
                        <div class="w-8 h-8 flex items-center justify-center relative group">
                          <div class="absolute w-6 h-6 rounded-full bg-white opacity-25"></div>
                          <div class="w-4 h-4 rounded-full bg-white border-2 transform transition-transform group-hover:scale-110"
                              style="border-color: ${obj.color};">
                          </div>
                        </div>`,
                      iconSize: [44, 44],  // Slightly smaller
                      iconAnchor: [22, 22] // Half of iconSize
                    })}
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
            <MarkerControl
              isEnabled={mapMode === 'marker'}
              boundary={boundary}
              onMarkerCreate={handleMarkerCreate}
            />

            {mapMode === 'edit' && shapeForEdit && (
              <EditTool
                activeTool={mapMode}
                selectedObject={shapeForEdit}
                boundary={boundary}
                onUpdateObject={handleUpdateObject}
                onBoundaryViolation={() => {
                  console.warn('Boundary violation detected during editing.');
                }}
              />
            )}
          </MapContainer>
        </div>

        <div className="fixed bottom-0 left-0 right-0 md:static md:w-80 md:block">
          {/* Toggle Button - Only show when not drawing */}
          {!mapMode || !['draw', 'circle', 'rectangle'].includes(mapMode) ? (
            <button
              onClick={togglePanel}
              className="absolute left-1/2 -translate-x-1/2 transform 
bg-jl-cream rounded-t-lg shadow-lg px-4 py-2 
flex items-center gap-2 md:hidden z-[9999]
border-t border-l border-r border-jl-sage/30
hover:bg-jl-sage/10
active:bg-jl-sage/30  // Increased opacity for active state
active:shadow-inner    // Added inner shadow for pressed effect
transition-all duration-300 ease-in-out"
              style={{
                bottom: isPanelVisible ? '30vh' : '0',
                backgroundColor: '#FFFFFF'  // Force solid background
              }}
            >
              {isPanelVisible ? (
                <>
                  <ChevronDown className="h-5 w-5 text-jl-teal" strokeWidth={2.5} />
                  <span className="text-sm font-medium text-jl-teal">Hide Objects</span>
                </>
              ) : (
                <>
                  <ChevronUp className="h-5 w-5 text-jl-teal" strokeWidth={2.5} />
                  <span className="text-sm font-medium text-jl-teal">Show Objects</span>
                </>
              )}
            </button>
          ) : null}

          {/* Panel - Unchanged */}
          <div className={`
absolute bottom-0 left-0 right-0 
md:relative md:w-full md:translate-y-0
transform transition-transform duration-300 ease-in-out
bg-jl-cream border-l border-jl-sage/30
${isPanelVisible ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
h-[30vh] md:h-full
flex flex-col overflow-hidden z-[9998]
`}>
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
    </div>
  );
};

export default GameMap;
