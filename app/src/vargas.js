// Divisional-chart sign of a longitude (0..360). Parashari definitions used by Saptavargaja bala.
import { norm360 } from './time.js';
import { SEVEN, MARS, MERCURY, JUPITER, VENUS, SATURN, ODD_SIGN, MOVABLE, FIXED, SIGN_LORD } from './constants.js';
import { compoundMatrix, dignity, isOwnSign } from './relations.js';

export const rasiOf = (lon) => Math.floor(norm360(lon) / 30) % 12;
export const degInSign = (lon) => norm360(lon) % 30;

/** D2 hora: odd signs first half Sun (Leo), second half Moon (Cancer); even signs reversed. */
export function horaSign(lon) {
  const s = rasiOf(lon), d = degInSign(lon);
  const first = d < 15;
  return ODD_SIGN(s) ? (first ? 4 : 3) : (first ? 3 : 4);
}
/** D3 drekkana: 1st part own sign, 2nd part 5th, 3rd part 9th. */
export function drekkanaSign(lon) {
  const s = rasiOf(lon), part = Math.min(2, Math.floor(degInSign(lon) / 10));
  return (s + 4 * part) % 12;
}
/** D7 saptamsa: odd signs count from itself, even from the 7th. */
export function saptamsaSign(lon) {
  const s = rasiOf(lon), part = Math.min(6, Math.floor(degInSign(lon) * 7 / 30));
  const start = ODD_SIGN(s) ? s : (s + 6) % 12;
  return (start + part) % 12;
}
/** D9 navamsa. */
export function navamsaSign(lon) {
  const s = rasiOf(lon), part = Math.min(8, Math.floor(degInSign(lon) * 9 / 30));
  return (s * 9 + part) % 12;
}
/** D12 dwadasamsa: count from the sign itself. */
export function dwadasamsaSign(lon) {
  const s = rasiOf(lon), part = Math.min(11, Math.floor(degInSign(lon) * 12 / 30));
  return (s + part) % 12;
}
/** D30 trimsamsa (Parashari): odd Mars 5, Saturn 5, Jupiter 8, Mercury 7, Venus 5; even Venus 5, Mercury 7, Jupiter 8, Saturn 5, Mars 5. */
export function trimsamsaSign(lon) {
  const s = rasiOf(lon), d = degInSign(lon);
  if (ODD_SIGN(s)) {
    if (d < 5) return 0;      // Mars → Aries
    if (d < 10) return 10;    // Saturn → Aquarius
    if (d < 18) return 8;     // Jupiter → Sagittarius
    if (d < 25) return 2;     // Mercury → Gemini
    return 6;                 // Venus → Libra
  }
  if (d < 5) return 1;        // Venus → Taurus
  if (d < 12) return 5;       // Mercury → Virgo
  if (d < 20) return 11;      // Jupiter → Pisces
  if (d < 25) return 9;       // Saturn → Capricorn
  return 7;                   // Mars → Scorpio
}
export const trimsamsaLord = (lon) => [MARS, VENUS, MERCURY, undefined, JUPITER, MERCURY, VENUS, MARS, JUPITER, SATURN, SATURN, JUPITER][trimsamsaSign(lon)];

const part = (lon, D) => Math.min(D - 1, Math.floor(degInSign(lon) * D / 30));
const quality = (s) => (MOVABLE.includes(s) ? 0 : FIXED.includes(s) ? 1 : 2); // 0 movable, 1 fixed, 2 dual
const element = (s) => s % 4;                                                 // 0 fire, 1 earth, 2 air, 3 water

