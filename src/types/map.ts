// src/types/map.ts
import type { LatLngExpression, LatLngTuple, Map as LeafletMap } from 'leaflet';

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  color: string;
  type: 'polygon';
  data: LatLngExpression[][] | null;
}

export interface DrawMap extends LeafletMap {
  mergeOptions: (options: any) => void;
  addInitHook: (hook: () => void) => void;
}

declare global {
  namespace L {
    interface DrawControlOptions {
      position?: L.ControlPosition;
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