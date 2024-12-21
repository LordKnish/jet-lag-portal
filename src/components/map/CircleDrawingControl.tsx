// src/components/map/CircleDrawingControl.tsx
import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';

interface CircleDrawingControlProps {
  onCircleComplete?: (center: L.LatLng, radiusMeters: number) => void;
  isEnabled: boolean;
}

const CircleDrawingControl: React.FC<CircleDrawingControlProps> = ({
  onCircleComplete,
  isEnabled
}) => {
  const map = useMap();

  useEffect(() => {
    if (!isEnabled) return;

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    // Initialize the circle drawing handler
    const circleDrawHandler = new L.Draw.Circle(map, {
      shapeOptions: {
        color: '#5F9EA0',
        fillColor: '#5F9EA0',
        fillOpacity: 0.2,
      },
      showRadius: true,
      metric: true,
      feet: false
    });

    // Start drawing when enabled
    if (isEnabled) {
      circleDrawHandler.enable();
    }

    const handleDrawCreated = (event: L.DrawEvents.Created) => {
      const layer = event.layer as L.Circle;
      drawnItems.addLayer(layer);

      // Get circle properties
      const center = layer.getLatLng();
      const radiusMeters = layer.getRadius();

      if (onCircleComplete) {
        onCircleComplete(center, radiusMeters);
      }

      // Reset the drawing handler
      circleDrawHandler.disable();
      circleDrawHandler.enable();
    };

    map.on(L.Draw.Event.CREATED, handleDrawCreated);

    // Cleanup
    return () => {
      map.off(L.Draw.Event.CREATED, handleDrawCreated);
      circleDrawHandler.disable();
      map.removeLayer(drawnItems);
    };
  }, [map, onCircleComplete, isEnabled]);

  return null;
};

export default CircleDrawingControl;