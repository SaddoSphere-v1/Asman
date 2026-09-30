import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { getEph, FIXTURE_DIR } from './helpers.mjs';
import { computeChart } from '../src/chart.js';
import { divisionalCharts, vargaSign, vargaDegree, vargaLongitude, SHODASAVARGA, VIMSHOPAKA } from '../src/vargas.js';

const fixtures = JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, 'vargas.json'), 'utf8'));

test('fifteen Parashari vargas match PyJHora for Lagna and nine grahas; Hora follows Parashara (Leo/Cancer only)', async () => {
  const eph = await getEph();
  for (const fx of fixtures) {
    const chart = computeChart(eph, fx.input);
    for (const v of divisionalCharts(chart).charts) {
      const signs = v.planets.map(x => x.sign);
      if (v.D === 2) { assert.ok([3, 4].includes(v.lagna.sign)); signs.forEach(s => assert.ok([3, 4].includes(s))); continue; }
      const o = fx.vargas[String(v.D)];
      assert.equal(v.lagna.sign, o.lagna, `${fx.input.id} D${v.D} lagna`);
      assert.deepEqual(signs, o.planets, `${fx.input.id} D${v.D}`);
    }
  }
});

test('division rules at exact boundaries', () => {
  // Aries 0° → every varga starts at Aries except Hora (Leo, odd sign first half), Chaturvimsamsa (Leo), Nakshatramsa (Aries for fire)
  assert.equal(vargaSign(0, 2), 4); assert.equal(vargaSign(0, 24), 4); assert.equal(vargaSign(0, 27), 0);
  for (const D of SHODASAVARGA) if (![2, 24].includes(D)) assert.equal(vargaSign(0, D), 0, `D${D} at 0° Aries`);
  // Taurus 0°: fixed → Shodasamsa from Leo, Vimsamsa from Sagittarius, Akshavedamsa from Leo; even → Dasamsa from 9th (Capricorn), Khavedamsa from Libra, Chaturvimsamsa from Cancer
  assert.equal(vargaSign(30, 16), 4); assert.equal(vargaSign(30, 20), 8); assert.equal(vargaSign(30, 45), 4);
  assert.equal(vargaSign(30, 10), 9); assert.equal(vargaSign(30, 40), 6); assert.equal(vargaSign(30, 24), 3);
  // Gemini 0°: air → Nakshatramsa from Libra; dual → Shodasamsa from Sagittarius, Vimsamsa from Leo
  assert.equal(vargaSign(60, 27), 6); assert.equal(vargaSign(60, 16), 8); assert.equal(vargaSign(60, 20), 4);
  // Shashtiamsa: Aries 29.5° → part 59 → (0 + 59) % 12 = Sagittarius
  assert.equal(vargaSign(29.5, 60), 11 % 12 === 11 ? 11 : 11); assert.equal((0 + 59) % 12, 11);
  // Chaturthamsa: Aries 22.5° → 4th part → Capricorn
  assert.equal(vargaSign(22.5, 4), 9);
});

test('varga longitudes: degree within the varga sign scales each part to 30°, including hora and the unequal trimsamsa', () => {
  assert.ok(Math.abs(vargaDegree(22.5, 2) - 15) < 1e-9);          // second hora, halfway → 15°
  assert.ok(Math.abs(vargaDegree(3 + 1 / 3 + 1, 9) - 9) < 1e-9);  // 1° into the second navamsa → 9°
  assert.ok(Math.abs(vargaDegree(14, 30) - 15) < 1e-9);           // odd sign: Jupiter's part 10–18, 14 is halfway → 15°
  assert.ok(Math.abs(vargaDegree(30 + 16, 30) - 15) < 1e-9);      // even sign: Jupiter's part 12–20, 16 is halfway → 15°
  assert.ok(Math.abs(vargaLongitude(0.25, 60) - 15) < 1e-9);      // first shashtiamsa, halfway → Aries 15°
});

test('Vimshopaka: weights total 20 per scheme; scores stay within 0..20; vargottama is flagged when a planet keeps its rasi sign', async () => {
  for (const w of Object.values(VIMSHOPAKA)) assert.ok(Math.abs(Object.values(w).reduce((a, b) => a + b, 0) - 20) < 1e-9);
  const eph = await getEph();
  const dv = divisionalCharts(computeChart(eph, fixtures[0].input));
  for (let p = 0; p <= 6; p++) for (const v of Object.values(dv.vimshopaka[p])) assert.ok(v >= 5 && v <= 20);
  const nav = dv.charts.find(v => v.D === 9);
  nav.planets.forEach((x, p) => assert.equal(x.vargottama, x.sign === fixtures[0].vargas['1'].planets[p]));
});

test('upagrahas and special lagnas map into every varga by the same division rule', async () => {
  const eph = await getEph();
  const chart = computeChart(eph, fixtures[0].input);
  const extra = [{ name: 'Gulika', lon: 123.456, group: 'upagraha' }, { name: 'Hora lagna', lon: 359.9, group: 'lagna' }];
  for (const v of divisionalCharts(chart, extra).charts) {
    assert.equal(v.points.length, 2);
    assert.equal(v.points[0].sign, vargaSign(123.456, v.D));
    assert.equal(v.points[1].sign, vargaSign(359.9, v.D));
    assert.equal(v.points[0].house, ((v.points[0].sign - v.lagna.sign) % 12 + 12) % 12 + 1);
  }
});
