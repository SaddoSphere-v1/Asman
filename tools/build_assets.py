#!/usr/bin/env python3
"""Assemble the curated, license-cleared asset library into the Asman repo.
Copies from scratchpad downloads into /home/user/Asman/assets/** and writes a
SOURCE.md per folder plus docs/sources.json. Idempotent (rebuilds assets/).
"""
import os, shutil, glob, json, re, sys
S = '/tmp/claude-0/-home-user-Asman/2f44d9a4-8eb8-5046-a996-0dadfd978ce0/scratchpad'
R = '/home/user/Asman'
A = os.path.join(R, 'assets')
LIC = os.path.join(S, 'dl/licenses')

def rm(p):
    if os.path.isdir(p): shutil.rmtree(p)
rm(A); os.makedirs(A)

entries = []  # for sources.json

def add(dest, title, origin, license, license_url, credit, files, notes='', tier='A', license_files=(), per_file=None):
    """files: list of (src, dstname). license_files: list of (src, dstname)."""
    d = os.path.join(A, dest); os.makedirs(d, exist_ok=True)
    copied = []
    for src, name in files:
        if not os.path.exists(src):
            print('  MISSING', src); continue
        dst = os.path.join(d, name); os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy2(src, dst); copied.append(name)
    for src, name in license_files:
        if os.path.exists(src): shutil.copy2(src, os.path.join(d, name))
        else: print('  MISSING LICENSE', src)
    if not copied:
        shutil.rmtree(d, ignore_errors=True); print(f'{dest}: SKIPPED (no files available)'); return
    size = sum(os.path.getsize(os.path.join(d, f)) for f in copied)
    with open(os.path.join(d, 'SOURCE.md'), 'w') as fh:
        fh.write(f'# {title}\n\n')
        fh.write(f'- **Source:** {origin}\n- **License:** {license}' + (f' ({license_url})' if license_url else '') + '\n')
        fh.write(f'- **Attribution / credit line:** {credit}\n')
        fh.write(f'- **Quality tier:** {tier}\n')
        if notes: fh.write(f'\n{notes}\n')
        if per_file:
            fh.write('\n## Files\n\n| File | Origin / notes | License |\n|---|---|---|\n')
            for f in copied:
                info = per_file.get(f, ('', license))
                fh.write(f'| `{f}` | {info[0]} | {info[1]} |\n')
        else:
            fh.write('\n## Files\n\n' + '\n'.join(f'- `{f}`' for f in copied) + '\n')
    entries.append(dict(path='assets/' + dest, title=title, source=origin, license=license, license_url=license_url,
                        credit=credit, tier=tier, files=copied, bytes=size, notes=notes))
    print(f'{dest}: {len(copied)} files, {size/1024:.0f} KB')

def globs(pattern, rename=None):
    out = []
    for p in sorted(glob.glob(pattern)):
        n = os.path.basename(p)
        out.append((p, rename(n) if rename else n))
    return out

# ---------------------------------------------------------------- textures
add('textures/planets/solar-system-scope-2k', 'Solar System Scope planet textures (2K, equirectangular)',
    'https://www.solarsystemscope.com/textures/ (mirrored on Wikimedia Commons, Category:Solar System Scope)',
    'CC BY 4.0', 'https://creativecommons.org/licenses/by/4.0/',
    'Textures by Solar System Scope (solarsystemscope.com), based on NASA imagery, CC BY 4.0',
    globs(f'{S}/dl/textures/sss2k/2k_*'),
    notes='2048x1024 equirectangular maps for three.js/WebGL spheres or flat "planet cards". 4K/8K versions exist upstream (see docs/ASSET_CATALOG.md). `2k_saturn_ring_alpha.png` is the ring strip (2048x125, alpha).',
    license_files=[(f'{LIC}/cc-by-4.0.txt', 'LICENSE-CC-BY-4.0.txt')])

add('textures/planets/nasa-3d-resources', 'NASA 3D Resources planet maps',
    'https://github.com/nasa/NASA-3D-Resources ("Images and Textures")',
    'Public domain / NASA media usage guidelines (no attribution required, NASA logo rules apply)', 'https://www.nasa.gov/nasa-brand-center/images-and-media',
    'NASA / JPL-Caltech',
    [(f'{S}/dl/textures/nasa3d/{n}.jpg', f'nasa_{n}.jpg') for n in ['jupiter','saturn','neptune','pluto','venus','mars']],
    notes='Lower resolution than the Solar System Scope set (720x360 to 1440x720) but public domain, useful when attribution-free assets are required. TIFF originals exist upstream.',
    tier='B', license_files=[(f'{LIC}/nasa-3d-resources-README', 'README-upstream.md')])

add('textures/moon/nasa-svs-cgi-moon-kit', 'NASA SVS CGI Moon Kit (LRO colour map + displacement)',
    'https://svs.gsfc.nasa.gov/4720', 'Public domain (NASA)', 'https://svs.gsfc.nasa.gov/4720',
    "NASA's Scientific Visualization Studio (Ernie Wright); LRO LROC WAC / LOLA data",
    [(f'{S}/dl/textures/svs-moon/lroc_color_2k.jpg', 'lroc_color_2k.jpg'),
     (f'{S}/dl/textures/svs-moon/lroc_color_poles_1k.jpg', 'lroc_color_poles_1k.jpg'),
     (f'{S}/dl/textures/svs-moon/ldem_3_8bit.jpg', 'ldem_3_8bit_displacement.jpg')],
    notes='The definitive Moon (Chandra) texture. 4K/8K/16K TIFF colour maps and 16-bit displacement maps are available at the SVS page for high-end rendering.')

add('textures/sky/eso-milky-way-panorama', 'ESO Milky Way 360 panorama (Serge Brunier)',
    'https://www.eso.org/public/images/eso0932a/', 'CC BY 4.0', 'https://creativecommons.org/licenses/by/4.0/',
    'ESO/S. Brunier',
    [(f'{S}/dl/textures/eso/eso0932a_milky_way_panorama_publication.jpg', 'eso0932a_milky_way_4000x2000.jpg'),
     (f'{S}/dl/textures/eso/eso0932a_milky_way_panorama_screen.jpg', 'eso0932a_milky_way_1280x640.jpg')],
    notes='Equirectangular all-sky photograph; ideal as a sky-sphere or hero background. Original 6000x3000 TIFF upstream.',
    license_files=[(f'{LIC}/cc-by-4.0.txt', 'LICENSE-CC-BY-4.0.txt')])