/** D4 chaturthamsa: parts of 7°30′ counted from the sign, its 4th, 7th and 10th. */
export const chaturthamsaSign = (lon) => (rasiOf(lon) + 3 * part(lon, 4)) % 12;
/** D10 dasamsa: odd signs from the sign itself, even signs from the 9th. */
export const dasamsaSign = (lon) => { const s = rasiOf(lon); return ((ODD_SIGN(s) ? s : s + 8) + part(lon, 10)) % 12; };
/** D16 shodasamsa: movable from Aries, fixed from Leo, dual from Sagittarius. */
export const shodasamsaSign = (lon) => ([0, 4, 8][quality(rasiOf(lon))] + part(lon, 16)) % 12;
/** D20 vimsamsa: movable from Aries, fixed from Sagittarius, dual from Leo. */
export const vimsamsaSign = (lon) => ([0, 8, 4][quality(rasiOf(lon))] + part(lon, 20)) % 12;
/** D24 chaturvimsamsa (siddhamsa): odd signs from Leo, even from Cancer. */
export const chaturvimsamsaSign = (lon) => ((ODD_SIGN(rasiOf(lon)) ? 4 : 3) + part(lon, 24)) % 12;
/** D27 nakshatramsa (bhamsa): fiery from Aries, earthy from Cancer, airy from Libra, watery from Capricorn. */
export const nakshatramsaSign = (lon) => ([0, 3, 6, 9][element(rasiOf(lon))] + part(lon, 27)) % 12;
/** D40 khavedamsa: odd signs from Aries, even from Libra. */
export const khavedamsaSign = (lon) => ((ODD_SIGN(rasiOf(lon)) ? 0 : 6) + part(lon, 40)) % 12;
/** D45 akshavedamsa: movable from Aries, fixed from Leo, dual from Sagittarius. */
export const akshavedamsaSign = (lon) => ([0, 4, 8][quality(rasiOf(lon))] + part(lon, 45)) % 12;
/** D60 shashtiamsa: counted from the sign itself. */
export const shashtiamsaSign = (lon) => (rasiOf(lon) + part(lon, 60)) % 12;

export const VARGA_FUNCS = {
  1: rasiOf, 2: horaSign, 3: drekkanaSign, 4: chaturthamsaSign, 7: saptamsaSign, 9: navamsaSign, 10: dasamsaSign, 12: dwadasamsaSign,
  16: shodasamsaSign, 20: vimsamsaSign, 24: chaturvimsamsaSign, 27: nakshatramsaSign, 30: trimsamsaSign, 40: khavedamsaSign, 45: akshavedamsaSign, 60: shashtiamsaSign,
};
export const VARGA_NAMES = {
  1: 'Rasi', 2: 'Hora', 3: 'Drekkana', 4: 'Chaturthamsa', 7: 'Saptamsa', 9: 'Navamsa', 10: 'Dasamsa', 12: 'Dwadasamsa',
  16: 'Shodasamsa', 20: 'Vimsamsa', 24: 'Chaturvimsamsa', 27: 'Nakshatramsa', 30: 'Trimsamsa', 40: 'Khavedamsa', 45: 'Akshavedamsa', 60: 'Shashtiamsa',
};
export const SAPTAVARGA = [1, 2, 3, 7, 9, 12, 30];
export const SHODASAVARGA = [1, 2, 3, 4, 7, 9, 10, 12, 16, 20, 24, 27, 30, 40, 45, 60];
export function vargaSign(lon, D) { return VARGA_FUNCS[D](lon); }

/** Degree within the varga sign (varga longitude = varga sign × 30 + this). */
export function vargaDegree(lon, D) {
  const d = degInSign(lon), s = rasiOf(lon);
  if (D === 1) return d;
  if (D === 2) return (d % 15) * 2;
  if (D === 30) {
    const bounds = ODD_SIGN(s) ? [0, 5, 10, 18, 25, 30] : [0, 5, 12, 20, 25, 30];
    let i = 0; while (i < 4 && d >= bounds[i + 1]) i++;
    return (d - bounds[i]) / (bounds[i + 1] - bounds[i]) * 30;
  }
  const size = 30 / D;
  return (d % size) * D;
}
export const vargaLongitude = (lon, D) => vargaSign(lon, D) * 30 + vargaDegree(lon, D);

