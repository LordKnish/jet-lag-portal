// src/types/map.ts
import type { LatLng } from 'leaflet';

export type Coordinate = [number, number];
export type PolygonData = Coordinate[][];

export interface CircleData {
  center: Coordinate;
  radius: number; // radius in meters
}
// src/types/map.ts
export interface CircleData {
  center: [number, number];  // [lat, lng]
  radius: number;  // in meters
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  color: string;
  type: 'polygon' | 'circle' | 'rectangle';
  data: PolygonData | CircleData | [number, number][] | null;
}
export const latLngToCoordinate = (latLng: L.LatLng): Coordinate => [
  latLng.lat,
  latLng.lng
];