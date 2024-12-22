// src/components/map/SquareDrawingControl.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { Check, X } from 'lucide-react'; // Ensure correct import based on your icon library

interface SquareDrawingControlProps {
  onSquareComplete?: (bounds: L.LatLngBounds) => void;
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

  const cleanupRectangle = useCallback(() => {
    if (rectangleRef.current) {
      rectangleRef.current.remove();
      rectangleRef.current = null;
    }
    initialClickRef.current = null;
    setShowConfirm(false);
  }, []);

  const isPointInPolygon = (point: L.LatLng, polygon: [number, number][]): boolean => {
    const x = point.lng;
    const y = point.lat;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const yi = polygon[i][0];
      const xi = polygon[i][1];
      const yj = polygon[j][0];
      const xj = polygon[j][1];

      const intersect =
        ((yi > y) !== (yj > y)) &&
        (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);

      if (intersect) inside = !inside;
    }

    return inside;
  };

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
      if (!isPointInPolygon(e.latlng, boundary)) {
        return; // Do not start drawing if click is outside boundary
      }

      // Clean up any existing rectangle
      cleanupRectangle();

      initialClickRef.current = e.latlng;

      // Create initial rectangle with zero area
      const rectangle = L.rectangle([e.latlng, e.latlng], {
        color: '#FF4500', // Customize color as needed
        weight: 2,
        fillOpacity: 0.2,
      }).addTo(map);
      rectangleRef.current = rectangle;

      const handleMouseMove = (moveEvent: L.LeafletMouseEvent) => {
        if (!rectangleRef.current || !initialClickRef.current) return;

        const currentLatLng = moveEvent.latlng;

        // Define bounds from initial click to current mouse position
        const bounds = L.latLngBounds(
          [initialClickRef.current.lat, initialClickRef.current.lng],
          [currentLatLng.lat, currentLatLng.lng]
        );
        

        // Ensure that the new bounds are within the boundary polygon
        const allPointsInside = [
          [bounds.getSouthWest().lat, bounds.getSouthWest().lng],
          [bounds.getNorthWest().lat, bounds.getNorthWest().lng],
          [bounds.getNorthEast().lat, bounds.getNorthEast().lng],
          [bounds.getSouthEast().lat, bounds.getSouthEast().lng],
        ].every(([lat, lng]) => isPointInPolygon(L.latLng(lat, lng), boundary));
        

        if (allPointsInside) {
          rectangleRef.current.setBounds(bounds);
        } else {
          // Optionally, provide visual feedback if outside boundary
          // For simplicity, we prevent updating the bounds
        }
      };

      const handleMouseUp = () => {
        setShowConfirm(true);
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
  }, [map, isEnabled, boundary, cleanupRectangle]);

  const handleConfirm = () => {
    if (rectangleRef.current && onSquareComplete) {
      onSquareComplete(rectangleRef.current.getBounds());
    }
    cleanupRectangle();
  };

  const handleCancel = () => {
    cleanupRectangle();
  };

  return (
    <>
      {isEnabled && (
        <div className="absolute top-4 right-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg z-[1000]">
          <span className="text-sm font-medium text-gray-700">
            Click and drag to draw rectangle
          </span>
        </div>
      )}
      {showConfirm && (
        <div
          ref={confirmContainerRef}
          className="absolute bottom-4 right-1/2 transform -translate-x-1/2 bg-white rounded-full shadow-lg z-[1000]"
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