add('textures/sky/nasa-star-maps', 'NASA 3D Resources star maps (Tycho, Hipparcos, Yale Bright Star)',
    'https://github.com/nasa/NASA-3D-Resources ("Images and Textures")', 'Public domain (NASA)', 'https://www.nasa.gov/nasa-brand-center/images-and-media',
    'NASA / Goddard Space Flight Center Scientific Visualization Studio',
    [(f'{S}/dl/textures/nasa3d/tycho_star_map.jpg', 'tycho_star_map_2880x1440.jpg'),
     (f'{S}/dl/textures/nasa3d/yale_bright_star_map.jpg', 'yale_bright_star_map_2880x1440.jpg'),
     (f'{S}/dl/textures/nasa3d/hipparcos_star_map.jpg', 'hipparcos_star_map_2880x1440.jpg')],
    notes='Equirectangular star-field maps (celestial coordinates) for sky spheres and dark backgrounds.')

add('textures/sky/polyhaven-night-skies', 'Poly Haven night-sky HDRI (tonemapped JPG, downscaled to 4K)',
    'https://polyhaven.com/hdris (dikhololo_night, moonless_golf)', 'CC0 1.0', 'https://creativecommons.org/publicdomain/zero/1.0/',
    'Poly Haven (Greg Zaal et al.), CC0',
    globs(f'{S}/dl/polyhaven/*.jpg'),
    notes='Real night-sky panoramas with Milky Way and horizon; equirectangular 4096x2048. Full HDR (up to 24K EXR) upstream.',
    license_files=[(f'{LIC}/cc0-1.0.txt', 'LICENSE-CC0-1.0.txt')])

# ---------------------------------------------------------------- photos
nasa_meta = {}
for line in open(f'{S}/probes/nasa_photo_meta.tsv'):
    p = line.rstrip('\n').split('\t')
    if len(p) >= 4: nasa_meta[p[0]] = p
photo_files = globs(f'{S}/dl/nasa-photos/*.jpg')
per = {}
for _, n in photo_files:
    nid = re.sub(r'^.*?_(PIA\d+|e\d+|AFRC)$', r'\1', n[:-4])
    key = next((k for k in nasa_meta if k.endswith(nid) or nid in k), None)
    if n.startswith('eclipse_2017'): key = 'AFRC2017-0233-009'
    m = nasa_meta.get(key)
    per[n] = ((f'{m[1]} ({m[0]}, {m[2]}, {m[3]})' if m else key or ''), 'Public domain (NASA)')
add('photos/nasa-graha-hero-images', 'NASA hero photographs of the grahas (Sun, Moon, planets, eclipses)',
    'https://images.nasa.gov (NASA Image and Video Library)', 'Public domain (NASA)', 'https://www.nasa.gov/nasa-brand-center/images-and-media',
    'NASA / JPL-Caltech / GSFC / SDO / Cassini / Voyager / MESSENGER / Mariner teams',
    photo_files, per_file=per,
    notes='One iconic photograph per graha for splash/hero panels: Surya (SDO), Chandra (LRO full moon), Mangala (Viking, Valles Marineris), Budha (MESSENGER), Guru (Cassini), Shukra (Mariner 10), Shani (Cassini), Rahu/Ketu (eclipse composites), plus Uranus, Neptune and Earthrise. Downscaled to max 2048px; originals via images.nasa.gov.')

# ---------------------------------------------------------------- art
pj = json.load(open(f'{S}/probes/commons_paintings_1280.json')) if os.path.exists(f'{S}/probes/commons_paintings_1280.json') else {'query': {'pages': {}}}
meta_by_title = {}
for pg in pj['query']['pages'].values():
    ii = (pg.get('imageinfo') or [{}])[0]; em = ii.get('extmetadata', {})
    clean = lambda s: re.sub(r'<[^>]+>', '', s or '').strip()
    meta_by_title[pg['title']] = dict(license=clean(em.get('LicenseShortName', {}).get('value', '')),
                                      artist=clean(em.get('Artist', {}).get('value', ''))[:80],
                                      date=clean(em.get('DateTimeOriginal', {}).get('value', ''))[:40],
                                      credit=clean(em.get('Credit', {}).get('value', ''))[:80],
                                      url=ii.get('descriptionurl', ''))
name_map = {
 'surya_poona_1800.jpg': 'File:Surya Poona painting 1800-05.jpg', 'surya_mandala_nepal_walters_16c.jpg': 'File:Nepalese - Mandala of Surya, the Sun God - Walters F195.jpg',
 'chandra_c1825.jpg': 'File:Chandra Vishnu.jpg', 'brihaspati_lacma_c1800.jpg': 'File:The Planetary Deity Brihaspati (Jupiter) LACMA M.79.191.8.jpg',
 'brihaspati_company_school_19c.jpg': 'File:Watercolour painting on paper of Bṛhaspati, a Vedic deity holding a lotus flower.jpg',
 'shani_raja_ravi_varma.jpg': 'File:Shani Deva.jpg', 'shani_pahari_chamba_1740.jpg': 'File:Brahma on Hamsa, Shani on vulture, and Yama on buffalo, Pahari school, Chamba style chitra 1740 CE.jpg',
 'rahu_astral_figures_chamba_c1740.jpg': 'File:The Planet Rahu and other Astral Figures.jpg', 'ketu_khara_khoto_13c_hermitage.jpg': 'File:Hermitage Museum XX-2455 Ketu Planet.jpg',
 'budha_and_ketu_dunhuang_10c.jpg': 'File:Mercury and Ketu from Dunhuang painting.jpg',
 'navagraha_lintel_7c_cleveland.jpg': 'File:India, central India, 7th - 8th century - Lintel with the Nine Planets- Navagrahas - 1971.61 - Cleveland Museum of Art.jpg',
 'navagraha_schist_bihar_10c_sandiego.jpg': 'File:Navagraha (anthropomorphic forms of astronomical bodies), Bihar, India, 10th century AD, schist - San Diego Museum of Art - DSC06389.JPG',
 'prasnapradipa_16c_cleveland.jpg': 'File:Western India, 16th century - Page from the Prasnapradipa, a Hindu Astrology Text - 1933.500.1 - Cleveland Museum of Art.jpg',
 'prasnapradipa_18c_cleveland.jpg': 'File:Western India, 18th century - Page from the Prasnapradipa, a Hindu Astrology Text - 1933.503 - Cleveland Museum of Art.jpg',
 'horoscope_of_a_peshwa_19c.jpg': 'File:Horoscope of a Peshwa, circa 19th century CE, INHCRF Collections, Nashik, Maharashtra.jpg',
 'brihajjataka_manuscript_1399.jpg': "File:Varahamihira's Brihajjataka, Sanskrit, Nepalaksara script, manuscript copied in 1399 CE, Kathmandu.jpg",
 '01_surya_graha_rodrigues_1842.jpg': 'File:Surya graha.JPG', '02_chandra_graha_rodrigues_1842.jpg': 'File:Chandra graha.JPG', '03_mangala_angraka_graha_rodrigues_1842.jpg': 'File:Angraka graha.JPG',
 '04_budha_graha_rodrigues_1842.jpg': 'File:Budha graha.JPG', '05_brihaspati_graha_rodrigues_1842.jpg': 'File:Brihaspati graha.JPG', '06_shukra_graha_rodrigues_1842.jpg': 'File:Shukra graha.JPG',
 '07_shani_graha_rodrigues_1842.jpg': 'File:Shani graha.JPG', '08_rahu_graha_rodrigues_1842.jpg': 'File:Rahu graha.JPG', '09_ketu_graha_rodrigues_1842.jpg': 'File:Ketu graha.JPG'}
