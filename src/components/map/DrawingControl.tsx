// src/components/map/DrawingControl.tsx
import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import { GeoJSON } from 'geojson';

interface DrawingControlProps {
  onDrawComplete?: (geoJSON: GeoJSON) => void;
  isDrawingMode: boolean;
}

const DrawingControl: React.FC<DrawingControlProps> = ({ 
  onDrawComplete,
  isDrawingMode 
}) => {
  const map = useMap();
  const drawControlRef = useRef<L.Control.Draw | null>(null);
  const drawnItemsRef = useRef(new L.FeatureGroup());
  
  useEffect(() => {
    map.addLayer(drawnItemsRef.current);
    
    const handleDrawCreated = (event: L.DrawEvents.Created) => {
      const layer = event.layer;
      drawnItemsRef.current.addLayer(layer);
      
      if (onDrawComplete && 'toGeoJSON' in layer) {
        const geoJSON = layer.toGeoJSON();
        onDrawComplete(geoJSON);
      }
    };

    map.on(L.Draw.Event.CREATED, handleDrawCreated);

    return () => {
      if (drawnItemsRef.current) {
        map.removeLayer(drawnItemsRef.current);
      }
      map.off(L.Draw.Event.CREATED, handleDrawCreated);
    };
  }, [map, onDrawComplete]);

  useEffect(() => {
    if (isDrawingMode) {
      if (!drawControlRef.current) {
        drawControlRef.current = new L.Control.Draw({
          position: 'topleft',
          draw: {
            rectangle: false,
            circle: false,
            circlemarker: false,
            marker: false,
            polyline: {
              shapeOptions: {
                color: '#5F9EA0',
                weight: 3
              }
            },
            polygon: {
              allowIntersection: false,
              drawError: {
                color: '#e1e100',
                message: '<strong>Draw error!</strong> Polygons cannot intersect.'
              },
              shapeOptions: {
                color: '#5F9EA0',
                weight: 3
              }
            }
          },
          edit: {
            featureGroup: drawnItemsRef.current,
            remove: true
          }
        });
      }

      map.addControl(drawControlRef.current);

      // Start polygon drawing automatically
      new L.Draw.Polygon(map, drawControlRef.current.options.draw?.polygon).enable();
    } else if (drawControlRef.current) {
      map.removeControl(drawControlRef.current);
    }
  }, [isDrawingMode, map]);

  return null;
};

export default DrawingControl;