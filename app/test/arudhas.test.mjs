import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { getEph, getEphSid, FIXTURE_DIR } from './helpers.mjs';
import { computeChart } from '../src/chart.js';
import { divisionalCharts } from '../src/vargas.js';
import { bhavaArudhas, grahaArudhas, padaFrom, signAspects, strongerCoLord, strongerSign, computeArudhas, positionsOf, ARUDHA_NAMES } from '../src/arudhas.js';
import { SUN, MOON, MARS, MERCURY, JUPITER, VENUS, SATURN, RAHU, KETU, NINE } from '../src/constants.js';
import { norm360 } from '../src/time.js';

const pos = (signs, lagnaSign, degs = null) => ({ planets: signs.map((s, p) => ({ sign: s, deg: degs ? degs[p] : 10 })), lagnaSign });
const near = (a, b, tol) => Math.abs(norm360(a - b + 180) - 180) < tol;

test('pada counting and the 1st / 7th exception', () => {
  // start Aries, lord in Gemini: 3 signs, 3rd from Gemini = Leo
  assert.deepEqual(padaFrom(0, 2), { sign: 4, exception: false });
  // lord in its own sign → pada = the sign itself → 10th from it (Capricorn)
  assert.deepEqual(padaFrom(0, 0), { sign: 9, exception: true });
  assert.deepEqual(padaFrom(0, 0, { exception: 'none' }), { sign: 0, exception: true });
  // lord in the 7th (Libra): 7th from Libra = Aries → Capricorn
  assert.deepEqual(padaFrom(0, 6), { sign: 9, exception: true });
  // lord in the 4th (Cancer): 4th from Cancer = Libra, the 7th → 10th from Libra = Cancer
  assert.deepEqual(padaFrom(0, 3), { sign: 3, exception: true });
  // lord in the 10th (Capricorn): 10th from Capricorn = Libra → Cancer
  assert.deepEqual(padaFrom(0, 9), { sign: 3, exception: true });
  // lord in the 12th (Pisces): 12th from Pisces = Aquarius, no exception
  assert.deepEqual(padaFrom(0, 11), { sign: 10, exception: false });
});

test('rasi drishti: movable ↔ fixed except adjacent, dual ↔ dual, always symmetric, never self', () => {
  assert.deepEqual([...Array(12).keys()].filter(b => signAspects(0, b)), [4, 7, 10]);   // Aries → Leo, Scorpio, Aquarius
  assert.deepEqual([...Array(12).keys()].filter(b => signAspects(4, b)), [0, 6, 9]);    // Leo → Aries, Libra, Capricorn
  assert.deepEqual([...Array(12).keys()].filter(b => signAspects(2, b)), [5, 8, 11]);   // Gemini → Virgo, Sagittarius, Pisces
  for (let a = 0; a < 12; a++) for (let b = 0; b < 12; b++) { assert.equal(signAspects(a, b), signAspects(b, a)); if (a === b) assert.equal(signAspects(a, b), false); }
});

