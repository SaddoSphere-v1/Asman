/**
 * Sacred Geometry Material Presets
 *
 * Metallic, warm-toned materials inspired by traditional yantra construction
 * materials: gold leaf, copper plates, crystal.
 */
import * as THREE from "three";
export interface SacredMaterialSet {
    shiva: THREE.MeshStandardMaterial;
    shakti: THREE.MeshStandardMaterial;
    bindu: THREE.MeshStandardMaterial;
}
/** Gold — traditional for Sri Yantra engraving */
export declare function createGoldMaterials(): SacredMaterialSet;
/** Copper — traditional temple yantra material */
export declare function createCopperMaterials(): SacredMaterialSet;
/** Crystal — translucent, refractive */
export declare function createCrystalMaterials(): SacredMaterialSet;
/** Get material set by preset name */
export declare function getMaterialPreset(preset: "gold" | "copper" | "crystal"): SacredMaterialSet;
