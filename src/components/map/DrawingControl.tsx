// src/components/map/DrawingControl.tsx

import React, { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { Check, X } from 'lucide-react';
import 'leaflet-draw'; // optional if you rely on Leaflet.Draw's CSS
import 'leaflet-draw/dist/leaflet.draw.css'; // optional
import { latLngToCoordinate } from '../../types/map';

interface DrawingControlProps {
  onDrawComplete?: (coordinates: [number, number][]) => void; // Changed to accept coordinates
  isDrawingMode: boolean;
  boundary?: [number, number][];
}


const DrawingControl: React.FC<DrawingControlProps> = ({
  onDrawComplete,
  isDrawingMode,
  boundary = []
}) => {
  const map = useMap();

  // Keep references to the polygon layer and all clicked vertices
  const polygonRef = useRef<L.Polygon | null>(null);
  const [vertices, setVertices] = useState<L.LatLng[]>([]);

  // Confirm/Cancel UI
  const [showConfirm, setShowConfirm] = useState(false);
  const confirmContainerRef = useRef<HTMLDivElement>(null);

  //---------------------------
  //  Boundary Check (Optional)
  //---------------------------
  const isPointInPolygon = (point: L.LatLng, polygon: [number, number][]) => {
    if (!polygon.length) {
      return true;
    } // If no boundary, always allow
    const x = point.lng;
    const y = point.lat;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [latI, lngI] = polygon[i];
      const [latJ, lngJ] = polygon[j];
      const xi = lngI;
      const yi = latI;
      const xj = lngJ;
      const yj = latJ;

      const intersect =
        (yi > y) !== (yj > y) &&
        x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

      if (intersect) {
        inside = !inside;
      }
    }
    return inside;
  };

  //---------------------------
  //  Cleanup
  //---------------------------
  const cleanupPolygon = () => {
    if (polygonRef.current) {
      polygonRef.current.remove();
      polygonRef.current = null;
    }
    setVertices([]);
    setShowConfirm(false);
  };

  //---------------------------
  //  Confirm / Cancel
  //---------------------------
  const handleConfirm = () => {
    if (polygonRef.current && onDrawComplete) {
      const latLngs = polygonRef.current.getLatLngs()[0] as L.LatLng[];
      const coordinates = latLngs.map(latLngToCoordinate);

      onDrawComplete(coordinates); // Pass coordinates instead of the layer
    }
    cleanupPolygon();
  };






  const handleCancel = () => {
    cleanupPolygon();
  };

  //---------------------------
  //  Manage map dragging
  //---------------------------
  useEffect(() => {
    if (isDrawingMode) {
      map.dragging.disable();
    } else {
      map.dragging.enable();
      cleanupPolygon();
    }
    return () => {
      map.dragging.enable();
      cleanupPolygon();
    };
  }, [map, isDrawingMode]);

  //---------------------------
  //  Stop propagation on confirm container
  //---------------------------
  useEffect(() => {
    if (showConfirm && confirmContainerRef.current) {
      L.DomEvent.disableClickPropagation(confirmContainerRef.current);
      L.DomEvent.disableScrollPropagation(confirmContainerRef.current);
    }
  }, [showConfirm]);

  //---------------------------
  //  Handle clicks to add polygon vertices
  //---------------------------
  useEffect(() => {
    if (!isDrawingMode) {
      return;
    }

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      // If boundary is provided, check if the click is inside it
      if (!isPointInPolygon(e.latlng, boundary)) {
        // Could optionally show a warning or ignore silently
        return;
      }

      setVertices(prevVertices => {
        const updatedVertices = [...prevVertices, e.latlng];

        // If polygon layer doesn't exist yet, create it
        if (!polygonRef.current) {
          polygonRef.current = L.polygon(updatedVertices, {
            color: '#5F9EA0',
            fillColor: '#5F9EA0',
            fillOpacity: 0.2,
            weight: 3
          }).addTo(map);
        } else {
          // Otherwise update the existing polygon with new points
          polygonRef.current.setLatLngs(updatedVertices);
        }

        // Show confirm only after at least 3 vertices (a valid polygon)
        if (updatedVertices.length >= 3) {
          setShowConfirm(true);
        }

        return updatedVertices;
      });
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
    };
  }, [map, isDrawingMode, boundary]);

  return (
    <>
      {isDrawingMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg z-[1000]">
          <span className="text-sm font-medium text-gray-700">
            Click on the map to add polygon vertices
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
              className="w-10 h-10 flex items-center justify-center rounded-full bg-jl-teal text-white hover:bg-jl-teal/90"
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

export default DrawingControl;
