# Jyotiṣa asset catalog — GitHub & open-web excavation (September 2026)

This document records everything found while hunting for visual raw material for a standalone HTML Jyotiṣa application: where it lives, what license it carries, how good it is, and whether it was bundled into `assets/`. It is written so the "gameplan" phase can pick from it without re-doing the search.

**Legend.** *Tier A* = production quality, permissive license, bundled. *Tier B* = good but with a caveat (resolution, share-alike, minimal metadata). *Tier C* = placeholder / reference quality. *Not bundled* = documented only (copyleft, unclear license, or too large); links are given so it can be fetched deliberately.

---

## 1. The shortlist (what to build with)

| Category | Pick | License | Folder |
|---|---|---|---|
| Planet textures (spheres, cards) | Solar System Scope 2K set, all 9 grahas' bodies + Earth/Uranus/Neptune + rings + star fields | CC BY 4.0 | `assets/textures/planets/solar-system-scope-2k` |
| Moon texture | NASA SVS CGI Moon Kit (LRO colour + displacement) | Public domain | `assets/textures/moon/nasa-svs-cgi-moon-kit` |
| Hero photos per graha | NASA Image Library (SDO Sun, LRO Moon, Viking Mars, MESSENGER Mercury, Cassini Jupiter/Saturn, Mariner 10 Venus, eclipse composites for Rahu/Ketu) | Public domain | `assets/photos/nasa-graha-hero-images` |
| All-sky background | ESO Milky Way panorama (S. Brunier) + Poly Haven night HDRIs | CC BY 4.0 / CC0 | `assets/textures/sky/*` |
| Sign + planet glyph SVGs | Zodiac Fonts free tier (55 glyphs, currentColor) | SIL OFL 1.1 | `assets/glyphs/zodiacfonts` |
| 30 tithi Moon renders, rashi constellation icons, North/South chart templates (plus labelled graha icons incl. Rahu/Ketu) | VedAstro SkyChart set | MIT | `assets/glyphs/vedastro` |
| Glyph font for text runs | Astronomicon (Roberto Corona) + Noto Sans Symbols (Unicode fallback) | OFL | `assets/glyphs/astronomicon`, `assets/fonts/symbols` |
| Nakshatra symbols reference | Wellcome "Twenty-Eight Hindoo Lunar Mansions" engraving (Barlow) | Public Domain Mark | `assets/art/wellcome-collection` |
| Navagraha deities, one style | E. A. Rodrigues, *The Complete Hindoo Pantheon* (1842), nine plates | Public domain | `assets/art/rodrigues-1842-navagraha-set` |
| Museum paintings for mood/hero | LACMA Brihaspati, Chamba Rahu, Khara-Khoto Ketu, Poona Surya, Cleveland Navagraha lintel, Prasnapradipa manuscript pages | PD / CC0 | `assets/art/paintings-and-sculpture-commons` |
| Moon phases, animated | Meteocons (4 styles, SMIL/CSS animated) + Weather Icons (28 steps) | MIT / OFL | `assets/icons/moon-phases/*` |
| "Premium" ready-made zodiac art | Microsoft Fluent Emoji 3D renders (zodiac, Sun, Moon faces, Om, Diya, Lotus) | MIT | `assets/emoji/fluent-emoji` |
| UI icon language with zodiac | Tabler Icons (+ MDI, Phosphor, Solar, Lucide, Iconoir, MingCute subsets) | MIT etc. | `assets/icons/*` |
| Devanagari display type | Yatra One, Rozha One, Eczar, Tillana, Modak; text: Tiro Devanagari Sanskrit, Noto Serif/Sans Devanagari, Martel | OFL | `assets/fonts/devanagari/*` |
| Latin "celestial atlas" type | Cinzel / Cinzel Decorative, Cormorant Garamond, IM Fell English, Marcellus | OFL | `assets/fonts/latin-display/*` |
| Sri Yantra | @vibzart/sri-yantra exact-geometry SVGs + generator | MIT | `assets/vedic/sri-yantra`, `assets/libs/sri-yantra-generator` |
| Sky chart engine + data | d3-celestial (stars to mag 6, IAU constellations, Milky Way) + Stellarium Indian nakshatra star lines | BSD-3 / CC BY-SA | `assets/sky-data/*` |
| Wheel/chart renderers | AstroChart (Kibo, MIT, SVG wheel with glyph paths); astrochartjs (MIT, North/South Indian) | MIT | `assets/libs/*` |
| Ephemeris in the browser | Astronomy Engine (MIT, 116 KB, ±1′) — Swiss Ephemeris WASM ports listed in §9 for arc-second needs | MIT | `assets/libs/astronomy-engine` |

