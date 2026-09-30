// Regression against V.P. Jain, "Shadbala and Bhavabala" worked example (13 Sep 1981, 01:30 IST, Delhi 28°39'N 77°13'E),
// as transcribed in PyJHora's test-suite. Components whose method the book shares with Raman/JHora must match closely.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getEph } from './helpers.mjs';
import { computeChart } from '../src/chart.js';
import { computeShadbala, sputaDrishti, ssKranti, ramanAhargana } from '../src/shadbala.js';
import { julianDay } from '../src/time.js';

const JAIN = { year: 1981, month: 9, day: 13, hour: 1, minute: 30, second: 0, utcOffset: 5.5, lat: 28 + 39 / 60, lon: 77 + 13 / 60 };
const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: got ${a}, expected ${b} (±${tol})`);
const closeAll = (arr, exp, tol, msg) => arr.forEach((v, i) => close(v, exp[i], tol, `${msg}[${i}]`));

test('V.P. Jain example: Sthana bala components', async () => {
  const eph = await getEph();
  const sb = computeShadbala(computeChart(eph, JAIN, { houseSystem: 'sripati' })).components;
  closeAll(sb.uchcha, [14.54, 32.17, 4.94, 58.16, 34.85, 3.09, 48.81], 0.02, 'uchcha');
  closeAll(sb.saptavargaja, [127.5, 30, 135, 120, 58.13, 150, 82.5], 0.01, 'saptavargaja');
  closeAll(sb.ojhayugma, [15, 0, 15, 0, 0, 15, 0], 0, 'ojhayugma');
  closeAll(sb.kendradi, [15, 15, 30, 60, 60, 30, 60], 0, 'kendradi');
  closeAll(sb.drekkana, [0, 0, 0, 0, 0, 0, 15], 0, 'drekkana');
  closeAll(sb.sthana, [172.04, 77.17, 184.94, 238.16, 152.98, 198.08, 206.31], 0.03, 'sthana');
});

test('V.P. Jain example: Dig, Kala components, Naisargika, Drik (Raman additive aspects)', async () => {
  const eph = await getEph();
  const chart = computeChart(eph, JAIN, { houseSystem: 'sripati' }); // the book's Dig bala uses Sripati bhava madhyas
  const sb = computeShadbala(chart, { drishtiSpecial: 'raman' }).components;
  closeAll(sb.dig, [6.59, 12.22, 20.99, 31.97, 31.99, 53.29, 26.67], 0.03, 'dig');
  closeAll(sb.natonnata, [6.1, 53.9, 53.9, 60.0, 6.1, 6.1, 53.9], 0.15, 'natonnata (local apparent time)');
  closeAll(sb.paksha, [5.62, 108.76, 5.62, 54.38, 54.38, 54.38, 5.62], 0.02, 'paksha');
  closeAll(sb.tribhaga, [0, 0, 0, 0, 60, 60, 0], 0, 'tribhaga');
  closeAll(sb.abda, [0, 0, 15, 0, 0, 0, 0], 0, 'abda');
  closeAll(sb.masa, [0, 0, 30, 0, 0, 0, 0], 0, 'masa');
  closeAll(sb.vara, [0, 0, 0, 0, 0, 0, 45], 0, 'vara');
  closeAll(sb.hora, [0, 0, 0, 60, 0, 0, 0], 0, 'hora');
  closeAll(sb.ayana, [70.08, 43.19, 53.56, 37.10, 22.94, 15.41, 35.04], 0.35, 'ayana (SS kranti table)');
  closeAll(sb.naisargika, [60.0, 51.43, 17.14, 25.71, 34.29, 42.86, 8.57], 0.01, 'naisargika');
  closeAll(sb.drik, [11.24, -0.32, -5.10, 4.29, 4.32, -2.86, 5.82], 0.02, 'drik');
});

test('V.P. Jain example: Chesta bala of the five planets within textbook tolerance', async () => {
  const eph = await getEph();
  const sb = computeShadbala(computeChart(eph, JAIN, { houseSystem: 'sripati' })).components;
  // Book: [-, -, 20.93, 28.76, 8.43, 28.18, 5.05]; Raman's linear mean elements vs the book's tables differ by a few shashtiamsas for Mercury.
  closeAll(sb.chesta.slice(2), [20.93, 28.76, 8.43, 28.18, 5.05], 5, 'chesta');
  assert.equal(sb.chestaInTotal[0], 0); assert.equal(sb.chestaInTotal[1], 0);
});

test('sputa drishti table: base values and Parasara/Raman special aspects', () => {
  assert.equal(sputaDrishti(0, 0), 0); assert.equal(sputaDrishti(45, 0), 7.5); assert.equal(sputaDrishti(60, 0), 15);
  assert.equal(sputaDrishti(90, 0), 45); assert.equal(sputaDrishti(120, 0), 30); assert.equal(sputaDrishti(150, 0), 0);
  assert.equal(sputaDrishti(180 - 1e-9, 0) > 59.99, true); assert.equal(sputaDrishti(180, 0), 60); assert.equal(sputaDrishti(240, 0), 30); assert.equal(sputaDrishti(300, 0), 0);
  // full special aspects peak at 60
  assert.equal(sputaDrishti(60, 6, 'parasara'), 60); assert.equal(sputaDrishti(270, 6, 'parasara'), 60);
  assert.equal(sputaDrishti(90, 2, 'parasara'), 60); assert.equal(sputaDrishti(210, 2, 'parasara'), 60);
  assert.equal(sputaDrishti(120, 4, 'parasara'), 60); assert.equal(sputaDrishti(240, 4, 'parasara'), 60);
  assert.equal(sputaDrishti(60, 6, 'raman'), 60); assert.equal(sputaDrishti(90, 2, 'raman'), 60); assert.equal(sputaDrishti(120, 4, 'raman'), 60);
});

test('Surya-Siddhanta kranti table and Raman ahargana', () => {
  assert.equal(ssKranti(0), 0); close(ssKranti(90), 24, 1e-9, 'max north'); close(ssKranti(270), -24, 1e-9, 'max south');
  close(ssKranti(170), 362 / 60 * (10 / 15), 1e-9, 'bhuja 10°');
  assert.equal(ramanAhargana(julianDay(1827, 5, 2, 0)), 1);
  assert.equal(ramanAhargana(julianDay(1827, 5, 9, 0)), 8); // a week later
});

test('Ishta/Kashta are bounded and consistent', async () => {
  const eph = await getEph();
  const sb = computeShadbala(computeChart(eph, JAIN, { houseSystem: 'sripati' }));
  for (let i = 0; i < 7; i++) {
    const u = sb.ishtaKashta.uchcha[i], c = sb.ishtaKashta.chesta[i];
    assert.ok(u >= 0 && u <= 60 && c >= 0 && c <= 60);
    close(sb.ishtaKashta.ishta[i], Math.sqrt(u * c), 1e-9, 'ishta');
    close(sb.ishtaKashta.kashta[i], Math.sqrt((60 - u) * (60 - c)), 1e-9, 'kashta');
  }
});
