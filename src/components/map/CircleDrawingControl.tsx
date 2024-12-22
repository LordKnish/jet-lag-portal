import React, { useEffect, useState, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { Check, X } from 'lucide-react';

interface CircleDrawingControlProps {
  onCircleComplete?: (center: L.LatLng, radiusMeters: number) => void;
  isEnabled: boolean;
  boundary: [number, number][]; // Add this line
}

const CircleDrawingControl: React.FC<CircleDrawingControlProps> = ({
  onCircleComplete,
  isEnabled,
  boundary
}) => {
  const map = useMap();
  const circleRef = useRef<L.Circle | null>(null);
  const radiusLabelRef = useRef<L.Marker | null>(null);
  const initialClickRef = useRef<L.LatLng | null>(null);
  const confirmContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Game-specific radius steps
  const radiusSteps = [50, 100, 200, 400, 800, 1600];

  // Find nearest snap radius
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
    setShowConfirm(false);
    setIsDragging(false);
  };

  const isPointInPolygon = (point: L.LatLng, polygon: [number, number][]): boolean => {
    const x = point.lng; // treat lng as x
    const y = point.lat; // treat lat as y
    let inside = false;
  
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const yi = polygon[i][0]; // lat
      const xi = polygon[i][1]; // lng
      const yj = polygon[j][0];
      const xj = polygon[j][1];
  
      const intersect =
        (yi > y) !== (yj > y) &&
        x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
  
      if (intersect) {
        inside = !inside;
      }
    }
  
    return inside;
  };
  

  // Manage map interactions
  useEffect(() => {
    if (isEnabled) {
      map.dragging.disable();
    }

    return () => {
      map.dragging.enable();
      cleanupCircle();
    };
  }, [map, isEnabled]);

  // Handle click propagation for confirmation buttons
  useEffect(() => {
    if (showConfirm && confirmContainerRef.current) {
      // Disable click propagation on the confirmation container
      L.DomEvent.disableClickPropagation(confirmContainerRef.current);
      L.DomEvent.disableScrollPropagation(confirmContainerRef.current);
    }
  }, [showConfirm]);

  // Handle circle drawing
  useEffect(() => {
    if (!isEnabled) {
      cleanupCircle();
      return;
    }

    const handleMouseDown = (e: L.LeafletMouseEvent) => {
      // Get the game boundary polygon from the map
      if (!isPointInPolygon(e.latlng, boundary)) {
        return; // Don't create circle if click is outside boundary
      }
    
      // Clean up any existing circle before starting a new one
      cleanupCircle();
      
      // Store initial click position
      initialClickRef.current = e.latlng;
      
      // Create initial circle
      const circle = L.circle(e.latlng, {
        radius: 100,
        color: '#5F9EA0',
        fillColor: '#5F9EA0',
        fillOpacity: 0.2,
        weight: 3
      }).addTo(map);
    
      // Create radius label
      const label = L.marker(e.latlng, {
        icon: L.divIcon({
          className: 'radius-label-container',
          html: '<div class="text-xl font-bold" style="color: white; text-shadow: 1px 1px 3px rgba(0,0,0,0.5);">100m</div>',
          iconSize: [80, 30],
          iconAnchor: [40, 15]
        })
      }).addTo(map);
    
      circleRef.current = circle;
      radiusLabelRef.current = label;
      setIsDragging(true);
    
      // Handle mouse move
      const handleMouseMove = (moveEvent: L.LeafletMouseEvent) => {
        if (!circleRef.current || !initialClickRef.current) return;
    
        const radius = initialClickRef.current.distanceTo(moveEvent.latlng);
        const snappedRadius = findNearestRadius(radius);
        
        circleRef.current.setRadius(snappedRadius);
        updateRadiusLabel(circleRef.current, snappedRadius);
      };
    
      // Handle mouse up
      const handleMouseUp = () => {
        if (circleRef.current) {
          setIsDragging(false);
          setShowConfirm(true);
        }
    
        map.off('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    
      // Attach move and up listeners
      map.on('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    map.on('mousedown', handleMouseDown);

    return () => {
      map.off('mousedown', handleMouseDown);
    };
  }, [map, isEnabled]);

  const handleConfirm = () => {
    if (circleRef.current && onCircleComplete) {
      onCircleComplete(circleRef.current.getLatLng(), circleRef.current.getRadius());
    }
    cleanupCircle();
  };

  const handleCancel = () => {
    cleanupCircle();
  };

  return (
    <>
      {isEnabled && (
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