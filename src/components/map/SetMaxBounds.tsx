// src/components/map/SetMaxBounds.tsx

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface SetMaxBoundsProps {
  bounds: L.LatLngBounds | null;
}

const SetMaxBounds: React.FC<SetMaxBoundsProps> = ({ bounds }) => {
  const map = useMap();

  useEffect(() => {
    if (bounds) {
      const paddedBounds = bounds.pad(0.5); // 10% padding
      map.setMaxBounds(paddedBounds);
    }
  }, [map, bounds]);

  return null;
};

export default SetMaxBounds;
