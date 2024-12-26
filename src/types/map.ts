// src/types/map.ts

import type { LatLng } from 'leaflet';

export type Coordinate = [number, number];
export type PolygonData = Coordinate[]; // Changed from Coordinate[][] to Coordinate[]
export type EditableLayer = Exclude<Layer, { type: 'marker' }>;

export interface CircleData {
  center: [number, number]; // [lat, lng]
  radius: number; // in meters
}

export type CircleOrPolyRect =
  | {
      id: string;
      visible: boolean;
      color?: string;
      type: 'circle';
      data: CircleData;
    }
  | {
      id: string;
      visible: boolean;
      color?: string;
      type: 'polygon' | 'rectangle';
      data: Coordinate[];
    };

// Define RectangleData as an array of coordinates (polygon-like)
export type RectangleData = Coordinate[];

export interface MarkerData {
  position: Coordinate;
  label: string;
  color: string;
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  color: string;
  opacity?: number; // Opacity for visual representation
  type: 'polygon' | 'circle' | 'rectangle' | 'marker'; // All possible types
  data: PolygonData | CircleData | RectangleData | MarkerData | null;
}

// Utility function to convert LatLng to Coordinate
export const latLngToCoordinate = (latLng: LatLng): Coordinate => [
  latLng.lat,
  latLng.lng,
];
