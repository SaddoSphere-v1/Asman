# Graha Bala — outputs-only Vedic chart calculator

Single-file HTML (`../graha-bala.html`) that computes, for any birth, exactly what Jagannatha Hora (JHora) shows and nothing else:

- **Placements**: Lagna and nine grahas — sidereal longitude (Lahiri), nakshatra and pada with lord, sign lord, whole-sign house, Sripati bhava, speed and retrogression, combustion, graha yuddha, latitude, declination.
- **Upagrahas**: Dhuma, Vyatipata, Parivesha, Indrachapa, Upaketu (from the Sun); Kala, Mrityu, Ardhaprahara, Yamaghantaka, Gulika, Mandi (ascendant rising at the ruling planet's portion of day or night); Pranapada.
- **Shadbala**: every sub-bala of Sthana (Uchcha, Saptavargaja, Ojhayugma, Kendradi, Drekkana), Dig, Kala (Natonnata, Paksha, Tribhaga, Abda, Masa, Vara, Hora, Ayana, Yuddha), Chesta, Naisargika and Drik; totals in shashtiamsas and rupas, required minimum, ratio, rank. Sun and Moon follow their own rules (Chesta = Ayana / Paksha; Sun's Ayana and Moon's Paksha doubled).
- **Ishta / Kashta phala** (Raman's method).
- **Avasthas**: Deeptadi (nine Parashari states) and Lajjitadi (six states, all that apply).

Conventions are fixed to **Lahiri ayanamsa** and **true Rahu** (Ketu opposite). Everything else that varies between texts is a named option (collapsed "Calculation options" in the page) whose default follows JHora / B.V. Raman's *Graha and Bhava Balas*, which JHora's release notes cite as its source for balas.

## Engine

Swiss Ephemeris 2.10.03 compiled to WebAssembly (`vendor/swisseph`, from npm `@kuntay/swisseph`) with the `sepl_18.se1` / `semo_18.se1` data files (1800–2399) embedded as base64, so the page works offline from a double-clicked file. Positions are geometric (SEFLG_TRUEPOS) as in JHora; sunrise is the true rise of the Sun's centre without refraction (SE_BIT_HINDU_RISING). Node tests show the WASM output is identical to `pyswisseph` of the same version to 1e-7°.

Swiss Ephemeris is licensed AGPL-3.0-or-later; the built HTML is the complete corresponding source.

## Layout

```
app/
  src/            ES modules: sweph.js (WASM wrapper) · time.js · constants.js · vargas.js · relations.js
                  chart.js (positions, houses, Hindu day) · upagrahas.js · shadbala.js · avasthas.js · render.js · main.js
  vendor/         Swiss Ephemeris WASM + data files (AGPL)
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
- `test/upagrahas.test.mjs`: kalavela and Pranapada longitudes against an independent Python implementation of the classical rule.

Conventions not yet verified against a live JHora printout are marked in the option labels; compare one chart in JHora and flip the option if a component differs.
