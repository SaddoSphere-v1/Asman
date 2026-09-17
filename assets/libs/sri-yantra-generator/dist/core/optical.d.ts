/**
 * Optical Scaling — adjusts stroke and bindu proportions by target use.
 *
 * Professional logos use different weight variants at different sizes.
 * A 16px favicon needs bolder strokes than a 2048px hero banner.
 */
import type { TargetUse } from "./types.js";
export interface OpticalProfile {
    /** Stroke width as fraction of size */
    strokeWidth: number;
    /** Bindu radius as fraction of size */
    binduRadius: number;
    /** Padding as fraction of size */
    padding: number;
}
/**
 * Resolve optical scaling values for the full yantra.
 * Explicit user values override the profile.
 */
export declare function resolveFullYantraOptics(targetUse: TargetUse | undefined, userStrokeWidth: number | undefined, userBinduRadius: number | undefined, defaultStrokeWidth: number, defaultBinduRadius: number): {
    strokeWidth: number;
    binduRadius: number;
};
/**
 * Resolve optical scaling values for the minimal mark.
 * Explicit user values override the profile.
 */
export declare function resolveMinimalMarkOptics(targetUse: TargetUse | undefined, userStrokeWidth: number | undefined, userBinduRadius: number | undefined, defaultStrokeWidth: number, defaultBinduRadius: number): {
    strokeWidth: number;
    binduRadius: number;
    padding: number;
};
/**
 * For the full yantra in favicon mode, recommend disabling
 * lotuses and bhupura since they become noise at small sizes.
 */
export declare function faviconOverrides(targetUse: TargetUse | undefined): {
    bhupura?: boolean;
    sixteenPetalLotus?: boolean;
    eightPetalLotus?: boolean;
};
