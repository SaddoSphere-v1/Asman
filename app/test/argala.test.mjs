import { test } from 'node:test';
import assert from 'node:assert/strict';
import { argalaOn, computeArgala } from '../src/argala.js';
import { SUN, MOON, MARS, MERCURY, JUPITER, VENUS, SATURN, RAHU, KETU } from '../src/constants.js';
import { getEph } from './helpers.mjs';
import { computeChart } from '../src/chart.js';

const chart = (signs, lagnaSign) => ({ planets: signs.map((s, p) => ({ index: p, sign: s })), lagnaSign });

test('argala houses and obstructions from a reference sign', () => {
  // Reference Aries (0): Jupiter in Taurus (2nd) gives dhanargala; Saturn in Pisces (12th) obstructs it (tie → obstructed)
  const c = chart([8, 8, 8, 8, 1, 8, 11, 8, 8], 0);
  const a = argalaOn(c, 0);
  assert.deepEqual(a.second.giving, [JUPITER]); assert.deepEqual(a.second.obstructing, [SATURN]); assert.equal(a.second.obstructed, true);
  assert.equal(argalaOn(c, 0, { tieObstructs: false }).second.obstructed, false);
  // two planets in the 4th (Cancer) against one in the 10th (Capricorn) → not obstructed
  const c2 = chart([3, 3, 9, 8, 8, 8, 8, 8, 8], 0);
  const b = argalaOn(c2, 0);
  assert.deepEqual(b.fourth.giving, [SUN, MOON]); assert.deepEqual(b.fourth.obstructing, [MARS]); assert.equal(b.fourth.obstructed, false);
  // vipareeta argala: only malefics in the 3rd count (Gemini): Mars yes, Venus no
  const c3 = chart([8, 8, 2, 8, 8, 2, 8, 8, 8], 0);
  assert.deepEqual(argalaOn(c3, 0).vipareeta.giving, [MARS]);
  // eleventh (Aquarius, 10) obstructed by the third (Gemini, 2); fifth (Leo, 4) obstructed by the ninth (Sagittarius, 8)
  const c4 = chart([10, 2, 4, 8, 8, 8, 8, 8, 8], 0);
  const d = argalaOn(c4, 0);
  assert.deepEqual(d.eleventh.giving, [SUN]); assert.deepEqual(d.eleventh.obstructing, [MOON]);
  assert.deepEqual(d.fifth.giving, [MARS]); assert.ok(d.fifth.obstructing.includes(MERCURY));
  // node reversal option: Rahu in the 12th from Aries counts as the 2nd when reversed
  const c5 = chart([8, 8, 8, 8, 8, 8, 8, 11, 5], 0);
  assert.deepEqual(argalaOn(c5, 0).second.giving, []); assert.deepEqual(argalaOn(c5, 0, { reverseNodes: true }).second.giving, [RAHU]);
});

test('computeArgala covers twelve houses and nine grahas on a real chart', async () => {
  const eph = await getEph();
  const c = computeChart(eph, { year: 1985, month: 6, day: 15, hour: 14, minute: 30, second: 0, utcOffset: 5.5, lat: 13.0827, lon: 80.2707 });
  const ag = computeArgala(c);
  assert.equal(ag.houses.length, 12); assert.equal(ag.planets.length, 9);
  assert.equal(ag.houses[0].sign, c.lagnaSign);
  for (const r of [...ag.houses, ...ag.planets]) for (const k of ['second', 'fourth', 'eleventh', 'fifth', 'vipareeta']) assert.ok(Array.isArray(r.argala[k].giving));
});
