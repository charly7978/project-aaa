// Declaraciones de tipos para módulos que pueden no tener tipos definidos
declare module 'react';

declare module 'expo-camera' {
  import { Component, ReactNode } from 'react';
  
  interface CameraViewProps {
    style?: any;
    facing?: 'front' | 'back';
    flash?: 'on' | 'off' | 'auto';
    enableTorch?: boolean;
    mode?: 'picture' | 'video';
    onFrameProcessed?: (frame: any) => void;
    children?: ReactNode;
  }
  
  interface CameraType {
    front: 'front';
    back: 'back';
  }
  
  class CameraView extends Component<CameraViewProps> {
    takePictureAsync(options?: any): Promise<any>;
  }
  
  function useCameraPermissions(): [any, () => Promise<void>];
  
  export { CameraView, CameraType, useCameraPermissions };
}

declare module 'expo-haptics' {
  export function impactAsync(style: any): Promise<void>;
  export const ImpactFeedbackStyle: {
    Light: any;
    Medium: any;
    Heavy: any;
  };
}

declare module 'expo-linear-gradient' {
  import { Component, ReactNode } from 'react';
  
  interface LinearGradientProps {
    colors: string[];
    start?: { x: number; y: number };
    end?: { x: number; y: number };
    style?: any;
    children?: ReactNode;
  }
  
  class LinearGradient extends Component<LinearGradientProps> {}
  export { LinearGradient };
}

declare module 'expo-av' {
  export class Sound {
    static createAsync(source: any, options?: any): Promise<Sound>;
    async playAsync(): Promise<void>;
    async stopAsync(): Promise<void>;
    async unloadAsync(): Promise<void>;
  }
}

declare module 'react-native-fs' {
  export function writeFile(path: string, content: string, encoding: string): Promise<void>;
  export const ExternalDirectoryPath: string;
}