test('bhava arudhas on constructed charts, with the co-lord rule for Aquarius and Scorpio', () => {
  // Aries lagna, Mars in Gemini → Arudha lagna Leo (house 5); all other planets in Pisces
  const A = bhavaArudhas(pos([11, 11, 2, 11, 11, 11, 11, 11, 11], 0));
  assert.equal(A[0].name, 'Arudha lagna'); assert.equal(A[0].sign, 4); assert.equal(A[0].house, 5); assert.equal(A[0].lord, MARS);
  assert.equal(A[11].name, 'Upapada'); assert.equal(A[11].houseSign, 11); // 12th house Pisces, lord Jupiter in Pisces → own sign → 10th from Pisces = Sagittarius
  assert.equal(A[11].sign, 8); assert.equal(A[11].exception, true);
  // Aquarius lagna: Saturn in Aquarius yields the lordship to Rahu (in Gemini) → count 5 → Libra. Under Parasara's lordship Saturn in own sign → Scorpio
  const P = pos([0, 0, 0, 0, 0, 0, 10, 2, 8], 10);
  assert.equal(strongerCoLord(P, 10), RAHU);
  assert.equal(bhavaArudhas(P)[0].sign, 6);
  assert.equal(bhavaArudhas(P, { coLords: 'parasara' })[0].sign, 7);
  // more planets conjoined wins: Saturn in Leo with Sun and Moon, Rahu alone in Gemini
  assert.equal(strongerCoLord(pos([4, 4, 0, 0, 0, 0, 4, 2, 8], 10), 10), SATURN);
  // equal company: Jupiter in Virgo sign-aspects Rahu's Gemini (dual → dual); nothing supports Saturn's Leo (the rest sit in Taurus, which aspects no fixed sign)
  assert.equal(strongerCoLord(pos([1, 1, 1, 1, 5, 1, 4, 2, 8], 10), 10), RAHU);
  // the same with the rest in Aries: Aries sign-aspects Leo, so Mercury and the dispositor Sun back Saturn (2 against Jupiter's 1)
  assert.equal(strongerCoLord(pos([0, 0, 0, 0, 5, 0, 4, 2, 8], 10), 10), SATURN);
  // Ketu standing in Scorpio itself yields to Mars
  assert.equal(strongerCoLord(pos([0, 0, 2, 0, 0, 0, 0, 1, 7], 7), 7), MARS);
  // Mars in Cancer, Ketu in Leo, the rest in Aries: Aries sign-aspects Leo, so Mercury and Leo's lord the Sun back Ketu
  assert.equal(strongerCoLord(pos([0, 0, 3, 0, 0, 0, 0, 10, 4], 7), 7), KETU);
  // exaltation breaks a full tie: Ketu in Sagittarius (exalted) against Mars in Gemini, everything else in Taurus (aspects neither)
  assert.equal(strongerCoLord(pos([1, 1, 2, 1, 1, 1, 1, 6, 8], 7), 7), KETU);
  // dual beats fixed beats movable when all else is equal: Mars in Cancer, Ketu in Virgo, the rest in Taurus (Taurus aspects Cancer!) → use Leo instead: Leo aspects Aries, Libra, Capricorn
  assert.equal(strongerCoLord(pos([4, 4, 3, 4, 4, 4, 4, 11, 5], 7), 7), KETU);
  // finally the more advanced planet
  assert.equal(strongerCoLord({ planets: [4, 4, 2, 4, 4, 4, 4, 2, 8].map((s, p) => ({ sign: s, deg: p === MARS ? 20 : 5 })), lagnaSign: 7 }, 7), MARS);
});

test('stronger sign rules', () => {
  // more planets: six in Taurus against three in Aries
  assert.equal(strongerSign(pos([0, 0, 0, 1, 1, 1, 1, 1, 1], 0), 0, 1), 1);
  // exalted occupant decides a tie in company and support: Mercury in Virgo against Gemini holding the Moon (Jupiter in Pisces aspects both, Mercury owns both)
  assert.equal(strongerSign(pos([7, 2, 7, 5, 11, 7, 7, 7, 7], 0), 2, 5), 5);
  // equal count, Jupiter aspecting: Jupiter in Leo aspects Aries (fixed → movable), not Scorpio
  assert.equal(strongerSign(pos([2, 2, 2, 2, 4, 2, 2, 2, 2], 0), 0, 7), 0);
});

test('graha arudhas on a constructed chart', () => {
  // Sun in Aries owns Leo: 5 signs → 5th from Leo = Sagittarius (house 9 from Aries lagna)
  const G = grahaArudhas(pos([0, 3, 2, 2, 2, 2, 2, 2, 2], 0));
  assert.equal(G[SUN].ownSign, 4); assert.equal(G[SUN].sign, 8); assert.equal(G[SUN].house, 9);
  // Moon in Cancer, its own sign → pada Cancer → 10th → Aries
  assert.equal(G[MOON].sign, 0); assert.equal(G[MOON].exception, true);
});

