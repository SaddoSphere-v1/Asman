import { type RenderOptions } from "../svg/renderer.js";
import { type AnimationPreset } from "../svg/animated.js";
export interface SriYantraProps extends RenderOptions {
    className?: string;
    style?: React.CSSProperties;
    animated?: boolean;
    animationPreset?: AnimationPreset;
}
/**
 * React component that renders Sri Yantra as inline SVG.
 */
export declare function SriYantra({ className, style, animated, animationPreset, ...options }: SriYantraProps): import("react/jsx-runtime").JSX.Element;
