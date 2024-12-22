// src/components/map/SquareDrawingControl.tsx

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { Check, X } from 'lucide-react';

interface SquareDrawingControlProps {
  onSquareComplete?: (coordinates: [number, number][]) => void; // Updated type
  isEnabled: boolean;
  boundary: [number, number][];
}

const SquareDrawingControl: React.FC<SquareDrawingControlProps> = ({
  onSquareComplete,
  isEnabled,
  boundary,
}) => {
  const map = useMap();
  const rectangleRef = useRef<L.Rectangle | null>(null);
  const confirmContainerRef = useRef<HTMLDivElement | null>(null);
  const initialClickRef = useRef<L.LatLng | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // Point in polygon check
  const isPointInPolygon = useCallback((point: L.LatLng, polygon: [number, number][]): boolean => {
    const x = point.lng;
    const y = point.lat;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][1], yi = polygon[i][0];
      const xj = polygon[j][1], yj = polygon[j][0];

      const intersect = ((yi > y) !== (yj > y)) && 
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) {
        inside = !inside;
      }
    }

    return inside;
  }, []);

  const cleanupRectangle = useCallback(() => {
    if (rectangleRef.current) {
      rectangleRef.current.remove();
      rectangleRef.current = null;
    }
    initialClickRef.current = null;
    setShowConfirm(false);
  }, []);

  useEffect(() => {
    if (isEnabled) {
      map.dragging.disable();
    }

    return () => {
      map.dragging.enable();
      cleanupRectangle();
    };
  }, [map, isEnabled, cleanupRectangle]);

  useEffect(() => {
    if (!isEnabled) {
      cleanupRectangle();
      return;
    }

    const handleMouseDown = (e: L.LeafletMouseEvent) => {
      // Check if initial click is within boundary
      if (!isPointInPolygon(e.latlng, boundary)) {
        return;
      }

      cleanupRectangle();
      initialClickRef.current = e.latlng;

      // Convert LatLng to LatLngTuple [lat, lng]
      const initialPoint: L.LatLngTuple = [e.latlng.lat, e.latlng.lng];
      const rectangle = L.rectangle([initialPoint, initialPoint], {
        color: '#FF4500',
        weight: 2,
        fillOpacity: 0.2,
      }).addTo(map);
      rectangleRef.current = rectangle;

      const handleMouseMove = (moveEvent: L.LeafletMouseEvent) => {
        if (!rectangleRef.current || !initialClickRef.current) return;
        
        // Create bounds from initial click and current mouse position
        const sw = L.latLng(
          Math.min(initialClickRef.current.lat, moveEvent.latlng.lat),
          Math.min(initialClickRef.current.lng, moveEvent.latlng.lng)
        );
        const ne = L.latLng(
          Math.max(initialClickRef.current.lat, moveEvent.latlng.lat),
          Math.max(initialClickRef.current.lng, moveEvent.latlng.lng)
        );
        
        const bounds = L.latLngBounds(sw, ne);
        rectangleRef.current.setBounds(bounds);

        // Check if all corners are within boundary
        const corners = [
          bounds.getNorthWest(),
          bounds.getNorthEast(),
          bounds.getSouthEast(),
          bounds.getSouthWest()
        ];
        
        const allCornersInside = corners.every(corner => isPointInPolygon(corner, boundary));

        // Update rectangle style based on validity
        rectangleRef.current.setStyle({
          color: allCornersInside ? '#FF4500' : '#FF0000',
          fillColor: allCornersInside ? '#FF4500' : '#FF0000',
          fillOpacity: allCornersInside ? 0.2 : 0.1,
          weight: 2,
          dashArray: allCornersInside ? undefined : '5,5'
        });
      };

      const handleMouseUp = () => {
        if (rectangleRef.current) {
          const bounds = rectangleRef.current.getBounds();
          const corners = [
            bounds.getNorthWest(),
            bounds.getNorthEast(),
            bounds.getSouthEast(),
            bounds.getSouthWest()
          ];
          
          const allCornersInside = corners.every(corner => isPointInPolygon(corner, boundary));
          
          if (allCornersInside) {
            setShowConfirm(true);
          } else {
            cleanupRectangle();
          }
        }
        map.off('mousemove', handleMouseMove);
        map.off('mouseup', handleMouseUp);
      };

      map.on('mousemove', handleMouseMove);
      map.on('mouseup', handleMouseUp);
    };

    map.on('mousedown', handleMouseDown);

    return () => {
      map.off('mousedown', handleMouseDown);
    };
  }, [map, isEnabled, cleanupRectangle, boundary, isPointInPolygon]);

  const handleConfirm = () => {
    if (rectangleRef.current && onSquareComplete) {
      const bounds = rectangleRef.current.getBounds();
      
      const rectangleData: [number, number][] = [
        [bounds.getNorthWest().lat, bounds.getNorthWest().lng],
        [bounds.getNorthEast().lat, bounds.getNorthEast().lng],
        [bounds.getSouthEast().lat, bounds.getSouthEast().lng],
        [bounds.getSouthWest().lat, bounds.getSouthWest().lng],
        [bounds.getNorthWest().lat, bounds.getNorthWest().lng], // Close the polygon
      ];
      
      onSquareComplete(rectangleData); // Pass coordinates instead of bounds
    }
    cleanupRectangle();
  };

  const handleCancel = () => {
    cleanupRectangle();
  };

  return (
    <>
      {isEnabled && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg z-[1000]">
          <span className="text-sm font-medium text-gray-700">
            Click and drag to draw rectangle
          </span>
        </div>
      )}
      {showConfirm && (
        <div
          ref={confirmContainerRef}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-lg z-[1000]"
        >
          <div className="flex items-center gap-2 p-2">
            <button
              onClick={handleCancel}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
              title="Cancel"
            >
              <X className="h-5 w-5" />
            </button>
            <button
              onClick={handleConfirm}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-orange-500 text-white hover:bg-orange-600"
              title="Confirm"
            >
              <Check className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SquareDrawingControl;
