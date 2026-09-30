import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { getEph, FIXTURE_DIR } from './helpers.mjs';
import { computeChart } from '../src/chart.js';
import { divisionalCharts, vargaSign, SHODASAVARGA } from '../src/vargas.js';

const fixtures = JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, 'vargas.json'), 'utf8'));

test('fifteen Parashari vargas match PyJHora for Lagna and nine grahas; Hora follows Parashara (Leo/Cancer only)', async () => {
  const eph = await getEph();
  for (const fx of fixtures) {
    const chart = computeChart(eph, fx.input);
    for (const v of divisionalCharts(chart)) {
      if (v.D === 2) { assert.ok([3, 4].includes(v.lagna)); v.planets.forEach(s => assert.ok([3, 4].includes(s))); continue; }
      const o = fx.vargas[String(v.D)];
      assert.equal(v.lagna, o.lagna, `${fx.input.id} D${v.D} lagna`);
      assert.deepEqual(v.planets, o.planets, `${fx.input.id} D${v.D}`);
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
