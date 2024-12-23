import React, { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface MeasurementControlProps {
  isEnabled: boolean;
}

interface MeasurementPoint {
  marker: L.Marker;
  latlng: L.LatLng;
}

const MeasurementControl: React.FC<MeasurementControlProps> = ({ isEnabled }) => {
  const map = useMap();
  const measurementLayerRef = useRef<L.LayerGroup | null>(null);
  const [measurementPoints, setMeasurementPoints] = useState<MeasurementPoint[]>([]);
  const [measurementLine, setMeasurementLine] = useState<L.Polyline | null>(null);
  const [distanceLabel, setDistanceLabel] = useState<L.Marker | null>(null);

  // Initialize measurement layer
  useEffect(() => {
    measurementLayerRef.current = L.layerGroup().addTo(map);
    return () => {
      measurementLayerRef.current?.remove();
    };
  }, [map]);

  // Handle measurement mode toggling
  useEffect(() => {
    if (!isEnabled) {
      clearMeasurement();
      return;
    }

    map.getContainer().style.cursor = 'crosshair';
    map.dragging.disable();

    return () => {
      map.getContainer().style.cursor = '';
      map.dragging.enable();
    };
  }, [isEnabled, map]);

  const clearMeasurement = () => {
    measurementPoints.forEach(point => point.marker.remove());
    measurementLine?.remove();
    distanceLabel?.remove();
    setMeasurementPoints([]);
    setMeasurementLine(null);
    setDistanceLabel(null);
  };

  const createMarker = (latlng: L.LatLng): L.Marker => {
    return L.marker(latlng, {
      icon: L.divIcon({
        className: 'measurement-point',
        html: '<div class="w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>',
        iconSize: [12, 12],
        iconAnchor: [6, 6]
      })
    });
  };

  const updateMeasurementDisplay = (points: MeasurementPoint[]) => {
    if (points.length === 2) {
      // Create or update measurement line
      const lineCoords = points.map(p => p.latlng);
      if (measurementLine) {
        measurementLine.setLatLngs(lineCoords);
      } else {
        const newLine = L.polyline(lineCoords, {
          color: '#3B82F6',
          weight: 2,
          dashArray: '5,5'
        }).addTo(measurementLayerRef.current!);
        setMeasurementLine(newLine);
      }

      // Calculate and display distance
      const distance = points[0].latlng.distanceTo(points[1].latlng);
      const midPoint = L.latLng(
        (points[0].latlng.lat + points[1].latlng.lat) / 2,
        (points[0].latlng.lng + points[1].latlng.lng) / 2
      );

      if (distanceLabel) {
        distanceLabel.setLatLng(midPoint);
      } else {
        const newLabel = L.marker(midPoint, {
            icon: L.divIcon({
              className: 'distance-label',
              html: `<div class="px-2 py-1 bg-white rounded shadow text-black font-medium">
                ${Math.round(distance)} meters
              </div>`,
              iconSize: [100, 30],
              iconAnchor: [50, 15]
            })
          }).addTo(measurementLayerRef.current!);
        setDistanceLabel(newLabel);
      }
    }
  };

  useEffect(() => {
    if (!isEnabled) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (measurementPoints.length >= 2) {
        clearMeasurement();
        return;
      }

      const marker = createMarker(e.latlng);
      marker.addTo(measurementLayerRef.current!);

      const newPoint = { marker, latlng: e.latlng };
      const updatedPoints = [...measurementPoints, newPoint];
      setMeasurementPoints(updatedPoints);
      updateMeasurementDisplay(updatedPoints);
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [isEnabled, map, measurementPoints]);

  return null;
};

export default MeasurementControl;