import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';

interface DrawingControlProps {
  onDrawComplete?: (geoJSON: any) => void;
  isDrawingMode: boolean;
}

const DrawingControl: React.FC<DrawingControlProps> = ({ 
  onDrawComplete,
  isDrawingMode 
}) => {
  const map = useMap();
  const drawControlRef = useRef<L.Control.Draw | null>(null);
  const drawnItemsRef = useRef(new L.FeatureGroup());
  
  // Initial setup
  useEffect(() => {
    map.addLayer(drawnItemsRef.current);
    
    // Event handlers for drawing
    map.on(L.Draw.Event.CREATED, (event) => {
      const layer = event.layer;
      drawnItemsRef.current.addLayer(layer);
      
      if (onDrawComplete) {
        const geoJSON = layer.toGeoJSON();
        onDrawComplete(geoJSON);
      }
    });

    return () => {
      if (drawnItemsRef.current) {
        map.removeLayer(drawnItemsRef.current);
      }
      // Clean up event listeners
      map.off(L.Draw.Event.CREATED);
    };
  }, [map, onDrawComplete]);

  // Handle drawing mode changes
  useEffect(() => {
    if (isDrawingMode) {
          if (!drawControlRef.current) {
            // Initialize draw control if it doesn't exist
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
          new L.Draw.Polygon(map, drawControlRef.current.options.draw.polygon).enable();

        }
    else if (drawControlRef.current) {
            map.removeControl(drawControlRef.current);
          }

  }, [isDrawingMode, map]);

  return null;
};

export default DrawingControl;