Bundle size: 63 MB across 1353 files in 79 source folders, all relative-path, no build step needed.

---

## 2. Planetary imagery

### 2.1 Equirectangular textures

| Source | What | Res. | License | Verdict |
|---|---|---|---|---|
| **Solar System Scope** — solarsystemscope.com/textures, mirrored on Wikimedia Commons *Category:Solar System Scope* (43 files) | Sun, Mercury, Venus (surface + atmosphere), Earth (day, night, clouds, normal, specular), Moon, Mars, Jupiter, Saturn + ring alpha, Uranus, Neptune, star field, Milky Way star field; fictional Ceres/Haumea/Makemake/Eris | 2K bundled; 4K and 8K on Commons (8K Sun/Jupiter/Saturn are 4096 wide) | CC BY 4.0 | **Tier A.** The consistent, colour-matched set every three.js solar-system demo on GitHub uses (e.g. `KyleGough/solar-system`, `ongyishen/SolarSystem`, `homer-jay/solar-system-textures`). The site itself blocks scripted downloads; Commons is the reliable mirror. |
| **NASA-3D-Resources** — github.com/nasa/NASA-3D-Resources, *Images and Textures* | Venus, Earth (A/B), Mars, Jupiter, Saturn, Neptune, Pluto, Moon (+ many moons, no Mercury/Sun/Uranus globe), Tycho / Hipparcos / Yale Bright Star star maps | 720x360 – 2880x1440 JPG, TIFF originals | Public domain (NASA) | **Tier B** for planets (low res), **Tier A** for the three star maps. Attribution-free. |
| **NASA SVS CGI Moon Kit** — svs.gsfc.nasa.gov/4720 | LRO colour map with corrected poles (1K JPG … 27K TIFF), LOLA displacement (4/16/64 px per degree), 8-bit displacement JPG | 2K bundled | Public domain | **Tier A.** Best Moon on the web. |
| Stellarium `textures/` (github.com/Stellarium/stellarium) | planet textures used by Stellarium | various | GPL-2 + mixed per-texture credits | Not bundled; SSS set is better licensed. |
| planetpixelemporium.com (J. Hastings-Trew) | classic planet maps | 1K–8K | free with credit, *non-commercial* for some | Not reachable through the sandbox and license is not fully permissive. Listed for completeness. |
| `KSP-RO/RSS-Textures` | Real Solar System textures (KSP) | 8K | CC BY-NC-SA | Not bundled (NC). |

**Rahu and Ketu** have no physical body. Visual options collected: eclipse photographs (§2.2), the ☊/☋ node glyphs (every glyph set here), Rahu/Ketu deity plates (Rodrigues 1842, Chamba painting, Khara-Khoto Ketu), and the VedAstro `rahu.svg`/`ketu.svg` icons. A procedural "shadow planet" (dark sphere with ring/limb glow over the Milky Way texture) is the obvious build-time option.

### 2.2 Hero photographs (NASA Image and Video Library, public domain)

Bundled at ≤2048 px in `assets/photos/nasa-graha-hero-images` with the NASA IDs in `SOURCE.md`: Sun (SDO AIA full disk, filament), Full Moon (LRO), Mars (Viking global colour, Valles Marineris hemisphere), Mercury (MESSENGER first colour orbit image), Jupiter (Cassini portrait), Venus (Mariner 10, processed), Saturn ("Staring at Saturn", Cassini), Uranus (Voyager 2), Neptune (Voyager 2), Earthrise (LRO), two solar-eclipse composites (SDO/SOHO 2010; 2017 totality). The API (`images-api.nasa.gov/search?q=`) returns `~orig/~large/~medium` variants; one search-result thumbnail turned out to be a black video frame and was discarded after visual inspection.

### 2.3 Sky backgrounds

