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
import type { SriYantraGeometry } from "./types.js";
/**
 * Compute the full Sri Yantra geometry.
 * Returns normalized coordinates in [0, 1] space.
 */
export declare function computeGeometry(): SriYantraGeometry;
/**
 * Get only the innermost triangles for the minimal mark.
 * Extracts U4 (Shiva) and D5 (Shakti) + bindu.
 */
export declare function getMinimalGeometry(): SriYantraGeometry;
