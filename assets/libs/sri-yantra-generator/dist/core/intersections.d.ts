/**
 * Marma Point & Sub-Triangle Computation
 *
 * A Marma Sthana (मर्म स्थान) is a point where exactly three triangle edges
 * intersect — the mathematical signature of a correctly constructed Sri Yantra.
 * The shastra prescribes exactly 18 such points.
 */
import type { Point, SriYantraGeometry, MarmaPoint } from "./types.js";
/**
 * Compute intersection of two line segments.
 * Returns the intersection point if it exists within both segments, else null.
 */
export declare function segmentIntersection(p1: Point, p2: Point, p3: Point, p4: Point): Point | null;
/**
 * Compute the 18 Marma Sthanas (triple intersection points).
 *
 * Algorithm:
 * 1. Extract all 27 edges (3 per triangle x 9 triangles)
 * 2. Find all pairwise edge-edge intersections
 * 3. Group intersections by location
 * 4. A point is a marma if 3+ edges from different triangles pass through it
 */
export declare function computeMarmaPoints(geometry: SriYantraGeometry): MarmaPoint[];
