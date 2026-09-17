/**
 * Sacred Geometry Material Presets
 *
 * Metallic, warm-toned materials inspired by traditional yantra construction
 * materials: gold leaf, copper plates, crystal.
 */
import * as THREE from "three";
/** Gold — traditional for Sri Yantra engraving */
export function createGoldMaterials() {
    return {
        shiva: new THREE.MeshStandardMaterial({
            color: new THREE.Color("#1A0F0A"),
            metalness: 0.85,
            roughness: 0.2,
            side: THREE.DoubleSide,
        }),
        shakti: new THREE.MeshStandardMaterial({
            color: new THREE.Color("#C9501C"),
            metalness: 0.85,
            roughness: 0.2,
            side: THREE.DoubleSide,
        }),
        bindu: new THREE.MeshStandardMaterial({
            color: new THREE.Color("#D4A843"),
            metalness: 0.95,
            roughness: 0.1,
            emissive: new THREE.Color("#D4A843"),
            emissiveIntensity: 0.3,
        }),
    };
}
/** Copper — traditional temple yantra material */
export function createCopperMaterials() {
    return {
        shiva: new THREE.MeshStandardMaterial({
            color: new THREE.Color("#B87333"),
            metalness: 0.9,
            roughness: 0.25,
            side: THREE.DoubleSide,
        }),
        shakti: new THREE.MeshStandardMaterial({
            color: new THREE.Color("#DA8A67"),
            metalness: 0.9,
            roughness: 0.25,
            side: THREE.DoubleSide,
        }),
        bindu: new THREE.MeshStandardMaterial({
            color: new THREE.Color("#FFD700"),
            metalness: 0.95,
            roughness: 0.1,
            emissive: new THREE.Color("#FFD700"),
            emissiveIntensity: 0.2,
        }),
    };
}
/** Crystal — translucent, refractive */
export function createCrystalMaterials() {
    return {
        shiva: new THREE.MeshStandardMaterial({
            color: new THREE.Color("#E8E0D8"),
            metalness: 0.1,
            roughness: 0.05,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide,
        }),
        shakti: new THREE.MeshStandardMaterial({
            color: new THREE.Color("#F5E6D3"),
            metalness: 0.1,
            roughness: 0.05,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide,
        }),
        bindu: new THREE.MeshStandardMaterial({
            color: new THREE.Color("#FFFFFF"),
            metalness: 0.3,
            roughness: 0.0,
            emissive: new THREE.Color("#C9501C"),
            emissiveIntensity: 0.5,
        }),
    };
}
/** Get material set by preset name */
export function getMaterialPreset(preset) {
    switch (preset) {
        case "gold":
            return createGoldMaterials();
        case "copper":
            return createCopperMaterials();
        case "crystal":
            return createCrystalMaterials();
    }
}
