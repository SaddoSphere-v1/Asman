/**
 * Sri Yantra SVG Renderer
 *
 * Renders mathematically precise SVG from prepared geometry.
 * Zero dependencies — pure string concatenation.
 */
import { computeGeometry, getMinimalGeometry } from "../core/geometry.js";
import { prepareForRender, prepareMinimalForRender, prepareLotus, prepareBhupura, } from "../core/transform.js";
import { resolveFullYantraOptics, resolveMinimalMarkOptics, faviconOverrides, } from "../core/optical.js";
function renderTrianglesToSvg(prepared, shivaColor, shaktiColor, filled, fillOpacity, linecap = "butt") {
    const capAttr = linecap !== "butt" ? ` stroke-linecap="${linecap}"` : "";
    return prepared.triangles.map((tri) => {
        const triColor = tri.tattva === "shiva" ? shivaColor : shaktiColor;
        const fillAttr = filled
            ? `fill="${triColor}" fill-opacity="${fillOpacity}"`
            : `fill="none"`;
        return `<path d="${tri.pathData}" ${fillAttr} stroke="${triColor}" stroke-width="${prepared.strokeWidth}" stroke-linejoin="miter"${capAttr} data-id="${tri.id}" data-tattva="${tri.tattva}" />`;
    });
}
function renderLotusToSvg(cx, cy, innerR, outerR, petalCount, color, sw) {
    const lotus = prepareLotus(cx, cy, innerR, outerR, petalCount);
    return `<g fill="none" stroke="${color}" stroke-width="${sw}" stroke-linejoin="round">
    ${lotus.petalPaths.map((d) => `<path d="${d}"/>`).join("\n    ")}
    <circle cx="${lotus.center.x}" cy="${lotus.center.y}" r="${lotus.innerRadius}" />
    <circle cx="${lotus.center.x}" cy="${lotus.center.y}" r="${lotus.outerRadius}" />
  </g>`;
}
function renderBhupuraToSvg(cx, cy, size, color, sw) {
    const bhupura = prepareBhupura(cx, cy, size);
    return bhupura.layers
        .map((layer) => {
        const gateLines = layer.gates
            .flatMap((gate) => gate.lines.map(([a, b]) => `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" />`))
            .join("\n      ");
        return `<g fill="none" stroke="${color}" stroke-width="${sw}">
      <rect x="${layer.x}" y="${layer.y}" width="${layer.width}" height="${layer.height}" />
      ${gateLines}
    </g>`;
    })
        .join("\n");
}
/**
 * Generate a complete Sri Yantra SVG.
 */
