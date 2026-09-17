/**
 * Sri Yantra SVG Renderer
 *
 * Renders mathematically precise SVG from prepared geometry.
 * Zero dependencies — pure string concatenation.
 */
import type { BaseRenderOptions } from "../core/types.js";
export interface RenderOptions extends BaseRenderOptions {
    outerCircle?: boolean;
    sixteenPetalLotus?: boolean;
    eightPetalLotus?: boolean;
    bhupura?: boolean;
    bindu?: boolean;
}
export interface MinimalMarkOptions extends BaseRenderOptions {
    enclosingCircle?: boolean;
}
/**
 * Generate a complete Sri Yantra SVG.
 */
export declare function generateSriYantra(options?: RenderOptions): string;
/**
 * Generate the minimal mark — innermost Shiva-Shakti interlock + bindu.
 */
export declare function generateMinimalMark(options?: MinimalMarkOptions): string;
