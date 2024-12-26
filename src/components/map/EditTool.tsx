import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L, { Polygon, Circle as LeafletCircle, Marker as LeafletMarker } from 'leaflet';
import { Check, X } from 'lucide-react';
import { EditableLayer, CircleData, Coordinate } from '../../types/map';

const isCircleData = (data: any): data is CircleData => {
  return data && 'center' in data && 'radius' in data;
};

const editMarkerIcon = L.divIcon({
  className: '',
  html: `
    <div style="
      width: 14px;
      height: 14px;
      background-color: #ff4500;
      border: 2px solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
      cursor: move;
    "></div>
  `,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

interface EditToolProps {
  activeTool: string | null;
  selectedObject: EditableLayer | null;
  boundary: Coordinate[];
  onUpdateObject: (id: string, newData: CircleData | Coordinate[]) => void;
  onBoundaryViolation?: () => void;
}

const EditTool: React.FC<EditToolProps> = ({
  activeTool,
  selectedObject,
  boundary,
  onUpdateObject,
  onBoundaryViolation,
}) => {
  const map = useMap();
  const vertexMarkersRef = useRef<LeafletMarker[]>([]);
  const centerMarkerRef = useRef<LeafletMarker | null>(null);
  const radiusMarkerRef = useRef<LeafletMarker | null>(null);
  const previewShapeRef = useRef<Polygon | LeafletCircle | null>(null);
  const originalDataRef = useRef<CircleData | Coordinate[] | null>(null);

  // Store the circle or polygon data in a ref to avoid re-renders on each drag
  const localDataRef = useRef<CircleData | Coordinate[] | null>(null);

  const [showConfirm, setShowConfirm] = useState(false);
  const [localObject, setLocalObject] = useState<EditableLayer | null>(null);

  const METERS_PER_DEGREE = 111319.9;

  useEffect(() => {
    if (selectedObject) {
      // Deep copy to avoid modifying the parent data
      const cloned = JSON.parse(JSON.stringify(selectedObject));
      setLocalObject(cloned);

      if (cloned.type === 'circle' && isCircleData(cloned.data)) {
        originalDataRef.current = { ...cloned.data };
        localDataRef.current = { ...cloned.data };
      } else if (
        (cloned.type === 'polygon' || cloned.type === 'rectangle') &&
        Array.isArray(cloned.data)
      ) {
        originalDataRef.current = [...cloned.data];
        localDataRef.current = [...cloned.data];
      }
    } else {
      setLocalObject(null);
      originalDataRef.current = null;
      localDataRef.current = null;
    }
  }, [selectedObject]);

  const cleanup = useCallback(() => {
    if (previewShapeRef.current) {
      previewShapeRef.current.removeFrom(map);
      previewShapeRef.current = null;
    }
    vertexMarkersRef.current.forEach(marker => marker.remove());
    vertexMarkersRef.current = [];

    if (centerMarkerRef.current) {
      centerMarkerRef.current.remove();
      centerMarkerRef.current = null;
    }
    if (radiusMarkerRef.current) {
      radiusMarkerRef.current.remove();
      radiusMarkerRef.current = null;
    }
    setShowConfirm(false);
  }, [map]);

  const createLocalCircle = useCallback(
    (circleData: CircleData) => {
      const { center, radius } = circleData;
      const circle = L.circle([center[0], center[1]], {
        radius,
        color: '#ff4500',
        weight: 2,
        fillOpacity: 0.1,
        dashArray: '4,2',
        interactive: false,
      }).addTo(map);
      previewShapeRef.current = circle;
    },
    [map]
  );

  const createLocalPolygon = useCallback(
    (coords: Coordinate[]) => {
      const latLngs = coords.map(([lat, lng]) => L.latLng(lat, lng));
      const polygon = L.polygon(latLngs, {
        color: '#ff4500',
        weight: 2,
        fillOpacity: 0.1,
        dashArray: '4,2',
        interactive: false,
      }).addTo(map);
      previewShapeRef.current = polygon;
    },
    [map]
  );

  const updateLocalCircle = useCallback(
    (newCenter: L.LatLng, radius: number) => {
      const shape = previewShapeRef.current as LeafletCircle | null;
      if (shape) {
        shape.setLatLng(newCenter);
        shape.setRadius(radius);
      }
    },
    []
  );

  const updateLocalPolygon = useCallback(
    (coords: Coordinate[]) => {
      const shape = previewShapeRef.current as Polygon | null;
      if (shape) {
        const latLngs = coords.map(([lat, lng]) => L.latLng(lat, lng));
        shape.setLatLngs(latLngs);
      }
    },
    []
  );

  const enableEditing = useCallback(() => {
    if (!localObject?.data || !localDataRef.current) return;

    if (localObject.type === 'circle' && isCircleData(localDataRef.current)) {
      const circleData = localDataRef.current;
      createLocalCircle(circleData);

      const centerLatLng = L.latLng(circleData.center[0], circleData.center[1]);
      const centerMarker = L.marker(centerLatLng, {
        draggable: true,
        icon: editMarkerIcon,
      }).addTo(map);
      centerMarkerRef.current = centerMarker;

      // Calculate radius marker position
      const metersToLongitude =
        circleData.radius / (METERS_PER_DEGREE * Math.cos(centerLatLng.lat * Math.PI / 180));
      const radiusLatLng = L.latLng(centerLatLng.lat, centerLatLng.lng + metersToLongitude);
      const radiusMarker = L.marker(radiusLatLng, {
        draggable: true,
        icon: editMarkerIcon,
      }).addTo(map);
      radiusMarkerRef.current = radiusMarker;

      // Center marker: update circle center in real-time, but only store in localDataRef on dragend
      centerMarker.on('drag', (e) => {
        const newCenter = (e.target as LeafletMarker).getLatLng();
        updateLocalCircle(newCenter, circleData.radius);

        // Move the radius marker in real-time
        const dynamicMetersToLongitude =
          circleData.radius / (METERS_PER_DEGREE * Math.cos(newCenter.lat * Math.PI / 180));
        if (radiusMarkerRef.current) {
          const newRadiusLatLng = L.latLng(
            newCenter.lat,
            newCenter.lng + dynamicMetersToLongitude
          );
          radiusMarkerRef.current.setLatLng(newRadiusLatLng);
        }
      });

      centerMarker.on('dragend', (e) => {
        const newCenter = (e.target as LeafletMarker).getLatLng();
        // Update both ref and local state
        (localDataRef.current as CircleData).center = [newCenter.lat, newCenter.lng];
        setLocalObject(prev => {
          if (prev?.type === 'circle' && isCircleData(prev.data)) {
            return {
              ...prev,
              data: {
                ...prev.data,
                center: [newCenter.lat, newCenter.lng]
              }
            };
          }
          return prev;
        });
      });

      // Radius marker: update circle radius in real-time, but only store in localDataRef on dragend
      radiusMarker.on('drag', (e) => {
        const newRadiusPos = (e.target as LeafletMarker).getLatLng();
        const cPos = centerMarker.getLatLng();
        const distance = cPos.distanceTo(newRadiusPos);
        updateLocalCircle(cPos, distance);
      });

      radiusMarker.on('dragend', (e) => {
        const newRadiusPos = (e.target as LeafletMarker).getLatLng();
        const cPos = centerMarker.getLatLng();
        const distance = cPos.distanceTo(newRadiusPos);
        const newRadius = Math.max(distance, 10);
        
        const newData = {
          ...(localDataRef.current as CircleData),
          radius: newRadius
        };
        // Update both ref and parent
        localDataRef.current = newData;
        onUpdateObject(localObject.id, newData);
      });
    } else if (localObject.type !== 'marker' && Array.isArray(localDataRef.current)) {
      const coords = localDataRef.current;
      createLocalPolygon(coords);

      coords.forEach((pt, idx) => {
        const marker = L.marker([pt[0], pt[1]], {
          draggable: true,
          icon: editMarkerIcon,
        }).addTo(map);

        // Update polygon in real-time
        marker.on('drag', (e) => {
          const newPos = (e.target as LeafletMarker).getLatLng();
          // For real-time visual updates only
          const tempCoords = [...coords];
          tempCoords[idx] = [newPos.lat, newPos.lng];
          updateLocalPolygon(tempCoords);
        });

        // Commit changes on dragend
        marker.on('dragend', (e) => {
          const newPos = (e.target as LeafletMarker).getLatLng();
          const newCoords = [...(localDataRef.current as Coordinate[])];
          newCoords[idx] = [newPos.lat, newPos.lng];
          // Update both ref and local state
          localDataRef.current = newCoords;
          onUpdateObject(localObject.id, newCoords);
        });

        vertexMarkersRef.current.push(marker);
      });
    }

    setShowConfirm(true);
  }, [
    localObject,
    createLocalCircle,
    createLocalPolygon,
    updateLocalCircle,
    updateLocalPolygon,
    map
  ]);

  const disableEditing = useCallback(() => {
    cleanup();
  }, [cleanup]);

  const handleConfirm = useCallback(() => {
    if (localObject && localDataRef.current) {
      onUpdateObject(localObject.id, localDataRef.current);
    }
    disableEditing();
  }, [localObject, onUpdateObject, disableEditing]);

  const handleCancel = useCallback(() => {
    if (localObject && originalDataRef.current) {
      // Revert to the original data
      onUpdateObject(localObject.id, originalDataRef.current);
    }
    disableEditing();
  }, [localObject, disableEditing, onUpdateObject]);

  // IMPORTANT: Remove `localObject` from the dependency array 
  // so we don't re-run enableEditing on every small drag update.
  useEffect(() => {
    if (activeTool === 'edit' && selectedObject) {
      if (!localObject) return;
      enableEditing();
    } else {
      disableEditing();
    }
    return () => {
      disableEditing();
    };
  }, [activeTool, selectedObject, enableEditing, disableEditing]);
  if (!showConfirm || !localObject) return null;

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-lg z-[1000]">
      <div className="flex items-center gap-4 p-4">
        <button
          onClick={handleCancel}
          className="w-14 h-14 flex items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
        >
          <X className="h-8 w-8" />
        </button>
        <button
          onClick={handleConfirm}
          className="w-14 h-14 flex items-center justify-center rounded-full bg-jl-teal text-white hover:bg-jl-teal/90"
        >
          <Check className="h-8 w-8" />
        </button>
      </div>
    </div>
  );
};

export default EditTool;
