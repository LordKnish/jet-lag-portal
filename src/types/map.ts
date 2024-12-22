import type { LatLng } from 'leaflet';

export type Coordinate = [number, number];
export type PolygonData = Coordinate[][];

export interface CircleData {
  center: [number, number]; // [lat, lng]
  radius: number; // in meters
}

// Define RectangleData as an array of coordinates (polygon-like)
export type RectangleData = Coordinate[]; // <-- Added this line

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  color: string;
  type: 'polygon' | 'circle' | 'rectangle'; // Includes 'rectangle'
  data: PolygonData | CircleData | RectangleData | null; // <-- Added RectangleData here
}

// Utility function to convert LatLng to Coordinate
export const latLngToCoordinate = (latLng: L.LatLng): Coordinate => [
  latLng.lat,
  latLng.lng,
];
