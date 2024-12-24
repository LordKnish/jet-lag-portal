import { useMapEvent } from 'react-leaflet';
import L from 'leaflet';
import { Layer, CircleData, Coordinate } from '../../types/map';

interface MapClickHandlerProps {
  mapMode: string | null;
  objects: Layer[];
  setActiveObject: (id: string | null) => void;
  onDeleteObject?: (id: string) => void; 
}

const MapClickHandler: React.FC<MapClickHandlerProps> = ({ 
  mapMode, 
  objects, 
  setActiveObject,
  onDeleteObject // Add this line to destructure the prop
}) => {
  useMapEvent('click', (e: L.LeafletMouseEvent) => {
    if (mapMode === 'delete') {
      const clickedObject = objects.find(obj => {
        if (obj.type === 'circle') {
          const circleData = obj.data as CircleData;
          const distance = e.latlng.distanceTo(L.latLng(circleData.center));
          return distance <= circleData.radius;
        } else {
          const polygon = L.polygon(obj.data as Coordinate[]);
          return polygon.getBounds().contains(e.latlng);
        }
      });
    
      if (clickedObject && onDeleteObject) { // Ensure function is defined
        const confirmDelete = window.confirm(`Delete ${clickedObject.name}?`);
        if (confirmDelete) {
          onDeleteObject(clickedObject.id); // Call deletion
        }
      }
    }    
    if (mapMode === 'move') {
      const clickedObject = objects.find(obj => {
        if (obj.type === 'circle') {
          const circleData = obj.data as CircleData;
          const distance = e.latlng.distanceTo(L.latLng(circleData.center));
          return distance <= circleData.radius;
        } else {
          const polygon = L.polygon(obj.data as Coordinate[]);
          return polygon.getBounds().contains(e.latlng);
        }
      });
      setActiveObject(clickedObject?.id || null);
    }
  });

  return null; // No UI, just event handling
};

export default MapClickHandler;
