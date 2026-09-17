"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { computeGeometry } from "../core/geometry.js";
import { triangleToShape } from "../three/geometry.js";
import { getMaterialPreset } from "../three/materials.js";
const Z_OFFSETS = {
    D1: 0, U1: 0, U2: 0.3, D2: 0.3,
    U3: 0.5, D3: 0.5, U4: 0.7, D4: 0.7, D5: 0.85,
};
function SriYantraModel({ materialPreset = "gold", extrusionDepth = 0.02, autoRotate = true, autoRotateSpeed = 0.05, }) {
    const groupRef = useRef(null);
    const geometry = useMemo(() => computeGeometry(), []);
    const materials = useMemo(() => getMaterialPreset(materialPreset), [materialPreset]);
    useFrame((state) => {
        if (autoRotate && groupRef.current) {
            groupRef.current.rotation.z = state.clock.elapsedTime * autoRotateSpeed;
        }
    });
    return (_jsxs("group", { ref: groupRef, children: [geometry.triangles.map((tri) => {
                const shape = triangleToShape(tri.vertices);
                const zOffset = (Z_OFFSETS[tri.id] ?? 0) * extrusionDepth * 4;
                const material = tri.tattva === "shiva" ? materials.shiva : materials.shakti;
                return (_jsxs("mesh", { position: [0, 0, zOffset], scale: [2, 2, 1], children: [_jsx("extrudeGeometry", { args: [
                                shape,
                                {
                                    depth: extrusionDepth,
                                    bevelEnabled: true,
                                    bevelThickness: 0.003,
                                    bevelSize: 0.002,
                                    bevelSegments: 2,
                                },
                            ] }), _jsx("primitive", { object: material, attach: "material" })] }, tri.id));
            }), _jsxs("mesh", { position: [0, 0, extrusionDepth * 5], children: [_jsx("sphereGeometry", { args: [0.025, 32, 32] }), _jsx("primitive", { object: materials.bindu, attach: "material" })] }), _jsx("pointLight", { position: [0, 0, extrusionDepth * 5 + 0.05], intensity: 0.6, distance: 2, color: "#D4A843" })] }));
}
/**
 * React Three Fiber component for 3D Sri Yantra rendering.
 */
export function SriYantra3D({ width = 600, height = 600, materialPreset = "gold", extrusionDepth = 0.02, autoRotate = true, autoRotateSpeed = 0.05, className, style, }) {
    return (_jsx("div", { className: className, style: { width, height, ...style }, children: _jsxs(Canvas, { camera: { position: [0, -0.3, 1.8], fov: 45 }, children: [_jsx("ambientLight", { intensity: 0.4, color: "#fff5e6" }), _jsx("directionalLight", { position: [2, 3, 4], intensity: 1.0 }), _jsx("directionalLight", { position: [-2, -1, 2], intensity: 0.3, color: "#e6f0ff" }), _jsx(SriYantraModel, { materialPreset: materialPreset, extrusionDepth: extrusionDepth, autoRotate: autoRotate, autoRotateSpeed: autoRotateSpeed }), _jsx(OrbitControls, { enableZoom: true, enablePan: false, autoRotate: false })] }) }));
}
