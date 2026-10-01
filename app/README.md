# Graha Bala — outputs-only Vedic chart calculator

Single-file HTML (`../graha-bala.html`) that computes, for any birth, exactly what Jagannatha Hora (JHora) shows and nothing else:

- **Placements**: Lagna and nine grahas — sidereal longitude (Lahiri), nakshatra and pada with lord, sign lord, whole-sign house, Parashara's equal bhava (Lagna degree at the middle of the first bhava), speed and retrogression, combustion, graha yuddha, latitude, declination.
- **House lords**: the twelve houses with sign, Parasara lord and its placement, and the Jaimini co-lord (Ketu for Scorpio, Rahu for Aquarius) with its placement. The header carries the panchanga at birth: weekday, tithi and paksha, nitya yoga, karana.
- **Upagrahas**: Dhuma, Vyatipata, Parivesha, Indrachapa, Upaketu (from the Sun); Kala, Mrityu, Ardhaprahara, Yamaghantaka, Gulika, Mandi (ascendant rising at the ruling planet's portion of day or night; portions follow Jagannatha Hora's fixed eight-slot cycle Sun…Saturn, lordless, entered at the weekday lord).
- **Special lagnas**: Bhava, Hora, Ghati, Vighati, Pranapada (Sun at birth plus 1/4, 1/2, 5/4, 5 degrees per minute since sunrise, as Jagannatha Hora), Varnada (Raman / Narasimha Rao method, for the Lagna and for all twelve houses), Sree, Indu (Raman), Kunda, Bhrigu Bindu; then the whole-sign houses of the nine grahas from each special lagna and the sputa drishti of each graha on it.
- **Chara karakas**: the eight-karaka scheme (Sun to Saturn and Rahu, Rahu counted from the end of its sign), shown as a column of the Placements table.
- **Arudha padas**: the twelve bhava arudhas (Arudha lagna to Upapada) and the nine graha arudhas, with the Parasara / Jaimini exception (a pada in the 1st or 7th from its start moves to the 10th from there) and the stronger co-lord of Scorpio (Mars / Ketu) and Aquarius (Saturn / Rahu) by Jaimini's rules in Jagannatha Hora's order (a co-lord standing in the sign yields to the other; more planets conjoined; Jupiter, Mercury and the dispositor conjoining or sign-aspecting; exaltation; dual > fixed > movable; advancement). For each pada: its sign lord, house from Lagna, grahas in it and grahas sign-aspecting it (rasi drishti). Every varga table lists the padas computed inside that chart, as Jagannatha Hora does. A sign-aspect table (Lagna and grahas: who shares the sign, who aspects it by rasi drishti) sits under the aspects.
- **Karakamsa**: the Atmakaraka's navamsa sign read as a lagna in the rasi (Karakamsa) and in the navamsa (Swamsa): its lord, the grahas in and sign-aspecting it in both charts, and every graha's house from it in both charts.
- **Shadbala**: every sub-bala of Sthana (Uchcha, Saptavargaja, Ojhayugma, Kendradi, Drekkana), Dig, Kala (Natonnata, Paksha, Tribhaga, Abda, Masa, Vara, Hora, Ayana, Yuddha), Chesta, Naisargika and Drik; totals in shashtiamsas and rupas, required minimum, ratio, rank. Sun and Moon follow their own rules (Chesta = Ayana / Paksha; Sun's Ayana and Moon's Paksha doubled).
- **Ishta / Kashta phala** (Raman's method).
- **Avasthas**: Deeptadi (nine Parashari states: Deepta for exaltation or moolatrikona, Swastha, then Pramudita / Shanta / Deena / Dukhita / Khala by the compound grade of the sign lord, debilitation as Deena, Vikala with a natural malefic, Kopa when combust; the reading shared by Santhanam's translation and kunjara/jyotish) and Lajjitadi (six states, all that apply).

The page asks for five things only: **Name, Gender, Birthday, Birthtime, Birthplace**. The birthplace is resolved offline by an embedded atlas (GeoNames, every place with population ≥ 5000: coordinates, region, country and time zone; the historical offset comes from the browser's time-zone database). Coordinates such as `13.08, 80.27` are accepted too.

After Compute, **Download Word document** writes a `.docx` from the same computed results: thirteen sections of plain tables for a reader to scan (identity; placements with dignity; house lords; special lagnas and Varnada lagnas; arudha and graha arudhas; Karakamsa; the sixteen-varga sign matrix, the Navamsa and Vimshopaka; sputa drishti, sign aspects and compound relationships; argala; upagrahas; Shadbala totals with Ishta / Kashta; Ashtakavarga with the reduced Sarvashtakavarga and pindas; avasthas). The file is written by a small dependency-free WordprocessingML writer (`src/docx.js`); empty values read "none".

Conventions are fixed to **Lahiri ayanamsa** and **true Rahu** (Ketu opposite). Everything else that varies between texts is a named option in the engine (`SHADBALA_DEFAULTS`, `UPAGRAHA_DEFAULTS`, `AVASTHA_DEFAULTS`, `DEFAULT_OPTIONS`) whose default follows JHora / B.V. Raman's *Graha and Bhava Balas*, which JHora's release notes cite as its source for balas. The page itself exposes no options.

## Engine

Swiss Ephemeris 2.10.03 compiled to WebAssembly (`vendor/swisseph`, from npm `@kuntay/swisseph`) with the `sepl_18.se1` / `semo_18.se1` data files (1800–2399) embedded as base64, so the page works offline from a double-clicked file. Positions are geometric (SEFLG_TRUEPOS) as in JHora; sunrise is the true rise of the Sun's centre without refraction (SE_BIT_HINDU_RISING). Node tests show the WASM output is identical to `pyswisseph` of the same version to 1e-7°.

Swiss Ephemeris is licensed AGPL-3.0-or-later; the built HTML is the complete corresponding source. The atlas is GeoNames data (CC BY 4.0), rebuilt with `tools/build_atlas.py` from `cities5000.txt`, `admin1CodesASCII.txt` and `countryInfo.txt`.

## Layout

```
app/
  src/            ES modules: sweph.js (WASM wrapper) · time.js · constants.js · vargas.js · relations.js · atlas.js
                  chart.js (positions, houses, Hindu day) · upagrahas.js · lagnas.js · lagnatables.js · argala.js · arudhas.js · ashtakavarga.js
                  shadbala.js · avasthas.js · tables.js · render.js · report.js · docx.js · main.js
  vendor/         Swiss Ephemeris WASM + data files (AGPL)
  data/           atlas.tsv.gz — GeoNames places ≥ 5000 (CC BY 4.0)
  test/           node:test suites and JSON fixtures
  tools/          Python oracle scripts (pyswisseph) that generate the fixtures
  build.mjs       esbuild bundle → ../graha-bala.html
```

```
npm install          # esbuild only
npm run build        # writes ../graha-bala.html
npm test             # parity + regression tests
```

## Verification

- `test/jhora-reference.test.mjs`: values generated by Jagannatha Hora itself for one chart (1996-12-07, Chennai): Lagna and nine grahas within 2″, solar upagrahas within 1″, kalavelas within 40″, special lagnas within the program's ≈2 s sunrise difference.
- `test/positions.test.mjs`: 8 charts (day/night, southern hemisphere, high latitude, pre-1900) against pyswisseph — longitudes, latitudes, speeds, declinations, ascendant, cusps, sunrise/sunset.
- `test/shadbala.test.mjs`: V.P. Jain's published worked example (13 Sep 1981, Delhi) — Sthana, Dig, Kala components, Ayana, Naisargika, Drik reproduce the book to 0.02–0.35 shashtiamsa; Chesta within textbook tolerance. (The books' Dig bala uses Sripati bhava madhyas, so those tests pass `houseSystem: 'sripati'`; the page itself uses Parashara's equal bhavas.)
- `test/shadbala-raman.test.mjs`: B.V. Raman's own worked example (16 Oct 1918, Bangalore, Raman ayanamsa) — Sthana, Dig, Kala components, Ayana, Chesta (to 0.05), Naisargika and Drik (Raman aspects) reproduce the book; two known book slips (Saturn's Uchcha arithmetic, Mars's unfolded Dig distance) are excluded.
- `test/upagrahas.test.mjs`: kalavela and Pranapada longitudes against an independent Python implementation of the same rule.
- `test/lagnas.test.mjs`: Varnada, Sree, Indu, Bhrigu Bindu and the chara karakas against PyJHora; lagna rates. (PyJHora's own time-based lagnas apply the zone offset twice and run Vighati at 15°/min, so those are checked against Jagannatha Hora instead.)
- `test/argala.test.mjs`: argala and obstruction rules, tie handling, vipareeta argala and node reversal on constructed charts.
- `test/arudhas.test.mjs`: pada counting and the exception, rasi drishti, every co-lord and stronger-sign rule on constructed charts; bhava and graha arudhas in the rasi and all sixteen vargas of the eight test charts against PyJHora (every pada that does not pass through the strength rules is identical; the strength-rule cases differ only where PyJHora counts the Lagna as a conjoined planet, misses a lord standing in its own sign, or keeps Parasara's lord of Scorpio / Aquarius inside the sign-strength rules).
- `test/lagnatables.test.mjs`: houses and aspects from each special lagna checked against direct recomputation from the chart.
- `test/varnada-karakamsa.test.mjs`: Varnada lagnas of all twelve houses against PyJHora; Karakamsa / Swamsa against direct recomputation.
- `test/panchanga.test.mjs`: tithi, karana and nitya yoga at birth against pyswisseph; the karana sequence.
- `test/report.test.mjs`: the Word report's thirteen sections (shape, no empty cells, no abbreviations), the zip writer against Python's zipfile, and the generated file opened with python-docx (headings, tables, title).
- `test/avasthas.test.mjs`: rule-level tests of every Deeptadi and Lajjitadi condition on constructed charts.
- `test/atlas.test.mjs`: place lookup by current name, former name (Madras, Bombay, Bangalore), with region or country, and coordinate fallback.

Readings that differ between sources and are exposed as engine options: the Khala rule of the Deeptadi avasthas (great enemy's sign, default, versus Narasimha Rao's malefic-owned sign), the Ekadhipatya sub-rule for an empty sign with more bindus, and Raman's versus Parasara's special-aspect formulas.
