import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getEph } from './helpers.mjs';
import { computeChart } from '../src/chart.js';
import { computeSpecialLagnas } from '../src/lagnas.js';
import { specialLagnaTables } from '../src/lagnatables.js';
import { ashtakavargaFromChart } from '../src/ashtakavarga.js';
import { argalaOn } from '../src/argala.js';
import { sputaDrishti } from '../src/shadbala.js';
import { vargaSign, SHODASAVARGA } from '../src/vargas.js';
import { NINE, SEVEN, RAHU, KETU, SIGN_LORD } from '../src/constants.js';
import { arc, norm360 } from '../src/time.js';

const input = { year: 1985, month: 6, day: 15, hour: 14, minute: 30, second: 0, utcOffset: 5.5, lat: 13.0827, lon: 80.2707 };

test('tables from each special lagna: houses, bhavas, lords, aspects, argala, bindus, vargas', async () => {
  const eph = await getEph();
  const chart = computeChart(eph, input);
  const lagnas = computeSpecialLagnas(eph, chart);
  const av = ashtakavargaFromChart(chart);
  const T = specialLagnaTables({ chart, lagnas, ashtakavarga: av, special: 'parasara' });
  assert.equal(T.length, lagnas.length);
  const P = chart.planets;
  for (const [i, t] of T.entries()) {
    const L = lagnas[i];
    assert.equal(t.name, L.name);
    assert.equal(t.sign, Math.floor(L.lon / 30));
    for (const p of NINE) {
      // whole-sign house from the lagna sign
      assert.equal(t.houses[p], ((P[p].sign - t.sign + 12) % 12) + 1);
      // equal bhava: 30° houses centred on the lagna degree, so the bhava starts 15° before it
      const expBhava = Math.floor(arc(norm360(L.lon - 15), P[p].lon) / 30) + 1;
      assert.equal(t.bhavas[p], expBhava, `${L.name} bhava of ${p}`);
      // sputa drishti of graha p on the lagna
      const exp = sputaDrishti(arc(P[p].lon, L.lon), p === RAHU || p === KETU ? -1 : p, 'parasara');
      assert.equal(t.aspects[p], exp);
      assert.ok(t.aspects[p] >= 0 && t.aspects[p] <= 60);
    }
    assert.ok(Math.abs(t.aspectTotal - t.aspects.reduce((a, b) => a + b, 0)) < 1e-9);
    // lords
    assert.equal(t.lord.planet, SIGN_LORD[t.sign]);
    assert.equal(t.lord.house, ((P[t.lord.planet].sign - t.sign + 12) % 12) + 1);
    assert.equal(t.nakshatraLord.planet, L.nakshatra.lord);
    assert.ok(t.lord.dignity);
    // argala identical to argalaOn for the lagna sign
    assert.deepEqual(t.argala, argalaOn(chart, t.sign));
    // bindus of the lagna sign
    assert.equal(t.bindus.total, av.sav[t.sign]);
    assert.equal(t.bindus.perPlanet.reduce((a, b) => a + b, 0), t.bindus.total);
    assert.equal(t.bindus.reduced, av.savReduced[t.sign]);
    for (const [k, p] of SEVEN.entries()) assert.equal(t.bindus.perPlanet[k], av.bav[p][t.sign]);
    // divisional signs
    assert.equal(t.vargas.length, 16);
    t.vargas.forEach((v, k) => { assert.equal(v.D, SHODASAVARGA[k]); assert.equal(v.sign, vargaSign(L.lon, v.D)); assert.ok(v.deg >= 0 && v.deg < 30); });
    assert.equal(t.vargas[0].sign, t.sign);
  }
});

test('an unavailable lagna passes through without derived tables', async () => {
  const eph = await getEph();
  const chart = computeChart(eph, input);
  const T = specialLagnaTables({ chart, lagnas: [{ name: 'Hora lagna', lon: null, unavailable: 'no sunrise at this latitude' }] });
  assert.equal(T.length, 1);
  assert.equal(T[0].lon, null); assert.equal(T[0].unavailable, 'no sunrise at this latitude'); assert.equal(T[0].houses, undefined);
});

test('bindus are omitted when no Ashtakavarga is supplied', async () => {
  const eph = await getEph();
  const chart = computeChart(eph, input);
  const T = specialLagnaTables({ chart, lagnas: computeSpecialLagnas(eph, chart) });
  for (const t of T) assert.equal(t.bindus, null);
});
