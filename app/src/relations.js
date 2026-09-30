// Planetary relationships and dignities.
import { SEVEN, NATURAL_RELATION, EXALTATION_SIGN, DEBILITATION_SIGN, MOOLATRIKONA, OWN_SIGNS, SIGN_LORD } from './constants.js';

/** Natural relation of p towards q: 'F' | 'N' | 'E'. */
export const naturalRelation = (p, q) => NATURAL_RELATION[p][q];

/** Temporal (tatkalika) friendship: q in 2nd, 3rd, 4th, 10th, 11th or 12th sign from p. */
export function temporalFriend(signP, signQ) {
  const h = ((signQ - signP) % 12 + 12) % 12 + 1; // 1..12
  return [2, 3, 4, 10, 11, 12].includes(h);
}

/**
 * Compound (panchadha) relation of p towards q given rasi-chart signs.
 * Returns 'adhimitra' | 'mitra' | 'sama' | 'satru' | 'adhisatru'.
 */
export function compoundRelation(p, q, signs) {
  const nat = naturalRelation(p, q);
  const tf = temporalFriend(signs[p], signs[q]);
  if (nat === 'F') return tf ? 'adhimitra' : 'sama';
  if (nat === 'N') return tf ? 'mitra' : 'satru';
  return tf ? 'sama' : 'adhisatru';
}

/** Full compound-relation matrix for the seven planets from rasi-chart signs. */
export function compoundMatrix(signs) {
  const m = {};
  for (const p of SEVEN) { m[p] = {}; for (const q of SEVEN) if (p !== q) m[p][q] = compoundRelation(p, q, signs); }
  return m;
}

export const isOwnSign = (p, sign) => p <= 6 && OWN_SIGNS[p].includes(sign);
export const isExaltationSign = (p, sign) => p <= 6 && EXALTATION_SIGN[p] === sign;
export const isDebilitationSign = (p, sign) => p <= 6 && DEBILITATION_SIGN[p] === sign;
/** Moolatrikona by sign only (varga use) or by sign + degree range (rasi use). */
export function isMoolatrikona(p, sign, deg = null) {
  if (p > 6) return false;
  const [s, from, to] = MOOLATRIKONA[p];
  if (sign !== s) return false;
  if (deg == null) return true;
  return deg >= from && deg < to;
}

/**
 * Dignity of planet p in a sign (with optional degree for the rasi chart).
 * relationMatrix: compound matrix (or null to use natural relations).
 * Returns one of 'exalted','moolatrikona','own','debilitated','adhimitra','mitra','sama','satru','adhisatru'
 * or for natural relations 'friend','neutral','enemy'.
 */
export function dignity(p, sign, deg, relationMatrix) {
  if (isExaltationSign(p, sign)) return 'exalted';
  if (isMoolatrikona(p, sign, deg)) return 'moolatrikona';
  if (isOwnSign(p, sign)) return 'own';
  if (isDebilitationSign(p, sign)) return 'debilitated';
  const lord = SIGN_LORD[sign];
  if (relationMatrix) return relationMatrix[p][lord];
  const n = naturalRelation(p, lord);
  return n === 'F' ? 'friend' : n === 'N' ? 'neutral' : 'enemy';
}
