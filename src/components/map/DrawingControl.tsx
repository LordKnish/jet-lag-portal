// src/components/map/DrawingControl.tsx
import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import { DrawMap } from '../../types/map';

interface DrawingControlProps {
  onDrawComplete?: (layer: L.Layer) => void;
  isDrawingMode: boolean;
}

const DrawingControl: React.FC<DrawingControlProps> = ({ 
  onDrawComplete,
  isDrawingMode 
}) => {
  const map = useMap() as DrawMap;
  const drawControlRef = useRef<L.Control.Draw | null>(null);
  const drawnItemsRef = useRef(new L.FeatureGroup());
  
  useEffect(() => {
    map.addLayer(drawnItemsRef.current);
    
    const handleDrawCreated = (e: any) => {
      const layer = e.layer;
      drawnItemsRef.current.addLayer(layer);
      
      if (onDrawComplete) {
        onDrawComplete(layer);
      }
    };

    map.on('draw:created', handleDrawCreated);

    return () => {
      if (drawnItemsRef.current) {
        map.removeLayer(drawnItemsRef.current);
      }
      map.off('draw:created', handleDrawCreated);
    };
  }, [map, onDrawComplete]);

  useEffect(() => {
    if (isDrawingMode) {
      if (!drawControlRef.current) {
        const drawOptions: L.DrawControlOptions = {
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
        };

        drawControlRef.current = new L.Control.Draw(drawOptions);
      }

      map.addControl(drawControlRef.current);

      const polygonDrawer = new L.Draw.Polygon(map);
      polygonDrawer.enable();
    } else if (drawControlRef.current) {
      map.removeControl(drawControlRef.current);
    }
  }, [isDrawingMode, map]);

  return null;
};

export default DrawingControl;