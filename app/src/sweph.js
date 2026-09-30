// Thin wrapper over the Emscripten build of Swiss Ephemeris (vendor/swisseph).
// Only the handful of swe_* calls the calculator needs; everything else stays in the WASM.

export const SE = Object.freeze({
  SUN: 0, MOON: 1, MERCURY: 2, VENUS: 3, MARS: 4, JUPITER: 5, SATURN: 6,
  MEAN_NODE: 10, TRUE_NODE: 11,
  FLG_JPLEPH: 1, FLG_SWIEPH: 2, FLG_MOSEPH: 4, FLG_TRUEPOS: 16, FLG_NONUT: 64,
  FLG_SPEED: 256, FLG_EQUATORIAL: 2048, FLG_SIDEREAL: 65536,
  SIDM_LAHIRI: 1,
  CALC_RISE: 1, CALC_SET: 2, CALC_MTRANSIT: 4, CALC_ITRANSIT: 8,
  BIT_DISC_CENTER: 256, BIT_DISC_BOTTOM: 8192, BIT_NO_REFRACTION: 512, BIT_GEOCTR_NO_ECL_LAT: 128,
  // SE_BIT_HINDU_RISING = DISC_CENTER | NO_REFRACTION | GEOCTR_NO_ECL_LAT (swephexp.h)
  BIT_HINDU_RISING: 256 | 512 | 128,
  GREG_CAL: 1, JUL_CAL: 0,
});

/**
 * Create the ephemeris facade.
 * @param {object} args
 * @param {Function} args.createModule  default export of vendor/swisseph/swisseph.mjs
 * @param {Uint8Array|ArrayBuffer} args.wasmBinary
 * @param {Record<string, Uint8Array>} args.files  .se1 files to mount under /ephe
 * @param {number} [args.sidMode]  Swiss Ephemeris SE_SIDM_* constant (default Lahiri)
 */
