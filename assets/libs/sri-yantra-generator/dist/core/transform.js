/**
 * Coordinate transforms — maps normalized [0,1] geometry to target pixel space.
 * This is the bridge between core geometry and all renderers.
 */
/** Round a number to n decimal places to eliminate floating-point artifacts */
function round(n, decimals = 4) {
    const factor = 10 ** decimals;
    return Math.round(n * factor) / factor;
}
function roundPoint(p, decimals = 4) {
    return { x: round(p.x, decimals), y: round(p.y, decimals) };
}
function pointsToPathData(vertices) {
    const [a, b, c] = vertices;
    return `M ${a.x} ${a.y} L ${b.x} ${b.y} L ${c.x} ${c.y} Z`;
}
/**
 * Transform normalized [0,1] geometry into target pixel coordinate space.
 * All renderers use this to get screen-ready coordinates.
 */
export function prepareForRender(geometry, viewBox) {
    const { size, padding: paddingFrac, strokeWidth: swFrac, binduRadius: brFrac } = viewBox;
    const padding = size * paddingFrac;
    const drawSize = size - padding * 2;
    const sw = round(swFrac * size);
    const br = round(brFrac * size);
    const cx = round(size / 2);
    const cy = round(size / 2);
    const circleR = round(geometry.outerCircleRadius * drawSize);
    const triangles = geometry.triangles.map((tri) => {
        const screenVertices = tri.vertices.map((v) => roundPoint({ x: v.x * drawSize + padding, y: v.y * drawSize + padding }));
        return {
            ...tri,
            screenVertices,
            pathData: pointsToPathData(screenVertices),
        };
    });
    const binduScreen = roundPoint({
        x: geometry.bindu.x * drawSize + padding,
        y: geometry.bindu.y * drawSize + padding,
    });
    return {
        triangles,
        bindu: { ...binduScreen, radius: br },
        outerCircle: { cx, cy, r: circleR },
        center: { x: cx, y: cy },
        drawSize,
        padding,
        strokeWidth: sw,
    };
}
/**
 * Prepare geometry for the minimal mark (bounding-box centered).
 */
export function prepareMinimalForRender(geometry, viewBox) {
    const { size, strokeWidth: swFrac, binduRadius: brFrac } = viewBox;
    const sw = round(swFrac * size);
    const br = round(brFrac * size);
    const padding = size * viewBox.padding;
    const availableSize = size - padding * 2;
    // Bounding box of all triangle vertices
    const allPoints = geometry.triangles.flatMap((t) => t.vertices);
    const minX = Math.min(...allPoints.map((p) => p.x));
    const maxX = Math.max(...allPoints.map((p) => p.x));
    const minY = Math.min(...allPoints.map((p) => p.y));
    const maxY = Math.max(...allPoints.map((p) => p.y));
    const geoWidth = maxX - minX;
    const geoHeight = maxY - minY;
    const geoCx = (minX + maxX) / 2;
    const geoCy = (minY + maxY) / 2;
    const scale = availableSize / Math.max(geoWidth, geoHeight);
    const cx = round(size / 2);
    const cy = round(size / 2);
    const triangles = geometry.triangles.map((tri) => {
        const screenVertices = tri.vertices.map((v) => roundPoint({
            x: (v.x - geoCx) * scale + cx,
            y: (v.y - geoCy) * scale + cy,
        }));
        return {
            ...tri,
            screenVertices,
            pathData: pointsToPathData(screenVertices),
        };
    });
    const binduScreen = roundPoint({
        x: (geometry.bindu.x - geoCx) * scale + cx,
        y: (geometry.bindu.y - geoCy) * scale + cy,
    });
    const circleR = round((availableSize / 2) * 1.05);
    return {
        triangles,
        bindu: { ...binduScreen, radius: br },
        outerCircle: { cx, cy, r: circleR },
        center: { x: cx, y: cy },
        drawSize: availableSize,
        padding,
        strokeWidth: sw,
    };
}
/**
 * Prepare lotus petal geometry.
 */
