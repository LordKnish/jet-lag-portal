// src/pages/GameMap.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Polygon, 
  LayersControl,
  ZoomControl,
  useMap,
  ScaleControl
} from 'react-leaflet';
import { LatLngBounds, LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertCircle } from 'lucide-react';
import { GeoJSON } from 'geojson';

import Toolbar from '../components/common/ui/Toolbar';
import LayerPanel from '../components/map/LayerPanel';
import { Layer } from '../types/map';
import DrawingControl from '../components/map/DrawingControl';
import { MapMode } from '../types/toolbar';

// Utility function to parse WKT polygon data
const parseWKTPolygon = (wkt: string): [number, number][] => {
  const coordsString = wkt
    .replace('POLYGON ((', '')
    .replace('))', '')
    .trim();

  return coordsString.split(', ').map(coord => {
    const [lng, lat] = coord.split(' ').map(Number);
    return [lat, lng];
  });
};

// Component to handle map initialization and bounds
const MapController: React.FC<{ 
  coordinates: [number, number][];
  onMapReady?: () => void;
}> = ({ coordinates, onMapReady }) => {
  const map = useMap();

  useEffect(() => {
    if (coordinates.length > 0) {
      const lats = coordinates.map(([lat]) => lat);
      const lngs = coordinates.map(([, lng]) => lng);

      const bounds = new LatLngBounds(
        new LatLng(Math.min(...lats), Math.min(...lngs)),
        new LatLng(Math.max(...lats), Math.max(...lngs))
      );

      map.fitBounds(bounds);
      map.setMaxBounds(bounds.pad(0.1));
      map.setMinZoom(map.getZoom() - 1);
      
      if (onMapReady) {
        onMapReady();
      }
    }
  }, [coordinates, map, onMapReady]);

  return null;
};

// Loading overlay component
const LoadingOverlay: React.FC = () => (
  <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 shadow-xl">
      <div className="flex items-center space-x-4">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-lg font-medium">Loading map...</span>
      </div>
    </div>
  </div>
);

// Error alert component
const ErrorAlert: React.FC<{ message: string }> = ({ message }) => (
  <div className="absolute top-4 left-4 right-4 z-50">
    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-lg">
      <div className="flex items-center">
        <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
        <span className="text-red-700">{message}</span>
      </div>
    </div>
  </div>
);

const GameMap: React.FC = () => {
  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [boundary, setBoundary] = useState<[number, number][]>([]);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [activeLayer, setActiveLayer] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<MapMode>(null);

  // Map center coordinates (Tel Aviv)
  const defaultCenter: [number, number] = useMemo(() => [32.0700, 34.7674], []);

  // Handlers
  const handleMapReady = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleAddLayer = useCallback(() => {
    const newLayer: Layer = {
      id: `layer-${Date.now()}`,
      name: `Layer ${layers.length + 1}`,
      visible: true,
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      type: 'polygon',
      data: null,
    };
    setLayers(prev => [...prev, newLayer]);
    setActiveLayer(newLayer.id);
  }, [layers.length]);

  const handleDeleteLayer = useCallback((id: string) => {
    setLayers(prev => prev.filter(layer => layer.id !== id));
    if (activeLayer === id) {
      setActiveLayer(null);
    }
  }, [activeLayer]);

  const handleToggleLayer = useCallback((id: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === id ? { ...layer, visible: !layer.visible } : layer
    ));
  }, []);

  const handleRenameLayer = useCallback((id: string, name: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === id ? { ...layer, name } : layer
    ));
  }, []);

  const handleReorderLayers = useCallback((startIndex: number, endIndex: number) => {
    setLayers(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  }, []);

  const handleDrawComplete = useCallback((geoJSON: GeoJSON) => {
    if (activeLayer) {
      setLayers(prev => prev.map(layer => 
        layer.id === activeLayer 
          ? { ...layer, data: [...(layer.data || []), geoJSON] }
          : layer
      ));
    }
  }, [activeLayer]);

  const handleToolChange = useCallback((tool: MapMode) => {
    setMapMode(prev => prev === tool ? null : tool);
  }, []);

  // Load boundary data on mount
  useEffect(() => {
    const loadBoundary = async () => {
      try {
        const response = await fetch('/data/game-boundary.csv');
        const text = await response.text();
        const lines = text.split('\n');
        if (lines.length >= 2) {
          const wktData = lines[1].split('"')[1];
          const coordinates = parseWKTPolygon(wktData);
          setBoundary(coordinates);
        }
      } catch (err) {
        setError('Failed to load game boundary. Please try refreshing the page.');
        setIsLoading(false);
      }
    };

    loadBoundary();
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden relative">
      {/* Toolbar */}
      <div className="flex-none w-full">
        <Toolbar
          onToolChange={handleToolChange}
          activeTool={mapMode}
          disabled={isLoading || !!error}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden w-full">
        {/* Map Container */}
        <div className={`flex-1 relative w-full ${mapMode === 'draw' ? 'cursor-crosshair' : ''}`}>
          {isLoading && <LoadingOverlay />}
          {error && <ErrorAlert message={error} />}
          
          <MapContainer
            center={defaultCenter}
            zoom={14}
            className="h-full w-full"
            zoomControl={false}
            maxBoundsViscosity={1.0}
          >
            {/* Map Controls */}
            <ZoomControl position="bottomright" />
            <ScaleControl position="bottomleft" />
            {boundary.length > 0 && (
              <MapController 
                coordinates={boundary} 
                onMapReady={handleMapReady} 
              />
            )}

            {/* Layer Controls */}
            <LayersControl position="topright">
              {/* Base Maps */}
              <LayersControl.BaseLayer checked name="Standard">
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
              </LayersControl.BaseLayer>

              <LayersControl.BaseLayer name="Transit">
                <TileLayer
                  url="https://tile.memomaps.de/tilegen/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
              </LayersControl.BaseLayer>

              {/* Game Boundary */}
              {boundary.length > 0 && (
                <Polygon
                  positions={boundary}
                  pathOptions={{
                    color: '#5F9EA0',
                    weight: 5,
                    fillOpacity: 0.1,
                    opacity: 1,
                    dashArray: '10, 10',
                  }}
                />
              )}

              {/* User Layers */}
              {layers.map(layer => 
                layer.visible && layer.type === 'polygon' ? (
                  <Polygon
                    key={layer.id}
                    positions={layer.data || boundary}
                    pathOptions={{
                      color: layer.color,
                      weight: 3,
                      fillOpacity: 0.2,
                      opacity: 1,
                    }}
                  />
                ) : null
              )}
            </LayersControl>

            {/* Drawing Control */}
            <DrawingControl 
              onDrawComplete={handleDrawComplete}
              isDrawingMode={mapMode === 'draw'}
            />
          </MapContainer>
        </div>

        {/* Layer Panel */}
        <div className="w-80 flex-none border-l border-jl-sage/30 bg-jl-cream">
          <LayerPanel
            layers={layers}
            onAddLayer={handleAddLayer}
            onDeleteLayer={handleDeleteLayer}
            onToggleLayer={handleToggleLayer}
            onRenameLayer={handleRenameLayer}
            onReorderLayers={handleReorderLayers}
            activeLayer={activeLayer}
            setActiveLayer={setActiveLayer}
          />
        </div>
      </div>
    </div>
  );
};

export default GameMap;