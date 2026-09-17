#!/usr/bin/env node
/**
 * CLI for generating Sri Yantra SVGs.
 *
 * Usage:
 *   sri-yantra [options]
 *   sri-yantra --minimal [options]
 *
 * Examples:
 *   sri-yantra --output yantra.svg
 *   sri-yantra --minimal --size 64 --output favicon.svg
 *   sri-yantra --color "#1A0F0A" --background "#FDF8F0" --output dark.svg
 *   sri-yantra --shiva-color "#1A0F0A" --shakti-color "#C9501C" --output dual.svg
 *   sri-yantra --filled --output filled.svg
 *   sri-yantra --no-bhupura --no-lotus --output triangles-only.svg
 */
import { writeFileSync } from "node:fs";
import { generateSriYantra, generateMinimalMark } from "./svg/renderer.js";
import { generateAnimatedSriYantra } from "./svg/animated.js";
function printHelp() {
    console.log(`
@vibzart/sri-yantra — Shastra-validated Sri Yantra SVG generator

USAGE
  sri-yantra [options]

OPTIONS
  --output, -o <file>     Output file path (default: stdout)
  --minimal               Generate minimal mark (innermost triangles + bindu)
  --size <px>             Output size in pixels (default: 512)
  --color <hex>           Primary stroke color (default: #C9501C)
  --shiva-color <hex>     Color for upward (Shiva) triangles
  --shakti-color <hex>    Color for downward (Shakti) triangles
  --bindu-color <hex>     Color for the bindu point
  --background <hex>      Background color (default: transparent)
  --stroke-width <n>      Stroke width relative to size (default: 0.004)
  --bindu-radius <n>      Bindu radius relative to size (default: 0.008)
  --filled                Fill triangles with color
  --fill-opacity <n>      Fill opacity 0-1 (default: 0.1)
  --no-bhupura            Omit outer square frame
  --no-lotus              Omit both lotus rings
  --no-circle             Omit outer circle
  --no-bindu              Omit bindu point
  --circle                Add enclosing circle (minimal mark only)
  --animated <preset>     Animation preset: draw|layer-reveal|breathe|rotate
  --duration <s>          Animation duration in seconds (default: 3)
  --help, -h              Show this help

EXAMPLES
  # Full yantra in saffron
  sri-yantra -o sri-yantra.svg

  # Minimal mark for favicon
  sri-yantra --minimal --size 64 -o favicon.svg

  # Dual-color with Shiva in brown, Shakti in saffron
  sri-yantra --shiva-color "#1A0F0A" --shakti-color "#C9501C" -o dual.svg

  # Triangles only (no decorative elements)
  sri-yantra --no-bhupura --no-lotus -o core.svg

  # On cream background
  sri-yantra --background "#FDF8F0" -o on-cream.svg

  # Animated stroke drawing
  sri-yantra --animated draw -o animated.svg

SHASTRA REFERENCE
  Soundarya Lahari, Verse 11 (Adi Shankaracharya, ~8th century CE)
  Sri Vidya Ratna Sutram

  सर्वे भवन्तु सुखिनः — May all beings be happy
`);
}
function parseArgs(args) {
    const parsed = {};
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === "--help" || arg === "-h") {
            parsed["help"] = true;
        }
        else if (arg === "--minimal") {
            parsed["minimal"] = true;
        }
        else if (arg === "--filled") {
            parsed["filled"] = true;
        }
        else if (arg === "--no-bhupura") {
            parsed["no-bhupura"] = true;
        }
        else if (arg === "--no-lotus") {
            parsed["no-lotus"] = true;
        }
        else if (arg === "--no-circle") {
            parsed["no-circle"] = true;
        }
        else if (arg === "--no-bindu") {
            parsed["no-bindu"] = true;
        }
        else if (arg === "--circle") {
            parsed["circle"] = true;
        }
        else if ((arg === "--output" || arg === "-o") &&
            i + 1 < args.length) {
            parsed["output"] = args[++i];
        }
        else if (arg.startsWith("--") && i + 1 < args.length) {
            const key = arg.slice(2);
            parsed[key] = args[++i];
        }
    }
    return parsed;
}
function main() {
    const args = parseArgs(process.argv.slice(2));
    if (args["help"]) {
        printHelp();
        process.exit(0);
    }
    let svg;
    const VALID_PRESETS = ["draw", "layer-reveal", "breathe", "rotate"];
    if (args["animated"]) {
        const preset = args["animated"];
        if (!VALID_PRESETS.includes(preset)) {
            console.error(`Error: Invalid animation preset "${preset}". Use: ${VALID_PRESETS.join(", ")}`);
            process.exit(1);
        }
        svg = generateAnimatedSriYantra({
            animation: preset,
            duration: args["duration"] ? Number(args["duration"]) : undefined,
            size: args["size"] ? Number(args["size"]) : undefined,
            color: args["color"],
            shivaColor: args["shiva-color"],
            shaktiColor: args["shakti-color"],
            binduColor: args["bindu-color"],
            background: args["background"],
            strokeWidth: args["stroke-width"]
                ? Number(args["stroke-width"])
                : undefined,
            binduRadius: args["bindu-radius"]
                ? Number(args["bindu-radius"])
                : undefined,
            outerCircle: args["no-circle"] !== true,
            sixteenPetalLotus: args["no-lotus"] !== true,
            eightPetalLotus: args["no-lotus"] !== true,
            bhupura: args["no-bhupura"] !== true,
            bindu: args["no-bindu"] !== true,
            filled: args["filled"] === true,
            fillOpacity: args["fill-opacity"]
                ? Number(args["fill-opacity"])
                : undefined,
        });
    }
    else if (args["minimal"]) {
        svg = generateMinimalMark({
            size: args["size"] ? Number(args["size"]) : undefined,
            color: args["color"],
            shivaColor: args["shiva-color"],
            shaktiColor: args["shakti-color"],
            binduColor: args["bindu-color"],
            background: args["background"],
            strokeWidth: args["stroke-width"]
                ? Number(args["stroke-width"])
                : undefined,
            binduRadius: args["bindu-radius"]
                ? Number(args["bindu-radius"])
                : undefined,
            enclosingCircle: args["circle"] === true,
            filled: args["filled"] === true,
            fillOpacity: args["fill-opacity"]
                ? Number(args["fill-opacity"])
                : undefined,
        });
    }
    else {
        svg = generateSriYantra({
            size: args["size"] ? Number(args["size"]) : undefined,
            color: args["color"],
            shivaColor: args["shiva-color"],
            shaktiColor: args["shakti-color"],
            binduColor: args["bindu-color"],
            background: args["background"],
            strokeWidth: args["stroke-width"]
                ? Number(args["stroke-width"])
                : undefined,
            binduRadius: args["bindu-radius"]
                ? Number(args["bindu-radius"])
                : undefined,
            outerCircle: args["no-circle"] !== true,
            sixteenPetalLotus: args["no-lotus"] !== true,
            eightPetalLotus: args["no-lotus"] !== true,
            bhupura: args["no-bhupura"] !== true,
            bindu: args["no-bindu"] !== true,
            filled: args["filled"] === true,
            fillOpacity: args["fill-opacity"]
                ? Number(args["fill-opacity"])
                : undefined,
        });
    }
    if (args["output"]) {
        writeFileSync(args["output"], svg, "utf-8");
        console.log(`✓ Written to ${args["output"]}`);
    }
    else {
        process.stdout.write(svg);
    }
}
main();