export function generateSriYantra(options = {}) {
    const { size = 512, color = "#C9501C", shivaColor, shaktiColor, binduColor, background = "none", outerCircle = true, bindu = true, filled = false, fillOpacity = 0.1, targetUse, strokeLinecap: linecap = "butt", } = options;
    // Optical scaling: resolve stroke/bindu proportions from targetUse preset,
    // allowing explicit user values to override.
    const optics = resolveFullYantraOptics(targetUse, options.strokeWidth, options.binduRadius, 0.004, // default strokeWidth
    0.008);
    const strokeWidth = optics.strokeWidth;
    const binduRadius = optics.binduRadius;
    // Favicon mode auto-disables decorative outer avaranas that become noise at small sizes.
    const favOverrides = faviconOverrides(targetUse);
    const bhupura = options.bhupura ?? favOverrides.bhupura ?? true;
    const sixteenPetalLotus = options.sixteenPetalLotus ?? favOverrides.sixteenPetalLotus ?? true;
    const eightPetalLotus = options.eightPetalLotus ?? favOverrides.eightPetalLotus ?? true;
    const geo = computeGeometry();
    const paddingFrac = bhupura ? 0.05 : 0.02;
    const prepared = prepareForRender(geo, { size, padding: paddingFrac, strokeWidth, binduRadius });
    const shivaC = shivaColor ?? color;
    const shaktiC = shaktiColor ?? color;
    const binduC = binduColor ?? color;
    const sw = prepared.strokeWidth;
    const cx = prepared.center.x;
    const cy = prepared.center.y;
    const circleR = prepared.outerCircle.r;
    const elements = [];
    if (background !== "none") {
        elements.push(`<rect width="${size}" height="${size}" fill="${background}" />`);
    }
    if (bhupura) {
        elements.push(`<!-- Avarana 1: Trailokya Mohana Chakra (त्रैलोक्य मोहन चक्र) -->`);
        elements.push(renderBhupuraToSvg(cx, cy, size, color, sw));
    }
    if (sixteenPetalLotus) {
        elements.push(`<!-- Avarana 2: Sarvashaparipuraka Chakra (सर्वाशापरिपूरक चक्र) — 16-petal lotus -->`);
        elements.push(renderLotusToSvg(cx, cy, circleR * 1.05, circleR * 1.22, 16, color, sw));
    }
    if (eightPetalLotus) {
        elements.push(`<!-- Avarana 3: Sarvasankshobhana Chakra (सर्वसंक्षोभण चक्र) — 8-petal lotus -->`);
        elements.push(renderLotusToSvg(cx, cy, circleR * 0.96, circleR * 1.05, 8, color, sw));
    }
    if (outerCircle) {
        elements.push(`<circle cx="${cx}" cy="${cy}" r="${circleR}" fill="none" stroke="${color}" stroke-width="${sw}" />`);
    }
    elements.push(`<!-- Avaranas 4-8: Nine interlocking triangles (4 Shiva ↑ + 5 Shakti ↓) = 43 sub-triangles -->`);
    elements.push(...renderTrianglesToSvg(prepared, shivaC, shaktiC, filled, fillOpacity, linecap));
    if (bindu) {
        elements.push(`<!-- Avarana 9: Sarvanandamaya Chakra (सर्वानन्दमय चक्र) — Bindu -->`);
        elements.push(`<circle cx="${prepared.bindu.x}" cy="${prepared.bindu.y}" r="${prepared.bindu.radius}" fill="${binduC}" />`);
    }
    return [
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">`,
        `  <!-- Sri Yantra — Generated by @vibzart/sri-yantra -->`,
        `  <!-- Shastra: Soundarya Lahari, Verse 11 (Adi Shankaracharya) -->`,
        `  <!-- सर्वे भवन्तु सुखिनः — May all beings be happy -->`,
        ...elements.map((e) => `  ${e}`),
        `</svg>`,
    ].join("\n");
}
/**
 * Generate the minimal mark — innermost Shiva-Shakti interlock + bindu.
 */
export function generateMinimalMark(options = {}) {
    const { size = 512, color = "#C9501C", shivaColor, shaktiColor, binduColor, background = "none", enclosingCircle = false, filled = false, fillOpacity = 0.1, targetUse, strokeLinecap: linecap = "butt", } = options;
    // Optical scaling: resolve stroke/bindu/padding from targetUse preset.
    const optics = resolveMinimalMarkOptics(targetUse, options.strokeWidth, options.binduRadius, 0.006, // default strokeWidth
    0.015);
    const geo = getMinimalGeometry();
    const prepared = prepareMinimalForRender(geo, {
        size,
        padding: optics.padding,
        strokeWidth: optics.strokeWidth,
        binduRadius: optics.binduRadius,
    });
    const shivaC = shivaColor ?? color;
    const shaktiC = shaktiColor ?? color;
    const binduC = binduColor ?? color;
    const elements = [];
    if (background !== "none") {
        elements.push(`<rect width="${size}" height="${size}" fill="${background}" />`);
    }
    if (enclosingCircle) {
        elements.push(`<circle cx="${prepared.center.x}" cy="${prepared.center.y}" r="${prepared.outerCircle.r}" fill="none" stroke="${color}" stroke-width="${prepared.strokeWidth}" />`);
    }
    elements.push(...renderTrianglesToSvg(prepared, shivaC, shaktiC, filled, fillOpacity, linecap));
    elements.push(`<circle cx="${prepared.bindu.x}" cy="${prepared.bindu.y}" r="${prepared.bindu.radius}" fill="${binduC}" />`);
    return [
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">`,
        `  <!-- Minimal Mark — Innermost Sri Yantra (Avaranas 8-9) -->`,
        `  <!-- @vibzart/sri-yantra -->`,
        ...elements.map((e) => `  ${e}`),
        `</svg>`,
    ].join("\n");
}
