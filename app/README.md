# Graha Bala — outputs-only Vedic chart calculator

Single-file HTML (`../graha-bala.html`) that computes, for any birth, exactly what Jagannatha Hora (JHora) shows and nothing else:

- **Placements**: Lagna and nine grahas — sidereal longitude (Lahiri), nakshatra and pada with lord, sign lord, whole-sign house, Sripati bhava, speed and retrogression, combustion, graha yuddha, latitude, declination.
- **Upagrahas**: Dhuma, Vyatipata, Parivesha, Indrachapa, Upaketu (from the Sun); Kala, Mrityu, Ardhaprahara, Yamaghantaka, Gulika, Mandi (ascendant rising at the ruling planet's portion of day or night); Pranapada.
- **Shadbala**: every sub-bala of Sthana (Uchcha, Saptavargaja, Ojhayugma, Kendradi, Drekkana), Dig, Kala (Natonnata, Paksha, Tribhaga, Abda, Masa, Vara, Hora, Ayana, Yuddha), Chesta, Naisargika and Drik; totals in shashtiamsas and rupas, required minimum, ratio, rank. Sun and Moon follow their own rules (Chesta = Ayana / Paksha; Sun's Ayana and Moon's Paksha doubled).
- **Ishta / Kashta phala** (Raman's method).
- **Avasthas**: Deeptadi (nine Parashari states) and Lajjitadi (six states, all that apply).

The page asks for five things only: **Name, Gender, Birthday, Birthtime, Birthplace**. The birthplace is resolved offline by an embedded atlas (GeoNames, every place with population ≥ 5000: coordinates, region, country and time zone; the historical offset comes from the browser's time-zone database). Coordinates such as `13.08, 80.27` are accepted too.

Conventions are fixed to **Lahiri ayanamsa** and **true Rahu** (Ketu opposite). Everything else that varies between texts is a named option in the engine (`SHADBALA_DEFAULTS`, `UPAGRAHA_DEFAULTS`, `AVASTHA_DEFAULTS`, `DEFAULT_OPTIONS`) whose default follows JHora / B.V. Raman's *Graha and Bhava Balas*, which JHora's release notes cite as its source for balas. The page itself exposes no options.

## Engine

Swiss Ephemeris 2.10.03 compiled to WebAssembly (`vendor/swisseph`, from npm `@kuntay/swisseph`) with the `sepl_18.se1` / `semo_18.se1` data files (1800–2399) embedded as base64, so the page works offline from a double-clicked file. Positions are geometric (SEFLG_TRUEPOS) as in JHora; sunrise is the true rise of the Sun's centre without refraction (SE_BIT_HINDU_RISING). Node tests show the WASM output is identical to `pyswisseph` of the same version to 1e-7°.

Swiss Ephemeris is licensed AGPL-3.0-or-later; the built HTML is the complete corresponding source. The atlas is GeoNames data (CC BY 4.0), rebuilt with `tools/build_atlas.py` from `cities5000.txt`, `admin1CodesASCII.txt` and `countryInfo.txt`.

## Layout

```
app/
  src/            ES modules: sweph.js (WASM wrapper) · time.js · constants.js · vargas.js · relations.js · atlas.js
                  chart.js (positions, houses, Hindu day) · upagrahas.js · shadbala.js · avasthas.js · render.js · main.js
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

- `test/positions.test.mjs`: 8 charts (day/night, southern hemisphere, high latitude, pre-1900) against pyswisseph — longitudes, latitudes, speeds, declinations, ascendant, cusps, sunrise/sunset.
- `test/shadbala.test.mjs`: V.P. Jain's published worked example (13 Sep 1981, Delhi) — Sthana, Dig, Kala components, Ayana, Naisargika, Drik reproduce the book to 0.02–0.35 shashtiamsa; Chesta within textbook tolerance.
- `test/shadbala-raman.test.mjs`: B.V. Raman's own worked example (16 Oct 1918, Bangalore, Raman ayanamsa) — Sthana, Dig, Kala components, Ayana, Chesta (to 0.05), Naisargika and Drik (Raman aspects) reproduce the book; two known book slips (Saturn's Uchcha arithmetic, Mars's unfolded Dig distance) are excluded.
- `test/upagrahas.test.mjs`: kalavela and Pranapada longitudes against an independent Python implementation of the classical rule.
- `test/atlas.test.mjs`: place lookup by current name, former name (Madras, Bombay, Bangalore), with region or country, and coordinate fallback.

Conventions not yet verified against a live JHora printout: the mean longitudes used for Chesta bala and the Khala rule of the Deeptadi avasthas. Compare one chart in JHora; each is a one-line default in the engine.
