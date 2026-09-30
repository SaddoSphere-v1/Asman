// Deeptadi (BPHS 45.7-10, nine states; readings cross-checked with Santhanam's translation, Narasimha Rao's book and kunjara/jyotish) and Lajjitadi (BPHS 45.11-18, six states).
import { SEVEN, SUN, MOON, MARS, MERCURY, JUPITER, VENUS, SATURN, RAHU, KETU, WATERY_SIGNS, FULL_ASPECT_HOUSES, SIGN_LORD } from './constants.js';
import { compoundMatrix, naturalRelation, isExaltationSign, isDebilitationSign, isOwnSign, isMoolatrikona } from './relations.js';
import { beneficsAndMalefics } from './shadbala.js';

export const AVASTHA_DEFAULTS = Object.freeze({
  /** Relationship for Deeptadi grades and Lajjitadi friend/enemy tests: 'compound' (panchadha, PVR) | 'natural' */
  relation: 'compound',
  /** Khala: 'adhisatru' — sign lord is a great enemy (Brihat Parashara Hora Shastra 45.10 per Santhanam; kunjara/jyotish) | 'maleficSign' — a sign owned by a natural malefic (Narasimha Rao's book) */
  khala: 'adhisatru',
  /** Rahu/Ketu cast a 7th-house aspect for the Lajjitadi tests */
  nodesAspect: true,
  /** Garvita moolatrikona: 'sign' whole sign | 'degrees' */
  garvitaMoolatrikona: 'sign',
  /** Trushita: aspected by an 'enemy' (PVR) | 'malefic' (Santhanam) */
  trushitaBy: 'enemy',
  /** Mudita: conjunct/aspected by a 'friend' (PVR) | 'benefic' (Santhanam) */
  muditaBy: 'friend',
});

const NAME = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

/** Full Parashari graha drishti from planet q in sign sq onto sign sp. */
export function fullAspects(q, sq, sp, nodesAspect = true) {
  const h = ((sp - sq) % 12 + 12) % 12 + 1;
  if (q === RAHU || q === KETU) return nodesAspect && h === 7;
  const houses = FULL_ASPECT_HOUSES[q] || FULL_ASPECT_HOUSES.default;
  return houses.includes(h);
}

const GRADE = { adhimitra: 'Pramudita', mitra: 'Shanta', sama: 'Deena', satru: 'Dukhita', adhisatru: 'Dukhita' };
const GRADE_NATURAL = { F: 'Shanta', N: 'Deena', E: 'Dukhita' };