export async function createEphemeris({ createModule, wasmBinary, files = {}, sidMode = SE.SIDM_LAHIRI }) {
  const M = await createModule({
    wasmBinary,
    print: () => {},
    printErr: () => {},
    locateFile: (p) => p,
  });
  try { M.FS.mkdir('/ephe'); } catch (e) { /* exists */ }
  for (const [name, bytes] of Object.entries(files)) {
    M.FS.writeFile('/ephe/' + name, bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes));
  }
  const c = (name, ret, args) => M.cwrap(name, ret, args);
  const f = {
    set_ephe_path: c('swe_set_ephe_path', null, ['string']),
    set_sid_mode: c('swe_set_sid_mode', null, ['number', 'number', 'number']),
    julday: c('swe_julday', 'number', ['number', 'number', 'number', 'number', 'number']),
    revjul: c('swe_revjul', null, ['number', 'number', 'number', 'number', 'number', 'number']),
    deltat_ex: c('swe_deltat_ex', 'number', ['number', 'number', 'number']),
    calc_ut: c('swe_calc_ut', 'number', ['number', 'number', 'number', 'number', 'number']),
    get_ayanamsa_ex_ut: c('swe_get_ayanamsa_ex_ut', 'number', ['number', 'number', 'number', 'number']),
    houses_ex: c('swe_houses_ex', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number']),
    rise_trans: c('swe_rise_trans', 'number', ['number', 'number', 'string', 'number', 'number', 'number', 'number', 'number', 'number', 'number']),
    sidtime: c('swe_sidtime', 'number', ['number']),
    time_equ: c('swe_time_equ', 'number', ['number', 'number', 'number']),
    version: c('swe_version', 'number', ['number']),
    close: c('swe_close', null, []),
  };
  const buf = {
    xx: M._malloc(6 * 8),
    serr: M._malloc(256),
    cusps: M._malloc(37 * 8),
    ascmc: M._malloc(10 * 8),
    geopos: M._malloc(3 * 8),
    tret: M._malloc(10 * 8),
    dret: M._malloc(8),
    ints: M._malloc(4 * 4),
    dbl: M._malloc(8),
    str: M._malloc(64),
  };
  const dbl = (ptr, i = 0) => M.getValue(ptr + i * 8, 'double');
  const err = () => M.UTF8ToString(buf.serr);

  f.set_ephe_path('/ephe');
  f.set_sid_mode(sidMode, 0, 0);
  f.version(buf.str);
  const version = M.UTF8ToString(buf.str);

  const api = {
    version,
    /** Julian Day (UT) from calendar date and decimal hours; Gregorian calendar. */
    julday(year, month, day, hours, gregorian = true) {
      return f.julday(year, month, day, hours, gregorian ? SE.GREG_CAL : SE.JUL_CAL);
    },
    /** Calendar date from Julian Day. */
    revjul(jd, gregorian = true) {
      f.revjul(jd, gregorian ? SE.GREG_CAL : SE.JUL_CAL, buf.ints, buf.ints + 4, buf.ints + 8, buf.dbl);
      return {
        year: M.getValue(buf.ints, 'i32'),
        month: M.getValue(buf.ints + 4, 'i32'),
        day: M.getValue(buf.ints + 8, 'i32'),
        hours: dbl(buf.dbl),
      };
    },
    deltaT(jdUt) { return f.deltat_ex(jdUt, SE.FLG_SWIEPH, buf.serr); },
    /** Ayanamsa (degrees) at jdUt for the configured sidereal mode. */
    ayanamsa(jdUt) {
      const r = f.get_ayanamsa_ex_ut(jdUt, SE.FLG_SWIEPH, buf.dret, buf.serr);
      if (r < 0) throw new Error('swe_get_ayanamsa_ex_ut: ' + err());
      return dbl(buf.dret);
    },
    /**
     * Body position. Returns {lon, lat, dist, speedLon, speedLat, speedDist, flags}.
     * flags default: Swiss ephemeris, speed, sidereal.
     */
    calc(jdUt, body, flags = SE.FLG_SWIEPH | SE.FLG_SPEED | SE.FLG_SIDEREAL) {
      const r = f.calc_ut(jdUt, body, flags, buf.xx, buf.serr);
      if (r < 0) throw new Error('swe_calc_ut(' + body + '): ' + err());
      return {
        lon: dbl(buf.xx, 0), lat: dbl(buf.xx, 1), dist: dbl(buf.xx, 2),
        speedLon: dbl(buf.xx, 3), speedLat: dbl(buf.xx, 4), speedDist: dbl(buf.xx, 5), flags: r,
      };
    },
    /**
     * Houses. hsys: single character ('P' Placidus, 'O' Porphyry, 'W' whole sign, 'A' equal...).
     * Returns {cusps:[undefined,c1..c12], asc, mc, armc, vertex}.
     */
    houses(jdUt, lat, lon, hsys = 'P', sidereal = true) {
      const flags = sidereal ? SE.FLG_SIDEREAL : 0;
      f.houses_ex(jdUt, flags, lat, lon, hsys.charCodeAt(0), buf.cusps, buf.ascmc);
      const cusps = [undefined];
      for (let i = 1; i <= 12; i++) cusps.push(dbl(buf.cusps, i));
      return { cusps, asc: dbl(buf.ascmc, 0), mc: dbl(buf.ascmc, 1), armc: dbl(buf.ascmc, 2), vertex: dbl(buf.ascmc, 3) };
    },
    /**
     * Next rising/setting of body after jdStartUt at (lon, lat, alt). rsmi = SE.CALC_RISE|SE.BIT_*.
     * Returns the Julian Day (UT) or null when the body never crosses the horizon (polar).
     */
    riseTrans(jdStartUt, body, rsmi, lon, lat, alt = 0, pressure = 1013.25, tempC = 15) {
      M.setValue(buf.geopos, lon, 'double');
      M.setValue(buf.geopos + 8, lat, 'double');
      M.setValue(buf.geopos + 16, alt, 'double');
      const r = f.rise_trans(jdStartUt, body, '', SE.FLG_SWIEPH, rsmi, buf.geopos, pressure, tempC, buf.tret, buf.serr);
      if (r === -2) return null;
      if (r < 0) throw new Error('swe_rise_trans: ' + err());
      return dbl(buf.tret, 0);
    },
    sidtime(jdUt) { return f.sidtime(jdUt); },
    /** Equation of time in days (apparent − mean solar time) at jdUt. */
    timeEqu(jdUt) { const r = f.time_equ(jdUt, buf.dret, buf.serr); if (r < 0) throw new Error('swe_time_equ: ' + err()); return dbl(buf.dret); },
    dispose() { f.close(); for (const p of Object.values(buf)) M._free(p); },
    _module: M,
  };
  return api;
}
