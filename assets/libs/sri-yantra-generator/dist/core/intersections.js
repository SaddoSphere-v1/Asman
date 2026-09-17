/**
 * Marma Point & Sub-Triangle Computation
 *
 * A Marma Sthana (मर्म स्थान) is a point where exactly three triangle edges
 * intersect — the mathematical signature of a correctly constructed Sri Yantra.
 * The shastra prescribes exactly 18 such points.
 */
const EPSILON = 1e-8;
/**
 * Compute intersection of two line segments.
 * Returns the intersection point if it exists within both segments, else null.
 */
export function segmentIntersection(p1, p2, p3, p4) {
    const d1x = p2.x - p1.x;
    const d1y = p2.y - p1.y;
    const d2x = p4.x - p3.x;
    const d2y = p4.y - p3.y;
    const denom = d1x * d2y - d1y * d2x;
    if (Math.abs(denom) < EPSILON)
        return null; // Parallel or coincident
    const t = ((p3.x - p1.x) * d2y - (p3.y - p1.y) * d2x) / denom;
    const u = ((p3.x - p1.x) * d1y - (p3.y - p1.y) * d1x) / denom;
    // Check if intersection is within both segments (with small tolerance)
    if (t < -EPSILON || t > 1 + EPSILON || u < -EPSILON || u > 1 + EPSILON) {
        return null;
    }
    return {
        x: p1.x + t * d1x,
        y: p1.y + t * d1y,
    };
}
/**
 * Check if two points are approximately equal.
 */
function pointsEqual(a, b, tolerance = 1e-6) {
    return Math.abs(a.x - b.x) < tolerance && Math.abs(a.y - b.y) < tolerance;
}
/**
 * Check if a point lies on a line segment (within tolerance).
 */
function pointOnSegment(p, s1, s2, tolerance = 1e-6) {
    // Check collinearity via cross product
    const cross = (s2.x - s1.x) * (p.y - s1.y) - (s2.y - s1.y) * (p.x - s1.x);
    if (Math.abs(cross) > tolerance)
        return false;
    // Check if within segment bounds
    const minX = Math.min(s1.x, s2.x) - tolerance;
    const maxX = Math.max(s1.x, s2.x) + tolerance;
    const minY = Math.min(s1.y, s2.y) - tolerance;
    const maxY = Math.max(s1.y, s2.y) + tolerance;
    return p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY;
}
/**
 * Extract all edges from the 9 triangles.
 */
function extractEdges(triangles) {
    const edges = [];
    for (const tri of triangles) {
        const [a, b, c] = tri.vertices;
        edges.push({ p1: a, p2: b, triangleId: tri.id, edgeIndex: 0 });
        edges.push({ p1: b, p2: c, triangleId: tri.id, edgeIndex: 1 });
        edges.push({ p1: c, p2: a, triangleId: tri.id, edgeIndex: 2 });
    }
    return edges;
}
/**
 * Compute the 18 Marma Sthanas (triple intersection points).
 *
 * Algorithm:
 * 1. Extract all 27 edges (3 per triangle x 9 triangles)
 * 2. Find all pairwise edge-edge intersections
 * 3. Group intersections by location
 * 4. A point is a marma if 3+ edges from different triangles pass through it
 */
export function computeMarmaPoints(geometry) {
    const edges = extractEdges(geometry.triangles);
    const intersections = [];
    // Find all pairwise intersections
    for (let i = 0; i < edges.length; i++) {
        for (let j = i + 1; j < edges.length; j++) {
            // Skip edges from the same triangle
            if (edges[i].triangleId === edges[j].triangleId)
                continue;
            const pt = segmentIntersection(edges[i].p1, edges[i].p2, edges[j].p1, edges[j].p2);
            if (!pt)
                continue;
            // Check if this intersection is near an existing one
            const existing = intersections.find((ip) => pointsEqual(ip.point, pt));
            const edgeIdI = `${edges[i].triangleId}-${edges[i].edgeIndex}`;
            const edgeIdJ = `${edges[j].triangleId}-${edges[j].edgeIndex}`;
            if (existing) {
                existing.edgeIds.add(edgeIdI);
                existing.edgeIds.add(edgeIdJ);
            }
            else {
                intersections.push({
                    point: pt,
                    edgeIds: new Set([edgeIdI, edgeIdJ]),
                });
            }
        }
    }
    // Also check: for each intersection point, find ALL edges that pass through it
    // (not just the two that were paired to discover it)
    for (const intersection of intersections) {
        for (const edge of edges) {
            const edgeId = `${edge.triangleId}-${edge.edgeIndex}`;
            if (intersection.edgeIds.has(edgeId))
                continue;
            if (pointOnSegment(intersection.point, edge.p1, edge.p2)) {
                intersection.edgeIds.add(edgeId);
            }
        }
    }
    // Filter to true marma sthanas: points where edges from 3+ DIFFERENT
    // triangles meet. Excludes vertex-on-edge coincidences where a triangle's
    // own vertex sits on another triangle's edge.
    const marmaPoints = [];
    let index = 1;
    for (const { point, edgeIds } of intersections) {
        // Count distinct triangle IDs
        const triangleIds = new Set(Array.from(edgeIds).map((id) => id.split("-")[0]));
        if (triangleIds.size >= 3) {
            // Pick one edge per triangle for the canonical 3-edge tuple
            const edgeArray = Array.from(edgeIds);
            marmaPoints.push({
                position: point,
                edges: [edgeArray[0], edgeArray[1], edgeArray[2]],
                index: index++,
            });
        }
    }
    return marmaPoints;
}
