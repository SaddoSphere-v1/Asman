// Chart core: positions, nakshatras, houses, Hindu day (sunrise/sunset), combustion, planetary war.
import { SE } from './sweph.js';
import { norm360, sep, arc, weekdayOfJd, calendarDate } from './time.js';
import {
  NINE, SEVEN, SUN, MOON, MARS, MERCURY, JUPITER, VENUS, SATURN, RAHU, KETU, FIVE_TARA,
  SE_BODY, SIGN_LORD, NAKSHATRA_NAMES, nakshatraLord, COMBUST_ORB, WAR_ORB, WEEKDAY_LORD,
} from './constants.js';

export const DEFAULT_OPTIONS = Object.freeze({
  /** Bhava system: 'equal' — Parashara's bhava chalit, Lagna degree at the middle of the first bhava, 30° houses (default) |
   *  'kp' — Placidus cusps as house starts | 'sripati' — Porphyry madhyas (kept only for the Raman / Jain regression tests) */
  houseSystem: 'equal',
  /** Planetary war winner: 'lowerLongitude' (B.V. Raman) | 'north' (greater ecliptic latitude, Surya Siddhanta) | 'higherLongitude' */
  warWinner: 'lowerLongitude',
  /** Geometric (true) positions without light-time/aberration, as JHora (SEFLG_TRUEPOS); false → apparent positions */
  truePositions: true,
  /** Sunrise definition: 'hindu' (disc centre, no refraction — JHora/PyJHora) | 'apparent' (upper limb with refraction) */
  sunrise: 'hindu',
  /** Combustion also for retrograde orbs (Mercury 12°, Venus 8°) */
  retroOrbs: true,
});

export function nakshatraOf(lon) {
  const l = norm360(lon);
  const span = 360 / 27;
  const n = Math.min(26, Math.floor(l / span));
  const pada = Math.min(3, Math.floor((l - n * span) / (span / 4))) + 1;
  return { index: n, name: NAKSHATRA_NAMES[n], pada, lord: nakshatraLord(n), degInNakshatra: l - n * span };
}

/** Whole-sign house of a longitude from the lagna sign (1..12). */
export const wholeSignHouse = (lon, lagnaSign) => ((Math.floor(norm360(lon) / 30) - lagnaSign) % 12 + 12) % 12 + 1;

/** Sripati (Porphyry-style) bhava madhyas from asc and mc. Returns madhya[1..12]. */
export function sripatiMadhyas(asc, mc) {
  const m = new Array(13);
  m[1] = norm360(asc); m[10] = norm360(mc); m[4] = norm360(mc + 180); m[7] = norm360(asc + 180);
  const a10to1 = arc(m[10], m[1]); // 10th → 1st
  const a1to4 = arc(m[1], m[4]);   // 1st → 4th
  m[11] = norm360(m[10] + a10to1 / 3); m[12] = norm360(m[10] + 2 * a10to1 / 3);
  m[2] = norm360(m[1] + a1to4 / 3); m[3] = norm360(m[1] + 2 * a1to4 / 3);
  m[5] = norm360(m[4] + a10to1 / 3); m[6] = norm360(m[4] + 2 * a10to1 / 3);
  m[8] = norm360(m[7] + a1to4 / 3); m[9] = norm360(m[7] + 2 * a1to4 / 3);
  return m;
}

/** Build bhavas {madhya[1..12], start[1..12], end[1..12]} for the chosen house system. */
export function buildBhavas(houseSystem, asc, mc, placidusCusps) {
  const madhya = new Array(13), start = new Array(13), end = new Array(13);
  if (houseSystem === 'equal') {
    for (let i = 1; i <= 12; i++) madhya[i] = norm360(asc + 30 * (i - 1));
  } else if (houseSystem === 'kp') {
    for (let i = 1; i <= 12; i++) start[i] = norm360(placidusCusps[i]);
    for (let i = 1; i <= 12; i++) { const nx = start[i % 12 + 1]; madhya[i] = norm360(start[i] + arc(start[i], nx) / 2); }
  } else {
    const m = sripatiMadhyas(asc, mc);
    for (let i = 1; i <= 12; i++) madhya[i] = m[i];
  }
  if (houseSystem !== 'kp') {
    for (let i = 1; i <= 12; i++) { const prev = madhya[(i + 10) % 12 + 1]; start[i] = norm360(prev + arc(prev, madhya[i]) / 2); }
  }
  for (let i = 1; i <= 12; i++) end[i] = start[i % 12 + 1];
  return { madhya, start, end, system: houseSystem };
}