def per_commons(files):
    out = {}
    for _, n in files:
        m = meta_by_title.get(name_map.get(n, ''), {})
        out[n] = (f"{name_map.get(n,'')} — {m.get('artist','')} {m.get('date','')} — {m.get('url','')}".strip(), m.get('license', '?'))
    return out
pf = [f for f in globs(f'{S}/dl/paintings/*.jpg') if not f[1].startswith('wellcome_')]
add('art/paintings-and-sculpture-commons', 'Navagraha paintings, manuscripts and sculpture (Wikimedia Commons, museum releases)',
    'https://commons.wikimedia.org (Cleveland Museum of Art CC0, LACMA PD, Walters CC0, Hermitage PD, Wellcome CC BY, private CC0 uploads)',
    'Mixed: Public domain / CC0 / CC BY 4.0 / CC BY-SA 4.0 — see per-file table', '',
    'Per file; see table (museum credit lines in the Commons file pages)',
    pf, per_file=per_commons(pf), tier='A',
    notes='Museum-quality source imagery for graha portraits, backgrounds and "authentic" texture (manuscript pages of the Prasnapradipa, a Brihajjataka manuscript, a Peshwa horoscope). Downloaded at 1280px; originals up to 6000px on Commons.',
    license_files=[(f'{LIC}/cc0-1.0.txt', 'LICENSE-CC0-1.0.txt'), (f'{LIC}/cc-by-4.0.txt', 'LICENSE-CC-BY-4.0.txt'), (f'{LIC}/cc-by-sa-4.0.txt', 'LICENSE-CC-BY-SA-4.0.txt')])
rf = globs(f'{S}/dl/paintings/rodrigues1842/*.jpg')
add('art/rodrigues-1842-navagraha-set', 'E. A. Rodrigues, "The Complete Hindoo Pantheon" (1842) — the nine grahas, one plate each',
    'https://commons.wikimedia.org (File:Surya graha.JPG … File:Ketu graha.JPG)', 'Public domain (author died 1800s; published 1842)', 'https://commons.wikimedia.org/wiki/Category:Navagraha',
    'E. A. Rodrigues, The Complete Hindoo Pantheon, 1842 (public domain), via Wikimedia Commons',
    rf, per_file=per_commons(rf),
    notes='The only stylistically consistent public-domain set of all nine graha deities found on the open web: Surya, Chandra, Mangala (Angaraka), Budha, Brihaspati, Shukra, Shani, Rahu, Ketu. Hand-coloured lithographs, suitable for graha cards after background clean-up.')
wf = globs(f'{S}/dl/paintings/wellcome_*.jpg')
add('art/wellcome-collection', 'Wellcome Collection Indian astrological prints and paintings',
    'https://wellcomecollection.org (IIIF image API)', 'Public Domain Mark / CC BY 4.0 (Wellcome Collection)', 'https://wellcomecollection.org/works',
    'Wellcome Collection (V0024916, V0045217, L0077813, L0079468, V0047491)',
    wf, per_file={
      'wellcome_hindu_zodiac_barlow.jpg': ('"The Twenty-Eight Hindoo Lunar Mansions" — Astrology: the Hindu zodiac. Engraving by Barlow (V0024916): all 28 nakshatra symbols with Devanagari names, one plate', 'Public Domain Mark'),
      'wellcome_surya_chariot.jpg': ('Surya the sun deity driving in his chariot. Gouache drawing (V0045217)', 'Public Domain Mark'),
      'wellcome_chandra_deer_chariot.jpg': ('Chandra, the moon god, riding on a chariot pulled by two deer. Gouache painting by an Indian artist (L0077813)', 'Public Domain Mark'),
      'wellcome_astrologer_1825.jpg': ('An astrologer. Watercolour by an Indian artist, ca. 1825 (L0079468)', 'Public Domain Mark'),
      'wellcome_six_hindu_gods.jpg': ('Six circular gouache paintings of Hindu gods, 19th century (V0047491)', 'Public Domain Mark / CC BY 4.0')},
    notes='The Barlow engraving is the single best "nakshatra symbol" reference plate found: 28 lunar mansions incl. Abhijit, each with its emblem and Devanagari label. Fetched at 1600px via IIIF; full resolution via https://iiif.wellcomecollection.org/image/<id>/full/full/0/default.jpg')

add('art/stellarium-skycultures/indian', 'Stellarium "Indian Vedic" sky culture (rashi + nakshatra constellations with illustrations)',
    'https://github.com/Stellarium/stellarium/tree/master/skycultures/indian', 'CC BY-SA 4.0 (as declared in description.md)', 'https://creativecommons.org/licenses/by-sa/4.0/',
    'Tanmoy Saha, Vishvas Vasuki and the sanskrit-coders community; re-worked by Susanne M. Hoffmann (Stellarium)',
    globs(f'{S}/dl/stellarium/indian/*.png', lambda n: 'illustrations/' + n) + [(f'{S}/dl/stellarium/indian/index.json', 'index.json'), (f'{S}/dl/stellarium/indian/description.md', 'description.md')],
    tier='C', notes='index.json holds 49 constellations (12 rashi, 27 nakshatra, extras) as HIP star-ID line lists plus image anchors (star → pixel) so each illustration can be placed on a star map. Illustrations are simple clip-art style; treat as placeholders or trace them into a house style.',
    license_files=[(f'{LIC}/cc-by-sa-4.0.txt', 'LICENSE-CC-BY-SA-4.0.txt')])
add('art/stellarium-skycultures/indian_nakshatras', 'Stellarium "Indian (Nakshatras)" sky culture — 28 nakshatra sketches',
    'https://github.com/Stellarium/stellarium/tree/master/skycultures/indian_nakshatras', 'CC BY 4.0 (as declared in description.md)', 'https://creativecommons.org/licenses/by/4.0/',
    'Susanne M. Hoffmann (with B. S. Shylaja), Stellarium',
    globs(f'{S}/dl/stellarium/indian_nakshatras/*.png', lambda n: 'illustrations/' + n) + [(f'{S}/dl/stellarium/indian_nakshatras/index.json', 'index.json'), (f'{S}/dl/stellarium/indian_nakshatras/description.md', 'description.md')],
    tier='C', notes='One small (about 210px) coloured sketch per nakshatra (1 Ashvini … 27 Revati + 28 Abhijit) with star anchors in index.json; description.md contains a short, scholarly text for every nakshatra. Low resolution: use for reference or as a base for redrawing.',
    license_files=[(f'{LIC}/cc-by-4.0.txt', 'LICENSE-CC-BY-4.0.txt')])

