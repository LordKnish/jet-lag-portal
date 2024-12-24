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
  const [isDrawing, setIsDrawing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const circleRef = useRef<L.Circle | null>(null);
  const labelRef = useRef<L.Marker | null>(null);
  const startPointRef = useRef<L.LatLng | null>(null);

  const radiusSteps = [50, 100, 200, 400, 800, 1600];

  const isPointInBoundary = (point: L.LatLng): boolean => {
    if (!boundary.length) return true;
    const x = point.lng;
    const y = point.lat;
    let inside = false;

    for (let i = 0, j = boundary.length - 1; i < boundary.length; j = i++) {
      const yi = boundary[i][0];
      const xi = boundary[i][1];
      const yj = boundary[j][0];
      const xj = boundary[j][1];

      const intersect = ((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  const updateLabel = (center: L.LatLng, radius: number) => {
    if (!labelRef.current) return;

    // Set label position to circle center
    labelRef.current.setLatLng(center);

    // Update label icon with new radius
    labelRef.current.setIcon(L.divIcon({
      className: 'radius-label-container',
        html: `<div class="text-xl font-bold" 
              style="color: white; text-shadow: 1px 1px 3px rgba(0,0,0,0.5);">
                ${Math.round(radius)}m
              </div>`,
        iconSize: [80, 30],
        iconAnchor: [40, 15]
    }));
  };

  const createCircle = (center: L.LatLng) => {
    if (!isPointInBoundary(center) || showConfirm) return;

    const circle = L.circle(center, {
      radius: 100,
      color: '#5F9EA0',
      fillColor: '#5F9EA0',
      fillOpacity: 0.2,
      weight: 3
    }).addTo(map);

    const label = L.marker(center).addTo(map);
    updateLabel(center, 100);

    circleRef.current = circle;
    labelRef.current = label;
    startPointRef.current = center;
    setIsDrawing(true);
  };

  const updateCircle = (latlng: L.LatLng) => {
    if (!circleRef.current || !startPointRef.current || !isDrawing) return;

    const radius = startPointRef.current.distanceTo(latlng);
    const snappedRadius = radiusSteps.reduce((prev, curr) =>
      Math.abs(curr - radius) < Math.abs(prev - radius) ? curr : prev
    );

    circleRef.current.setRadius(snappedRadius);
    updateLabel(circleRef.current.getLatLng(), snappedRadius);
  };

  const cleanup = () => {
    if (circleRef.current) {
      map.removeLayer(circleRef.current);
      circleRef.current = null;
    }
    if (labelRef.current) {
      map.removeLayer(labelRef.current);
      labelRef.current = null;
    }
    startPointRef.current = null;
    setIsDrawing(false);
    setShowConfirm(false);
  };

  const handleConfirm = () => {
    if (circleRef.current && onCircleComplete) {
      onCircleComplete(circleRef.current.getLatLng(), circleRef.current.getRadius());
    }
    setShowConfirm(false);
  };

  useEffect(() => {
    if (!isEnabled) {
      cleanup();
      map.dragging.enable();
      return;
    }

    const handleStart = (latlng: L.LatLng) => {
      if (!showConfirm) createCircle(latlng);
    };

    const handleMove = (latlng: L.LatLng) => {
      updateCircle(latlng);
      map.dragging.disable();
    };

    const handleEnd = () => {
      if (isDrawing) {
        setIsDrawing(false);
        setShowConfirm(true);
      }
    };

    // Mouse event handlers
    const handleMouseDown = (e: L.LeafletMouseEvent) => handleStart(e.latlng);
    const handleMouseMove = (e: L.LeafletMouseEvent) => handleMove(e.latlng);
    const handleMouseUp = () => handleEnd();

    // Touch event handlers
    const handleTouchStart = (e: TouchEvent) => {
      if (!e.touches.length) return;
      const touch = e.touches[0];
      const container = map.getContainer();
      const rect = container.getBoundingClientRect();
      const point = L.point(touch.clientX - rect.left, touch.clientY - rect.top);
      handleStart(map.containerPointToLatLng(point));
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!e.touches.length) return;
      const touch = e.touches[0];
      const container = map.getContainer();
      const rect = container.getBoundingClientRect();
      const point = L.point(touch.clientX - rect.left, touch.clientY - rect.top);
      handleMove(map.containerPointToLatLng(point));
    };

    const container = map.getContainer();
    map.on('mousedown', handleMouseDown);
    map.on('mousemove', handleMouseMove);
    map.on('mouseup', handleMouseUp);
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleEnd);

    return () => {
      map.off('mousedown', handleMouseDown);
      map.off('mousemove', handleMouseMove);
      map.off('mouseup', handleMouseUp);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleEnd);
    };
  }, [isEnabled, map, showConfirm, isDrawing]);

  return (
    <>
      {isEnabled && !showConfirm && !isDrawing && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg z-[1000]">
          <span className="text-sm font-medium text-gray-700">
            {L.Browser.touch ? 'Tap and drag' : 'Click and drag'} to draw circle
          </span>
        </div>
      )}

      {showConfirm && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-lg z-[1000]">
          <div className="flex items-center gap-4 p-4">
            <button onClick={cleanup}
              className="w-14 h-14 flex items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600">
              <X className="h-8 w-8" />
            </button>
            <button onClick={handleConfirm}
              className="w-14 h-14 flex items-center justify-center rounded-full bg-jl-teal text-white hover:bg-jl-teal/90">
              <Check className="h-8 w-8" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default CircleDrawingControl;