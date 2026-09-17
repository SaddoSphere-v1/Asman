/**
 * Complete Three.js scene setup for Sri Yantra.
 */
import * as THREE from "three";
export interface SceneOptions {
    materialPreset?: "gold" | "copper" | "crystal";
    extrusionDepth?: number;
    cameraPosition?: [number, number, number];
    background?: string;
    ambientIntensity?: number;
    autoRotate?: boolean;
}
/**
 * Create a complete Three.js scene with Sri Yantra geometry and lighting.
 */
export declare function createSriYantraScene(options?: SceneOptions): {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    group: THREE.Group;
};
