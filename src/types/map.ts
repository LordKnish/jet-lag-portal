import type { LatLng } from 'leaflet';

export type Coordinate = [number, number];
export type PolygonData = Coordinate[][];

export interface CircleData {
  center: [number, number]; // [lat, lng]
  radius: number; // in meters
}

// Define RectangleData as an array of coordinates (polygon-like)
export type RectangleData = Coordinate[];

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  color: string;
  opacity?: number; // Add opacity property
  type: 'polygon' | 'circle' | 'rectangle';
  data: PolygonData | CircleData | RectangleData | null;
}


// Utility function to convert LatLng to Coordinate
export const latLngToCoordinate = (latLng: LatLng): Coordinate => [
  latLng.lat,
  latLng.lng,
];