# ---------------------------------------------------------------- sky data
add('sky-data/d3-celestial', 'd3-celestial star map library + sky data (stars to mag 6, constellations, Milky Way, planets)',
    'https://github.com/ofrohn/d3-celestial (v0.7.35)', 'BSD-3-Clause', 'https://opensource.org/licenses/BSD-3-Clause',
    'Olaf Frohn, d3-celestial (BSD-3-Clause); data derived from HYG, Stellarium and IAU sources (see data/readme.md)',
    [(f'{S}/src/d3-celestial/celestial.min.js', 'celestial.min.js'), (f'{S}/src/d3-celestial/celestial.js', 'celestial.js'), (f'{S}/src/d3-celestial/celestial.css', 'celestial.css'),
     (f'{S}/src/d3-celestial/lib/d3.min.js', 'lib/d3.min.js'), (f'{S}/src/d3-celestial/lib/d3.geo.projection.min.js', 'lib/d3.geo.projection.min.js'), (f'{S}/src/d3-celestial/lib/d3.geo.zoom.js', 'lib/d3.geo.zoom.js'), (f'{S}/src/d3-celestial/lib/topojson.min.js', 'lib/topojson.min.js'),
     (f'{S}/src/d3-celestial/readme.md', 'README-upstream.md'), (f'{S}/src/d3-celestial/demo/sky.html', 'demo/sky.html'), (f'{S}/src/d3-celestial/demo/map.html', 'demo/map.html')] +
    [(f'{S}/src/d3-celestial/data/{n}', f'data/{n}') for n in ['stars.6.json','constellations.json','constellations.lines.json','constellations.bounds.json','constellations.borders.json','mw.json','planets.json','asterisms.json','messier.json','starnames.json','dsos.bright.json','readme.md']],
    notes='Everything needed for an in-browser sky chart: ecliptic/equatorial grids, zodiac band, Milky Way outline, 27 nakshatra boundaries can be drawn as 13°20′ ecliptic sectors on top. stars.8.json (5 MB) and stars.14.json (15 MB) are upstream if deeper zoom is needed.',
    license_files=[(f'{S}/src/d3-celestial/LICENSE', 'LICENSE')])
add('sky-data/stellarium-nakshatra-lines', 'Stellarium sky-cultures repo: nakshatra star-line data (28 nakshatras as HIP IDs)',
    'https://github.com/Stellarium/stellarium-skycultures/tree/master/indian', 'CC BY-SA (as declared in description.md)', 'https://creativecommons.org/licenses/by-sa/4.0/',
    'Tanmoy Saha, Vishvas Vasuki, sanskrit-coders community; Susanne M. Hoffmann (Stellarium)',
    [(f'{S}/probes/indian_index.json', 'indian.index.json'), (f'{S}/probes/western_index.json', 'western.index.json')],
    notes='Lines-only variant (no images) of the Indian sky culture; western.index.json included for the IAU constellation lines + image anchors (Johan Meuris art, Free Art License, not bundled).')

# ---------------------------------------------------------------- glyphs
add('glyphs/zodiacfonts', 'Zodiac Fonts — free tier (55 astrological SVG glyphs + WOFF2 icon font)',
    'https://www.zodiacfonts.com / npm zodiacfonts@1.1.1', 'SIL OFL 1.1', 'https://scripts.sil.org/OFL',
    'Zodiac Fonts (zodiacfonts.com), SIL OFL 1.1',
    [(p, os.path.relpath(p, f'{S}/npm/zodiacfonts/package')) for p in glob.glob(f'{S}/npm/zodiacfonts/package/**/*', recursive=True) if os.path.isfile(p)],
    notes='Clean currentColor SVGs: 12 signs, 11 planets, North/South Node (Rahu/Ketu), Lilith, Chiron, 12 houses + ASC/MC, 8 lunar phases, 5 major aspects, retrograde. Also shipped as a PUA icon font (see glyphs.json for code points).')
add('glyphs/astromoony', 'Astromoony — astronomical symbol font with per-glyph SVG sources',
    'https://github.com/RobertWinslow/Astromoony-Font', 'Public domain (per README)', 'https://github.com/RobertWinslow/Astromoony-Font#license',
    'Robert Martin Winslow, Astromoony (public domain)',
    [(f'{S}/src/astromoony/sans-serif/AstromoonySans.ttf', 'AstromoonySans.ttf'), (f'{S}/src/astromoony/quivira-serif/AstromoonySerif.ttf', 'AstromoonySerif.ttf'), (f'{S}/src/astromoony/README.md', 'README-upstream.md')] +
    globs(f'{S}/src/astromoony/sans-serif/svg/*.svg', lambda n: 'svg/' + n),
    notes='Maps real Unicode code points (U+2609 Sun, U+263D Moon, U+263F–2647 planets, U+2BD3 Pluto alt…). SVG files are named by code point. No zodiac signs or nodes; pair with Noto Sans Symbols for those.')
add('glyphs/astronomicon', 'Astronomicon astrological font (Roberto Corona)',
    'https://astronomicon.co (bundled with Astrolog: https://github.com/CruiserOne/Astrolog/tree/master/font)', 'SIL OFL 1.1 (Reserved Font Name "Astronomicon")', 'https://scripts.sil.org/OFL',
    'Astronomicon by Roberto Corona, SIL OFL 1.1',
    [(f'{S}/dl/astrolog-fonts/Astronomicon.ttf', 'Astronomicon.ttf'), (f'{S}/dl/astrolog-fonts/Astronomicon.woff2', 'Astronomicon.woff2')],
    notes='192 glyphs mapped onto ASCII letters/digits (planets, signs, aspects, asteroids, Uranian points). Open preview/index.html to see the key map rendered; the font is designed to blend with modern UI type.',
    license_files=[(f'{S}/dl/astrolog-fonts/Astronomicon-OFL-License.txt', 'OFL.txt'), (f'{S}/dl/astrolog-fonts/Astronomicon-OFL-FAQ.txt', 'OFL-FAQ.txt')])
add('glyphs/hamburg-symbols', 'HamburgSymbols astrological font (Uranian / general glyphs)',
    'https://github.com/CruiserOne/Astrolog/tree/master/font', 'Public domain (embedded font notice: "HamburgSymbols is Public Domain (2005)")', '',
    'HamburgSymbols (public domain, 2005)',
    [(f'{S}/dl/astrolog-fonts/HamburgSymbols.ttf', 'HamburgSymbols.ttf'), (f'{S}/dl/astrolog-fonts/HamburgSymbols.woff2', 'HamburgSymbols.woff2')],
    tier='B', notes='226 glyphs on ASCII positions; includes planets, signs, aspects and the eight Hamburg-school hypothetical planets.')
