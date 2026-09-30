// Regression against B.V. Raman, "Graha and Bhava Balas": the author's worked example, 16 Oct 1918 14:22:16 IST, Bangalore 13°N 77°35'E,
// Raman ayanamsa. Values as transcribed in PyJHora's test-suite. JHora's release notes name this book as the source of its balas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getEphRaman } from './helpers.mjs';
import { computeChart } from '../src/chart.js';
import { computeShadbala } from '../src/shadbala.js';

const RAMAN = { year: 1918, month: 10, day: 16, hour: 14, minute: 22, second: 16, utcOffset: 5.5, lat: 13.0, lon: 77 + 35 / 60 };
const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: got ${a}, expected ${b} (±${tol})`);
const closeAll = (arr, exp, tol, msg, skip = []) => arr.forEach((v, i) => { if (!skip.includes(i)) close(v, exp[i], tol, `${msg}[${i}]`); });

test('Raman example: positions and Sthana bala', async () => {
  const eph = await getEphRaman();
  const chart = computeChart(eph, RAMAN);
  const exp = [180 + 53 / 60 + 55 / 3600, 311 + 17 / 60 + 19 / 3600, 229 + 30 / 60 + 34 / 3600, 181 + 31 / 60 + 34 / 3600, 84 + 0 / 60 + 49 / 3600, 171 + 9 / 60 + 56 / 3600, 124 + 22 / 60 + 41 / 3600];
  exp.forEach((e, i) => close(chart.planets[i].lon, e, 0.06, `longitude ${i}`)); // Raman's 1918 ephemeris vs Swiss Ephemeris
  const sb = computeShadbala(chart).components;
  closeAll(sb.uchcha, [3.0, 32.75, 37.06, 54.5, 56.33, 1.95, 34.08], 0.1, 'uchcha', [6]); // Saturn: book arithmetic slip (104.4°/3 = 34.8)
  closeAll(sb.saptavargaja, [90, 48.75, 90, 135, 71.25, 116.25, 97.5], 0.01, 'saptavargaja');
  closeAll(sb.ojhayugma, [30, 15, 15, 30, 15, 30, 15], 0, 'ojhayugma');
  closeAll(sb.kendradi, [60, 30, 30, 60, 15, 15, 30], 0, 'kendradi');
  closeAll(sb.drekkana, [15, 0, 0, 0, 0, 15, 0], 0, 'drekkana');
  closeAll(sb.sthana, [198, 126.5, 172.06, 279.5, 157.58, 178.2, 177.3], 0.15, 'sthana', [6]);
});

test('Raman example: Dig, Kala, Chesta, Naisargika, Drik', async () => {
  const eph = await getEphRaman();
  const chart = computeChart(eph, RAMAN);
  const sb = computeShadbala(chart, { drishtiSpecial: 'raman' }).components;
  closeAll(sb.dig, [48.10, 31.56, 64.30, 21.09, 11.50, 15.15, 58.02], 0.6, 'dig', [2]); // Mars: book did not fold 192.9° to 167.1°
  closeAll(sb.natonnata, [48.32, 11.68, 11.68, 60, 48.32, 48.32, 11.68], 0.4, 'natonnata');
  closeAll(sb.paksha, [16.54, 86.92, 16.54, 16.54, 43.46, 43.46, 16.54], 0.05, 'paksha');
  closeAll(sb.tribhaga, [0, 0, 0, 0, 60, 0, 60], 0, 'tribhaga');
  closeAll(sb.abda, [0, 0, 0, 0, 0, 0, 15], 0, 'abda');
  closeAll(sb.masa, [0, 0, 0, 30, 0, 0, 0], 0, 'masa');
  closeAll(sb.vara, [0, 0, 0, 45, 0, 0, 0], 0, 'vara');
  closeAll(sb.hora, [0, 60, 0, 0, 0, 0, 0], 0, 'hora');
  closeAll(sb.ayana, [38.12, 43.44, 1.84, 41.25, 59.4, 23.75, 13.75], 0.6, 'ayana');
  closeAll(sb.chesta.slice(2), [22.23, 2.3, 35.26, 5.95, 21.14], 0.05, 'chesta');
  closeAll(sb.naisargika, [60.0, 51.43, 17.14, 25.70, 34.28, 42.85, 8.57], 0.02, 'naisargika');
  closeAll(sb.drik, [15.86, -21.73, 0.95, 15.64, -16.04, 18.47, 7.21], 0.03, 'drik (Raman additive aspects)');
  closeAll(sb.kala, [102.98, 202.04, 30.06, 192.79, 211.18, 115.53, 116.97], 0.6, 'kala');
});
