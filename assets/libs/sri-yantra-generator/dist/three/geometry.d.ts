/**
 * Three.js Geometry — Sri Yantra as 3D extruded meshes.
 *
 * Transforms the 2D sacred geometry into 3D space:
 *   - Triangles become extruded prisms with beveled edges
 *   - Inner triangles are stacked higher (Z-axis) than outer ones
 *   - Bindu becomes a metallic sphere at the apex
 */
import * as THREE from "three";
import type { Point, SriYantraGeometry } from "../core/types.js";
export interface ThreeGeometryOptions {
    /** Extrusion depth. Default: 0.02 */
    extrusionDepth?: number;
    /** Bevel thickness. Default: 0.003 */
    bevelThickness?: number;
    /** Bevel size. Default: 0.002 */
    bevelSize?: number;
    /** Scale factor for the geometry. Default: 2 */
    scale?: number;
}
export interface ThreeBinduOptions {
    /** Sphere radius. Default: 0.025 */
    radius?: number;
    /** Add a point light at the bindu. Default: true */
    pointLight?: boolean;
    /** Point light intensity. Default: 0.6 */
    lightIntensity?: number;
    /** Point light color. Default: '#D4A843' */
    lightColor?: string;
}
/**
 * Create a THREE.Shape from triangle vertices.
 */
export declare function triangleToShape(vertices: [Point, Point, Point]): THREE.Shape;
/**
 * Create extruded triangle meshes for all 9 triangles.
 * Returns a THREE.Group with 9 children, each tagged with userData.
 */
export declare function createTriangleMeshes(geometry: SriYantraGeometry, materials: {
    shiva: THREE.Material;
    shakti: THREE.Material;
}, options?: ThreeGeometryOptions): THREE.Group;
/**
 * Create the bindu as a sphere, optionally with a point light.
 */
export declare function createBindu(geometry: SriYantraGeometry, material: THREE.Material, extrusionDepth?: number, options?: ThreeBinduOptions): THREE.Group;
/**
 * Create a complete Sri Yantra 3D scene group.
 */
export declare function createSriYantra3DGroup(materials: {
    shiva: THREE.Material;
    shakti: THREE.Material;
    bindu: THREE.Material;
}, options?: ThreeGeometryOptions & ThreeBinduOptions): THREE.Group;
