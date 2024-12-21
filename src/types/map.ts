// src/types/map.ts
import type { LatLng } from 'leaflet';

export type Coordinate = [number, number];
export type PolygonData = Coordinate[][];

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  color: string;
  type: 'polygon';
  data: PolygonData | null;
}

export const latLngToCoordinate = (latLng: L.LatLng): Coordinate => [
  latLng.lat,
  latLng.lng
];