export function computeAvasthas(chart, options = {}) {
  const opt = { ...AVASTHA_DEFAULTS, ...options };
  const P = chart.planets;
  const signs = SEVEN.map(p => P[p].sign);
  const compound = compoundMatrix(signs);
  const { benefics, malefics } = beneficsAndMalefics(chart);
  const naturalMalefics = [...malefics, RAHU, KETU];           // Sun, Mars, Saturn, waning Moon, malefic Mercury, nodes
  const naturalBenefics = benefics;                            // Jupiter, Venus, waxing Moon, benefic Mercury
  const rel = (p, q) => (opt.relation === 'compound' ? ({ adhimitra: 'F', mitra: 'F', sama: 'N', satru: 'E', adhisatru: 'E' })[compound[p][q]] : naturalRelation(p, q));
  const conjunct = (p, q) => P[p].sign === P[q].sign;
  const aspectedBy = (p, q) => q !== p && fullAspects(q, P[q].sign, P[p].sign, opt.nodesAspect);
  const MALEFIC_SIGNS = [0, 7, 4, 9, 10]; // Aries, Scorpio (Mars), Leo (Sun), Capricorn, Aquarius (Saturn)

  const deeptadi = {}, lajjitadi = {};
  for (const p of SEVEN) {
    const sign = P[p].sign, deg = P[p].deg, lord = SIGN_LORD[sign];
    // ---------- Deeptadi ----------
    // Deepta: exaltation or moolatrikona; Swastha: own sign; Pramudita / Shanta / Deena / Dukhita / Khala by the compound grade of the sign lord
    // (great friend, friend, neutral, enemy, great enemy); debilitation counts as Deena. Vikala: with a natural malefic. Kopa: combust.
    const states = [], why = [];
    if (isExaltationSign(p, sign) || isMoolatrikona(p, sign, deg)) { states.push('Deepta'); why.push(isExaltationSign(p, sign) ? 'exalted' : 'moolatrikona'); }
    else if (isOwnSign(p, sign)) { states.push('Swastha'); why.push('own sign'); }
    else if (isDebilitationSign(p, sign)) { states.push('Deena'); why.push('debilitated'); }
    else if (opt.relation === 'compound') {
      const g = compound[p][lord];
      const name = g === 'adhisatru' && opt.khala === 'adhisatru' ? 'Khala' : GRADE[g];
      states.push(name); why.push(`${NAME[lord]}'s sign, ${g}`);
    } else { const n = naturalRelation(p, lord); states.push(GRADE_NATURAL[n]); why.push(`${NAME[lord]}'s sign, natural ${n === 'F' ? 'friend' : n === 'N' ? 'neutral' : 'enemy'}`); }
    const withMalefic = naturalMalefics.filter(q => q !== p && conjunct(p, q));
    if (withMalefic.length) { states.push('Vikala'); why.push(`with ${withMalefic.map(q => NAME[q]).join(', ')}`); }
    if (opt.khala === 'maleficSign' && MALEFIC_SIGNS.includes(sign) && !isOwnSign(p, sign) && !states.includes('Khala')) { states.push('Khala'); why.push("malefic's sign"); }
    if (P[p].combust) { states.push('Kopa'); why.push('combust'); }
    deeptadi[p] = { states, why, state: states.join(', ') };

    // ---------- Lajjitadi ----------
    const friends = SEVEN.filter(q => q !== p && rel(p, q) === 'F');
    const enemies = SEVEN.filter(q => q !== p && rel(p, q) === 'E');
    const own = isOwnSign(p, sign);
    const inEnemySign = !own && rel(p, lord) === 'E';
    const inFriendSign = !own && rel(p, lord) === 'F';
    const conjEnemy = enemies.filter(q => conjunct(p, q));
    const aspEnemy = enemies.filter(q => aspectedBy(p, q));
    const conjFriend = friends.filter(q => conjunct(p, q));
    const aspFriend = friends.filter(q => aspectedBy(p, q));
    const aspMalefic = naturalMalefics.filter(q => q !== p && aspectedBy(p, q));
    const aspBenefic = naturalBenefics.filter(q => q !== p && aspectedBy(p, q));
    const conjBenefic = naturalBenefics.filter(q => q !== p && conjunct(p, q));
    const L = [], W = [];
    if (P[p].house === 5) {
      const co = [SUN, MARS, SATURN, RAHU, KETU].filter(q => q !== p && conjunct(p, q));
      if (co.length) { L.push('Lajjita'); W.push(`5th house with ${co.map(q => NAME[q]).join(', ')}`); }
    }
    if (isExaltationSign(p, sign) || isMoolatrikona(p, sign, opt.garvitaMoolatrikona === 'degrees' ? deg : null)) { L.push('Garvita'); W.push(isExaltationSign(p, sign) ? 'exalted' : 'moolatrikona'); }
    {
      const r = [];
      if (inEnemySign) r.push("enemy's sign");
      if (conjEnemy.length) r.push(`with ${conjEnemy.map(q => NAME[q]).join('/')}`);
      if (aspEnemy.length) r.push(`aspected by ${aspEnemy.map(q => NAME[q]).join('/')}`);
      if (p !== SATURN && conjunct(p, SATURN) && !conjEnemy.includes(SATURN)) r.push('with Saturn');
      if (r.length) { L.push('Kshudhita'); W.push(r.join(', ')); }
    }
    {
      const by = opt.trushitaBy === 'malefic' ? aspMalefic : aspEnemy;
      if (WATERY_SIGNS.includes(sign) && by.length && !aspBenefic.length) { L.push('Trushita'); W.push(`watery sign, aspected by ${by.map(q => NAME[q]).join('/')}, no benefic aspect`); }
    }
    {
      const r = [];
      const cj = opt.muditaBy === 'benefic' ? conjBenefic : conjFriend;
      const asp = opt.muditaBy === 'benefic' ? aspBenefic : aspFriend;
      if (inFriendSign) r.push("friend's sign");
      if (cj.length) r.push(`with ${cj.map(q => NAME[q]).join('/')}`);
      if (asp.length) r.push(`aspected by ${asp.map(q => NAME[q]).join('/')}`);
      if (p !== JUPITER && conjunct(p, JUPITER) && !cj.includes(JUPITER)) r.push('with Jupiter');
      if (r.length) { L.push('Mudita'); W.push(r.join(', ')); }
    }
    if (p !== SUN && conjunct(p, SUN) && (aspMalefic.length || aspEnemy.length)) { L.push('Kshobhita'); W.push(`with Sun, aspected by ${[...new Set([...aspMalefic, ...aspEnemy])].map(q => NAME[q]).join('/')}`); }
    lajjitadi[p] = { states: L, why: W };
  }
  return { deeptadi, lajjitadi, options: opt, benefics: naturalBenefics, malefics: naturalMalefics };
}
