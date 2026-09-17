/**
 * Canvas 2D Renderer
 *
 * Zero dependencies — accepts a CanvasRenderingContext2D interface.
 * Works identically with browser canvas, node-canvas, or @napi-rs/canvas.
 */
import type { BaseRenderOptions } from "../core/types.js";
export interface CanvasRenderOptions extends BaseRenderOptions {
    pixelRatio?: number;
    outerCircle?: boolean;
    sixteenPetalLotus?: boolean;
    eightPetalLotus?: boolean;
    bhupura?: boolean;
    bindu?: boolean;
}
/** Minimal interface matching CanvasRenderingContext2D for cross-platform use */
interface CanvasContext {
    beginPath(): void;
    moveTo(x: number, y: number): void;
    lineTo(x: number, y: number): void;
    closePath(): void;
    stroke(): void;
    fill(): void;
    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number): void;
    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void;
    rect(x: number, y: number, w: number, h: number): void;
    save(): void;
    restore(): void;
    scale(x: number, y: number): void;
    clearRect(x: number, y: number, w: number, h: number): void;
    fillRect(x: number, y: number, w: number, h: number): void;
    strokeStyle: string | CanvasGradient | CanvasPattern;
    fillStyle: string | CanvasGradient | CanvasPattern;
    lineWidth: number;
    lineJoin: string;
    globalAlpha: number;
}
/**
 * Render Sri Yantra to a Canvas 2D context.
 *
 * The function accepts any object matching the Canvas 2D API, making it
 * work across browser, node-canvas, and @napi-rs/canvas.
 */
export declare function renderToCanvas(ctx: CanvasContext, options?: CanvasRenderOptions): void;
export {};
