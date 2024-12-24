import React, { useEffect, useState, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { Check, X } from 'lucide-react';

interface CircleDrawingControlProps {
  onCircleComplete?: (center: L.LatLng, radiusMeters: number) => void;
  isEnabled: boolean;
  boundary: [number, number][];
  gpsEnabled?: boolean;
  userLocation?: L.LatLng | null;
}

const CircleDrawingControl: React.FC<CircleDrawingControlProps> = ({
  onCircleComplete,
  isEnabled,
  boundary,
  gpsEnabled,
  userLocation,
}) => {
  const map = useMap();
  const circleRef = useRef<L.Circle | null>(null);
  const radiusLabelRef = useRef<L.Marker | null>(null);
  const initialClickRef = useRef<L.LatLng | null>(null);
  const confirmContainerRef = useRef<HTMLDivElement>(null);

  const [showConfirm, setShowConfirm] = useState(false);
  const [isLocked, setIsLocked] = useState(false); // Lock state during active circle

  // Radius steps for snapping
  const radiusSteps = [50, 100, 200, 400, 800, 1600];

  const findNearestRadius = (radius: number) => {
    return radiusSteps.reduce((prev, curr) => {
      return Math.abs(curr - radius) < Math.abs(prev - radius) ? curr : prev;
    });
  };

  // Update radius label position and content
  const updateRadiusLabel = (circle: L.Circle, radius: number) => {
    if (radiusLabelRef.current) {
      const center = circle.getLatLng();
      radiusLabelRef.current.setLatLng(center);

      const icon = L.divIcon({
        className: 'radius-label-container',
        html: `<div class="text-xl font-bold" 
              style="color: white; text-shadow: 1px 1px 3px rgba(0,0,0,0.5);">
                ${Math.round(radius)}m
              </div>`,
        iconSize: [80, 30],
        iconAnchor: [40, 15]
      });
      radiusLabelRef.current.setIcon(icon);
    }
  };

  const cleanupCircle = () => {
    if (circleRef.current) {
      circleRef.current.remove();
      circleRef.current = null;
    }
    if (radiusLabelRef.current) {
      radiusLabelRef.current.remove();
      radiusLabelRef.current = null;
    }
    initialClickRef.current = null;
    setShowConfirm(false); // Hide confirm UI
    setIsLocked(false); // Unlock for new circles
  };

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
        yi > y !== yj > y &&
        x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

      if (intersect) {
        inside = !inside;
      }
    }
    return inside;
  };

  // Handle map interaction logic
  useEffect(() => {
    if (!isEnabled || isLocked) {
      return;
    } // Block interactions if locked or disabled

    map.dragging.disable();

    const snapThreshold = 100; // meters

    const handleMouseDown = (e: L.LeafletMouseEvent) => {
      if (isLocked) {
        return;
      } // Block new circles if already locked

      let clickLatLng = e.latlng;

      // Snap to GPS location if within threshold
      if (
        gpsEnabled &&
        userLocation &&
        userLocation.distanceTo(clickLatLng) <= snapThreshold
      ) {
        clickLatLng = userLocation;
      }

      // Boundary check
      if (!isPointInPolygon(clickLatLng, boundary)) {
        return;
      }

      // Start circle creation
      initialClickRef.current = clickLatLng;

      const circle = L.circle(clickLatLng, {
        radius: 100,
        color: '#5F9EA0',
        fillColor: '#5F9EA0',
        fillOpacity: 0.2,
        weight: 3,
      }).addTo(map);
      circleRef.current = circle;

      const label = L.marker(clickLatLng, {
        icon: L.divIcon({
          className: 'radius-label-container',
          html: '<div class="text-xl font-bold" style="color: white; text-shadow: 1px 1px 3px rgba(0,0,0,0.5);">100m</div>',
          iconSize: [80, 30],
          iconAnchor: [40, 15],
        }),
      }).addTo(map);
      radiusLabelRef.current = label;

      // Lock further interactions
      setIsLocked(true);

      const handleMouseMove = (moveEvent: L.LeafletMouseEvent) => {
        if (!circleRef.current || !initialClickRef.current) {
          return;
        }

        // Calculate radius based on mouse movement
        const radius = initialClickRef.current.distanceTo(moveEvent.latlng);
        const snappedRadius = findNearestRadius(radius);

        // Update circle radius
        circleRef.current.setRadius(snappedRadius);

        // Update radius label dynamically
        updateRadiusLabel(circleRef.current, snappedRadius); // Add this line
      };


      const handleMouseUp = () => {
        setShowConfirm(true); // Show confirm/cancel buttons

        // Detach listeners
        map.off('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      map.on('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    map.on('mousedown', handleMouseDown);

    return () => {
      map.off('mousedown', handleMouseDown);
      map.dragging.enable();
    };
  }, [map, isEnabled, isLocked, gpsEnabled, userLocation, boundary]);

  const handleConfirm = () => {
    if (circleRef.current && onCircleComplete) {
      const center = circleRef.current.getLatLng();
      const radius = circleRef.current.getRadius();
      onCircleComplete(center, radius);
    }
    cleanupCircle(); // Unlock after confirmation
  };

  const handleCancel = () => {
    cleanupCircle(); // Unlock after cancel
  };

  return (
    <>
      {isEnabled && !isLocked && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg z-[1000]">
          <span className="text-sm font-medium text-gray-700">
            Click and drag to draw circle
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

export default CircleDrawingControl;
