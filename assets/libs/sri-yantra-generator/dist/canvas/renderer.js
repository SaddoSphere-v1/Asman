/**
 * Canvas 2D Renderer
 *
 * Zero dependencies — accepts a CanvasRenderingContext2D interface.
 * Works identically with browser canvas, node-canvas, or @napi-rs/canvas.
 */
import { computeGeometry } from "../core/geometry.js";
import { prepareForRender, prepareLotus, prepareBhupura, } from "../core/transform.js";
function drawTriangle(ctx, pathData) {
    const parts = pathData.split(/[MLZC ]+/).filter(Boolean);
    const nums = parts.map(Number);
    ctx.beginPath();
    ctx.moveTo(nums[0], nums[1]);
    ctx.lineTo(nums[2], nums[3]);
    ctx.lineTo(nums[4], nums[5]);
    ctx.closePath();
}
function parsePathCommands(d) {
    const commands = [];
    const re = /([MQLZmlqz])([^MQLZmlqz]*)/g;
    let match;
    while ((match = re.exec(d)) !== null) {
        const cmd = match[1];
        const args = match[2].trim().split(/[\s,]+/).filter(Boolean).map(Number);
        commands.push({ cmd, args });
    }
    return commands;
}
function drawPath(ctx, d) {
    const commands = parsePathCommands(d);
    ctx.beginPath();
    for (const { cmd, args } of commands) {
        switch (cmd) {
            case "M":
                ctx.moveTo(args[0], args[1]);
                break;
            case "L":
                ctx.lineTo(args[0], args[1]);
                break;
            case "Q":
                ctx.quadraticCurveTo(args[0], args[1], args[2], args[3]);
                break;
            case "Z":
                ctx.closePath();
                break;
        }
    }
}
/**
 * Render Sri Yantra to a Canvas 2D context.
 *
 * The function accepts any object matching the Canvas 2D API, making it
 * work across browser, node-canvas, and @napi-rs/canvas.
 */
export function renderToCanvas(ctx, options = {}) {
    const { size = 512, color = "#C9501C", shivaColor, shaktiColor, binduColor, background = "none", strokeWidth = 0.004, binduRadius = 0.008, pixelRatio = 1, outerCircle = true, sixteenPetalLotus = true, eightPetalLotus = true, bhupura = true, bindu = true, filled = false, fillOpacity = 0.1, } = options;
    const geo = computeGeometry();
    const paddingFrac = bhupura ? 0.05 : 0.02;
    const prepared = prepareForRender(geo, { size, padding: paddingFrac, strokeWidth, binduRadius });
    const shivaC = (shivaColor ?? color);
    const shaktiC = (shaktiColor ?? color);
    const binduC = (binduColor ?? color);
    const sw = prepared.strokeWidth;
    const cx = prepared.center.x;
    const cy = prepared.center.y;
    const circleR = prepared.outerCircle.r;
    ctx.save();
    if (pixelRatio !== 1) {
        ctx.scale(pixelRatio, pixelRatio);
    }
    // Background
    if (background !== "none") {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, size, size);
    }
    else {
        ctx.clearRect(0, 0, size, size);
    }
    ctx.lineWidth = sw;
    ctx.lineJoin = "miter";
    // Bhupura
    if (bhupura) {
        const bp = prepareBhupura(cx, cy, size);
        ctx.strokeStyle = color;
        for (const layer of bp.layers) {
            ctx.beginPath();
            ctx.rect(layer.x, layer.y, layer.width, layer.height);
            ctx.stroke();
            for (const gate of layer.gates) {
                for (const [a, b] of gate.lines) {
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
            }
        }
    }
    // Lotuses
    ctx.lineJoin = "round";
    if (sixteenPetalLotus) {
        const lotus16 = prepareLotus(cx, cy, circleR * 1.05, circleR * 1.22, 16);
        ctx.strokeStyle = color;
        for (const d of lotus16.petalPaths) {
            drawPath(ctx, d);
            ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(cx, cy, lotus16.innerRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, lotus16.outerRadius, 0, Math.PI * 2);
        ctx.stroke();
    }
    if (eightPetalLotus) {
        const lotus8 = prepareLotus(cx, cy, circleR * 0.96, circleR * 1.05, 8);
        ctx.strokeStyle = color;
        for (const d of lotus8.petalPaths) {
            drawPath(ctx, d);
            ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(cx, cy, lotus8.innerRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, lotus8.outerRadius, 0, Math.PI * 2);
        ctx.stroke();
    }
    // Outer circle
    if (outerCircle) {
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.arc(cx, cy, circleR, 0, Math.PI * 2);
        ctx.stroke();
    }
    // Triangles
    ctx.lineJoin = "miter";
    for (const tri of prepared.triangles) {
        const triColor = tri.tattva === "shiva" ? shivaC : shaktiC;
        drawTriangle(ctx, tri.pathData);
        if (filled) {
            ctx.globalAlpha = fillOpacity;
            ctx.fillStyle = triColor;
            ctx.fill();
            ctx.globalAlpha = 1;
        }
        ctx.strokeStyle = triColor;
        ctx.stroke();
    }
    // Bindu
    if (bindu) {
        ctx.fillStyle = binduC;
        ctx.beginPath();
        ctx.arc(prepared.bindu.x, prepared.bindu.y, prepared.bindu.radius, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}