/** Bhava (1..12) that contains a longitude. */
export function bhavaOf(lon, bhavas) {
  for (let i = 1; i <= 12; i++) {
    const s = bhavas.start[i], e = bhavas.end[i];
    const span = arc(s, e), d = arc(s, lon);
    if (d < span) return i;
  }
  return 12;
}

/** Sunrise/sunset flags. */
function riseFlags(mode) {
  return mode === 'apparent' ? 0 : SE.BIT_HINDU_RISING;
}

/**
 * Hindu day around the birth instant: sunrise (day start), sunset, next sunrise, weekday, day/night flag.
 * jd0 = local civil midnight of the birth date in UT.
 */
export function hinduDay(eph, jdUt, jdLocalMidnightUt, lat, lon, alt, mode) {
  const bits = riseFlags(mode);
  const rise = (from) => eph.riseTrans(from, SE.SUN, SE.CALC_RISE | bits, lon, lat, alt);
  const set = (from) => eph.riseTrans(from, SE.SUN, SE.CALC_SET | bits, lon, lat, alt);
  let sunrise = rise(jdLocalMidnightUt);
  if (sunrise == null) return { polar: true };
  let sunset, nextSunrise, prevSunset;
  if (jdUt < sunrise) {
    // born before today's sunrise: Hindu day is yesterday's
    nextSunrise = sunrise;
    sunrise = rise(jdLocalMidnightUt - 1);
    if (sunrise == null) return { polar: true };
    sunset = set(sunrise);
  } else {
    sunset = set(sunrise);
    nextSunrise = sunset != null ? rise(sunset) : null;
  }
  if (sunset == null || nextSunrise == null) return { polar: true };
  prevSunset = set(sunrise - 1);
  const isDay = jdUt >= sunrise && jdUt < sunset;
  return { polar: false, sunrise, sunset, nextSunrise, prevSunset, isDay, dayLength: sunset - sunrise, nightLength: nextSunrise - sunset };
}

/**
 * Compute the chart.
 * input: { year, month, day, hour, minute, second, utcOffset (hours), lat, lon, alt }
 */
