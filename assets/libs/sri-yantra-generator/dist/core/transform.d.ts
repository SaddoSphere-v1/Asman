/**
 * Coordinate transforms — maps normalized [0,1] geometry to target pixel space.
 * This is the bridge between core geometry and all renderers.
 */
import type { SriYantraGeometry, PreparedGeometry, PreparedLotus, PreparedBhupura } from "./types.js";
export interface ViewBox {
    /** Total output width/height in pixels */
    size: number;
    /** Padding as fraction of size (e.g., 0.05 for 5%) */
    padding: number;
    /** Stroke width as fraction of size */
    strokeWidth: number;
    /** Bindu radius as fraction of size */
    binduRadius: number;
}
/**
 * Transform normalized [0,1] geometry into target pixel coordinate space.
 * All renderers use this to get screen-ready coordinates.
 */
export declare function prepareForRender(geometry: SriYantraGeometry, viewBox: ViewBox): PreparedGeometry;
/**
 * Prepare geometry for the minimal mark (bounding-box centered).
 */
export declare function prepareMinimalForRender(geometry: SriYantraGeometry, viewBox: ViewBox): PreparedGeometry;
/**
 * Prepare lotus petal geometry.
 */
export declare function prepareLotus(cx: number, cy: number, innerRadius: number, outerRadius: number, petalCount: number): PreparedLotus;
/**
 * Prepare bhupura (outer square frame with gates) geometry.
 */
export declare function prepareBhupura(cx: number, cy: number, size: number): PreparedBhupura;
