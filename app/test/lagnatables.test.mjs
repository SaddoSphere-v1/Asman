import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getEph } from './helpers.mjs';
import { computeChart } from '../src/chart.js';
import { computeSpecialLagnas } from '../src/lagnas.js';
import { specialLagnaTables } from '../src/lagnatables.js';
import { sputaDrishti } from '../src/shadbala.js';
import { NINE, RAHU, KETU } from '../src/constants.js';
import { arc } from '../src/time.js';

const input = { year: 1985, month: 6, day: 15, hour: 14, minute: 30, second: 0, utcOffset: 5.5, lat: 13.0827, lon: 80.2707 };

test('houses and aspects from each special lagna', async () => {
  const eph = await getEph();
  const chart = computeChart(eph, input);
  const lagnas = computeSpecialLagnas(eph, chart);
  const T = specialLagnaTables({ chart, lagnas, special: 'parasara' });
  assert.equal(T.length, lagnas.length);
  const P = chart.planets;
  for (const [i, t] of T.entries()) {
    const L = lagnas[i];
    assert.equal(t.name, L.name);
    assert.equal(t.sign, Math.floor(L.lon / 30));
    for (const p of NINE) {
      assert.equal(t.houses[p], ((P[p].sign - t.sign + 12) % 12) + 1);
      const exp = sputaDrishti(arc(P[p].lon, L.lon), p === RAHU || p === KETU ? -1 : p, 'parasara');
      assert.equal(t.aspects[p], exp);
      assert.ok(t.aspects[p] >= 0 && t.aspects[p] <= 60);
    }
    assert.ok(Math.abs(t.aspectTotal - t.aspects.reduce((a, b) => a + b, 0)) < 1e-9);
  }
});

test('an unavailable lagna passes through without derived tables', async () => {
  const eph = await getEph();
  const chart = computeChart(eph, input);
  const T = specialLagnaTables({ chart, lagnas: [{ name: 'Hora lagna', lon: null, unavailable: 'no sunrise at this latitude' }] });
  assert.equal(T.length, 1);
  assert.equal(T[0].lon, null); assert.equal(T[0].unavailable, 'no sunrise at this latitude'); assert.equal(T[0].houses, undefined);
});
