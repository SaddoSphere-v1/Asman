# tools

Scripts used to assemble and verify this asset library. They are kept for provenance and so the preview/attribution can be regenerated after edits.

| Script | Purpose | Needs |
|---|---|---|
| `build_assets.py` | Copies the curated files from the download staging tree into `assets/`, writes every `SOURCE.md` and `docs/sources.json`. Paths at the top point at the session's staging directory; the per-folder `SOURCE.md` files record the upstream URLs if you need to re-fetch. | Python 3 |
| `build_preview.py` | Regenerates `preview/index.html` from `docs/sources.json` (image tiles, font specimens, glyph key maps). | Python 3 |
| `build_attribution.py` | Regenerates `docs/ATTRIBUTION.md` from `docs/sources.json`. | Python 3 |
| `normalize_svg.js` | Rewrites an SVG's `viewBox` to its rendered content bounding box (used on the Kibo AstroChart glyphs, which were exported on A4 pages). | Node + Playwright + Chromium |
| `shot.js` | Screenshots every section of the preview page and reports broken images. | Node + Playwright + Chromium |

Fonts were converted from TTF to WOFF2 with `fontTools` (`TTFont(path).flavor = 'woff2'`); NASA/Poly Haven photographs were downscaled with Pillow (max 2048 px, quality 86).
