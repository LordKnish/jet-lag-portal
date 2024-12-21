// src/types/map.ts
import type { LatLngExpression, LatLngTuple } from 'leaflet';

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  color: string;
  type: 'polygon';
  data: LatLngExpression[][] | null;
}

declare global {
  namespace L {
    interface DrawControlOptions {
      position?: string;
      draw?: {
        polyline?: any;
        polygon?: {
          allowIntersection?: boolean;
          drawError?: {
            color: string;
            message: string;
          };
          shapeOptions?: {
            color: string;
            weight: number;
          };
        };
        rectangle?: boolean;
        circle?: boolean;
        circlemarker?: boolean;
        marker?: boolean;
      };
      edit?: {
        featureGroup: L.FeatureGroup;
        remove?: boolean;
      };
    }
  }
}

export type PolygonCoords = LatLngTuple[][];