add('glyphs/starfont', 'StarFont Sans / Serif astrological fonts (Anthony I. P. Owen)',
    'https://github.com/CruiserOne/Astrolog/tree/master/font (LaTeX starfont package)', 'Public domain (released by the author, see StarFont.txt)', '',
    'StarFont by Anthony I. P. Owen, packaged by Matthew Skala (public domain)',
    [(f'{S}/dl/astrolog-fonts/StarFontSans.ttf', 'StarFontSans.ttf'), (f'{S}/dl/astrolog-fonts/StarFontSerif.ttf', 'StarFontSerif.ttf'), (f'{S}/dl/astrolog-fonts/StarFont.txt', 'StarFont-license.txt')],
    tier='B', notes='Classic 1993 astrological glyph fonts in two styles; the name table is minimal so some tools show no family name.')
add('glyphs/kibo-astrochart-svg', 'AstroChart (Kibo) glyph SVGs incl. Hershey stroke sets',
    'https://github.com/Kibo/AstroChart/tree/master/assets', 'MIT', 'https://opensource.org/licenses/MIT',
    'Matheus Alves (Kibo), AstroChart, MIT',
    [(f'{S}/dl/kibo-normalized/{n}', n) for n in ['Sun.svg','Moon.svg','Mercury.svg','Venus.svg','Mars.svg','Jupiter.svg','Saturn.svg','Uranus.svg','Neptune.svg','Pluto.svg','Northnode.svg','Lilith.svg','Chiron.svg','Aries.svg','Taurus.svg','Gemini.svg','Cancer.svg','Leo.svg','Virgo.svg','Libra.svg','Scorpio.svg','Sagittarius.svg','Capricorn.svg','Aquarius.svg','Pisces.svg','Astro_signs.svg','axis.svg','signs-hershey.svg','points-hershey.svg','numbers-hershey.svg']],
    notes='Single-stroke (Hershey) glyphs are perfect for plotter-style / engraved looks and animate well with stroke-dashoffset. The upstream files are Inkscape A4 pages with the glyph drawn small; here the root viewBox was rewritten to the content bounding box (path geometry untouched) so they display at full size.',
    license_files=[(f'{S}/src/astrochart/LICENSE', 'LICENSE')])
gc = globs(f'{S}/dl/glyphs-commons/*.svg')
add('glyphs/wikimedia-fixed-width', 'Wikipedia "fixed width" astrological symbol SVGs (planets, signs) + public-domain glyph sheets',
    'https://commons.wikimedia.org (File:<Name> symbol (fixed width).svg; File:Astrological Glyphs.svg; File:Astrological glyphs of planets.svg)',
    'CC BY-SA 4.0 for the fixed-width set (Chiron: public domain); glyph sheets: public domain', 'https://creativecommons.org/licenses/by-sa/4.0/',
    'Wikimedia Commons contributors (fixed-width symbol set, CC BY-SA 4.0)', gc,
    per_file={n: ('Public domain' if 'Chiron' in n or 'Glyphs' in n or 'glyphs' in n else 'Wikipedia astrological symbol set', 'Public domain' if ('Chiron' in n or 'Glyphs' in n or 'glyphs' in n) else 'CC BY-SA 4.0') for _, n in gc},
    tier='B', notes='The canonical encyclopaedic glyph shapes; share-alike applies to the fixed-width set.',
    license_files=[(f'{LIC}/cc-by-sa-4.0.txt', 'LICENSE-CC-BY-SA-4.0.txt')])
vf = [x for x in globs(f'{S}/dl/vedastro/*.svg') if x[1] != 'house-icon.svg'] + globs(f'{S}/dl/vedastro/*.png')
add('glyphs/vedastro', 'VedAstro UI icons: 9 graha icons, 30 tithi Moon phases, 12 rashi event icons, zodiac wheel',
    'https://github.com/VedAstro/VedAstro (Website/wwwroot/images/SkyChart, Others/VedicCharts)', 'MIT', 'https://opensource.org/licenses/MIT',
    'VedAstro (vedastro.org), MIT',
    vf, tier='B', notes='The only MIT-licensed set found with explicit Rahu and Ketu icons. Caveat: the nine graha icons are cartoon planets with the English name badge baked into the SVG ("JUPITER", "KETU"…) and Rahu/Ketu are recoloured crescents, so they need editing before production use. Strong parts: moon-1.svg … moon-30.svg are photographic-style Moon renders for the 30 tithis (Shukla 1 → Krishna 15); the 12 rashi "event" icons are constellation stick-figures; zodiac-360.svg is a full zodiac wheel; north-chart-source.svg / south-chart-source.svg are editable North- and South-Indian chart templates.',
    license_files=[(f'{LIC}/vedastro-LICENSE', 'LICENSE.md')])

# ---------------------------------------------------------------- icons
tab_out = ['zodiac-aries','zodiac-taurus','zodiac-gemini','zodiac-cancer','zodiac-leo','zodiac-virgo','zodiac-libra','zodiac-scorpio','zodiac-sagittarius','zodiac-capricorn','zodiac-aquarius','zodiac-pisces','planet','moon','moon-2','moon-stars','sun','sun-high','sun-low','sun-moon','sunrise','sunset','sunset-2','star','stars','sparkles','sparkles-2','galaxy','comet','meteor','telescope','universe','satellite','rocket','compass','calendar','calendar-star','clock','clock-star','ufo']
tab_fill = ['moon','sun','star','stars','sparkles','meteor','ufo','sunrise','sunset','compass']
add('icons/tabler', 'Tabler Icons — zodiac + celestial subset (outline and filled)',
    'https://github.com/tabler/tabler-icons (@tabler/icons 3.46.0)', 'MIT', 'https://opensource.org/licenses/MIT', 'Tabler Icons by Paweł Kuna, MIT',
    [(f'{S}/npm/tabler/package/icons/outline/{n}.svg', f'outline/{n}.svg') for n in tab_out] + [(f'{S}/npm/tabler/package/icons/filled/{n}.svg', f'filled/{n}.svg') for n in tab_fill],
    notes='24px grid, 2px stroke; the 12 zodiac icons match the rest of the UI icon language.', license_files=[(f'{LIC}/tabler-LICENSE', 'LICENSE')])