export function prepareLotus(cx, cy, innerRadius, outerRadius, petalCount) {
    const petalPaths = [];
    const petalAngle = (Math.PI * 2) / petalCount;
    const rotationOffset = -Math.PI / 2;
    for (let i = 0; i < petalCount; i++) {
        const startAngle = rotationOffset + i * petalAngle;
        const halfPetal = petalAngle * 0.4;
        const innerLeft = roundPoint({
            x: cx + innerRadius * Math.cos(startAngle - halfPetal),
            y: cy + innerRadius * Math.sin(startAngle - halfPetal),
        });
        const innerRight = roundPoint({
            x: cx + innerRadius * Math.cos(startAngle + halfPetal),
            y: cy + innerRadius * Math.sin(startAngle + halfPetal),
        });
        const outerTip = roundPoint({
            x: cx + outerRadius * Math.cos(startAngle),
            y: cy + outerRadius * Math.sin(startAngle),
        });
        const cpLeft = roundPoint({
            x: cx + (innerRadius + outerRadius) * 0.55 * Math.cos(startAngle - halfPetal * 0.5),
            y: cy + (innerRadius + outerRadius) * 0.55 * Math.sin(startAngle - halfPetal * 0.5),
        });
        const cpRight = roundPoint({
            x: cx + (innerRadius + outerRadius) * 0.55 * Math.cos(startAngle + halfPetal * 0.5),
            y: cy + (innerRadius + outerRadius) * 0.55 * Math.sin(startAngle + halfPetal * 0.5),
        });
        petalPaths.push(`M ${innerLeft.x} ${innerLeft.y} Q ${cpLeft.x} ${cpLeft.y} ${outerTip.x} ${outerTip.y} Q ${cpRight.x} ${cpRight.y} ${innerRight.x} ${innerRight.y}`);
    }
    return {
        center: roundPoint({ x: cx, y: cy }),
        innerRadius: round(innerRadius),
        outerRadius: round(outerRadius),
        petalCount,
        petalPaths,
    };
}
/**
 * Prepare bhupura (outer square frame with gates) geometry.
 */
export function prepareBhupura(cx, cy, size) {
    const gateWidth = size * 0.06;
    const gateDepth = size * 0.04;
    const layerSizes = [size * 0.48, size * 0.46, size * 0.44];
    const gateHalf = gateWidth / 2;
    const layers = layerSizes.map((half) => {
        const x = round(cx - half);
        const y = round(cy - half);
        const w = round(half * 2);
        const h = round(half * 2);
        const makeGate = (lines) => ({
            lines: lines.map(([a, b]) => [roundPoint(a), roundPoint(b)]),
        });
        const gates = [
            // Top gate
            makeGate([
                [{ x: cx - gateHalf, y: y }, { x: cx - gateHalf, y: y - gateDepth }],
                [{ x: cx + gateHalf, y: y }, { x: cx + gateHalf, y: y - gateDepth }],
                [{ x: cx - gateHalf, y: y - gateDepth }, { x: cx + gateHalf, y: y - gateDepth }],
            ]),
            // Bottom gate
            makeGate([
                [{ x: cx - gateHalf, y: y + h }, { x: cx - gateHalf, y: y + h + gateDepth }],
                [{ x: cx + gateHalf, y: y + h }, { x: cx + gateHalf, y: y + h + gateDepth }],
                [{ x: cx - gateHalf, y: y + h + gateDepth }, { x: cx + gateHalf, y: y + h + gateDepth }],
            ]),
            // Left gate
            makeGate([
                [{ x: x, y: cy - gateHalf }, { x: x - gateDepth, y: cy - gateHalf }],
                [{ x: x, y: cy + gateHalf }, { x: x - gateDepth, y: cy + gateHalf }],
                [{ x: x - gateDepth, y: cy - gateHalf }, { x: x - gateDepth, y: cy + gateHalf }],
            ]),
            // Right gate
            makeGate([
                [{ x: x + w, y: cy - gateHalf }, { x: x + w + gateDepth, y: cy - gateHalf }],
                [{ x: x + w, y: cy + gateHalf }, { x: x + w + gateDepth, y: cy + gateHalf }],
                [{ x: x + w + gateDepth, y: cy - gateHalf }, { x: x + w + gateDepth, y: cy + gateHalf }],
            ]),
        ];
        return { x, y, width: w, height: h, gates };
    });
    return {
        center: roundPoint({ x: cx, y: cy }),
        layers,
    };
}
