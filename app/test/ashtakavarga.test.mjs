import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { getEph, FIXTURE_DIR } from './helpers.mjs';
import { computeChart } from '../src/chart.js';
import { computeAshtakavarga, ashtakavargaFromChart, BINDU_TABLE, EXPECTED_TOTALS } from '../src/ashtakavarga.js';

test('bindu tables carry the classical totals (48, 49, 39, 54, 56, 52, 39 = 337)', () => {
  let all = 0;
  for (const [p, t] of Object.entries(BINDU_TABLE)) { const n = t.reduce((s, h) => s + h.length, 0); assert.equal(n, EXPECTED_TOTALS[p]); all += n; }
  assert.equal(all, 337);
});

test('Bhinnashtakavarga, Sarvashtakavarga, reductions and pindas match the oracle', async () => {
  const eph = await getEph();
  const fixtures = JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, 'ashtakavarga.json'), 'utf8'));
  for (const fx of fixtures) {
    const chart = computeChart(eph, fx.input);
    const signs = [0, 1, 2, 3, 4, 5, 6].map(p => chart.planets[p].sign); signs[7] = chart.lagnaSign;
    assert.deepEqual(signs, fx.signs, `${fx.input.id} signs`);
    const av = ashtakavargaFromChart(chart);
    for (let p = 0; p < 7; p++) {
      assert.deepEqual(av.bav[p], fx.bav[p], `${fx.input.id} bav ${p}`);
      assert.deepEqual(av.trikona[p], fx.trikona[p], `${fx.input.id} trikona ${p}`);
      assert.deepEqual(av.ekadhipatya[p], fx.ekadhipatya[p], `${fx.input.id} ekadhipatya ${p}`);
      assert.equal(av.rasiPinda[p], fx.rasiPinda[p], `${fx.input.id} rasi pinda ${p}`);
      assert.equal(av.grahaPinda[p], fx.grahaPinda[p], `${fx.input.id} graha pinda ${p}`);
      assert.equal(av.shodhyaPinda[p], fx.shodhyaPinda[p], `${fx.input.id} shodhya pinda ${p}`);
    }
    assert.deepEqual(av.sav, fx.sav, `${fx.input.id} sav`);
    assert.equal(av.savTotal, 337);
  }
});

test('reduction rules on a synthetic chart', () => {
  // all planets in Aries, lagna Aries: every trine carries bindus in one sign only → no trikona reduction unless all three non-zero
  const av = computeAshtakavarga([0, 0, 0, 0, 0, 0, 0, 0], [0]);
  for (let p = 0; p < 7; p++) {
    for (let t = 0; t < 4; t++) {
      const v = [av.bav[p][t], av.bav[p][t + 4], av.bav[p][t + 8]];
      const r = [av.trikona[p][t], av.trikona[p][t + 4], av.trikona[p][t + 8]];
      if (v.includes(0)) assert.deepEqual(r, v); else assert.equal(Math.min(...r), 0);
    }
    // Ekadhipatya: Aries occupied, Scorpio empty → Scorpio becomes 0 (if lower) or equal to Aries (if higher)
    const a = av.trikona[p][0], s = av.trikona[p][7];
    if (a && s) assert.equal(av.ekadhipatya[p][7], s < a ? 0 : a);
  }
});