- ESO Milky Way panorama eso0932a (CC BY 4.0, credit "ESO/S. Brunier"): 4000x2000 and 1280x640 bundled; 6000x3000 TIFF upstream.
- Solar System Scope `2k_stars.jpg` and `2k_stars_milky_way.jpg` (CC BY 4.0) — synthetic, tileable-looking star fields.
- NASA Tycho / Hipparcos / Yale star maps (PD) — real star catalogues rendered equirectangularly; align with d3-celestial coordinates.
- Poly Haven `dikhololo_night`, `moonless_golf` (CC0) — photographic night skies with horizon, downscaled to 4K from 8K tonemapped JPGs; the API (`api.polyhaven.com/files/<id>`) also serves the EXR/HDR at up to 24K.

---

## 3. Astrological glyphs and symbol fonts

| Source | Format | Coverage | License | Bundled |
|---|---|---|---|---|
| **Zodiac Fonts** free tier (zodiacfonts.com; npm `zodiacfonts`) | 55 SVG (currentColor, 512 grid) + WOFF2 icon font + CSS/JS + `glyphs.json` | 12 signs, 11 planets, North/South Node, Lilith, Chiron, 12 houses, ASC/MC, 8 lunar phases, 5 aspects, retrograde | SIL OFL 1.1 | Yes, `glyphs/zodiacfonts` |
| **Astronomicon** (Roberto Corona; shipped in `CruiserOne/Astrolog/font`) | TTF/WOFF2, 192 glyphs on ASCII keys | planets, signs, aspects, asteroids, Uranians, misc. | SIL OFL 1.1 (RFN) | Yes, `glyphs/astronomicon` (key map rendered in the preview) |
| **Astromoony** (RobertWinslow/Astromoony-Font) | TTF (sans + serif) + one SVG per glyph, Unicode code points | Sun, Moon, planets, dwarf planets, moons as ligatures; no signs/nodes | Public domain | Yes, `glyphs/astromoony` |
| **Noto Sans Symbols / Symbols 2** (google/fonts) | WOFF2 (variable) | ♈–♓ ⛎, ☿♀♂♃♄♅♆♇, ☊☋ (nodes), ⚷ ⚸; Symbols 2 adds ☉ and ⯓ | OFL | Yes, `fonts/symbols` |
| **HamburgSymbols** (2005, in Astrolog) | TTF/WOFF2, 226 glyphs on ASCII | planets, signs, aspects, Hamburg-school points | Public domain (embedded notice) | Yes, `glyphs/hamburg-symbols` |
| **StarFont Sans/Serif** (A. I. P. Owen 1993, LaTeX starfont) | TTF | classic glyph set | Public domain (author statement in `StarFont.txt`) | Yes, `glyphs/starfont` |
| **AstroChart (Kibo)** assets | SVG (incl. Hershey single-stroke sets) | planets, signs, nodes, Lilith, Chiron, axis | MIT | Yes, `glyphs/kibo-astrochart-svg` |
| **Wikipedia "fixed width" symbols** (Commons) | SVG, 25 files + two PD glyph sheets | planets, signs, Chiron, Ceres, Earth | CC BY-SA 4.0 (Chiron and sheets PD) | Pending: `glyphs/wikimedia-fixed-width` is added when Wikimedia's file host stops rate-limiting the fetch (URLs: `https://commons.wikimedia.org/wiki/File:<Sign>_symbol_(fixed_width).svg`) |
| **VedAstro SkyChart icons** | SVG (Illustrator exports) | Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, **Rahu, Ketu** (cartoon planets with the English name badge baked in; Rahu/Ketu are recoloured crescents — edit before use), 12 rashi "event" constellation icons, zodiac-360 wheel, **30 tithi Moon renders**, North/South Indian chart source SVGs | MIT | Yes, `glyphs/vedastro` (Tier B) |
| Tabler / MDI / Fluent / Noto / Twemoji / OpenMoji / game-icons zodiac | see §6 and §5 | | | Yes |
| Astro.ttf (Kenneth Hirst / LPS) in Astrolog | TTF | | requires purchase for embedding/commercial | **No** |
| EnigmaAstrology (RadixPro) in Astrolog | TTF | | embedded notice says public domain, RadixPro docs say GPL — conflicting | **No** (documented) |
| **HanksNakshatra.ttf** (Hank Friedman) in Astrolog | TTF, 110 PUA glyphs | pictorial nakshatra symbols (horse head, yoni, razor, cart, deer head, drop, bow, snake, crown, hammock, hand, gem, sprout, arch, lotus, root, basket, tusk, footprints, drum, wheel, flames, dancer…) | **no license file found** | **No** — the only ready-made nakshatra symbol font found; ask the author (learnastrologyfree.com) before use. Raw file: `https://raw.githubusercontent.com/CruiserOne/Astrolog/master/font/HanksNakshatra.ttf` |
| Saravali.ttf (Maitreya 8/9) | TTF, 67 glyphs with named slots (a=Sun … j=Pluto, T=DragonHead, U=DragonTail, A–L signs, 0–= aspects) | | GPL-2 | **No** (documented, key map above) |
| `travisyunis/astrology_icons` | 12 sign SVGs | | GPL-3 | No |
| `Kibo/AstrologyChart2` | JS library | | GPL-3 | No (v1 `Kibo/AstroChart` is MIT and bundled) |
| `g-battaglia/kerykeion` `site/docs/assets/chart-glyphs.svg`, chart templates | SVG/XML | | AGPL-3 | No |
| `AstroDraw/AstroChart` (TypeScript successor of Kibo's lib) | npm | | MIT | Not bundled (needs a build); noted as the maintained line |

**Recommendation:** use Zodiac Fonts SVGs as the primary UI glyph set (consistent stroke, currentColor), Astronomicon for inline text runs, and Noto Sans Symbols as the no-asset fallback; VedAstro's tithi Moons and chart templates are the Vedic-specific pieces worth keeping as-is. Rahu/Ketu convention: ☊ (ascending node) = Rahu, ☋ (descending node) = Ketu; all four glyph sets agree on this.

---

## 4. Vedic-specific visuals

### 4.1 Nakshatras

- **Wellcome Collection V0024916**, *"The Twenty-Eight Hindoo Lunar Mansions"*, engraving by Barlow (Public Domain Mark) — one plate with all 28 nakshatra emblems (incl. Abhijit) drawn as star-dotted pictograms with Devanagari captions. This is the best single reference for designing a nakshatra icon set (trace → SVG). Bundled at 1600 px; full size via IIIF (`https://iiif.wellcomecollection.org/image/V0024916/full/full/0/default.jpg`).
- **Stellarium "Indian (Nakshatras)" sky culture** (CC BY 4.0, Susanne M. Hoffmann): 28 small colour sketches + star anchors + a scholarly paragraph per nakshatra in `description.md`. Low resolution (≈210 px) — Tier C, reference only.
- **Stellarium "Indian Vedic" sky culture** (CC BY-SA 4.0, sanskrit-coders): 49 constellations (12 rāśi, 27 nakṣatra, Saptarṣi, Śiṃśumāra, Triśaṅku…) as HIP star-ID lines with 27 clip-art style illustrations and anchors. Tier C art, Tier A *data* (the only machine-readable nakshatra star-line set found).
- The **stellarium-skycultures** repo variant of the Indian culture (lines only, 28 nakshatras) is bundled as `sky-data/stellarium-nakshatra-lines/indian.index.json`.
- `naturalstupid/PyJHora` ships `src/jhora/images/` with one PNG per nakshatra and rāśi plus festival icons — **AGPL-3 and the README credits "other internet sources"**, so provenance is unclear. Not bundled.
- No permissively-licensed, production-quality *nakshatra icon set* exists on GitHub today. This is the clearest gap (§12).

### 4.2 Navagraha deities

- **Rodrigues 1842 set** (Commons: `File:Surya graha.JPG` … `File:Ketu graha.JPG`): the only stylistically uniform public-domain set of all nine grahas found. Bundled at 1280 px.
- Museum pieces bundled (see per-file license table in `assets/art/paintings-and-sculpture-commons/SOURCE.md`): LACMA *Planetary Deity Brihaspati* (c. 1800), Company-School Bṛhaspati watercolour, *The Planet Rahu and other Astral Figures* (Mahesh of Chamba, c. 1725–50), Hermitage Khara-Khoto *Ketu* (13th c.), Dunhuang *Mercury and Ketu* (10th c.), Raja Ravi Varma *Shani*, Pahari *Brahma/Shani/Yama* (1740, CC0), Poona *Surya* (1800–05), Walters *Mandala of Surya* (Nepal, 16th c., CC0), Chandra (c. 1825), Cleveland *Lintel with the Nine Planets* (7th–8th c., CC0), San Diego *Navagraha* schist (10th c., CC0).
- Wellcome: *Surya driving his chariot* (V0045217), *Chandra on a chariot pulled by two deer* (L0077813), *An astrologer* (L0079468), *Six circular gouache paintings of Hindu gods* (V0047491) — all Public Domain Mark.
- Commons *Category:Navagraha symbols* also holds nine small (300 px) public-domain PNGs of the traditional graha yantra symbols (`Surya symbol.png` … `Ketu symbol.png`) and CC0 photographs of the navagraha idols at Shani Shingnapur; too small/photographic to bundle but linked here for reference: `https://commons.wikimedia.org/wiki/Category:Navagraha_symbols`.
- Wellcome's catalogue API (`api.wellcomecollection.org/catalogue/v2/works?query=`) returned no further planetary-deity paintings for Budha, Shukra, Shani, Rahu, Ketu; the Rodrigues plates cover those.

### 4.3 Manuscripts, horoscopes, texture of authenticity

Cleveland Museum of Art (CC0): two pages of the *Prasnapradipa* (Hindu astrology text, 16th and 18th c.) — excellent for parchment-like panels and marginalia. INHCRF *Horoscope of a Peshwa* (CC0) shows a historical kundali layout. *Brihajjataka* manuscript (Kathmandu, 1399; CC BY-SA 4.0) for Sanskrit texture.

### 4.4 Sacred geometry and religious symbols

- `vibzart/sri-yantra` (MIT): mathematically exact Sri Yantra with 43 triangles; static, dark, filled, minimal and **four animated** SVG variants + an ESM generator (SVG/Canvas/Three.js/React). Tier A.
- `evoluteur/sacred-geometry` (MIT): Vesica Piscis, Seed/Flower of Life, Metatron's Cube, Golden Spiral generator — background patterns. Tier B.
- Om, Diya lamp, Lotus, Hindu temple, Prayer beads, Wheel of Dharma: Fluent Emoji 3D/Color/Flat (MIT), Noto Emoji (image resources Apache 2.0 per its README; the font is OFL), Twemoji (CC BY 4.0), OpenMoji (CC BY-SA); MDI `om`, `meditation`; Phosphor `flower-lotus`, `hands-praying`; game-icons `lotus`, `meditation`, `prayer-beads`.
- Indian ornament/paisley/mandala **vector borders**: no permissively-licensed GitHub set found. Options: generate with the sacred-geometry lib; CC0 clip art on freesvg.org / svgsilh.com (not GitHub, quality uneven); or commission. Flagged in §12.

### 4.5 Chart layouts (North / South Indian, wheel)

- VedAstro `north-chart-source.svg`, `south-chart-source.svg`, `zodiac-360.svg` (MIT) — editable templates.
- `erajasekar/astrochartjs` (MIT) — JS that draws North/South Indian charts with snap.svg; demo bundled.
- `Kibo/AstroChart` (MIT) — zero-dependency SVG wheel; rotate the sign ring by the ayanāṁśa for sidereal use.
- `VicharaVandana/jyotichart` (Python, no license file) and `rahulrai89` gist (Python/svgwrite North Indian chart) — reference only.
- `VedAstro` API renders North/South Indian charts as SVG server-side (MIT) — the whole C# library is a reference implementation of Vedic calculations.
- `PriyankGahtori/hora-prakash` and `jatinsing/jyotish` ("Kundli Studio") appeared in search results but returned 404 at fetch time.
- `RoxyAPI/jyotish-vedic-astrology-app` (Next.js, screenshots only, API-backed) — UI reference, no reusable assets.

---

## 5. Moon phases and panchāṅga UI

| Source | License | What |
|---|---|---|
| **Meteocons** (basmilius/meteocons, npm `@meteocons/svg` + `svg-static`) | MIT | 8 Moon phases, moonrise/moonset, clear-day/night, starry-night, star, falling-stars, sunrise/sunset, horizon, solar-eclipse, sun-hot, 8 time-of-day, compass — each in fill / flat / line / monochrome, **static and animated** (SMIL + CSS, no JS). |
| **Weather Icons** (erikflowers/weather-icons) | OFL 1.1 | 28-step Moon cycle (two drawing styles), sunrise/sunset, solar/lunar eclipse, meteor, 12 clock faces; icon font + SVGs. |
| **VedAstro** `moon-1..30.svg` | MIT | 30 tithi moons (Shukla 1 → Krishna 15). |
| MDI `moon-*` (8), Fluent Emoji Moon phases + faces, Noto/Twemoji 1F311–1F31C | Apache / MIT / CC BY | alternates. |
| Tabler `sunrise`, `sunset`, `clock-*`, `calendar-*` | MIT | panchāṅga chrome. |

---

## 6. Icon systems (subsets bundled)

Tabler (MIT; 12 zodiac + 30 celestial, outline & filled) · Material Design Icons (Pictogrammers/Apache; zodiac 12, moon phases 8, planet, orbit, om, meditation, yin-yang…) · Phosphor (MIT; planet, moon-stars, sun, sparkle, flower-lotus, hands-praying…) · Solar (CC BY 4.0; planets 1–4, black holes, star-fall…) · Lucide (ISC) · Iconoir (MIT) · MingCute (Apache 2.0) · game-icons.net (CC BY 3.0; pictorial zodiac ram/bull/twins…, jupiter, ringed-planet, astrolabe, sundial, lotus). All fetched from the original repos or through the Iconify API with the collection license recorded.

---

## 7. Typography

All from `google/fonts` (OFL), converted to WOFF2 (≈7 MB total). Family → role:

- **Display Devanagari**: Yatra One (brush, temple-signage energy — app title, graha names), Rozha One (high-contrast serif), Eczar (variable 400–800), Tillana (calligraphic), Modak (rounded), Amita, Kalam (handwritten), Teko / Khand (condensed).
- **Text Devanagari**: Tiro Devanagari Sanskrit (scholarly, supports Vedic accents — use for ślokas), Tiro Devanagari Hindi, Noto Serif Devanagari and Noto Sans Devanagari (variable), Martel, Hind, Rajdhani (dense tables), Mukta, Anek Devanagari (variable), Karma, Halant, Laila, Sumana, Kurale, Inknut Antiqua, Rhodium Libre, Vesper Libre.
- **Latin display**: Cinzel / Cinzel Decorative (celestial-atlas capitals), Cormorant Garamond (roman + italic), Marcellus, Philosopher, Uncial Antiqua, IM Fell English (almanac), Playfair Display, Spectral, Almendra.
- **Symbols**: Noto Sans Symbols (variable) + Noto Sans Symbols 2.
- Not bundled: *Samarkan* (Devanagari-flavoured Latin, freeware but no clear license), *Siddhanta* (not free for commercial use), *Shobhika* (OFL, github.com/Sandhi-IITBombay/Shobhika — Vedic accents, fetch if Tiro is insufficient), *Adishila* (free but license text unclear).

---

## 8. Sky and star data

- **d3-celestial** (ofrohn/d3-celestial, BSD-3, v0.7.35): `celestial.min.js` + d3 v3 + projection/zoom libs; data bundled: stars to magnitude 6 (`stars.6.json`), IAU constellation names/lines/bounds/borders, Milky Way outline, planets, asterisms, Messier, star names (incl. Bayer/Flamsteed and proper names for the yogatārās), bright DSOs. Larger catalogues (mag 8 = 5 MB, mag 14 = 15 MB) upstream. Supports ecliptic view, so 27 nakshatra sectors of 13°20′ can be overlaid directly.
- **Stellarium sky cultures**: Indian Vedic (CC BY-SA 4.0) and Indian Nakshatras (CC BY 4.0) index files with HIP-ID star lines; western index for IAU lines + Johan Meuris illustration anchors (Free Art License; illustrations *not* bundled — 88 WebP files in `Stellarium/stellarium-skycultures/western/illustrations`).
- HYG star database (astronexus/HYG-Database, CC BY-SA 2.5) is the upstream of d3-celestial's stars; not bundled.

---

## 9. Computation engines for a standalone HTML app

| Library | License | Notes |
|---|---|---|
| **Astronomy Engine** (cosinekitty/astronomy) — bundled | MIT | 116 KB, no data files, ±1′; Sun/Moon/planets, phases, rise/set, eclipses, `SearchMoonNode`. Sidereal = tropical − ayanāṁśa (Lahiri etc. computed by formula). |
| Swiss Ephemeris WASM ports: `prolaxu/swisseph-wasm`, `u-blusky/sweph-wasm`, `astroahava/astro-sweph` (single ~1.9 MB file), `ptprashanttripathi/sweph-wasm` | AGPL-3 (or Astrodienst commercial license) | arc-second accuracy, all ayanāṁśas, true/mean nodes, houses. Use only if the app can be AGPL or a license is bought. |
| `vedika-io/xalen-ephemeris` | Apache-2.0 | Pure-Rust, Vedic-native (50 ayanāṁśas, nakshatra/pada, panchāṅga transitions, dasha), sub-arc-second vs DE440; WASM bindings exist but npm packages were not yet published — build from source. Best permissive high-precision option. |
| `VedAstro/VedAstro` | MIT | C# library + REST API with 650+ methods (SVG charts, dasha, yogas); reference implementation, not browser-native. |
| `kunjara/jyotish` (PHP) | GPL-2+ | rich reference *data* (nakshatra deities/symbols, tithi/karana/yoga tables) — read, don't copy. |
| `naturalstupid/PyJHora` (AGPL-3), `velteyn/OpenJyotish` (GPL), `robinrodricks/Maitreya9` (GPL-2), `CruiserOne/Astrolog` (project license, copyleft-style) | copyleft | desktop-class feature references (Maitreya: dasha trees, ashtakavarga, shadbala). |
| `0xStarcat/CircularNatalHoroscopeJS` | Unlicense (public domain) | house systems, aspects; tropical. |
| `sanskrit-coders/jyotisha` (Python panchāṅga) | see repo (no license file at the root of the default branch at fetch time) | panchāṅga logic in Python; port candidate. |

---

## 10. Off-GitHub sources used (all scriptable)

Wikimedia Commons API (`commons.wikimedia.org/w/api.php`, needs a User-Agent; `iiurlwidth` gives valid thumbnail URLs; rate-limited: keep ≥5 s between file downloads) · Wellcome Collection catalogue + IIIF (`api.wellcomecollection.org`, `iiif.wellcomecollection.org/image/<id>/full/1600,/0/default.jpg`) · NASA Image Library (`images-api.nasa.gov`) · NASA SVS · ESO image archive (`cdn.eso.org/images/...`) · Poly Haven API · Google Fonts repo (`raw.githubusercontent.com/google/fonts/main/ofl/<family>/`) · Iconify API (`api.iconify.design/<set>/<icon>.svg`, `/collections` for licenses) · npm registry tarballs.

---

## 11. License matrix and obligations

See `docs/ATTRIBUTION.md` for the per-folder table. Summary: 68 folders are permissive or public domain (MIT/ISC/BSD/Apache/OFL/PD/CC0/NASA), 7 are CC BY (credit required: `textures/planets/solar-system-scope-2k`, `textures/sky/eso-milky-way-panorama`, `art/wellcome-collection`, `art/stellarium-skycultures/indian_nakshatras`, `icons/solar`, `icons/game-icons`, `emoji/twemoji`), 4 are CC BY-SA (credit + share-alike on derivative images: `art/paintings-and-sculpture-commons`, `art/stellarium-skycultures/indian`, `sky-data/stellarium-nakshatra-lines`, `emoji/openmoji`), and 0 mixed-license folder carries a per-file table (``). Nothing GPL/AGPL is bundled.

---

## 12. Gaps and recommendations for the gameplan

1. **Nakshatra icon set** — none exists with a clear license. Build one: trace the 28 emblems of the Wellcome Barlow plate into a 24-px stroke style matching Zodiac Fonts, or license HanksNakshatra from Hank Friedman.
2. **Navagraha deity portraits in one modern style** — the 1842 Rodrigues plates are the only uniform PD set; a redraw/illustration pass would make them cohesive with the UI. The museum paintings work well as atmospheric hero backgrounds meanwhile.
3. **Rahu/Ketu textures** — use eclipse photography + node glyphs, or render a procedural shadow planet.
4. **Indian ornament vectors** (borders, paisley, jali) — generate (sacred-geometry lib, SVG patterns) or source CC0 clip art outside GitHub.
5. **Ephemeris precision** — Astronomy Engine is enough for a panchāṅga and D-1; for arc-second sidereal longitudes, divisional charts and exact dasha boundaries plan for `xalen-ephemeris` (Apache) compiled to WASM or Swiss Ephemeris (AGPL/commercial).
6. **Fonts**: pick two Devanagari families (e.g. Yatra One display + Tiro Devanagari Sanskrit text) to keep the bundle small; the rest are in the library for comparison in `preview/index.html`.
7. **Higher resolutions** are one URL away for every texture (4K/8K on Commons for SSS, 16K/27K Moon on SVS, 6000 px ESO panorama); `SOURCE.md` files carry the links.
