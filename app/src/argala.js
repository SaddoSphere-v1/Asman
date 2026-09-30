// Argala (Jaimini Sutras 1.1.5-1.1.9): planets in the 2nd, 4th, 11th (primary) and 5th (secondary) from a reference give argala;
// malefics in the 3rd give vipareeta argala. Planets in the 12th, 10th, 3rd and 9th obstruct the 2nd, 4th, 11th and 5th argalas.
import { NINE, SUN, MARS, SATURN, RAHU, KETU, PLANET_NAMES } from './constants.js';

export const ARGALA_DEFAULTS = Object.freeze({
  /** An obstruction with as many planets as the argala removes it (true) or only a larger number does (false) */
  tieObstructs: true,
  /** Count Rahu and Ketu in the reverse direction (some Jaimini traditions); off, as in Jagannatha Hora's table */
  reverseNodes: false,
  /** Natural malefics for vipareeta argala from the 3rd */
  malefics: [SUN, MARS, SATURN, RAHU, KETU],
});

export const ARGALA_HOUSES = [
  { key: 'second', house: 2, obstructor: 12 },
  { key: 'fourth', house: 4, obstructor: 10 },
  { key: 'eleventh', house: 11, obstructor: 3 },
  { key: 'fifth', house: 5, obstructor: 9 },
];

/** Planets (indices) whose sign is `house` counted from `refSign` (1-based), with the node-reversal option. */
function planetsAt(chart, refSign, house, opt) {
  const out = [];
  for (const p of NINE) {
    const s = chart.planets[p].sign;
    const forward = ((s - refSign) % 12 + 12) % 12 + 1;
    const backward = ((refSign - s) % 12 + 12) % 12 + 1;
    const h = opt.reverseNodes && (p === RAHU || p === KETU) ? backward : forward;
    if (h === house) out.push(p);
  }
  return out;
}

/** Argala on one reference sign. */
export function argalaOn(chart, refSign, options = {}) {
  const opt = { ...ARGALA_DEFAULTS, ...options };
  const result = {};
  for (const a of ARGALA_HOUSES) {
    const giving = planetsAt(chart, refSign, a.house, opt);
    const obstructing = planetsAt(chart, refSign, a.obstructor, opt);
    const obstructed = giving.length > 0 && (opt.tieObstructs ? obstructing.length >= giving.length : obstructing.length > giving.length);
    result[a.key] = { house: a.house, giving, obstructing, obstructed };
  }
  const third = planetsAt(chart, refSign, 3, opt).filter(p => opt.malefics.includes(p));
  result.vipareeta = { house: 3, giving: third, obstructing: [], obstructed: false };
  return result;
}

/** Argala for the twelve houses (from the Lagna sign) and for each graha as reference. */
export function computeArgala(chart, options = {}) {
  const houses = [];
  for (let h = 1; h <= 12; h++) houses.push({ label: `House ${h}`, sign: (chart.lagnaSign + h - 1) % 12, argala: argalaOn(chart, (chart.lagnaSign + h - 1) % 12, options) });
  const planets = NINE.map(p => ({ label: PLANET_NAMES[p], sign: chart.planets[p].sign, argala: argalaOn(chart, chart.planets[p].sign, options) }));
  return { houses, planets };
}
