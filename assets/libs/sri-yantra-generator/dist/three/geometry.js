/**
 * Three.js Geometry — Sri Yantra as 3D extruded meshes.
 *
 * Transforms the 2D sacred geometry into 3D space:
 *   - Triangles become extruded prisms with beveled edges
 *   - Inner triangles are stacked higher (Z-axis) than outer ones
 *   - Bindu becomes a metallic sphere at the apex
 */
import * as THREE from "three";
import { computeGeometry } from "../core/geometry.js";
/** Z-offset per triangle — inner triangles are progressively higher */
const Z_OFFSETS = {
    D1: 0,
    U1: 0,
    U2: 0.3,
    D2: 0.3,
    U3: 0.5,
    D3: 0.5,
    U4: 0.7,
    D4: 0.7,
    D5: 0.85,
};
/** Convert normalized [0,1] 2D point to Three.js world coordinates */
function toWorld(point) {
    return new THREE.Vector2(point.x - 0.5, -(point.y - 0.5));
}
/**
 * Create a THREE.Shape from triangle vertices.
 */
export function triangleToShape(vertices) {
    const [a, b, c] = vertices.map(toWorld);
    const shape = new THREE.Shape();
    shape.moveTo(a.x, a.y);
    shape.lineTo(b.x, b.y);
    shape.lineTo(c.x, c.y);
    shape.lineTo(a.x, a.y);
    return shape;
}
/**
 * Create extruded triangle meshes for all 9 triangles.
 * Returns a THREE.Group with 9 children, each tagged with userData.
 */
export function createTriangleMeshes(geometry, materials, options = {}) {
    const { extrusionDepth = 0.02, bevelThickness = 0.003, bevelSize = 0.002, scale = 2, } = options;
    const group = new THREE.Group();
    for (const tri of geometry.triangles) {
        const shape = triangleToShape(tri.vertices);
        const extrudeSettings = {
            depth: extrusionDepth,
            bevelEnabled: true,
            bevelThickness,
            bevelSize,
            bevelSegments: 2,
        };
        const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        const material = tri.tattva === "shiva" ? materials.shiva : materials.shakti;
        const mesh = new THREE.Mesh(geo, material);
        const zOffset = (Z_OFFSETS[tri.id] ?? 0) * extrusionDepth * 4;
        mesh.position.z = zOffset;
        mesh.scale.set(scale, scale, 1);
        mesh.userData = {
            id: tri.id,
            tattva: tri.tattva,
            direction: tri.direction,
        };
        group.add(mesh);
    }
    return group;
}
/**
 * Create the bindu as a sphere, optionally with a point light.
 */
export function createBindu(geometry, material, extrusionDepth = 0.02, options = {}) {
    const { radius = 0.025, pointLight = true, lightIntensity = 0.6, lightColor = "#D4A843", } = options;
    const group = new THREE.Group();
    const sphereGeo = new THREE.SphereGeometry(radius, 32, 32);
    const sphere = new THREE.Mesh(sphereGeo, material);
    const binduWorld = toWorld(geometry.bindu);
    const zTop = extrusionDepth * 4 + extrusionDepth;
    sphere.position.set(binduWorld.x * 2, binduWorld.y * 2, zTop);
    group.add(sphere);
    if (pointLight) {
        const light = new THREE.PointLight(new THREE.Color(lightColor), lightIntensity, 2);
        light.position.copy(sphere.position);
        light.position.z += radius * 2;
        group.add(light);
    }
    return group;
}
/**
 * Create a complete Sri Yantra 3D scene group.
 */
export function createSriYantra3DGroup(materials, options = {}) {
    const geometry = computeGeometry();
    const group = new THREE.Group();
    const triangleGroup = createTriangleMeshes(geometry, materials, options);
    group.add(triangleGroup);
    const binduGroup = createBindu(geometry, materials.bindu, options.extrusionDepth, options);
    group.add(binduGroup);
    return group;
}
