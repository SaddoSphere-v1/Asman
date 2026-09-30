// Divisional-chart sign of a longitude (0..360). Parashari definitions used by Saptavargaja bala.
import { norm360 } from './time.js';
import { MARS, MERCURY, JUPITER, VENUS, SATURN, ODD_SIGN, MOVABLE, FIXED } from './constants.js';

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

/** Sixteen Parashari divisional charts: for each D the varga sign of the Lagna and of the nine grahas. */
export function divisionalCharts(chart) {
  return SHODASAVARGA.map(D => ({
    D, name: VARGA_NAMES[D],
    lagna: vargaSign(chart.asc, D),
    planets: chart.planets.map(p => vargaSign(p.lon, D)),
  }));
}
