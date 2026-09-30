// Reference tables derived from the chart: sputa drishti matrix, natural / temporal / compound relationships, dignity flags.
import { arc } from './time.js';
import { SEVEN, NINE, RAHU, KETU, SIGN_LORD } from './constants.js';
import { sputaDrishti } from './shadbala.js';
import { naturalRelation, temporalFriend, compoundMatrix, isExaltationSign, isDebilitationSign, isOwnSign, isMoolatrikona } from './relations.js';

/**
 * Sputa drishti in shashtiamsas. rows: aspecting grahas Sun..Ketu (nodes cast the plain graduated aspect, no special aspects);
 * columns: aspected grahas Sun..Ketu and Lagna. special: 'parasara' | 'raman'.
 */
export function aspectMatrix(chart, special = 'parasara') {
  const P = chart.planets;
  const targets = [...NINE.map(p => P[p].lon), chart.asc];
  const rows = {};
  for (const q of NINE) {
    rows[q] = targets.map((lon, i) => (i === q ? null : sputaDrishti(arc(P[q].lon, lon), q === RAHU || q === KETU ? -1 : q, special)));
  }
  return { rows, columns: [...NINE, 'lagna'] };
}

export function relationshipTables(chart) {
  const signs = SEVEN.map(p => chart.planets[p].sign);
  const natural = {}, temporal = {};
  for (const p of SEVEN) {
    natural[p] = {}; temporal[p] = {};
    for (const q of SEVEN) if (p !== q) { natural[p][q] = naturalRelation(p, q); temporal[p][q] = temporalFriend(signs[p], signs[q]) ? 'F' : 'E'; }
  }
  return { natural, temporal, compound: compoundMatrix(signs) };
}

export function dignityTable(chart) {
  const signs = SEVEN.map(p => chart.planets[p].sign);
  const compound = compoundMatrix(signs);
  return SEVEN.map((p) => {
    const sign = chart.planets[p].sign, deg = chart.planets[p].deg, lord = SIGN_LORD[sign];
    return {
      planet: p, sign, lord,
      exalted: isExaltationSign(p, sign), debilitated: isDebilitationSign(p, sign), own: isOwnSign(p, sign),
      moolatrikona: isMoolatrikona(p, sign, deg), moolatrikonaSign: isMoolatrikona(p, sign),
      natural: lord === p ? null : naturalRelation(p, lord), compound: lord === p ? null : compound[p][lord],
    };
  });
}
