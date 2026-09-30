// Tables computed with each special lagna as the reference point: houses and equal bhavas of the grahas counted from it,
// its sign lord and nakshatra lord, sputa drishti of the grahas on it, argala on it, the Ashtakavarga bindus of its sign,
// and its sign in the sixteen divisional charts.
import { SEVEN, NINE, RAHU, KETU, SIGN_LORD } from './constants.js';
import { arc } from './time.js';
import { wholeSignHouse, buildBhavas, bhavaOf } from './chart.js';
import { sputaDrishti } from './shadbala.js';
import { argalaOn } from './argala.js';
import { compoundMatrix, dignity } from './relations.js';
import { SHODASAVARGA, vargaSign, vargaDegree } from './vargas.js';

/**
 * @param {object} args
 * @param {object} args.chart          result of computeChart
 * @param {Array}  args.lagnas         result of computeSpecialLagnas (entries with lon == null are passed through as unavailable)
 * @param {object} [args.ashtakavarga] result of ashtakavargaFromChart (bindus omitted when absent)
 * @param {string} [args.special]      special-aspect variant for sputa drishti: 'parasara' | 'raman'
 * @param {object} [args.argalaOptions]
 */
export function specialLagnaTables({ chart, lagnas, ashtakavarga = null, special = 'parasara', argalaOptions = {} }) {
  const P = chart.planets;
  const relation = compoundMatrix(SEVEN.map(p => P[p].sign));
  const placementOf = (p, refSign) => ({
    planet: p, sign: P[p].sign, deg: P[p].deg, lon: P[p].lon,
    house: wholeSignHouse(P[p].lon, refSign),
    dignity: p === RAHU || p === KETU ? null : dignity(p, P[p].sign, P[p].deg, relation),
    retro: !!P[p].retro, combust: !!P[p].combust,
  });
  return lagnas.map(L => {
    if (L.lon == null) return { name: L.name, lon: null, unavailable: L.unavailable };
    const sign = L.sign;
    const bhavas = buildBhavas('equal', L.lon);
    const aspects = NINE.map(q => sputaDrishti(arc(P[q].lon, L.lon), q === RAHU || q === KETU ? -1 : q, special));
    return {
      name: L.name, lon: L.lon, sign, deg: L.deg,
      houses: NINE.map(p => wholeSignHouse(P[p].lon, sign)),
      bhavas: NINE.map(p => bhavaOf(P[p].lon, bhavas)),
      lord: placementOf(SIGN_LORD[sign], sign),
      nakshatraLord: placementOf(L.nakshatra.lord, sign),
      aspects, aspectTotal: aspects.reduce((a, b) => a + b, 0),
      argala: argalaOn(chart, sign, argalaOptions),
      bindus: ashtakavarga ? { perPlanet: SEVEN.map(p => ashtakavarga.bav[p][sign]), total: ashtakavarga.sav[sign], reduced: ashtakavarga.savReduced[sign] } : null,
      vargas: SHODASAVARGA.map(D => ({ D, sign: vargaSign(L.lon, D), deg: vargaDegree(L.lon, D) })),
    };
  });
}
