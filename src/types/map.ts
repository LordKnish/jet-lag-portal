// src/types/map.ts
import type { LatLngExpression, Map as LeafletMap } from 'leaflet';

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
    interface RectangleOptions {
      shapeOptions?: {
        color?: string;
        weight?: number;
      };
    }

    interface DrawOptions {
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
      rectangle?: false | RectangleOptions;
      circle?: boolean;
      circlemarker?: boolean;
      marker?: boolean;
    }

    interface DrawConstructorOptions {
      position?: L.ControlPosition;
      draw?: DrawOptions;
      edit?: {
        featureGroup: L.FeatureGroup;
        remove?: boolean;
      };
    }

    namespace Control {
      class Draw extends Control {
        constructor(options: DrawConstructorOptions);
      }
    }

    namespace Draw {
      class Polygon {
        constructor(map: LeafletMap, options?: any);
        enable(): void;
      }
    }
  }
}