export function computeChart(eph, input, options = {}) {
  const opt = { ...DEFAULT_OPTIONS, ...options };
  const localHours = input.hour + input.minute / 60 + (input.second || 0) / 3600;
  const jdUt = eph.julday(input.year, input.month, input.day, localHours - input.utcOffset);
  const jdLocalMidnightUt = eph.julday(input.year, input.month, input.day, -input.utcOffset);
  const ayanamsa = eph.ayanamsa(jdUt);
  const deltaT = eph.deltaT(jdUt) * 86400; // seconds (swe_deltat_ex returns days)
  const lat = input.lat, lon = input.lon, alt = input.alt || 0;

  // Positions
  const planets = [];
  for (const p of NINE) {
    if (p === KETU) {
      const r = planets[RAHU];
      planets[KETU] = { ...r, index: KETU, lon: norm360(r.lon + 180), lat: -r.lat, tropLon: norm360(r.tropLon + 180), dec: -r.dec, retro: true };
      continue;
    }
    const base = SE.FLG_SWIEPH | SE.FLG_SPEED | (opt.truePositions ? SE.FLG_TRUEPOS : 0);
    const sid = eph.calc(jdUt, SE_BODY[p], base | SE.FLG_SIDEREAL);
    const equ = eph.calc(jdUt, SE_BODY[p], base | SE.FLG_EQUATORIAL);
    planets[p] = {
      index: p, lon: norm360(sid.lon), lat: sid.lat, speed: sid.speedLon, dist: sid.dist,
      tropLon: norm360(sid.lon + ayanamsa), ra: equ.lon, dec: equ.lat,
      retro: p === RAHU ? true : sid.speedLon < 0,
    };
  }
  planets[KETU].speed = planets[RAHU].speed;

  // Houses
  const h = eph.houses(jdUt, lat, lon, 'P', true);
  const asc = norm360(h.asc), mc = norm360(h.mc);
  const lagnaSign = Math.floor(asc / 30);
  const bhavas = buildBhavas(opt.houseSystem, asc, mc, h.cusps);

  // Derived per planet
  for (const p of NINE) {
    const P = planets[p];
    P.sign = Math.floor(P.lon / 30); P.deg = P.lon - P.sign * 30; P.signLord = SIGN_LORD[P.sign];
    P.nakshatra = nakshatraOf(P.lon);
    P.house = wholeSignHouse(P.lon, lagnaSign);
    P.bhava = bhavaOf(P.lon, bhavas);
  }
  const lagna = { lon: asc, sign: lagnaSign, deg: asc - lagnaSign * 30, signLord: SIGN_LORD[lagnaSign], nakshatra: nakshatraOf(asc), house: 1, bhava: 1 };

  // Combustion
  for (const p of [MOON, MARS, MERCURY, JUPITER, VENUS, SATURN]) {
    const P = planets[p];
    const orb = COMBUST_ORB[p][P.retro && opt.retroOrbs ? 1 : 0];
    P.sunDistance = sep(P.lon, planets[SUN].lon);
    P.combust = P.sunDistance <= orb;
    P.combustOrb = orb;
  }
  // Planetary war (Mars..Saturn within 1°)
  const wars = [];
  for (let i = 0; i < FIVE_TARA.length; i++) for (let j = i + 1; j < FIVE_TARA.length; j++) {
    const a = planets[FIVE_TARA[i]], b = planets[FIVE_TARA[j]];
    if (sep(a.lon, b.lon) <= WAR_ORB) {
      let winner;
      if (opt.warWinner === 'lowerLongitude') winner = arc(a.lon, b.lon) < 180 ? a.index : b.index; // a behind b → a lower
      else if (opt.warWinner === 'higherLongitude') winner = arc(a.lon, b.lon) < 180 ? b.index : a.index;
      else winner = a.lat >= b.lat ? a.index : b.index;
      const loser = winner === a.index ? b.index : a.index;
      wars.push({ a: a.index, b: b.index, winner, loser, separation: sep(a.lon, b.lon) });
      planets[winner].war = { with: loser, won: true };
      planets[loser].war = { with: winner, won: false };
    }
  }

  // Hindu day
  const day = hinduDay(eph, jdUt, jdLocalMidnightUt, lat, lon, alt, opt.sunrise);
  let weekday = null, weekdayLord = null;
  if (!day.polar) {
    weekday = weekdayOfJd(day.sunrise + input.utcOffset / 24);
    weekdayLord = WEEKDAY_LORD[weekday];
  } else {
    weekday = weekdayOfJd(jdUt + input.utcOffset / 24);
    weekdayLord = WEEKDAY_LORD[weekday];
  }

  // Tithi / paksha
  const elong = arc(planets[SUN].lon, planets[MOON].lon);
  const tithi = Math.floor(elong / 12) + 1; // 1..30
  const waxing = tithi <= 15;

  return {
    input: { ...input }, options: opt, jdUt, jdLocalMidnightUt, deltaT, ayanamsa,
    lst: norm360(eph.sidtime(jdUt) * 15 + lon), // local sidereal time in degrees
    equationOfTime: eph.timeEqu(jdUt), // days, apparent − mean
    planets, lagna, asc, mc, lagnaSign, placidusCusps: h.cusps, bhavas,
    wars, day, weekday, weekdayLord, tithi, waxing, elongation: elong,
  };
}
