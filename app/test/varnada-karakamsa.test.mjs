import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { getEph, FIXTURE_DIR } from './helpers.mjs';
import { computeChart } from '../src/chart.js';
import { computeSpecialLagnas, varnadaLagnas, karakamsa, charaKarakas } from '../src/lagnas.js';
import { navamsaSign } from '../src/vargas.js';
import { countSigns, signAspects } from '../src/arudhas.js';
import { NINE } from '../src/constants.js';
import { norm360, localHours } from '../src/time.js';

const near = (a, b, tol) => Math.abs(norm360(a - b + 180) - 180) < tol;

test('Varnada lagnas of the twelve houses match PyJHora (B.V. Raman / Narasimha Rao method)', async () => {
  const eph = await getEph();
  const fixtures = JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, 'varnada.json'), 'utf8'));
  let compared = 0;
  for (const fx of fixtures) {
    const chart = computeChart(eph, fx.input);
    const lagnas = computeSpecialLagnas(eph, chart);
    const V = varnadaLagnas(chart, lagnas);
    if (chart.day.polar) { assert.equal(V.length, 0); continue; }
    assert.equal(V.length, 12);
    assert.ok(near(V[0].lon, lagnas.find(l => l.name === 'Varnada lagna').lon, 1e-9));
    if (!(fx.input.hour + fx.input.minute / 60 > localHours(chart.day.sunrise, fx.input.utcOffset))) continue; // PyJHora's Hora lagna is wrong before sunrise
    V.forEach((v, i) => { assert.equal(v.house, i + 1); assert.ok(near(v.lon, fx.varnada[i], 1e-6), `${fx.input.id} V${i + 1}: ${v.lon} vs ${fx.varnada[i]}`); compared++; });
  }
  assert.ok(compared >= 48);
});

test('Karakamsa is the Atmakaraka\'s navamsa sign, read in the rasi and in the navamsa', async () => {
  const eph = await getEph();
  const chart = computeChart(eph, { year: 1985, month: 6, day: 15, hour: 14, minute: 30, second: 0, utcOffset: 5.5, lat: 13.0827, lon: 80.2707 });
  const K = karakamsa(chart);
  const ak = charaKarakas(chart)[0].planet;
  assert.equal(K.atmakaraka, ak);
  assert.equal(K.sign, navamsaSign(chart.planets[ak].lon));
  for (const p of NINE) {
    const x = K.planets[p];
    assert.equal(x.planet, p);
    assert.equal(x.rasiHouse, countSigns(K.sign, chart.planets[p].sign));
    assert.equal(x.navamsaSign, navamsaSign(chart.planets[p].lon));
    assert.equal(x.navamsaHouse, countSigns(K.sign, x.navamsaSign));
  }
  assert.ok(K.navamsaOccupants.includes(ak)); // the Atmakaraka itself sits in Swamsa
  assert.deepEqual(K.rasiAspecting, NINE.filter(p => signAspects(chart.planets[p].sign, K.sign)));
});