for setname, folder, lic, licurl, credit, licfile in [
    ('mdi', 'material-design-icons', 'Pictogrammers Free License (Apache 2.0 for icons)', 'https://pictogrammers.com/docs/general/license/', 'Material Design Icons by Pictogrammers', 'mdi-LICENSE'),
    ('ph', 'phosphor', 'MIT', 'https://opensource.org/licenses/MIT', 'Phosphor Icons, MIT', 'phosphor-LICENSE'),
    ('solar', 'solar', 'CC BY 4.0', 'https://creativecommons.org/licenses/by/4.0/', 'Solar Icon Set by 480 Design, CC BY 4.0', 'cc-by-4.0.txt'),
    ('lucide', 'lucide', 'ISC', 'https://opensource.org/licenses/ISC', 'Lucide Icons contributors, ISC', 'lucide-LICENSE'),
    ('iconoir', 'iconoir', 'MIT', 'https://opensource.org/licenses/MIT', 'Iconoir by Luca Burgio, MIT', 'iconoir-LICENSE'),
    ('mingcute', 'mingcute', 'Apache 2.0', 'https://www.apache.org/licenses/LICENSE-2.0', 'MingCute Icon by MingCute Design, Apache 2.0', 'mingcute-LICENSE')]:
    add(f'icons/{folder}', f'{credit.split(",")[0]} — celestial subset', f'Fetched via Iconify API (https://api.iconify.design/{setname}/<name>.svg)', lic, licurl, credit,
        globs(f'{S}/dl/iconify/{setname}/*.svg'), license_files=[(f'{LIC}/{licfile}', 'LICENSE')])
add('icons/game-icons', 'Game-icons.net — zodiac signs, planets, lotus, meditation, astrolabe (Delapouite, Lorc et al.)',
    'https://github.com/game-icons/icons', 'CC BY 3.0', 'https://creativecommons.org/licenses/by/3.0/',
    'Icons by Delapouite, Lorc, Caro Asercion, Skoll (game-icons.net), CC BY 3.0',
    globs(f'{S}/dl/game-icons/*.svg'), notes='Bold silhouette style (512x512); the 13 zodiac icons are pictorial (ram, bull, twins…) rather than glyphs.',
    license_files=[(f'{S}/dl/game-icons/LICENSE.txt', 'LICENSE.txt')])
wi = ['wi-moon-new','wi-moon-waxing-crescent-1','wi-moon-waxing-crescent-2','wi-moon-waxing-crescent-3','wi-moon-waxing-crescent-4','wi-moon-waxing-crescent-5','wi-moon-waxing-6','wi-moon-first-quarter','wi-moon-waxing-gibbous-1','wi-moon-waxing-gibbous-2','wi-moon-waxing-gibbous-3','wi-moon-waxing-gibbous-4','wi-moon-waxing-gibbous-5','wi-moon-waxing-gibbous-6','wi-moon-full','wi-moon-waning-gibbous-1','wi-moon-waning-gibbous-2','wi-moon-waning-gibbous-3','wi-moon-waning-gibbous-4','wi-moon-waning-gibbous-5','wi-moon-waning-gibbous-6','wi-moon-third-quarter','wi-moon-waning-crescent-1','wi-moon-waning-crescent-2','wi-moon-waning-crescent-3','wi-moon-waning-crescent-4','wi-moon-waning-crescent-5','wi-moon-waning-crescent-6']
wi_alt = [n.replace('wi-moon-', 'wi-moon-alt-').replace('alt-waxing-6', 'alt-waxing-crescent-6') for n in wi]
wi_extra = ['wi-day-sunny','wi-night-clear','wi-stars','wi-sunrise','wi-sunset','wi-moonrise','wi-moonset','wi-horizon','wi-horizon-alt','wi-solar-eclipse','wi-lunar-eclipse','wi-meteor'] + [f'wi-time-{i}' for i in range(1, 13)]
add('icons/moon-phases/weather-icons', 'Weather Icons (Erik Flowers) — 28+28 Moon phase glyphs, sun, eclipses, clock faces',
    'https://github.com/erikflowers/weather-icons', 'SIL OFL 1.1 (icons); MIT (CSS)', 'https://scripts.sil.org/OFL', 'Weather Icons by Erik Flowers (SIL OFL 1.1); artwork by Lukas Bischoff',
    [(f'{S}/src/weather-icons/svg/{n}.svg', f'svg/{n}.svg') for n in wi + wi_alt + wi_extra] +
    [(f'{S}/src/weather-icons/font/weathericons-regular-webfont.woff2', 'font/weathericons-regular-webfont.woff2'), (f'{S}/src/weather-icons/css/weather-icons.min.css', 'css/weather-icons.min.css'), (f'{S}/src/weather-icons/README.md', 'README-upstream.md')],
    notes='28 phase steps ≈ one glyph per tithi (the 30 tithis map onto 28 with two doublings); the "alt" set draws the lit portion as a disc.')
met = ['moon-new','moon-waxing-crescent','moon-first-quarter','moon-waxing-gibbous','moon-full','moon-waning-gibbous','moon-last-quarter','moon-waning-crescent','moonrise','moonset','clear-day','clear-night','starry-night','star','falling-stars','sunrise','sunset','horizon','solar-eclipse','sun-hot']
met_static_extra = ['time-morning','time-late-morning','time-afternoon','time-late-afternoon','time-evening','time-late-evening','time-night','time-late-night','compass']
files = []
for st in ['fill','flat','line','monochrome']:
    files += [(f'{S}/npm/meteocons-static/package/{st}/{n}.svg', f'static/{st}/{n}.svg') for n in met + met_static_extra]
    files += [(f'{S}/npm/meteocons-anim/package/{st}/{n}.svg', f'animated/{st}/{n}.svg') for n in met]
add('icons/moon-phases/meteocons', 'Meteocons (Bas Milius) — animated + static Moon phases, Sun, stars, eclipse, in 4 styles',
    'https://github.com/basmilius/meteocons (@meteocons/svg, @meteocons/svg-static 0.1.0)', 'MIT', 'https://opensource.org/licenses/MIT', 'Meteocons by Bas Milius, MIT',
    files, notes='Animated SVGs use embedded CSS/SMIL, no JS. Styles: fill (colour), flat, line, monochrome. Great for a living Panchanga header (moon phase, sunrise/sunset, hora clock).',
    license_files=[(f'{S}/npm/meteocons-static/package/LICENSE', 'LICENSE')])

# ---------------------------------------------------------------- emoji
add('emoji/fluent-emoji', 'Microsoft Fluent Emoji — 3D renders (PNG), Color and Flat SVGs: zodiac, Sun, Moon phases, Om, Diya, Lotus…',
    'https://github.com/microsoft/fluentui-emoji', 'MIT', 'https://opensource.org/licenses/MIT', 'Fluent Emoji © Microsoft Corporation, MIT',
    globs(f'{S}/dl/emoji/fluent-3d/*.png', lambda n: '3d/' + n) + globs(f'{S}/dl/emoji/fluent-color/*.svg', lambda n: 'color/' + n) + globs(f'{S}/dl/emoji/fluent-flat/*.svg', lambda n: 'flat/' + n),
    notes='The 3D set is the most "premium" looking ready-made zodiac imagery with a permissive license; 256px PNG with alpha.',
    license_files=[(f'{LIC}/fluentui-emoji-LICENSE', 'LICENSE')])
