export interface SriYantra3DProps {
    width?: number;
    height?: number;
    materialPreset?: "gold" | "copper" | "crystal";
    extrusionDepth?: number;
    autoRotate?: boolean;
    autoRotateSpeed?: number;
    className?: string;
    style?: React.CSSProperties;
}
/**
 * React Three Fiber component for 3D Sri Yantra rendering.
 */
export declare function SriYantra3D({ width, height, materialPreset, extrusionDepth, autoRotate, autoRotateSpeed, className, style, }: SriYantra3DProps): import("react/jsx-runtime").JSX.Element;
