import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { getEph, FIXTURE_DIR } from './helpers.mjs';
import { computeChart } from '../src/chart.js';
import { computeSpecialLagnas, charaKarakas } from '../src/lagnas.js';
import { norm360, localHours } from '../src/time.js';

const fixtures = JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, 'lagnas.json'), 'utf8'));
const NAMES = { bhava: 'Bhava lagna', hora: 'Hora lagna', ghati: 'Ghati lagna', vighati: 'Vighati lagna', pranapada: 'Pranapada lagna', varnada: 'Varnada lagna', sree: 'Sree lagna', indu: 'Indu lagna', bhrigu: 'Bhrigu Bindu' };
const near = (a, b, tol) => Math.abs(norm360(a - b + 180) - 180) < tol;

test('Varnada, Sree, Indu lagnas and Bhrigu Bindu match PyJHora', async () => {
  const eph = await getEph();
  for (const fx of fixtures) {
    const chart = computeChart(eph, fx.input);
    const L = Object.fromEntries(computeSpecialLagnas(eph, chart).map(x => [x.name, x]));
    // PyJHora's time-based lagnas take the Sun at sunrise with the zone offset applied twice and run Vighati at 15°/min; those are checked against Jagannatha Hora's own values instead (jhora-reference.test.mjs)
    for (const key of ['sree', 'indu', 'bhrigu', 'varnada']) {
      const exp = fx.lagnas[key];
      if (exp == null) continue;
      if (key === 'varnada' && !(fx.input.hour + fx.input.minute / 60 > localHours(chart.day.sunrise, fx.input.utcOffset))) continue; // PyJHora's Hora lagna is wrong before sunrise
      assert.ok(near(L[NAMES[key]].lon, exp, 1e-6), `${fx.input.id} ${NAMES[key]}: ${L[NAMES[key]].lon} vs ${exp}`);
    }
  }
});

test('chara karakas (eight-karaka scheme, Rahu from the end of its sign) match PyJHora', async () => {
  const eph = await getEph();
  for (const fx of fixtures) {
    const chart = computeChart(eph, fx.input);
    assert.deepEqual(charaKarakas(chart).map(k => k.planet), fx.karakas, fx.input.id);
  }
});

test('lagna rates: Hora lagna moves one sign per hour, Ghati lagna one sign per ghati', async () => {
  const eph = await getEph();
  const a = computeChart(eph, { year: 2000, month: 1, day: 1, hour: 12, minute: 0, second: 0, utcOffset: 5.5, lat: 23.1765, lon: 75.7885 });
  const b = computeChart(eph, { year: 2000, month: 1, day: 1, hour: 13, minute: 0, second: 0, utcOffset: 5.5, lat: 23.1765, lon: 75.7885 });
  const la = Object.fromEntries(computeSpecialLagnas(eph, a).map(x => [x.name, x.lon])), lb = Object.fromEntries(computeSpecialLagnas(eph, b).map(x => [x.name, x.lon]));
  const sunMove = norm360(b.planets[0].lon - a.planets[0].lon);
  assert.ok(near(lb['Hora lagna'] - la['Hora lagna'], 30 + sunMove, 1e-4));
  assert.ok(near(lb['Bhava lagna'] - la['Bhava lagna'], 15 + sunMove, 1e-4));
  assert.ok(near(lb['Ghati lagna'] - la['Ghati lagna'], 75 + sunMove, 1e-4));
  assert.ok(near(lb['Vighati lagna'] - la['Vighati lagna'], 300 + sunMove, 1e-4));
});
