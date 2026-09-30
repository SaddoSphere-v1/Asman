// Divisional-chart sign of a longitude (0..360). Parashari definitions used by Saptavargaja bala.
import { norm360 } from './time.js';
import { MARS, MERCURY, JUPITER, VENUS, SATURN, ODD_SIGN } from './constants.js';

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

export const VARGA_FUNCS = { 1: rasiOf, 2: horaSign, 3: drekkanaSign, 7: saptamsaSign, 9: navamsaSign, 12: dwadasamsaSign, 30: trimsamsaSign };
export const SAPTAVARGA = [1, 2, 3, 7, 9, 12, 30];
export function vargaSign(lon, D) { return VARGA_FUNCS[D](lon); }
