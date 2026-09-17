/**
 * Optical Scaling — adjusts stroke and bindu proportions by target use.
 *
 * Professional logos use different weight variants at different sizes.
 * A 16px favicon needs bolder strokes than a 2048px hero banner.
 */
/**
 * Optical profiles for the full Sri Yantra (all avaranas).
 */
const FULL_YANTRA_PROFILES = {
    favicon: {
        strokeWidth: 0.012,
        binduRadius: 0.025,
        padding: 0.03,
    },
    logo: {
        strokeWidth: 0.007,
        binduRadius: 0.016,
        padding: 0.04,
    },
    hero: {
        strokeWidth: 0.004,
        binduRadius: 0.008,
        padding: 0.05,
    },
    print: {
        strokeWidth: 0.002,
        binduRadius: 0.006,
        padding: 0.05,
    },
};
/**
 * Optical profiles for the minimal mark (U4 + D5 + bindu).
 */
const MINIMAL_MARK_PROFILES = {
    favicon: {
        strokeWidth: 0.018,
        binduRadius: 0.045,
        padding: 0.08,
    },
    logo: {
        strokeWidth: 0.010,
        binduRadius: 0.030,
        padding: 0.10,
    },
    hero: {
        strokeWidth: 0.006,
        binduRadius: 0.015,
        padding: 0.10,
    },
    print: {
        strokeWidth: 0.003,
        binduRadius: 0.010,
        padding: 0.12,
    },
};
/**
 * Resolve optical scaling values for the full yantra.
 * Explicit user values override the profile.
 */
export function resolveFullYantraOptics(targetUse, userStrokeWidth, userBinduRadius, defaultStrokeWidth, defaultBinduRadius) {
    if (!targetUse) {
        return {
            strokeWidth: userStrokeWidth ?? defaultStrokeWidth,
            binduRadius: userBinduRadius ?? defaultBinduRadius,
        };
    }
    const profile = FULL_YANTRA_PROFILES[targetUse];
    return {
        strokeWidth: userStrokeWidth ?? profile.strokeWidth,
        binduRadius: userBinduRadius ?? profile.binduRadius,
    };
}
/**
 * Resolve optical scaling values for the minimal mark.
 * Explicit user values override the profile.
 */
export function resolveMinimalMarkOptics(targetUse, userStrokeWidth, userBinduRadius, defaultStrokeWidth, defaultBinduRadius) {
    if (!targetUse) {
        return {
            strokeWidth: userStrokeWidth ?? defaultStrokeWidth,
            binduRadius: userBinduRadius ?? defaultBinduRadius,
            padding: 0.1,
        };
    }
    const profile = MINIMAL_MARK_PROFILES[targetUse];
    return {
        strokeWidth: userStrokeWidth ?? profile.strokeWidth,
        binduRadius: userBinduRadius ?? profile.binduRadius,
        padding: profile.padding,
    };
}
/**
 * For the full yantra in favicon mode, recommend disabling
 * lotuses and bhupura since they become noise at small sizes.
 */
export function faviconOverrides(targetUse) {
    if (targetUse === "favicon") {
        return {
            bhupura: false,
            sixteenPetalLotus: false,
            eightPetalLotus: false,
        };
    }
    return {};
}