/** Vimshopaka bala weights (Brihat Parashara Hora Shastra); each scheme totals 20. */
export const VIMSHOPAKA = {
  Shadvarga: { 1: 6, 2: 2, 3: 4, 9: 5, 12: 2, 30: 1 },
  Saptavarga: { 1: 5, 2: 2, 3: 3, 7: 2.5, 9: 4.5, 12: 2, 30: 1 },
  Dasavarga: { 1: 3, 2: 1.5, 3: 1.5, 7: 1.5, 9: 1.5, 10: 1.5, 12: 1.5, 16: 1.5, 30: 1.5, 60: 5 },
  Shodasavarga: { 1: 3.5, 2: 1, 3: 1, 4: 0.5, 7: 0.5, 9: 3, 10: 0.5, 12: 0.5, 16: 2, 20: 0.5, 24: 0.5, 27: 0.5, 30: 1, 40: 0.5, 45: 0.5, 60: 4 },
};
/** Vimshopaka points out of 20 by dignity in a varga. */
export const VIMSHOPAKA_POINTS = { exalted: 20, moolatrikona: 20, own: 20, adhimitra: 18, mitra: 15, sama: 10, satru: 7, adhisatru: 5 };
/** Varga vishwa: names for a planet in its own, moolatrikona or exaltation sign in n vargas of each scheme. */
export const AMSA_NAMES = {
  Shadvarga: { 2: 'Kimsuka', 3: 'Vyanjana', 4: 'Chamara', 5: 'Chatra', 6: 'Kundala' },
  Saptavarga: { 2: 'Kimsuka', 3: 'Vyanjana', 4: 'Chamara', 5: 'Chatra', 6: 'Kundala', 7: 'Mukuta' },
  Dasavarga: { 2: 'Parijata', 3: 'Uttama', 4: 'Gopura', 5: 'Simhasana', 6: 'Paravata', 7: 'Devaloka', 8: 'Brahmaloka', 9: 'Airavata', 10: 'Sridhama' },
  Shodasavarga: { 2: 'Bhedaka', 3: 'Kusuma', 4: 'Nagapushpa', 5: 'Kanduka', 6: 'Kerala', 7: 'Kalpavriksha', 8: 'Chandanavana', 9: 'Poornachandra', 10: 'Uchchaisrava', 11: 'Dhanvantari', 12: 'Suryakanta', 13: 'Vidruma', 14: 'Indrasana', 15: 'Golokamsa', 16: 'Srivallabha' },
};

/**
 * Sixteen Parashari divisional charts with varga longitudes, houses from the varga lagna, dignity (compound relationship
 * of the rasi chart, as the Saptavargaja bala uses), vargottama, plus Vimshopaka bala and varga vishwa for the seven planets.
 * In the vargas other than rasi, moolatrikona is a sign-level notion, so the moolatrikona sign counts as own sign when the planet
 * owns it and by the lord's relationship otherwise (the Moon in Taurus).
 */
export function divisionalCharts(chart, extraPoints = []) {
  const compound = compoundMatrix(SEVEN.map(p => chart.planets[p].sign));
  const dignityOf = (p, sign, deg, D) => {
    const d = dignity(p, sign, D === 1 ? deg : null, compound);
    if (d === 'moolatrikona' && D !== 1) return isOwnSign(p, sign) ? 'own' : compound[p][SIGN_LORD[sign]];
    return d;
  };
  const charts = SHODASAVARGA.map((D) => {
    const lagnaLon = vargaLongitude(chart.asc, D);
    const lagnaSign = Math.floor(lagnaLon / 30);
    const planets = chart.planets.map((P, p) => {
      const lon = vargaLongitude(P.lon, D), sign = Math.floor(lon / 30), deg = lon - sign * 30;
      const dignity = p <= 6 ? dignityOf(p, sign, deg, D) : null;
      return { sign, deg, lon, house: ((sign - lagnaSign) % 12 + 12) % 12 + 1, dignity, vargottama: D !== 1 && sign === P.sign };
    });
    const points = extraPoints.filter(x => x.lon != null).map((x) => {
      const lon = vargaLongitude(x.lon, D), sign = Math.floor(lon / 30);
      return { name: x.name, group: x.group, sign, deg: lon - sign * 30, lon, house: ((sign - lagnaSign) % 12 + 12) % 12 + 1, vargottama: D !== 1 && sign === Math.floor(x.lon / 30) };
    });
    return { D, name: VARGA_NAMES[D], lagna: { lon: lagnaLon, sign: lagnaSign, deg: lagnaLon - lagnaSign * 30 }, planets, points };
  });
  const byD = Object.fromEntries(charts.map(c => [c.D, c]));
  const vimshopaka = {}, vishwa = {};
  for (let p = 0; p <= 6; p++) {
    vimshopaka[p] = {}; vishwa[p] = {};
    for (const [scheme, weights] of Object.entries(VIMSHOPAKA)) {
      let score = 0, good = 0;
      for (const [D, w] of Object.entries(weights)) {
        const dig = byD[+D].planets[p].dignity;
        score += w * (VIMSHOPAKA_POINTS[dig] ?? 10) / 20;
        if (dig === 'exalted' || dig === 'moolatrikona' || dig === 'own') good++;
      }
      vimshopaka[p][scheme] = score;
      vishwa[p][scheme] = { count: good, name: AMSA_NAMES[scheme][good] || null };
    }
  }
  return { charts, vimshopaka, vishwa };
}
