import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { Check, X } from 'lucide-react';

interface SquareDrawingControlProps {
  onSquareComplete?: (coordinates: [number, number][]) => void;
  isEnabled: boolean;
  boundary: [number, number][]; // [lat, lng]
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

  // ----- HELPER: check if point is within polygon -----
  const isPointInPolygon = useCallback(
    (point: L.LatLng, polygon: [number, number][]): boolean => {
      const x = point.lng;
      const y = point.lat;
      let inside = false;

      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        // polygon[i] = [lat, lng]
        const xi = polygon[i][1],
          yi = polygon[i][0];
        const xj = polygon[j][1],
          yj = polygon[j][0];

        const intersect =
          (yi > y) !== (yj > y) &&
          x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
      }

      return inside;
    },
    []
  );

  // ----- HELPER: remove rectangle + reset state -----
  const cleanupRectangle = useCallback(() => {
    if (rectangleRef.current) {
      rectangleRef.current.remove();
      rectangleRef.current = null;
    }
    initialClickRef.current = null;
    setShowConfirm(false);
  }, []);

  // ----- DISABLE map dragging when enabled -----
  useEffect(() => {
    if (isEnabled) {
      map.dragging.disable();
    }
    return () => {
      map.dragging.enable();
    };
  }, [map, isEnabled]);

  // ---- CORE DRAWING LOGIC: start, move, end ----
  const startDraw = (latlng: L.LatLng) => {
    // check if within boundary
    if (!isPointInPolygon(latlng, boundary)) {
      return;
    }

    initialClickRef.current = latlng;
    const initialPoint: L.LatLngTuple = [latlng.lat, latlng.lng];
    const rectangle = L.rectangle([initialPoint, initialPoint], {
      color: '#FF4500',
      weight: 2,
      fillOpacity: 0.2,
    }).addTo(map);
    rectangleRef.current = rectangle;
  };

  const moveDraw = (latlng: L.LatLng) => {
    if (!rectangleRef.current || !initialClickRef.current) return;

    // create bounds from initial click + current mouse/touch location
    const sw = L.latLng(
      Math.min(initialClickRef.current.lat, latlng.lat),
      Math.min(initialClickRef.current.lng, latlng.lng)
    );
    const ne = L.latLng(
      Math.max(initialClickRef.current.lat, latlng.lat),
      Math.max(initialClickRef.current.lng, latlng.lng)
    );

    const bounds = L.latLngBounds(sw, ne);
    rectangleRef.current.setBounds(bounds);

    // check if corners are in boundary
    const corners = [
      bounds.getNorthWest(),
      bounds.getNorthEast(),
      bounds.getSouthEast(),
      bounds.getSouthWest(),
    ];
    const allCornersInside = corners.every((corner) =>
      isPointInPolygon(corner, boundary)
    );

    // style update
    rectangleRef.current.setStyle({
      color: allCornersInside ? '#FF4500' : '#FF0000',
      fillColor: allCornersInside ? '#FF4500' : '#FF0000',
      fillOpacity: allCornersInside ? 0.2 : 0.1,
      weight: 2,
      dashArray: allCornersInside ? undefined : '5,5',
    });
  };

  const endDraw = () => {
    if (rectangleRef.current) {
      const bounds = rectangleRef.current.getBounds();
      const corners = [
        bounds.getNorthWest(),
        bounds.getNorthEast(),
        bounds.getSouthEast(),
        bounds.getSouthWest(),
      ];

      const allCornersInside = corners.every((corner) =>
        isPointInPolygon(corner, boundary)
      );

      if (allCornersInside) {
        setShowConfirm(true);
      } 
    }
  };

  // ----- CONFIRM BUTTONS -----
  const handleConfirm = () => {
    if (rectangleRef.current && onSquareComplete) {
      const bounds = rectangleRef.current.getBounds();
      const rectangleData: [number, number][] = [
        [bounds.getNorthWest().lat, bounds.getNorthWest().lng],
        [bounds.getNorthEast().lat, bounds.getNorthEast().lng],
        [bounds.getSouthEast().lat, bounds.getSouthEast().lng],
        [bounds.getSouthWest().lat, bounds.getSouthWest().lng],
        [bounds.getNorthWest().lat, bounds.getNorthWest().lng], // close polygon
      ];
      onSquareComplete(rectangleData);
    }
    cleanupRectangle();
  };
  const handleCancel = () => {
    cleanupRectangle();
  };

  // ----- MOUSE + TOUCH EVENT ATTACHMENT -----
  useEffect(() => {
    if (!isEnabled) {
      cleanupRectangle();
      return;
    }

    // MOUSE events
    const handleMouseDown = (e: L.LeafletMouseEvent) => {
      startDraw(e.latlng);

      // attach move/up for this session only
      const handleMouseMove = (moveEvent: L.LeafletMouseEvent) => {
        moveDraw(moveEvent.latlng);
      };
      const handleMouseUp = () => {
        endDraw();
        map.off('mousemove', handleMouseMove);
        map.off('mouseup', handleMouseUp);
      };

      map.on('mousemove', handleMouseMove);
      map.on('mouseup', handleMouseUp);
    };
    map.on('mousedown', handleMouseDown);

    // TOUCH events - reuse same draw logic
    const container = map.getContainer();

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length < 1) return;
      // Convert clientX/Y to latlng
      const touch = e.touches[0];
      const rect = container.getBoundingClientRect();
      const point = L.point(touch.clientX - rect.left, touch.clientY - rect.top);
      startDraw(map.containerPointToLatLng(point));

      // attach move/end for this "gesture"
      const handleTouchMove = (moveEvt: TouchEvent) => {
        if (moveEvt.touches.length < 1) return;
        moveEvt.preventDefault(); // prevents scrolling on mobile
        const t = moveEvt.touches[0];
        const pt = L.point(t.clientX - rect.left, t.clientY - rect.top);
        moveDraw(map.containerPointToLatLng(pt));
      };
      const handleTouchEnd = () => {
        endDraw();
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
        container.removeEventListener('touchcancel', handleTouchEnd);
      };

      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('touchend', handleTouchEnd);
      container.addEventListener('touchcancel', handleTouchEnd);
    };
    container.addEventListener('touchstart', handleTouchStart, { passive: false });

    // ----- CLEANUP -----
    return () => {
      map.off('mousedown', handleMouseDown);
      container.removeEventListener('touchstart', handleTouchStart);
    };
  }, [map, isEnabled, startDraw, moveDraw, endDraw, cleanupRectangle]);

  // ----- RENDER -----
  return (
    <>
      {isEnabled && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg z-[1000]">
          <span className="text-sm font-medium text-gray-700">
            {L.Browser.touch
              ? 'Tap and drag to draw rectangle'
              : 'Click and drag to draw rectangle'}
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