test('bhava and graha arudhas in the rasi and all sixteen vargas against PyJHora for the eight test charts', async () => {
  const eph = await getEph();
  const fixtures = JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, 'arudhas.json'), 'utf8'));
  let plain = 0, strength = 0; const plainDiffs = [], strengthDiffs = [];
  for (const fx of fixtures) {
    const chart = computeChart(eph, fx.input);
    const dv = divisionalCharts(chart);
    for (const v of dv.charts) {
      const ref = fx.vargas[String(v.D)];
      assert.equal(v.lagna.sign, ref.lagnaSign, `${fx.input.id} D${v.D} lagna`);
      assert.deepEqual(v.planets.map(x => x.sign), ref.planetSigns, `${fx.input.id} D${v.D} signs`);
      const P = { planets: v.planets.map(x => ({ sign: x.sign, deg: x.deg })), lagnaSign: v.lagna.sign };
      bhavaArudhas(P).forEach((a, i) => {
        const strengthRule = a.houseSign === 7 || a.houseSign === 10; // Scorpio / Aquarius: the lord depends on the co-lord strength rules
        if (strengthRule) strength++; else plain++;
        if (a.sign !== ref.bhava[i]) (strengthRule ? strengthDiffs : plainDiffs).push(`${fx.input.id} D${v.D} A${i + 1}: ${a.sign} vs ${ref.bhava[i]}`);
      });
      grahaArudhas(P).forEach((a, p) => {
        const strengthRule = p !== SUN && p !== MOON; // two owned signs, or a node: the stronger sign / co-lord rules apply
        if (strengthRule) strength++; else plain++;
        if (a.sign !== ref.graha[p]) (strengthRule ? strengthDiffs : plainDiffs).push(`${fx.input.id} D${v.D} graha ${p}: ${a.sign} vs ${ref.graha[p]}`);
      });
    }
  }
  // Every arudha that does not pass through the strength rules is identical to PyJHora
  assert.ok(plain > 1500, `compared ${plain}`);
  assert.deepEqual(plainDiffs, [], plainDiffs.join('\n'));
  // Strength-rule cases: PyJHora counts the Lagna as a conjoined planet, misses a lord standing in its own sign, and keeps Parasara's lord of
  // Scorpio / Aquarius inside the sign-strength rules; the page uses the stronger co-lord throughout. All remaining differences are of those kinds.
  assert.ok(strength > 1000);
  assert.ok(strengthDiffs.length <= 25, `${strengthDiffs.length} strength-rule differences:\n${strengthDiffs.join('\n')}`);
});

test('arudha longitudes reproduce Jagannatha Hora (1996-12-07 10:34 IST, Chennai, True Pushya ayanamsa)', async () => {
  const eph = await getEphSid(29);
  const chart = computeChart(eph, { year: 1996, month: 12, day: 7, hour: 10, minute: 34, second: 0, utcOffset: 5.5, lat: 13.0878, lon: 80.2785 });
  const exp = ["22Ar18'12.79", "22Pi18'20.95", "0Cn20'50.53", "29Sg46'14.74", "26Pi07'31.91", "28Ta33'50.99", "22Sg36'36.88", "21Sc49'18.59", "28Aq33'50.99", "26Cn07'31.91", "2Cn05'43.65", "0Li20'50.53"];
  const SIGNS = ['Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi'];
  const parse = (s) => { const m = s.match(/^(\d+)([A-Za-z]{2})(\d+)'([\d.]+)$/); return SIGNS.indexOf(m[2]) * 30 + +m[1] + m[3] / 60 + m[4] / 3600; };
  const A = computeArudhas(chart);
  // JHora's True Pushya ayanamsa sits ≈5.7″ from Swiss Ephemeris'; JHora's own Arudha lagna row is a further 8″ off its other rows (its A1 and A2 share the same lord and should differ by exactly 30°)
  A.longitudes.forEach((lon, i) => assert.ok(near(lon, parse(exp[i]), 15 / 3600), `${ARUDHA_NAMES[i]}: ${lon} vs ${parse(exp[i])} (${exp[i]})`));
  for (let i = 1; i < 12; i++) assert.ok(near(A.longitudes[i] - A.longitudes[0], parse(exp[i]) - parse(exp[0]), 10 / 3600));
  // sign-level padas agree with the sign of the longitude for this chart except where the reflection crosses a sign boundary
  assert.equal(A.bhava.length, 12); assert.equal(A.graha.length, 9);
  assert.equal(positionsOf(chart).planets.length, 9);
});
