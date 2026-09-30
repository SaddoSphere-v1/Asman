// Arudha padas (Jaimini Sutras 1.1.29-30, BPHS 29): bhava arudhas of the twelve houses and graha arudhas of the nine
// grahas, with the exception (a pada falling in the 1st or 7th from its starting sign moves ten signs on), Jaimini's
// stronger-co-lord rule for Scorpio (Mars / Ketu) and Aquarius (Saturn / Rahu), arudha longitudes (the lord reflected
// about the bhava madhya, as Jagannatha Hora), and rasi drishti (sign aspects) used by those rules.
import { MARS, MERCURY, JUPITER, SATURN, RAHU, KETU, SUN, MOON, VENUS, NINE, SIGN_LORD, ODD_SIGN, signQuality } from './constants.js';
import { isExaltationSign } from './relations.js';
import { norm360, arc } from './time.js';

export const ARUDHA_DEFAULTS = Object.freeze({
  /** 'tenth': a pada in the 1st or 7th from its start moves to the 10th from there (Parasara, Jaimini) | 'none' */
  exception: 'tenth',
  /** 'stronger': Scorpio and Aquarius are ruled by the stronger of Mars / Ketu and Saturn / Rahu (Jaimini) | 'parasara': Mars and Saturn always */
  coLords: 'stronger',
});

export const ARUDHA_NAMES = ['Arudha lagna', 'Dhana pada', 'Bhratri pada', 'Matri pada', 'Mantra pada', 'Shatru pada', 'Dara pada', 'Mrityu pada', 'Bhagya pada', 'Rajya pada', 'Labha pada', 'Upapada'];
/** Signs owned; Rahu and Ketu as co-lords of Aquarius and Scorpio. */
export const OWNED_SIGNS = { [SUN]: [4], [MOON]: [3], [MARS]: [0, 7], [MERCURY]: [2, 5], [JUPITER]: [8, 11], [VENUS]: [1, 6], [SATURN]: [9, 10], [RAHU]: [10], [KETU]: [7] };
const NODE_EXALTATION = { [RAHU]: [1, 2], [KETU]: [7, 8] }; // Taurus / Gemini and Scorpio / Sagittarius, as Jagannatha Hora
const QUALITY_RANK = { movable: 1, fixed: 2, dual: 3 };

/** 1-based count of signs from `from` to `to`. */
export const countSigns = (from, to) => ((to - from) % 12 + 12) % 12 + 1;

/** Rasi drishti: movable signs aspect the fixed signs except the adjacent one, fixed aspect the movable except the adjacent one, dual aspect the other duals. */
export function signAspects(a, b) {
  const d = ((b - a) % 12 + 12) % 12, q = signQuality(a);
  return q === 'movable' ? d === 4 || d === 7 || d === 10 : q === 'fixed' ? d === 2 || d === 5 || d === 8 : d === 3 || d === 6 || d === 9;
}

/** Sign-level positions {planets: [{sign, deg}] × 9, lagnaSign} from a rasi chart or from one divisional chart. */
export const positionsOf = (chart) => ({ planets: NINE.map(p => ({ sign: chart.planets[p].sign, deg: chart.planets[p].deg })), lagnaSign: chart.lagnaSign });

const inSign = (pos, s) => NINE.filter(p => pos.planets[p].sign === s);
const aspectingSign = (pos, s) => NINE.filter(p => signAspects(pos.planets[p].sign, s));
const isExalted = (p, sign) => (p === RAHU || p === KETU ? NODE_EXALTATION[p].includes(sign) : isExaltationSign(p, sign));
/** How many of Jupiter, Mercury and the lord of sign s stand in s or sign-aspect it (a planet that is both Mercury or Jupiter and the lord counts for each); `self` never supports itself. */
function supportScore(pos, s, lord, self = null) {
  let n = 0;
  for (const q of [JUPITER, MERCURY, lord]) if (q !== self && (pos.planets[q].sign === s || signAspects(pos.planets[q].sign, s))) n++;
  return n;
}

/** Stronger of the two co-lords of Scorpio (7) or Aquarius (10), Jaimini's rules in Jagannatha Hora's order. */
export function strongerCoLord(pos, sign) {
  const [a, b] = sign === 7 ? [MARS, KETU] : [SATURN, RAHU];
  const sa = pos.planets[a].sign, sb = pos.planets[b].sign;
  if (sa === sign && sb !== sign) return b; // the co-lord standing in the sign itself yields to the other
  if (sb === sign && sa !== sign) return a;
  const ca = inSign(pos, sa).length, cb = inSign(pos, sb).length; // planets conjoined (own presence cancels out)
  if (ca !== cb) return ca > cb ? a : b;
  const ra = supportScore(pos, sa, SIGN_LORD[sa], a), rb = supportScore(pos, sb, SIGN_LORD[sb], b); // dispositor by Parasara's lordship, avoiding recursion
  if (ra !== rb) return ra > rb ? a : b;
  const ea = isExalted(a, sa), eb = isExalted(b, sb);
  if (ea !== eb) return ea ? a : b;
  const qa = QUALITY_RANK[signQuality(sa)], qb = QUALITY_RANK[signQuality(sb)];
  if (qa !== qb) return qa > qb ? a : b;
  return pos.planets[a].deg >= pos.planets[b].deg ? a : b;
}