add('emoji/noto-emoji', 'Google Noto Emoji — zodiac and celestial SVGs', 'https://github.com/googlefonts/noto-emoji', 'Apache 2.0 (image resources, per upstream README); the emoji font itself is SIL OFL 1.1', 'https://www.apache.org/licenses/LICENSE-2.0', 'Noto Emoji © Google LLC, Apache 2.0',
    globs(f'{S}/dl/emoji/noto/*.svg'), license_files=[(f'{LIC}/noto-emoji-LICENSE', 'LICENSE')], notes='Files named by Unicode code point (2648 = Aries … 2653 = Pisces, 26ce = Ophiuchus, 1f311–1f318 Moon phases, 1f549 Om, 1fa94 Diya, 1fab7 Lotus, 1f52e crystal ball).')
add('emoji/twemoji', 'Twemoji — zodiac and celestial SVGs', 'https://github.com/jdecked/twemoji', 'CC BY 4.0', 'https://creativecommons.org/licenses/by/4.0/', 'Twemoji graphics © Twitter / jdecked, CC BY 4.0',
    globs(f'{S}/dl/emoji/twemoji/*.svg'), license_files=[(f'{LIC}/twemoji-LICENSE-GRAPHICS', 'LICENSE-GRAPHICS')])
add('emoji/openmoji', 'OpenMoji — zodiac and celestial SVGs (color + black line)', 'https://github.com/hfg-gmuend/openmoji', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0/', 'OpenMoji (hfg-gmuend), CC BY-SA 4.0',
    globs(f'{S}/dl/emoji/openmoji-color/*.svg', lambda n: 'color/' + n) + globs(f'{S}/dl/emoji/openmoji-black/*.svg', lambda n: 'black/' + n), tier='B',
    license_files=[(f'{LIC}/openmoji-LICENSE', 'LICENSE')])

# ---------------------------------------------------------------- fonts
FD = f'{S}/dl/fonts'
def fontfam(dest, fam, title, note='', tier='A'):
    fs = globs(f'{FD}/{fam}/*.woff2', lambda n: n) 
    add(f'fonts/{dest}/{fam}', title, f'https://github.com/google/fonts/tree/main/ofl/{fam}', 'SIL OFL 1.1', 'https://scripts.sil.org/OFL', f'{title.split(" —")[0]} (Google Fonts), SIL OFL 1.1', fs, notes=note, tier=tier,
        license_files=[(f'{FD}/{fam}/OFL.txt', 'OFL.txt')])
for fam, title, note in [
    ('yatraone', 'Yatra One — bold brush-style Devanagari + Latin display', 'Signature "temple signage" display face; ideal for app title and graha names.'),
    ('rozhaone', 'Rozha One — high-contrast Devanagari + Latin display serif', 'Elegant Bodoni-like Devanagari for headlines.'),
    ('modak', 'Modak — chubby rounded Devanagari + Latin display', 'Festive, playful; good for large numerals in charts.'),
    ('kalam', 'Kalam — handwritten Devanagari + Latin', 'Informal, warm handwriting for annotations.'),
    ('tillana', 'Tillana — calligraphic Devanagari + Latin', 'Dancing calligraphic strokes; headings.'),
    ('amita', 'Amita — Devanagari + Latin display serif with calligraphic flair', ''),
    ('sumana', 'Sumana — Devanagari + Latin text serif', ''),
    ('kurale', 'Kurale — Devanagari + Latin + Cyrillic text serif', ''),
    ('eczar', 'Eczar (variable) — high-contrast Devanagari + Latin serif for headlines', 'Variable weight 400–800.'),
    ('inknutantiqua', 'Inknut Antiqua — Devanagari + Latin bookish serif', ''),
    ('rhodiumlibre', 'Rhodium Libre — Devanagari + Latin serif', ''),
    ('laila', 'Laila — Devanagari + Latin text', ''),
    ('tirodevanagarisanskrit', 'Tiro Devanagari Sanskrit — scholarly Sanskrit text face with Vedic accents', 'Best choice for shlokas and Sanskrit terminology (supports Vedic svaras).'),
    ('tirodevanagarihindi', 'Tiro Devanagari Hindi — text face', ''),
    ('notoserifdevanagari', 'Noto Serif Devanagari (variable width/weight)', 'Workhorse text serif.'),
    ('notosansdevanagari', 'Noto Sans Devanagari (variable width/weight)', 'Workhorse UI sans.'),
    ('martel', 'Martel — Devanagari + Latin text serif (Light/Regular/Bold)', ''),
    ('hind', 'Hind — Devanagari + Latin UI sans', ''),
    ('rajdhani', 'Rajdhani — condensed Devanagari + Latin sans', 'Good for dense data tables and dasha timelines.'),
    ('mukta', 'Mukta — Devanagari + Latin sans', ''),
    ('anekdevanagari', 'Anek Devanagari (variable width/weight)', 'Very flexible variable family.'),
    ('karma', 'Karma — Devanagari + Latin serif', ''),
    ('halant', 'Halant — Devanagari + Latin text serif', ''),
    ('khand', 'Khand — condensed Devanagari + Latin display sans', ''),
    ('teko', 'Teko (variable) — condensed Devanagari + Latin display', ''),
    ('vesperlibre', 'Vesper Libre — Devanagari + Latin serif', '')]:
    fontfam('devanagari', fam, title, note)
for fam, title, note in [
    ('cinzel', 'Cinzel (variable) — Roman-inscription capitals', 'Classic "celestial atlas" feel for Latin headings.'),
    ('cinzeldecorative', 'Cinzel Decorative — ornamented capitals', ''),
    ('cormorantgaramond', 'Cormorant Garamond (variable, roman + italic)', 'Refined old-style serif for body/labels.'),
    ('marcellus', 'Marcellus — Trajan-like display serif', ''),
    ('philosopher', 'Philosopher — quirky humanist sans', ''),
    ('uncialantiqua', 'Uncial Antiqua — uncial display', ''),
    ('imfellenglish', 'IM Fell English — 17th-century book type (roman + italic)', 'Antique almanac flavour.'),
    ('playfairdisplay', 'Playfair Display (variable, roman + italic)', ''),
    ('spectral', 'Spectral — screen serif', ''),
    ('almendra', 'Almendra — calligraphic serif', '')]:
    fontfam('latin-display', fam, title, note)
fontfam('symbols', 'notosanssymbols', 'Noto Sans Symbols (variable) — Unicode zodiac ♈–♓, planets ☿♀♂♃♄♅♆♇, nodes ☊☋, Chiron, Lilith', 'Covers U+2600 block astrological code points except the Sun (☉ U+2609), which is in Noto Sans Symbols 2.')
fontfam('symbols', 'notosanssymbols2', 'Noto Sans Symbols 2 — Sun ☉ U+2609, Pluto alt ⯓, stars', '')

