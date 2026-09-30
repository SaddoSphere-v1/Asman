# Swiss Ephemeris 2.10.03 — WebAssembly build

- **Source:** npm `@kuntay/swisseph` 0.2.2 (https://github.com/kuntayerkus/swisseph-wasm), files `wasm/swisseph.mjs` (Emscripten glue, ES module) and `wasm/swisseph.wasm`.
- **Upstream:** Swiss Ephemeris by Dieter Koch and Alois Treindl, Astrodienst AG — https://www.astro.com/swisseph, https://github.com/aloistr/swisseph
- **License:** GNU AGPL-3.0-or-later (see `LICENSE`, `NOTICE`). Personal, non-distributed use; the built HTML in this repository is itself the complete corresponding source.
- **Why this build:** exposes the full `swe_*` C API through `cwrap`/`ccall` plus the Emscripten `FS`, so the `.se1` data files can be mounted in memory. Verified bit-identical to `pyswisseph` 2.10.3.2 on planetary longitudes, ayanamsa, houses and rise/set (see `app/test`).

## Local patch

`swisseph.mjs`, two one-line edits restoring Emscripten's standard `wasmBinary` input: `var wasmBinary;` → `var wasmBinary=Module["wasmBinary"];` and `getBinarySync` gains `if(wasmBinary){return new Uint8Array(wasmBinary)}` first. The upstream build only located the `.wasm` next to the script, which fails for an inlined single-file page opened from `file://`. No other change.
