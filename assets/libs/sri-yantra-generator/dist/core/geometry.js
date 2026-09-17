/**
 * Sri Yantra Geometry — Core Mathematical Engine
 *
 * Coordinates derived from Type III (mathematically rigid) construction,
 * verified against the Soundarya Lahari verse 11 specification.
 *
 * References:
 *   - Soundarya Lahari, Adi Shankaracharya (8th century CE)
 *   - Sri Vidya Ratna Sutram
 *   - "Sri Yantra Geometry" — sriyantraresearch.com
 *   - Type III construction via TeXample.net (verified coordinates)
 */
/**
 * Raw triangle data from Type III (mathematically rigid) construction.
 *
 * Each entry: [leftX, topOrBaseY, peakOrBaseY, rightX, type]
 * - type 0 = downward (Shakti), type 1 = upward (Shiva)
 *
 * Coordinate system: 300x300 unit space, center at (150, 150), radius 100.
 */
const RAW_TRIANGLES = [
    [53.65669559977147, 123.20508075688774, 250, 246.34330440022853, 0], // D1
    [52.984011026495736, 174.24660560764943, 50, 247.01598897350425, 1], // U1
    [98.71823312733801, 220.03828947357886, 123.20508075688774, 201.281766872662, 1], // U3
    [78.26467997914015, 197.92315674002487, 78.10499177949904, 221.73532002085986, 1], // U2
    [90.4856922951427, 78.10499177949904, 160.66014976539617, 209.51430770485734, 0], // D3
    [80.98384838952128, 103.12199145016105, 220.03828947357886, 219.0161516104787, 0], // D2
    [114.9488500600036, 160.66014976539617, 103.12199145016105, 185.0511499399964, 1], // U4
    [116.35142605010424, 134.30757626706648, 197.92315674002487, 183.64857394989576, 0], // D4
    [124.61190803072795, 144.79777263138968, 174.24660560764943, 175.38809196927207, 0], // D5
];
const TRIANGLE_IDS = ["D1", "U1", "U3", "U2", "D3", "D2", "U4", "D4", "D5"];
function parseTriangle(raw, id) {
    const [leftX, y1, y2, rightX, type] = raw;
    const midX = (leftX + rightX) / 2;
    const direction = type === 1 ? "up" : "down";
    const vertices = direction === "down"
        ? [{ x: leftX, y: y1 }, { x: rightX, y: y1 }, { x: midX, y: y2 }]
        : [{ x: leftX, y: y1 }, { x: rightX, y: y1 }, { x: midX, y: y2 }];
    return {
        id,
        vertices,
        direction,
        tattva: direction === "up" ? "shiva" : "shakti",
    };
}
/**
 * Compute the full Sri Yantra geometry.
 * Returns normalized coordinates in [0, 1] space.
 */
export function computeGeometry() {
    const SPACE = 300;
    const CENTER = 150;
    const RADIUS = 100;
    const triangles = RAW_TRIANGLES.map((raw, i) => {
        const tri = parseTriangle(raw, TRIANGLE_IDS[i]);
        return {
            ...tri,
            vertices: tri.vertices.map((v) => ({
                x: v.x / SPACE,
                y: v.y / SPACE,
            })),
        };
    });
    return {
        triangles,
        bindu: { x: CENTER / SPACE, y: CENTER / SPACE },
        outerCircleRadius: RADIUS / SPACE,
        center: { x: CENTER / SPACE, y: CENTER / SPACE },
    };
}
/**
 * Get only the innermost triangles for the minimal mark.
 * Extracts U4 (Shiva) and D5 (Shakti) + bindu.
 */
export function getMinimalGeometry() {
    const full = computeGeometry();
    const u4 = full.triangles.find((t) => t.id === "U4");
    const d5 = full.triangles.find((t) => t.id === "D5");
    return {
        triangles: [u4, d5],
        bindu: full.bindu,
        outerCircleRadius: full.outerCircleRadius,
        center: full.center,
    };
}
