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

    const drawOptions: L.Control.DrawConstructorOptions = {
      draw: {
        polyline: false,
        polygon: {
          allowIntersection: false,
          drawError: {
            color: '#e1e4e8',
            message: '<strong>Cannot intersect lines!</strong>'
          },
          shapeOptions: {
            color: '#5F9EA0',
            weight: 3
          }
        },
        rectangle: {
          shapeOptions: {
            color: '#5F9EA0',
            weight: 3
          }
        },
        circle: false,
        circlemarker: false,
        marker: false
      },
      edit: {
        featureGroup: drawnItems,
        remove: true
      }
    };

    const drawControl = new L.Control.Draw(drawOptions);

    if (isDrawingMode) {
      map.addControl(drawControl);
    }

    const handleDrawCreated = (event: any) => {
      const layer = event.layer;
      drawnItems.addLayer(layer);
      
      if (onDrawComplete) {
        onDrawComplete(layer);
      }
    };

    // Using string literal for event name to avoid type issues
    map.on('draw:created', handleDrawCreated);

    return () => {
      map.removeLayer(drawnItems);
      if (isDrawingMode) {
        map.removeControl(drawControl);
      }
      map.off('draw:created', handleDrawCreated);
    };
  }, [map, onDrawComplete, isDrawingMode]);

  return null;
};

export default DrawingControl;