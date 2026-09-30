// Rule-level tests for the Deeptadi and Lajjitadi avasthas on constructed charts (each condition exercised in isolation).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeAvasthas } from '../src/avasthas.js';
import { SUN, MOON, MARS, MERCURY, JUPITER, VENUS, SATURN, RAHU, KETU } from '../src/constants.js';

/** Build a minimal chart: signs[p] for the nine grahas, lagna sign, optional degree in sign, combust set, waxing flag. */
function chart(signs, lagnaSign, { deg = 15, combust = [], waxing = true } = {}) {
  const planets = signs.map((s, p) => ({ index: p, sign: s, deg, lon: s * 30 + deg, house: ((s - lagnaSign) % 12 + 12) % 12 + 1, combust: combust.includes(p) }));
  return { planets, lagnaSign, waxing };
}
const states = (av, p) => av.lajjitadi[p].states;
const deep = (av, p) => av.deeptadi[p].states;

test('Deeptadi: Deepta (exaltation, moolatrikona), Swastha, Deena for debilitation, Vikala with a malefic, Khala in a great enemy\'s sign, Kopa when combust', () => {
  // Sun exalted in Aries, alone; Moon in own sign Cancer; Mars debilitated in Cancer? no — Mars in Capricorn (exalted); Venus in Libra 10° (moolatrikona)
  let av = computeAvasthas(chart([0, 3, 9, 2, 8, 6, 10, 1, 7], 4, { deg: 10 }));
  assert.deepEqual(deep(av, SUN), ['Deepta']);
  assert.deepEqual(deep(av, MOON), ['Swastha']);
  assert.ok(deep(av, VENUS).includes('Deepta'), 'Venus at Libra 10° is in moolatrikona');
  // Sun debilitated in Libra, alone → Deena
  av = computeAvasthas(chart([6, 3, 9, 2, 8, 1, 10, 4, 10], 4));
  assert.deepEqual(deep(av, SUN), ['Deena']);
  // Vikala: Venus together with Saturn (natural malefic)
  av = computeAvasthas(chart([0, 3, 5, 2, 8, 10, 10, 6, 0], 4));
  assert.ok(deep(av, VENUS).includes('Vikala'));
  // Kopa: combust Mercury
  av = computeAvasthas(chart([0, 3, 5, 0, 8, 1, 10, 6, 0], 4, { combust: [MERCURY] }));
  assert.ok(deep(av, MERCURY).includes('Kopa'));
  // Khala: Venus in Leo (Sun is Venus's natural enemy) with the Sun in the 6th from Venus (temporal enemy) → great enemy → Khala
  av = computeAvasthas(chart([9, 3, 5, 2, 8, 4, 10, 6, 0], 4));
  assert.ok(deep(av, VENUS).includes('Khala'), deep(av, VENUS).join(','));
  // Venus in Leo with the Sun in the 2nd from Venus (temporal friend) → natural enemy + temporal friend = neutral → Deena
  av = computeAvasthas(chart([5, 3, 9, 2, 8, 4, 10, 6, 0], 4));
  assert.ok(deep(av, VENUS).includes('Deena'), deep(av, VENUS).join(','));
  // Narasimha Rao's reading as an option: any planet in a malefic-owned sign gets Khala
  av = computeAvasthas(chart([5, 3, 9, 2, 8, 4, 10, 6, 0], 4), { khala: 'maleficSign' });
  assert.ok(deep(av, VENUS).includes('Khala'));
});

test('Lajjitadi: Lajjita needs the 5th house with Sun, Mars, Saturn, Rahu or Ketu', () => {
  // Lagna Aries → 5th house is Leo (4). Venus in Leo with Rahu.
  let av = computeAvasthas(chart([9, 3, 1, 2, 8, 4, 10, 4, 10], 0));
  assert.ok(states(av, VENUS).includes('Lajjita'));
  // Venus in Leo alone → no Lajjita
  av = computeAvasthas(chart([9, 3, 1, 2, 8, 4, 10, 6, 0], 0));
  assert.ok(!states(av, VENUS).includes('Lajjita'));
  // Venus in Leo with Sun but lagna Taurus (5th = Virgo) → not the 5th → no Lajjita
  av = computeAvasthas(chart([4, 3, 1, 2, 8, 4, 10, 6, 0], 1));
  assert.ok(!states(av, VENUS).includes('Lajjita'));
});

test('Lajjitadi: Garvita in exaltation or moolatrikona; Kshudhita with Saturn or in an enemy sign; Trushita in water with an enemy aspect and no benefic aspect; Mudita with Jupiter; Kshobhita with the Sun under a malefic aspect', () => {
  // Garvita: Mars exalted in Capricorn
  let av = computeAvasthas(chart([0, 3, 9, 2, 8, 1, 10, 6, 0], 4));
  assert.ok(states(av, MARS).includes('Garvita'));
  // Kshudhita: Venus with Saturn
  av = computeAvasthas(chart([0, 3, 5, 2, 8, 10, 10, 6, 0], 4));
  assert.ok(states(av, VENUS).includes('Kshudhita'));
  // Mudita: Venus with Jupiter (Jupiter conjunct rule)
  av = computeAvasthas(chart([0, 3, 5, 2, 8, 8, 10, 6, 0], 4));
  assert.ok(states(av, VENUS).includes('Mudita'));
  // Kshobhita: Mercury with the Sun in Aries, Saturn in Libra casting the 7th aspect (malefic and enemy of Mercury? natural neutral; Saturn is a natural malefic → qualifies)
  av = computeAvasthas(chart([0, 3, 5, 0, 8, 1, 6, 9, 3], 4));
  assert.ok(states(av, MERCURY).includes('Kshobhita'));
  // Trushita: Venus in Cancer (water) aspected by its enemy the Sun from Capricorn (7th), no benefic aspect on Cancer
  av = computeAvasthas(chart([9, 10, 5, 10, 10, 3, 10, 1, 7], 4, { waxing: false }));
  assert.ok(states(av, VENUS).includes('Trushita'), states(av, VENUS).join(','));
});
