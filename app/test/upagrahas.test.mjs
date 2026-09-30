import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { getEph, FIXTURE_DIR } from './helpers.mjs';
import { computeChart } from '../src/chart.js';
import { computeUpagrahas, portionLords } from '../src/upagrahas.js';
import { computeSpecialLagnas } from '../src/lagnas.js';
import { norm360 } from '../src/time.js';

test('portion lords: eight-slot cycle entered at the weekday lord (day) or fifth weekday lord (night)', () => {
  assert.deepEqual(portionLords(0, true), [0, 1, 2, 3, 4, 5, 6, null]);           // Sunday day
  assert.deepEqual(portionLords(1, true), [1, 2, 3, 4, 5, 6, null, 0]);           // Monday day: lordless slot follows Saturn
  assert.deepEqual(portionLords(6, true), [6, null, 0, 1, 2, 3, 4, 5]);           // Saturday day (Jagannatha Hora reference chart)
  assert.deepEqual(portionLords(0, false), [4, 5, 6, null, 0, 1, 2, 3]);          // Sunday night → Jupiter first
  assert.deepEqual(portionLords(6, false), [3, 4, 5, 6, null, 0, 1, 2]);          // Saturday night → Mercury first
  assert.deepEqual(portionLords(1, true, 'eighth'), [1, 2, 3, 4, 5, 6, 0, null]); // classical alternative
});

test('Sun-based upagrahas obey the BPHS chain and Upaketu + 30° = Sun', async () => {
  const eph = await getEph();
  const chart = computeChart(eph, { year: 1985, month: 6, day: 15, hour: 14, minute: 30, second: 0, utcOffset: 5.5, lat: 13.0827, lon: 80.2707 });
  const u = Object.fromEntries(computeUpagrahas(eph, chart).map(x => [x.name, x]));
  const sun = chart.planets[0].lon;
  assert.ok(Math.abs(norm360(u.Dhuma.lon - sun - (133 + 20 / 60))) < 1e-9);
  assert.ok(Math.abs(norm360(u.Vyatipata.lon + u.Dhuma.lon)) < 1e-9);
  assert.ok(Math.abs(norm360(u.Parivesha.lon - u.Vyatipata.lon - 180)) < 1e-9);
  assert.ok(Math.abs(norm360(u.Indrachapa.lon + u.Parivesha.lon)) < 1e-9);
  assert.ok(Math.abs(norm360(u.Upaketu.lon + 30 - sun)) < 1e-9);
});

test('kalavelas and Pranapada match the independent pyswisseph implementation', async () => {
  const file = path.join(FIXTURE_DIR, 'upagrahas.json');
  if (!fs.existsSync(file)) { console.log('no upagraha fixtures'); return; }
  const eph = await getEph();
  for (const fx of JSON.parse(fs.readFileSync(file, 'utf8'))) {
    const chart = computeChart(eph, fx.input);
    const ups = Object.fromEntries(computeUpagrahas(eph, chart).map(x => [x.name, x]));
    const pl = computeSpecialLagnas(eph, chart).find(x => x.name === 'Pranapada lagna');
    ups.Pranapada = { lon: pl.lon == null ? null : pl.lon };
    for (const [name, lon] of Object.entries(fx.expected)) {
      if (lon == null) { assert.equal(ups[name].lon, null, `${fx.input.id} ${name} unavailable`); continue; }
      assert.ok(Math.abs(norm360(ups[name].lon - lon + 180) - 180) < 1e-6, `${fx.input.id} ${name}: ${ups[name].lon} vs ${lon}`);
    }
  }
});
