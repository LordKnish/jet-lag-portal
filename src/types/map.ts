// src/types/map.ts
import { LatLngExpression } from 'leaflet';

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  color: string;
  type: 'polygon';
  data: LatLngExpression[][] | null;
}

declare module 'leaflet' {
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
    rectangle?: boolean;
    circle?: boolean;
    circlemarker?: boolean;
    marker?: boolean;
  }

  interface DrawControlOptions extends L.ControlOptions {
    draw?: DrawOptions;
    edit?: {
      featureGroup: L.FeatureGroup;
      remove?: boolean;
    };
  }

  namespace Control {
    class Draw extends L.Control {
      constructor(options: DrawControlOptions);
    }
  }
}