# ---------------------------------------------------------------- vedic geometry
add('vedic/sri-yantra', 'Sri Yantra — mathematically exact SVG renders (plain, dark, filled, animated) from @vibzart/sri-yantra',
    'https://github.com/vibzart/sri-yantra', 'MIT', 'https://opensource.org/licenses/MIT', 'Sri Yantra generator by Vibz.Art, MIT',
    globs(f'{S}/dl/sri-yantra/output/*.svg') + [(f'{S}/dl/sri-yantra/README.md', 'README-upstream.md')],
    notes='Shastra-validated construction: 43 triangles, every marma a true triple intersection. Animated variants (draw, breathe, rotate, layer-reveal) are self-contained SVGs — ideal loading screen / splash.',
    license_files=[(f'{S}/dl/sri-yantra/LICENSE', 'LICENSE')])
add('vedic/sacred-geometry-generator', 'Sacred Geometry Generator (Vesica, Seed/Flower of Life, Metatron, Golden Spiral) — JS',
    'https://github.com/evoluteur/sacred-geometry', 'MIT', 'https://opensource.org/licenses/MIT', 'Olivier Giulieri, sacred-geometry, MIT',
    [(f'{S}/src/sacred-geometry/patterns.js', 'patterns.js'), (f'{S}/src/sacred-geometry/js/sg.js', 'sg.js'), (f'{S}/src/sacred-geometry/sg.css', 'sg.css'), (f'{S}/src/sacred-geometry/index.html', 'index.html'), (f'{S}/src/sacred-geometry/README.md', 'README-upstream.md')],
    tier='B', notes='Dependency-free DOM/SVG generator; useful for background mandala patterns.',
    license_files=[(f'{S}/src/sacred-geometry/LICENSE', 'LICENSE')])

# ---------------------------------------------------------------- libs
add('libs/astrochart-kibo', 'AstroChart (Kibo) — dependency-free SVG natal/transit wheel renderer with built-in glyph paths',
    'https://github.com/Kibo/AstroChart (v2.0.1; successor: https://github.com/AstroDraw/AstroChart, TypeScript)', 'MIT', 'https://opensource.org/licenses/MIT', 'Matheus Alves (Kibo), AstroChart, MIT',
    [(f'{S}/src/astrochart/project/build/astrochart.min.js', 'astrochart.min.js'), (f'{S}/src/astrochart/project/build/astrochart.js', 'astrochart.js'), (f'{S}/src/astrochart/README.md', 'README-upstream.md'),
     (f'{S}/src/astrochart/project/examples/radix/radix.html', 'examples/radix.html'), (f'{S}/src/astrochart/project/examples/transit/transit.html', 'examples/transit.html'), (f'{S}/src/astrochart/project/src/settings.js', 'src/settings.js'), (f'{S}/src/astrochart/project/src/svg.js', 'src/svg.js')],
    notes='All planet/sign symbols are drawn as SVG path code inside svg.js — extractable as a glyph library. Colours/sizes are configurable via settings.js. The wheel can be adapted to a sidereal zodiac by rotating the sign ring by the ayanamsa.',
    license_files=[(f'{S}/src/astrochart/LICENSE', 'LICENSE')])
add('libs/astrochartjs-hindu', 'astrochartjs — Hindu (North/South Indian) chart drawing in SVG (snap.svg)',
    'https://github.com/erajasekar/astrochartjs', 'MIT', 'https://opensource.org/licenses/MIT', 'Rajasekar Elango, astrochartjs, MIT',
    [(f'{S}/src/astrochartjs/dist/astrochart.js', 'astrochart.js'), (f'{S}/src/astrochartjs/dist/themes/default.css', 'themes/default.css'), (f'{S}/src/astrochartjs/dist/themes/astrosoft.css', 'themes/astrosoft.css'),
     (f'{S}/src/astrochartjs/lib/snapsvg/snap.svg-min.js', 'lib/snap.svg-min.js'), (f'{S}/src/astrochartjs/demo/index.html', 'demo/index.html'), (f'{S}/src/astrochartjs/README.md', 'README-upstream.md')],
    tier='B', notes='From the author of Astrosoft. Demo shows the layout; CoffeeScript source upstream.',
    license_files=[(f'{S}/src/astrochartjs/LICENSE.txt', 'LICENSE.txt')])
add('libs/astronomy-engine', 'Astronomy Engine (Don Cross) — Sun/Moon/planet positions, phases, rise/set, eclipses; single browser file',
    'https://github.com/cosinekitty/astronomy (npm astronomy-engine 2.1.19)', 'MIT', 'https://opensource.org/licenses/MIT', 'Astronomy Engine by Don Cross, MIT',
    [(f'{S}/npm/astronomy-engine/package/astronomy.browser.min.js', 'astronomy.browser.min.js'), (f'{S}/npm/astronomy-engine/package/astronomy.browser.js', 'astronomy.browser.js'), (f'{S}/npm/astronomy-engine/package/astronomy.d.ts', 'astronomy.d.ts'), (f'{S}/npm/astronomy-engine/package/README.md', 'README-upstream.md')],
    notes='±1 arcminute, no data files, 116 KB — enough for a standalone HTML panchanga/kundali (tropical → sidereal via ayanamsa; lunar nodes via SearchMoonNode or a mean-node formula). Swiss-Ephemeris-grade alternatives are listed in the catalog.',
    license_files=[(f'{LIC}/astronomy-engine-LICENSE', 'LICENSE')])
add('libs/sri-yantra-generator', '@vibzart/sri-yantra — generator library (SVG/Canvas/Three.js/React), ESM dist',
    'https://github.com/vibzart/sri-yantra (npm @vibzart/sri-yantra 0.3.1)', 'MIT', 'https://opensource.org/licenses/MIT', 'Vibz.Art, MIT',
    [(p, os.path.relpath(p, f'{S}/npm/sri-yantra/package')) for p in glob.glob(f'{S}/npm/sri-yantra/package/dist/**/*', recursive=True) if os.path.isfile(p)] + [(f'{S}/npm/sri-yantra/package/package.json', 'package.json')],
    tier='B', license_files=[(f'{S}/dl/sri-yantra/LICENSE', 'LICENSE')])

# ---------------------------------------------------------------- manifest + license bundle
os.makedirs(os.path.join(R, 'docs'), exist_ok=True)
json.dump(entries, open(os.path.join(R, 'docs', 'sources.json'), 'w'), indent=1, ensure_ascii=False)
os.makedirs(os.path.join(A, '_licenses'), exist_ok=True)
for n in ['cc-by-4.0.txt', 'cc-by-sa-4.0.txt', 'cc0-1.0.txt', 'cc-by-3.0.txt', 'OFL-1.1.txt']:
    shutil.copy2(os.path.join(LIC, n), os.path.join(A, '_licenses', n))
tot = sum(e['bytes'] for e in entries)
print(f'\nTOTAL: {len(entries)} folders, {sum(len(e["files"]) for e in entries)} files, {tot/1024/1024:.1f} MB')
