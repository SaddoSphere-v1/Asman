# Asman — Jyotiṣa asset library (research branch)

A curated, license-cleared collection of **planetary imagery, astrological glyphs, Vedic art, icons, sky data, fonts and rendering libraries** excavated from GitHub and the open museum/space-agency web, assembled as raw material for a standalone HTML Jyotiṣa application.

- `assets/` — the library, one folder per source. Every folder has a `SOURCE.md` (origin URL, license, credit line, quality tier, file list) and, where needed, the license text.
- `docs/ASSET_CATALOG.md` — the research write-up: what exists, what was picked, what was rejected and why, quality tiers, gaps and recommendations.
- `docs/ATTRIBUTION.md` — attribution obligations per folder (generated from `docs/sources.json`).
- `docs/sources.json` — machine-readable manifest of every folder (path, license, credit, files, bytes).
- `preview/index.html` — contact sheet of every asset with font specimens and glyph key maps. Open it directly in a browser.

## Calculator (`graha-bala.html`)

`graha-bala.html` is a self-contained, offline birth-chart calculator (open the file in a browser). It asks for name, gender, birthday, birthtime and birthplace (resolved by an embedded GeoNames atlas) and prints placements with nakshatras, all upagrahas, the full Shadbala with the separate Sun/Moon rules, Ishta/Kashta phala, Ashtakavarga with both reductions and pindas, and the Deeptadi and Lajjitadi avasthas — outputs only, no interpretation. Lahiri ayanamsa, true Rahu, Swiss Ephemeris (WebAssembly, data files embedded), JHora / B.V. Raman conventions. Source, tests and build in `app/` (see `app/README.md`). The embedded Swiss Ephemeris is AGPL-3.0-or-later.

## Quick orientation

| Need | Go to |
|---|---|
| Planet spheres / planet cards | `assets/textures/planets/solar-system-scope-2k` (CC BY 4.0), `assets/textures/moon/nasa-svs-cgi-moon-kit` (PD) |
| Hero photographs of each graha | `assets/photos/nasa-graha-hero-images` (PD) |
| Sky / starfield backgrounds | `assets/textures/sky/*` (CC BY 4.0, PD, CC0) |
| Planet + sign glyphs (SVG) | `assets/glyphs/zodiacfonts` (OFL), `assets/glyphs/kibo-astrochart-svg` (MIT), `assets/glyphs/vedastro` (MIT, has Rahu/Ketu) |
| Glyph fonts | `assets/glyphs/astronomicon` (OFL), `assets/glyphs/astromoony` (PD), `assets/fonts/symbols/*` (OFL, Unicode) |
| Nakshatra symbols / art | `assets/art/wellcome-collection` (28-mansion plate, PD), `assets/art/stellarium-skycultures/*` (CC BY / CC BY-SA) |
| Navagraha deity imagery | `assets/art/rodrigues-1842-navagraha-set` (PD), `assets/art/paintings-and-sculpture-commons` (PD/CC0/CC BY) |
| Moon phases / tithi | `assets/icons/moon-phases/*` (OFL, MIT), `assets/glyphs/vedastro/moon-*.svg` (MIT) |
| UI icon systems with zodiac | `assets/icons/tabler`, `assets/icons/material-design-icons`, others |
| Devanagari + Latin type | `assets/fonts/devanagari/*`, `assets/fonts/latin-display/*` (all OFL, WOFF2) |
| Sri Yantra, sacred geometry | `assets/vedic/*` (MIT) |
| Star catalogue + constellation lines | `assets/sky-data/d3-celestial` (BSD), `assets/sky-data/stellarium-nakshatra-lines` (CC BY-SA) |
| Chart drawing + ephemeris JS | `assets/libs/*` (MIT) |

## License posture

Only permissive, public-domain or Creative Commons material is bundled. Copyleft candidates (GPL/AGPL fonts, chart libraries and image sets) are documented in the catalog with links but **not** copied. Share-alike items (CC BY-SA) are kept in clearly marked folders. See `docs/ATTRIBUTION.md`.
