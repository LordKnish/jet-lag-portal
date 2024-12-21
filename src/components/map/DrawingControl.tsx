// src/components/map/DrawingControl.tsx
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';

interface DrawingControlProps {
  onDrawComplete?: (layer: L.Layer) => void;
  isDrawingMode: boolean;
}

const DrawingControl: React.FC<DrawingControlProps> = ({
  onDrawComplete,
  isDrawingMode
}) => {
  const map = useMap();

  useEffect(() => {
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    const drawControl = new L.Control.Draw({
      draw: {
        marker: false,
        circlemarker: false,
        circle: false,
        polyline: false,
        rectangle: {
          shapeOptions: {
            color: '#5F9EA0',
            weight: 3
          }
        },
        polygon: {
          allowIntersection: false,
          showArea: true,
          shapeOptions: {
            color: '#5F9EA0',
            weight: 3
          }
        }
      },
      edit: {
        featureGroup: drawnItems
      }
    } as L.Control.DrawConstructorOptions);

    if (isDrawingMode) {
      map.addControl(drawControl);
    }

    const handleDrawCreated = (e: L.DrawEvents.Created) => {
      const layer = e.layer;
      drawnItems.addLayer(layer);
      
      if (onDrawComplete) {
        onDrawComplete(layer);
      }
    };

    map.on(L.Draw.Event.CREATED, handleDrawCreated);

    return () => {
      map.removeLayer(drawnItems);
      if (isDrawingMode) {
        map.removeControl(drawControl);
      }
      map.off(L.Draw.Event.CREATED, handleDrawCreated);
    };
  }, [map, onDrawComplete, isDrawingMode]);

  return null;
};

export default DrawingControl;