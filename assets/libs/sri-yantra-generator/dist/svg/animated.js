/**
 * Animated Sri Yantra SVG Renderer
 *
 * Generates SVGs with embedded CSS @keyframes animations.
 * Four presets: draw, layer-reveal, breathe, rotate.
 *
 * Uses CSS animations over SMIL for better browser support.
 * Includes prefers-reduced-motion media query for accessibility.
 */
import { generateSriYantra } from "./renderer.js";
const TRIANGLE_ORDER = ["D1", "U1", "U2", "U3", "D2", "D3", "U4", "D4", "D5"];
function generateDrawStyle(duration, easing, loop) {
    const stagger = duration / TRIANGLE_ORDER.length;
    const triRules = TRIANGLE_ORDER.map((id, i) => `[data-id="${id}"] { stroke-dasharray: 2000; stroke-dashoffset: 2000; animation: sri-draw ${(duration * 0.6).toFixed(2)}s ${easing} ${(i * stagger).toFixed(2)}s forwards; }`).join("\n      ");
    return `
    <defs><style>
      @keyframes sri-draw {
        to { stroke-dashoffset: 0; }
      }
      ${triRules}
      [data-id="bindu"] { opacity: 0; animation: sri-fade 0.5s ${easing} ${duration}s forwards; }
      @keyframes sri-fade { to { opacity: 1; } }
    </style></defs>`;
}
function generateLayerRevealStyle(duration, easing) {
    const layerDuration = duration / 9;
    const avaranaTags = [
        { selector: "rect", delay: 0 },
        { selector: "[stroke-linejoin='round']", delay: layerDuration * 2 },
        { selector: "[data-id]", delay: layerDuration * 4 },
        { selector: "[data-id='bindu'], circle:last-child", delay: layerDuration * 8 },
    ];
    const rules = avaranaTags
        .map(({ selector, delay }) => `${selector} { opacity: 0; animation: sri-reveal 0.6s ${easing} ${delay.toFixed(2)}s forwards; }`)
        .join("\n      ");
    return `
    <defs><style>
      @keyframes sri-reveal {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      ${rules}
    </style></defs>`;
}
function generateBreatheStyle(duration, easing) {
    return `
    <defs><style>
      @keyframes sri-breathe {
        0%, 100% { r: 1; opacity: 1; }
        50% { r: 1.6; opacity: 0.7; }
      }
      circle:last-of-type {
        animation: sri-breathe ${duration}s ${easing} infinite;
        transform-origin: center;
      }
    </style></defs>`;
}
function generateRotateStyle(duration, easing) {
    return `
    <defs><style>
      @keyframes sri-rotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      svg > *:not(defs):not(rect:first-child) {
        transform-origin: 50% 50%;
        animation: sri-rotate ${duration}s ${easing} infinite;
      }
    </style></defs>`;
}
const PRESET_DEFAULTS = {
    draw: { duration: 3, easing: "ease-out", loop: false },
    "layer-reveal": { duration: 4, easing: "ease-out", loop: false },
    breathe: { duration: 4, easing: "ease-in-out", loop: true },
    rotate: { duration: 120, easing: "linear", loop: true },
};
/**
 * Generate an animated Sri Yantra SVG with embedded CSS animations.
 */
export function generateAnimatedSriYantra(options) {
    const { animation, duration = PRESET_DEFAULTS[animation].duration, easing = PRESET_DEFAULTS[animation].easing, loop = PRESET_DEFAULTS[animation].loop, respectReducedMotion = true, ...renderOptions } = options;
    // Generate base SVG
    let svg = generateSriYantra(renderOptions);
    // Generate animation style block
    let styleBlock;
    switch (animation) {
        case "draw":
            styleBlock = generateDrawStyle(duration, easing, loop);
            break;
        case "layer-reveal":
            styleBlock = generateLayerRevealStyle(duration, easing);
            break;
        case "breathe":
            styleBlock = generateBreatheStyle(duration, easing);
            break;
        case "rotate":
            styleBlock = generateRotateStyle(duration, easing);
            break;
    }
    // Add reduced-motion support
    if (respectReducedMotion) {
        styleBlock = styleBlock.replace("</style></defs>", `\n      @media (prefers-reduced-motion: reduce) {
        * { animation: none !important; opacity: 1 !important; stroke-dashoffset: 0 !important; }
      }
    </style></defs>`);
    }
    // Inject style block after the opening <svg> tag
    svg = svg.replace(/(<svg[^>]*>)/, `$1\n  ${styleBlock}`);
    return svg;
}
