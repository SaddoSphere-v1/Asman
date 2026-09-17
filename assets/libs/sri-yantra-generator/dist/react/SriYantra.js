"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { useMemo } from "react";
import { generateSriYantra } from "../svg/renderer.js";
import { generateAnimatedSriYantra, } from "../svg/animated.js";
/**
 * React component that renders Sri Yantra as inline SVG.
 */
export function SriYantra({ className, style, animated = false, animationPreset = "draw", ...options }) {
    const svgString = useMemo(() => {
        if (animated) {
            return generateAnimatedSriYantra({
                ...options,
                animation: animationPreset,
            });
        }
        return generateSriYantra(options);
    }, [animated, animationPreset, JSON.stringify(options)]);
    return (_jsx("div", { className: className, style: style, dangerouslySetInnerHTML: { __html: svgString } }));
}
