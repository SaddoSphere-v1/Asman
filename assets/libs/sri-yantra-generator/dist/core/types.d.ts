/**
 * Core types for Sri Yantra geometry.
 *
 * These types represent the canonical mathematical structure of the Sri Yantra
 * as described in Soundarya Lahari verse 11 (Adi Shankaracharya).
 */
export interface Point {
    x: number;
    y: number;
}
export interface Triangle {
    /** Identifier: U1-U4 (Shiva/upward), D1-D5 (Shakti/downward) */
    id: string;
    /** Three vertices of the triangle */
    vertices: [Point, Point, Point];
    /** Direction: 'up' for Shiva, 'down' for Shakti */
    direction: "up" | "down";
    /** Tattva represented */
    tattva: "shiva" | "shakti";
}
export interface SriYantraGeometry {
    /** The nine interlocking triangles */
    triangles: Triangle[];
    /** Center point — Bindu (Sarvanandamaya Chakra) */
    bindu: Point;
    /** Outer circle radius */
    outerCircleRadius: number;
    /** The outer circle center */
    center: Point;
}
export interface MarmaPoint {
    /** Position of the triple intersection */
    position: Point;
    /** IDs of the three edges (triangle sides) that meet here */
    edges: [string, string, string];
    /** Index (M1 through M18) */
    index: number;
}
export interface SubTriangle {
    /** Three vertices */
    vertices: [Point, Point, Point];
    /** Which avarana ring this sub-triangle belongs to (4-8) */
    avarana: number;
}
export interface Avarana {
    number: number;
    sanskrit: string;
    transliteration: string;
    meaning: string;
    form: string;
}
/** Prepared geometry with coordinates mapped to a target pixel space */
export interface PreparedGeometry {
    triangles: PreparedTriangle[];
    bindu: {
        x: number;
        y: number;
        radius: number;
    };
    outerCircle: {
        cx: number;
        cy: number;
        r: number;
    };
    center: {
        x: number;
        y: number;
    };
    drawSize: number;
    padding: number;
    strokeWidth: number;
}
export interface PreparedTriangle extends Triangle {
    /** Vertices in target coordinate space */
    screenVertices: [Point, Point, Point];
    /** SVG/Canvas path string: M ... L ... L ... Z */
    pathData: string;
}
export interface PreparedLotus {
    center: Point;
    innerRadius: number;
    outerRadius: number;
    petalCount: number;
    petalPaths: string[];
}
export interface PreparedBhupura {
    center: Point;
    layers: BhupuraLayer[];
}
export interface BhupuraLayer {
    x: number;
    y: number;
    width: number;
    height: number;
    gates: BhupuraGate[];
}
export interface BhupuraGate {
    lines: [Point, Point][];
}
/**
 * Target use case for optical scaling.
 *
 * Different sizes need different stroke/bindu proportions to remain legible.
 * - favicon: 16-48px — bold strokes, large bindu, simplified geometry
 * - logo: 48-128px — medium strokes, prominent bindu
 * - hero: 128-512px — default proportions, full detail
 * - print: 512px+ — thin strokes to reveal mathematical precision
 */
export type TargetUse = "favicon" | "logo" | "hero" | "print";
/** Stroke line cap style */
export type StrokeLinecap = "butt" | "round" | "square";
/** Shared render options across all renderers */
export interface BaseRenderOptions {
    size?: number;
    color?: string;
    shivaColor?: string;
    shaktiColor?: string;
    binduColor?: string;
    background?: string;
    strokeWidth?: number;
    binduRadius?: number;
    filled?: boolean;
    fillOpacity?: number;
    /**
     * Optical scaling preset — adjusts stroke weight and bindu size
     * for the target render context. Explicit strokeWidth/binduRadius
     * values override the preset.
     */
    targetUse?: TargetUse;
    /** SVG stroke-linecap: "butt" (default), "round", or "square" */
    strokeLinecap?: StrokeLinecap;
}
