import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { getEph, FIXTURE_DIR } from './helpers.mjs';
import { computeChart } from '../src/chart.js';

const fixtures = JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, 'positions.json'), 'utf8'));
const ARCSEC = 1 / 3600;

test('planet longitudes, latitudes, speeds, declinations match pyswisseph', async () => {
  const eph = await getEph();
  for (const fx of fixtures) {
    const c = computeChart(eph, fx.input);
    assert.ok(Math.abs(c.jdUt - fx.jdUt) < 1e-9, `${fx.input.id} jd`);
    assert.ok(Math.abs(c.ayanamsa - fx.ayanamsa) < 1e-9, `${fx.input.id} ayanamsa`);
    for (const [idx, ref] of Object.entries(fx.planets)) {
      const P = c.planets[+idx];
      assert.ok(Math.abs(P.lon - ref.lon) < 1e-7, `${fx.input.id} planet ${idx} lon ${P.lon} vs ${ref.lon}`);
      assert.ok(Math.abs(P.lat - ref.lat) < 1e-7, `${fx.input.id} planet ${idx} lat`);
      assert.ok(Math.abs(P.speed - ref.speed) < 1e-7, `${fx.input.id} planet ${idx} speed`);
      assert.ok(Math.abs(P.dec - ref.dec) < 1e-7, `${fx.input.id} planet ${idx} dec`);
    }
    // apparent positions when truePositions is off
    const ca = computeChart(eph, fx.input, { truePositions: false });
    for (const [idx, ref] of Object.entries(fx.planets)) assert.ok(Math.abs(ca.planets[+idx].lon - ref.apparentLon) < 1e-7, `${fx.input.id} planet ${idx} apparent lon`);
    // Ketu opposite Rahu
    assert.ok(Math.abs(((c.planets[8].lon - c.planets[7].lon) % 360 + 360) % 360 - 180) < 1e-9, 'Ketu = Rahu + 180');
  }
});

test('ascendant, MC and Placidus cusps match pyswisseph', async () => {
  const eph = await getEph();
  for (const fx of fixtures) {
    const c = computeChart(eph, fx.input);
    assert.ok(Math.abs(c.asc - fx.asc) < 1e-7, `${fx.input.id} asc`);
    assert.ok(Math.abs(c.mc - fx.mc) < 1e-7, `${fx.input.id} mc`);
    for (let i = 1; i <= 12; i++) assert.ok(Math.abs(c.placidusCusps[i] - fx.cusps[i - 1]) < 1e-7, `${fx.input.id} cusp ${i}`);
  }
});

test('Hindu-day sunrise/sunset/next sunrise match pyswisseph (disc centre, no refraction)', async () => {
  const eph = await getEph();
  for (const fx of fixtures) {
    const c = computeChart(eph, fx.input);
    if (fx.day.error || fx.day.sunrise == null) { assert.ok(c.day.polar, `${fx.input.id} polar`); continue; }
    assert.ok(!c.day.polar, `${fx.input.id} not polar`);
    assert.ok(Math.abs(c.day.sunrise - fx.day.sunrise) < 1e-6, `${fx.input.id} sunrise ${c.day.sunrise} vs ${fx.day.sunrise}`);
    assert.ok(Math.abs(c.day.sunset - fx.day.sunset) < 1e-6, `${fx.input.id} sunset`);
    assert.ok(Math.abs(c.day.nextSunrise - fx.day.nextSunrise) < 1e-6, `${fx.input.id} next sunrise`);
  }
});

test('sanity: sign, nakshatra, house and Sripati bhavas are consistent', async () => {
  const eph = await getEph();
  const c = computeChart(eph, fixtures[0].input);
  for (const P of c.planets) {
    assert.equal(P.sign, Math.floor(P.lon / 30));
    assert.ok(P.nakshatra.pada >= 1 && P.nakshatra.pada <= 4);
    assert.ok(P.house >= 1 && P.house <= 12 && P.bhava >= 1 && P.bhava <= 12);
  }
  assert.ok(Math.abs(c.bhavas.madhya[1] - c.asc) < 1e-9 && Math.abs(c.bhavas.madhya[10] - c.mc) < 1e-9);
  // consecutive madhyas increase around the circle
  let total = 0; for (let i = 1; i <= 12; i++) total += ((c.bhavas.madhya[i % 12 + 1] - c.bhavas.madhya[i]) % 360 + 360) % 360;
  assert.ok(Math.abs(total - 360) < 1e-6);
});
