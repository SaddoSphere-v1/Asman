/**
 * Animated Sri Yantra SVG Renderer
 *
 * Generates SVGs with embedded CSS @keyframes animations.
 * Four presets: draw, layer-reveal, breathe, rotate.
 *
 * Uses CSS animations over SMIL for better browser support.
 * Includes prefers-reduced-motion media query for accessibility.
 */
import { type RenderOptions } from "./renderer.js";
export type AnimationPreset = "draw" | "layer-reveal" | "breathe" | "rotate";
export interface AnimatedSvgOptions extends RenderOptions {
    animation: AnimationPreset;
    /** Total animation duration in seconds. Default varies by preset. */
    duration?: number;
    /** CSS easing function. Default varies by preset. */
    easing?: string;
    /** Whether animation loops. Default: false for draw/reveal, true for breathe/rotate. */
    loop?: boolean;
    /** Respect prefers-reduced-motion. Default: true */
    respectReducedMotion?: boolean;
}
/**
 * Generate an animated Sri Yantra SVG with embedded CSS animations.
 */
export declare function generateAnimatedSriYantra(options: AnimatedSvgOptions): string;
