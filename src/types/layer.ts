// src/types/layer.ts
export interface Layer {
    id: string;
    name: string;
    visible: boolean;
    color: string;
    type: 'polygon' | 'marker' | 'circle';
    data: any; // Replace `any` with more specific types as needed
  }
  