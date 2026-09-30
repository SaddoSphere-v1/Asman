// Tables computed with each special lagna as the reference point: whole-sign houses of the grahas counted from it and the
// sputa drishti of each graha on it.
import { NINE, RAHU, KETU } from './constants.js';
import { arc } from './time.js';
import { wholeSignHouse } from './chart.js';
import { sputaDrishti } from './shadbala.js';

/**
 * @param {object} args
 * @param {object} args.chart     result of computeChart
 * @param {Array}  args.lagnas    result of computeSpecialLagnas (entries with lon == null are passed through as unavailable)
 * @param {string} [args.special] special-aspect variant for sputa drishti: 'parasara' | 'raman'
 */
export function specialLagnaTables({ chart, lagnas, special = 'parasara' }) {
  const P = chart.planets;
  return lagnas.map(L => {
    if (L.lon == null) return { name: L.name, lon: null, unavailable: L.unavailable };
    const aspects = NINE.map(q => sputaDrishti(arc(P[q].lon, L.lon), q === RAHU || q === KETU ? -1 : q, special));
    return { name: L.name, lon: L.lon, sign: L.sign, deg: L.deg, houses: NINE.map(p => wholeSignHouse(P[p].lon, L.sign)), aspects, aspectTotal: aspects.reduce((a, b) => a + b, 0) };
  });
}
