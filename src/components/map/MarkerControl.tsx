import React, { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { Check, X } from 'lucide-react';
import { MarkerData } from '../../types/map';

interface MarkerControlProps {
  isEnabled: boolean;
  boundary?: [number, number][];
  onMarkerCreate: (marker: MarkerData) => void;
}

const MarkerControl: React.FC<MarkerControlProps> = ({
  isEnabled,
  boundary = [],
  onMarkerCreate,
}) => {
  const map = useMap();
  const [showConfirm, setShowConfirm] = useState(false);
  const activeMarkerRef = useRef<L.Marker | null>(null);
  const confirmContainerRef = useRef<HTMLDivElement>(null);
  const [isLocked, setIsLocked] = useState(false);
  const generateRandomColor = () => {
    // Color palette similar to what's used in other objects
    const colors = [
      '#5F9EA0', // Default teal
      '#FF6B6B', // Coral red
      '#4ECDC4', // Turquoise
      '#45B7D1', // Sky blue
      '#96CEB4', // Sage
      '#FFEEAD', // Cream yellow
      '#D4A5A5', // Dusty rose
      '#9FA4A9', // Slate
      '#A3C6C4', // Sea foam
      '#E6B89C'  // Peach
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };
  const isPointInBoundary = (point: L.LatLng): boolean => {
    if (!boundary.length) {
      return true;
    }

    const x = point.lng;
    const y = point.lat;
    let inside = false;

    for (let i = 0, j = boundary.length - 1; i < boundary.length; j = i++) {
      const [yi, xi] = boundary[i];
      const [yj, xj] = boundary[j];

      const intersect = ((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

      if (intersect) {
        inside = !inside;
      }
    }

    return inside;
  };

  const createMarkerIcon = (color = generateRandomColor()) => {
    return L.divIcon({
      className: 'custom-marker-icon',
      html: `
        <div class="w-8 h-8 flex items-center justify-center relative group">
          <div class="absolute w-6 h-6 rounded-full bg-white opacity-25"></div>
          <div class="w-4 h-4 rounded-full bg-white border-2 transform transition-transform group-hover:scale-110"
              style="border-color: ${color};">
          </div>
        </div>`,
      iconSize: [42, 42],  // Slightly smaller
      iconAnchor: [22, 22]  // Half of iconSize
    });
  };

  const cleanupMarker = () => {
    if (!activeMarkerRef.current) {
      return;
    }
    map.removeLayer(activeMarkerRef.current);
    activeMarkerRef.current = null;
    setShowConfirm(false);
    setIsLocked(false);
  };

  useEffect(() => {
    if (!isEnabled || isLocked) {
      return;
    }

    let lastValidPosition: L.LatLng;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (!isPointInBoundary(e.latlng)) {
        return;
      }

      cleanupMarker();

      // Generate color when creating marker
      const markerColor = generateRandomColor();
      const marker = L.marker(e.latlng, {
        icon: createMarkerIcon(markerColor),
        draggable: true
      }).addTo(map);
      // Store color with marker
      (marker as any).color = markerColor;

      lastValidPosition = e.latlng;

      marker.on('drag', (dragEvent) => {
        const newPos = dragEvent.target.getLatLng();
        if (!isPointInBoundary(newPos)) {
          marker.setLatLng(lastValidPosition);
        } else {
          lastValidPosition = newPos;
        }
      });

      activeMarkerRef.current = marker;
      setShowConfirm(true);
      setIsLocked(true);
    };

    map.on('click', handleMapClick);
    map.getContainer().style.cursor = 'crosshair';

    return () => {
      map.off('click', handleMapClick);
      map.getContainer().style.cursor = '';
    };
  }, [map, isEnabled, isLocked, boundary]);

  useEffect(() => {
    if (showConfirm && confirmContainerRef.current) {
      L.DomEvent.disableClickPropagation(confirmContainerRef.current);
      L.DomEvent.disableScrollPropagation(confirmContainerRef.current);
    }
  }, [showConfirm]);

  const handleConfirm = () => {
    if (activeMarkerRef.current && onMarkerCreate) {
      const pos = activeMarkerRef.current.getLatLng();
      const markerData: MarkerData = {
        position: [pos.lat, pos.lng],
        label: 'New Marker',
        color: (activeMarkerRef.current as any).color || '#5F9EA0'
      };
      onMarkerCreate(markerData);
    }
    cleanupMarker();
  };

  const handleCancel = () => {
    cleanupMarker();
  };

  return (
    <>
      {isEnabled && !isLocked && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg z-[1000]">
          <span className="text-sm font-medium text-gray-700">
            Click to place marker
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

export default MarkerControl;