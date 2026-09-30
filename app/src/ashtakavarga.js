// Ashtakavarga (Brihat Parashara Hora Shastra ch. 66-67): Bhinnashtakavarga for the seven planets, Sarvashtakavarga,
// Trikona and Ekadhipatya shodhana, Shodhya pindas. Prastara grids are kept for reference.
import { SEVEN, SUN, MOON, MARS, MERCURY, JUPITER, VENUS, SATURN } from './constants.js';

/** Houses (1..12) counted from each contributor (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Lagna) that receive a bindu. */
export const BINDU_TABLE = {
  [SUN]:     [[1,2,4,7,8,9,10,11], [3,6,10,11], [1,2,4,7,8,9,10,11], [3,5,6,9,10,11,12], [5,6,9,11], [6,7,12], [1,2,4,7,8,9,10,11], [3,4,6,10,11,12]],
  [MOON]:    [[3,6,7,8,10,11], [1,3,6,7,10,11], [2,3,5,6,9,10,11], [1,3,4,5,7,8,10,11], [1,4,7,8,10,11,12], [3,4,5,7,9,10,11], [3,5,6,11], [3,6,10,11]],
  [MARS]:    [[3,5,6,10,11], [3,6,11], [1,2,4,7,8,10,11], [3,5,6,11], [6,10,11,12], [6,8,11,12], [1,4,7,8,9,10,11], [1,3,6,10,11]],
  [MERCURY]: [[5,6,9,11,12], [2,4,6,8,10,11], [1,2,4,7,8,9,10,11], [1,3,5,6,9,10,11,12], [6,8,11,12], [1,2,3,4,5,8,9,11], [1,2,4,7,8,9,10,11], [1,2,4,6,8,10,11]],
  [JUPITER]: [[1,2,3,4,7,8,9,10,11], [2,5,7,9,11], [1,2,4,7,8,10,11], [1,2,4,5,6,9,10,11], [1,2,3,4,7,8,10,11], [2,5,6,9,10,11], [3,5,6,12], [1,2,4,5,6,7,9,10,11]],
  [VENUS]:   [[8,11,12], [1,2,3,4,5,8,9,11,12], [3,4,6,9,11,12], [3,5,6,9,11], [5,8,9,10,11], [1,2,3,4,5,8,9,10,11], [3,4,5,8,9,10,11], [1,2,3,4,5,8,9,11]],
  [SATURN]:  [[1,2,4,7,8,10,11], [3,6,11], [3,5,6,10,11,12], [6,8,9,10,11,12], [5,6,11,12], [6,11,12], [3,5,6,11], [1,3,4,6,10,11]],
};
export const EXPECTED_TOTALS = { [SUN]: 48, [MOON]: 49, [MARS]: 39, [MERCURY]: 54, [JUPITER]: 56, [VENUS]: 52, [SATURN]: 39 };

/** Rasi multipliers Aries..Pisces and graha multipliers Sun..Saturn for the pindas. */
export const RASI_MANA = [7, 10, 8, 4, 10, 6, 7, 8, 9, 5, 11, 12];
export const GRAHA_MANA = [5, 5, 8, 5, 10, 7, 5];
/** Sign pairs with one lord (Ekadhipatya): Mars, Mercury, Jupiter, Venus, Saturn. */
const LORD_PAIRS = [[0, 7], [2, 5], [8, 11], [1, 6], [9, 10]];

/**
 * @param signs  array: signs[p] = rasi index (0..11) of Sun..Saturn (indices 0..6); signs[7] = Lagna sign
 * @param occupied  set/array of rasi indices occupied by any of the seven planets
 */
export const ASHTAKAVARGA_DEFAULTS = Object.freeze({
  /** Ekadhipatya, one sign occupied and the empty sign holding more bindus: 'replace' the empty sign's count with the occupied sign's (Narasimha Rao, Raman) | 'subtract' the occupied sign's count from it (Maitreya) */
  emptyHigher: 'replace',
});

export function computeAshtakavarga(signs, occupied, options = {}) {
  const opt = { ...ASHTAKAVARGA_DEFAULTS, ...options };
  const occ = new Set(occupied);
  const bav = {}, prastara = {};
  for (const p of SEVEN) {
    const grid = []; // 8 contributors × 12 signs
    const row = new Array(12).fill(0);
    BINDU_TABLE[p].forEach((houses, c) => {
      const line = new Array(12).fill(0);
      const from = signs[c]; // c = 7 → Lagna
      for (const h of houses) { const r = (from + h - 1) % 12; line[r] = 1; row[r] += 1; }
      grid.push(line);
    });
    bav[p] = row; prastara[p] = grid;
  }
  const sav = new Array(12).fill(0);
  for (const p of SEVEN) for (let r = 0; r < 12; r++) sav[r] += bav[p][r];

  // Trikona shodhana: in each trine, if none is zero subtract the smallest from all three.
  const trikona = {};
  for (const p of SEVEN) {
    const row = bav[p].slice();
    for (let t = 0; t < 4; t++) {
      const idx = [t, t + 4, t + 8];
      const vals = idx.map(i => row[i]);
      if (vals.some(v => v === 0)) continue;
      const m = Math.min(...vals);
      for (const i of idx) row[i] -= m;
    }
    trikona[p] = row;
  }
  // Ekadhipatya shodhana on the five two-sign lords.
  const ekadhipatya = {};
  for (const p of SEVEN) {
    const row = trikona[p].slice();
    for (const [a, b] of LORD_PAIRS) {
      const va = row[a], vb = row[b];
      if (va === 0 || vb === 0) continue;
      const oa = occ.has(a), ob = occ.has(b);
      if (oa && ob) continue;
      if (!oa && !ob) { if (va === vb) { row[a] = 0; row[b] = 0; } else { const m = Math.min(va, vb); row[a] = m; row[b] = m; } continue; }
      const [full, empty] = oa ? [a, b] : [b, a];
      row[empty] = row[empty] < row[full] ? 0 : (opt.emptyHigher === 'subtract' ? row[empty] - row[full] : row[full]);
    }
    ekadhipatya[p] = row;
  }
  const savReduced = new Array(12).fill(0);
  for (const p of SEVEN) for (let r = 0; r < 12; r++) savReduced[r] += ekadhipatya[p][r];

  // Pindas from the fully reduced bindus.
  const rasiPinda = {}, grahaPinda = {}, shodhyaPinda = {};
  for (const p of SEVEN) {
    rasiPinda[p] = ekadhipatya[p].reduce((s, v, r) => s + v * RASI_MANA[r], 0);
    grahaPinda[p] = SEVEN.reduce((s, q) => s + ekadhipatya[p][signs[q]] * GRAHA_MANA[q], 0);
    shodhyaPinda[p] = rasiPinda[p] + grahaPinda[p];
  }
  const totals = Object.fromEntries(SEVEN.map(p => [p, bav[p].reduce((a, b) => a + b, 0)]));
  return { bav, sav, prastara, trikona, ekadhipatya, savReduced, rasiPinda, grahaPinda, shodhyaPinda, totals, savTotal: sav.reduce((a, b) => a + b, 0) };
}

/** Convenience: build from a computed chart. */
export function ashtakavargaFromChart(chart, options = {}) {
  const signs = SEVEN.map(p => chart.planets[p].sign);
  signs[7] = chart.lagnaSign;
  return computeAshtakavarga(signs, SEVEN.map(p => chart.planets[p].sign), options);
}
