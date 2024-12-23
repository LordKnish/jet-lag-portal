import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface GpsControlProps {
  gpsEnabled: boolean;
}

const GpsControl: React.FC<GpsControlProps> = ({ gpsEnabled }) => {
  const map = useMap();
  const [marker, setMarker] = useState<L.Marker | null>(null);
  const [userLocation, setUserLocation] = useState<L.LatLng | null>(null);
  const snapThreshold = 200; // meters

  useEffect(() => {
    if (!gpsEnabled) {
      if (marker) {
        map.removeLayer(marker);
        setMarker(null);
      }
      return;
    }
    const snapIcon = L.divIcon({
      className: 'custom-gps-icon-snap',
      html: `<div class="gps-marker gps-marker-snap"></div>`, // Different style for snap
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
    const gpsIcon = L.divIcon({
      className: 'custom-gps-icon',
      html: `
        <div class="gps-marker">
          <div class="gps-accuracy-circle"></div>
          <div class="gps-center">
            <div class="gps-dot"></div>
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
    const defaultIcon = gpsIcon; // Original icon

    const style = document.createElement('style');
    style.textContent = `
      .gps-marker {
        position: relative;
        width: 40px;
        height: 40px;
      }
      
      .gps-accuracy-circle {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: rgba(33, 150, 243, 0.15);
        border: 2px solid rgba(33, 150, 243, 0.3);
        animation: pulse 2s ease-out infinite;
      }
      
      .gps-center {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 16px;
        height: 16px;
        background: rgba(33, 150, 243, 0.3);
        border-radius: 50%;
        border: 2px solid rgba(255, 255, 255, 0.5);
      }
      
      .gps-dot {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 8px;
        height: 8px;
        background: #2196F3;
        border-radius: 50%;
        box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
      }
      
      @keyframes pulse {
        0% {
          transform: translate(-50%, -50%) scale(0.8);
          opacity: 1;
        }
        100% {
          transform: translate(-50%, -50%) scale(1.5);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const latlng = L.latLng(latitude, longitude);
    
        if (!marker) {
          const newMarker = L.marker(latlng, { icon: gpsIcon }).addTo(map);
          setMarker(newMarker);
        } else {
          marker.setLatLng(latlng);
    
          // Snap feedback logic here
          if (gpsEnabled && userLocation !== null) { // Ensure GPS is on and userLocation exists
            const distance = marker.getLatLng().distanceTo(userLocation);
            if (distance <= snapThreshold) {
              marker.setIcon(snapIcon); // Use snap style
            } else {
              marker.setIcon(defaultIcon); // Use default style
            }
          }
        }
      },
      (error) => {
        console.error('GPS Error:', error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
    

    return () => {
      navigator.geolocation.clearWatch(watchId);
      if (marker) {
        map.removeLayer(marker);
      }
      document.head.removeChild(style);
    };
  }, [gpsEnabled, map, marker]);

  return null;
};

export default GpsControl;