/** Lord of a sign under the chosen co-lord rule. */
export function lordOf(pos, sign, options = {}) {
  const opt = { ...ARUDHA_DEFAULTS, ...options };
  return opt.coLords === 'stronger' && (sign === 7 || sign === 10) ? strongerCoLord(pos, sign) : SIGN_LORD[sign];
}

/** Stronger of two signs (Jaimini): more planets; Jupiter, Mercury and the lord in or aspecting; an exalted occupant; lord in a sign of the other parity; dual > fixed > movable; lord more advanced. */
export function strongerSign(pos, s1, s2, options = {}) {
  const n1 = inSign(pos, s1).length, n2 = inSign(pos, s2).length;
  if (n1 !== n2) return n1 > n2 ? s1 : s2;
  const l1 = lordOf(pos, s1, options), l2 = lordOf(pos, s2, options);
  const r1 = supportScore(pos, s1, l1), r2 = supportScore(pos, s2, l2);
  if (r1 !== r2) return r1 > r2 ? s1 : s2;
  const e1 = inSign(pos, s1).some(p => isExalted(p, s1)), e2 = inSign(pos, s2).some(p => isExalted(p, s2));
  if (e1 !== e2) return e1 ? s1 : s2;
  const o1 = ODD_SIGN(s1) !== ODD_SIGN(pos.planets[l1].sign), o2 = ODD_SIGN(s2) !== ODD_SIGN(pos.planets[l2].sign);
  if (o1 !== o2) return o1 ? s1 : s2;
  const q1 = QUALITY_RANK[signQuality(s1)], q2 = QUALITY_RANK[signQuality(s2)];
  if (q1 !== q2) return q1 > q2 ? s1 : s2;
  return pos.planets[l1].deg >= pos.planets[l2].deg ? s1 : s2;
}

/** Pada: count from `start` to `target`, then as many signs on from `target`; exception when it lands in the 1st or 7th from `start`. */
export function padaFrom(start, target, options = {}) {
  const opt = { ...ARUDHA_DEFAULTS, ...options };
  const n = countSigns(start, target);
  let sign = (target + n - 1) % 12;
  const rel = countSigns(start, sign), exception = rel === 1 || rel === 7;
  if (exception && opt.exception === 'tenth') sign = (sign + 9) % 12;
  return { sign, exception };
}

/** Bhava arudhas A1..A12 from sign-level positions (rasi or any divisional chart). */
export function bhavaArudhas(pos, options = {}) {
  return ARUDHA_NAMES.map((name, i) => {
    const houseSign = (pos.lagnaSign + i) % 12;
    const lord = lordOf(pos, houseSign, options);
    const { sign, exception } = padaFrom(houseSign, pos.planets[lord].sign, options);
    return { index: i + 1, name, houseSign, lord, lordSign: pos.planets[lord].sign, sign, exception, house: countSigns(pos.lagnaSign, sign), occupants: inSign(pos, sign), aspecting: aspectingSign(pos, sign) };
  });
}

/** Graha arudhas: from the graha to the sign it owns (the stronger one when it owns two), then as many signs on. */
export function grahaArudhas(pos, options = {}) {
  return NINE.map(p => {
    const owned = OWNED_SIGNS[p];
    const ownSign = owned.length > 1 ? strongerSign(pos, owned[0], owned[1], options) : owned[0];
    const { sign, exception } = padaFrom(pos.planets[p].sign, ownSign, options);
    return { planet: p, ownSign, sign, exception, house: countSigns(pos.lagnaSign, sign), occupants: inSign(pos, sign), aspecting: aspectingSign(pos, sign) };
  });
}

/** Arudha longitudes (Jagannatha Hora): lord reflected about the equal bhava madhya; a result inside the 1st or 7th bhava span moves back 90°. */
export function arudhaLongitudes(chart, arudhas, options = {}) {
  const opt = { ...ARUDHA_DEFAULTS, ...options };
  return arudhas.map((a, i) => {
    const madhya = norm360(chart.asc + 30 * i), start = norm360(madhya - 15);
    let lon = norm360(2 * chart.planets[a.lord].lon - madhya);
    const d = arc(start, lon);
    if (opt.exception === 'tenth' && (d < 30 || (d >= 180 && d < 210))) lon = norm360(lon - 90);
    return lon;
  });
}

export function computeArudhas(chart, options = {}) {
  const opt = { ...ARUDHA_DEFAULTS, ...options };
  const pos = positionsOf(chart);
  const bhava = bhavaArudhas(pos, opt);
  return { bhava, graha: grahaArudhas(pos, opt), longitudes: arudhaLongitudes(chart, bhava, opt), options: opt };
}
