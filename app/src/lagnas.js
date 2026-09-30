// Special lagnas (Bhava, Hora, Ghati, Vighati, Pranapada, Varnada, Sree, Indu, Kunda, Bhrigu Bindu), the Varnada lagnas of the
// twelve houses, the eight chara karakas, and Karakamsa / Swamsa.
import { SE } from './sweph.js';
import { norm360, arc } from './time.js';
import { SUN, MOON, RAHU, NINE, SIGN_LORD, ODD_SIGN, signQuality } from './constants.js';
import { navamsaSign } from './vargas.js';
import { countSigns, signAspects } from './arudhas.js';
import { nakshatraOf, wholeSignHouse, bhavaOf } from './chart.js';

export const LAGNA_DEFAULTS = Object.freeze({
  /** Sun used as the base of the time-based lagnas: 'birth' (Jagannatha Hora) | 'sunrise' (classical reading) */
  sunBase: 'birth',
});

const KARAKA_NAMES = ['Atmakaraka', 'Amatyakaraka', 'Bhratrikaraka', 'Matrikaraka', 'Pitrikaraka', 'Putrakaraka', 'Gnatikaraka', 'Darakaraka'];
const INDU_KALAS = [30, 16, 6, 8, 10, 12, 1]; // Sun..Saturn

export function computeSpecialLagnas(eph, chart, options = {}) {
  const opt = { ...LAGNA_DEFAULTS, ...options };
  const P = chart.planets, day = chart.day;
  const out = [];
  const push = (name, lon, extra = {}) => {
    const L = norm360(lon), sign = Math.floor(L / 30);
    out.push({ name, lon: L, sign, deg: L - sign * 30, signLord: SIGN_LORD[sign], nakshatra: nakshatraOf(L), house: wholeSignHouse(L, chart.lagnaSign), bhava: bhavaOf(L, chart.bhavas), ...extra });
  };
  const unavailable = (name, why) => out.push({ name, lon: null, unavailable: why });

  // Time-based lagnas: base Sun + rate × minutes since the Hindu day's sunrise (degrees per minute: 1/4, 1/2, 5/4, 5).
  let horaLagnaSign = null;
  if (!day.polar) {
    const minutes = (chart.jdUt - day.sunrise) * 1440;
    const base = opt.sunBase === 'sunrise'
      ? eph.calc(day.sunrise, SE.SUN, SE.FLG_SWIEPH | SE.FLG_SIDEREAL | (chart.options.truePositions ? SE.FLG_TRUEPOS : 0)).lon
      : P[SUN].lon;
    const bhava = base + 0.25 * minutes, hora = base + 0.5 * minutes, ghati = base + 1.25 * minutes, vighati = base + 5 * minutes;
    push('Bhava lagna', bhava); push('Hora lagna', hora); push('Ghati lagna', ghati); push('Vighati lagna', vighati);
    const offset = { movable: 0, fixed: 240, dual: 120 }[signQuality(P[SUN].sign)];
    push('Pranapada lagna', vighati + offset);
    horaLagnaSign = Math.floor(norm360(hora) / 30);
  } else {
    for (const n of ['Bhava lagna', 'Hora lagna', 'Ghati lagna', 'Vighati lagna', 'Pranapada lagna']) unavailable(n, 'no sunrise at this latitude');
  }

  // Varnada lagna (Raman / Narasimha Rao): counts from Aries for odd signs, from Pisces backwards for even; add when the parities agree, else subtract.
  if (horaLagnaSign != null) push('Varnada lagna', varnadaOfHouse(chart, horaLagnaSign, 1).lon);
  else unavailable('Varnada lagna', 'no sunrise at this latitude');

  // Sree lagna: Lagna + (fraction of the Moon's nakshatra elapsed) × 360°.
  const nk = P[MOON].nakshatra;
  push('Sree lagna', chart.asc + (nk.degInNakshatra / (360 / 27)) * 360);

  // Indu lagna (Raman): kalas of the ninth lords from Lagna and from the Moon, summed, mod 12, counted from the Moon; Moon's degree kept.
  const lord9L = SIGN_LORD[(chart.lagnaSign + 8) % 12], lord9M = SIGN_LORD[(P[MOON].sign + 8) % 12];
  let k = (INDU_KALAS[lord9L] + INDU_KALAS[lord9M]) % 12; if (k === 0) k = 12;
  push('Indu lagna', ((P[MOON].sign + k - 1) % 12) * 30 + P[MOON].deg);

  // Kunda lagna: Lagna × 81.
  push('Kunda lagna', chart.asc * 81);

  // Bhrigu Bindu: midpoint of the arc from Rahu forward to the Moon.
  push('Bhrigu Bindu', P[RAHU].lon + arc(P[RAHU].lon, P[MOON].lon) / 2);
  return out;
}

/** Varnada of house n (1..12): the nth signs from the Lagna and from the Hora lagna, worked as for the Lagna; the Lagna's degree is kept. */
function varnadaOfHouse(chart, horaLagnaSign, n) {
  const L = (chart.lagnaSign + n - 1) % 12, H = (horaLagnaSign + n - 1) % 12;
  const count = (s) => (ODD_SIGN(s) ? s + 1 : 12 - s);
  let k = ODD_SIGN(L) === ODD_SIGN(H) ? (count(L) + count(H)) % 12 : Math.abs(count(L) - count(H)) % 12;
  if (k === 0) k = 12;
  const sign = ODD_SIGN(L) ? k - 1 : (12 - k) % 12;
  return { house: n, sign, deg: chart.lagna.deg, lon: norm360(sign * 30 + chart.lagna.deg), houseFromLagna: countSigns(chart.lagnaSign, sign) };
}

/** Varnada lagnas of the twelve houses; [] when the Hora lagna is unavailable (polar night or day). */
export function varnadaLagnas(chart, lagnas) {
  const hora = lagnas.find(l => l.name === 'Hora lagna');
  if (!hora || hora.lon == null) return [];
  return Array.from({ length: 12 }, (_, i) => varnadaOfHouse(chart, hora.sign, i + 1));
}

/** Karakamsa: the Atmakaraka's navamsa sign, read as a lagna in the rasi (Karakamsa) and in the navamsa (Swamsa). */
export function karakamsa(chart) {
  const atmakaraka = charaKarakas(chart)[0].planet;
  const sign = navamsaSign(chart.planets[atmakaraka].lon);
  const nav = NINE.map(p => navamsaSign(chart.planets[p].lon));
  return {
    atmakaraka, sign, lord: SIGN_LORD[sign],
    planets: NINE.map(p => ({ planet: p, rasiSign: chart.planets[p].sign, rasiHouse: countSigns(sign, chart.planets[p].sign), navamsaSign: nav[p], navamsaHouse: countSigns(sign, nav[p]) })),
    rasiOccupants: NINE.filter(p => chart.planets[p].sign === sign), navamsaOccupants: NINE.filter(p => nav[p] === sign),
    rasiAspecting: NINE.filter(p => signAspects(chart.planets[p].sign, sign)), navamsaAspecting: NINE.filter(p => signAspects(nav[p], sign)),
  };
}

/** Eight chara karakas (Jaimini): Sun..Saturn and Rahu ranked by advancement in the sign; Rahu counted from the end of its sign. */
export function charaKarakas(chart) {
  const rows = [0, 1, 2, 3, 4, 5, 6, 7].map(p => ({ planet: p, advancement: p === RAHU ? 30 - chart.planets[p].deg : chart.planets[p].deg }));
  rows.sort((a, b) => b.advancement - a.advancement);
  return rows.map((r, i) => ({ karaka: KARAKA_NAMES[i], ...r }));
}
