# Swiss Ephemeris data files (1800–2399 CE)

- `sepl_18.se1` — planets, `semo_18.se1` — Moon. JPL DE441-derived compressed ephemeris, Astrodienst AG.
- **Source:** npm `@kuntay/swisseph-data` 0.2.2 (mirrors https://github.com/aloistr/swisseph/tree/master/ephe).
- **License:** GNU AGPL-3.0-or-later (see `LICENSE`).
- The calculator inlines both files (base64) so it works offline from a single HTML file. Dates outside 1800–2399 fall back to the built-in Moshier theory inside Swiss Ephemeris.
