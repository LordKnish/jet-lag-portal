// src/types/map.ts
import { Map as LeafletMap, FeatureGroup, DrawEvents } from 'leaflet';
import { GeoJSON } from 'geojson';

declare module 'leaflet' {
  namespace Control {
    interface DrawConstructorOptions {
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
        featureGroup: FeatureGroup;
        remove?: boolean;
      };
    }

    class Draw extends Control {
      constructor(options: DrawConstructorOptions);
    }
  }

  namespace Draw {
    namespace Event {
      const CREATED: DrawEvents.Created;
    }

    class Polygon {
      constructor(map: LeafletMap, options?: any);
      enable(): void;
    }
  }
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  color: string;
  type: 'polygon';
  data: GeoJSON[] | null;
}