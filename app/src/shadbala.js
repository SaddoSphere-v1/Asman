// Shadbala (BPHS ch. 27) with Ishta/Kashta phala.
// JHora's balas follow B.V. Raman's "Graha and Bhava Balas" (JHora release notes 7.4/7.6); every convention that varies is a named option.
import { norm360, sep, arc, weekdayOfJd, julianDay } from './time.js';
import {
  SEVEN, SUN, MOON, MARS, MERCURY, JUPITER, VENUS, SATURN,
  EXALTATION_DEG, SIGN_LORD, WEEKDAY_LORD, HORA_SEQUENCE, NAISARGIKA_BALA, REQUIRED_RUPAS, DISC_DIAMETER, SAPTAVARGAJA_POINTS, ODD_SIGN,
} from './constants.js';
import { SAPTAVARGA, vargaSign, navamsaSign } from './vargas.js';
import { compoundMatrix, isMoolatrikona, isOwnSign } from './relations.js';

export const SHADBALA_DEFAULTS = Object.freeze({
  /** Moolatrikona in the rasi chart for Saptavargaja: 'sign' → whole MT sign counts 45 (Raman, V.P. Jain, PyJHora) | 'degrees' → only inside the MT degree range */
  moolatrikonaRasi: 'sign',
  /** Moolatrikona in the six other vargas: 'none' → judged by lordship (Raman) | 'sign' → 45 in the MT sign */
  moolatrikonaInVargas: 'none',
  /** Drekkana bala order: 'raman' male 1st, Mercury/Saturn 2nd, Moon/Venus 3rd | 'bphs' male 1st, Moon/Venus 2nd, Mercury/Saturn 3rd */
  drekkanaOrder: 'raman',
  /** Natonnata time basis: 'lat' local apparent (sundial) time (Raman) | 'lmt' local mean time | 'apparent' midpoint of sunset→sunrise */
  natonnataReference: 'lat',
  moonPakshaDoubled: true,
  sunAyanaDoubled: true,
  /** Sun's/Moon's Chesta row shows Ayana/Paksha bala but is not added again to the total (Raman, V.P. Jain) */
  luminaryChestaInTotal: false,
  /** Hora: 'equalHours' 60-minute horas from sunrise (Raman) | 'unequal' day/12 + night/12 */
  horaMethod: 'equalHours',
  /** Kranti for Ayana bala: 'ss-table' Surya-Siddhanta declination table on the sayana longitude (Raman) | 'ecliptic' sin δ = sin ε sin λ | 'true' Swiss Ephemeris declination */
  declination: 'ss-table',
  clampAyana: true,
  /** Year/month lords: 'raman' condensed ahargana from 2 May 1827 (Raman, PyJHora, Mhora) | 'kali' ahargana from the Kali epoch */
  ahargana: 'raman',
  /** Chesta mean longitudes: 'raman' 1900 Ujjain epoch linear elements, sidereal (Raman) | 'meeus' modern mean elements */
  chestaMeans: 'raman',
  /** Sputa drishti special aspects: 'parasara' replacement formulas (JHora default since 7.6) | 'raman' additive +15/+30/+45 */
  drishtiSpecial: 'parasara',
  drikDivisor: 4,
  /** Required minima: 'bphs' Sun 390 … | 'raman' Sun 300 */
  requiredMinima: 'bphs',
  nodesInMercuryTest: false,
});

/** PVR classification: Jupiter, Venus benefic; waxing Moon benefic; Mercury benefic when alone or with ≥ as many benefics as malefics (tie → nearer planet decides); Sun, Mars, Saturn malefic. */
export function beneficsAndMalefics(chart, nodesInMercuryTest = false) {
  const P = chart.planets;
  const benefics = [JUPITER, VENUS], malefics = [SUN, MARS, SATURN];
  (chart.waxing ? benefics : malefics).push(MOON);
  const same = (list) => list.filter(q => P[q].sign === P[MERCURY].sign);
  const mal = same(malefics).concat(nodesInMercuryTest ? [7, 8].filter(q => P[q].sign === P[MERCURY].sign) : []);
  const ben = same(benefics);
  let mercuryMalefic;
  if (mal.length === 0 && ben.length === 0) mercuryMalefic = false;
  else if (mal.length !== ben.length) mercuryMalefic = mal.length > ben.length;
  else { // tie: the planet nearest to Mercury decides
    const near = (list) => Math.min(...list.map(q => sep(P[q].lon, P[MERCURY].lon)));
    mercuryMalefic = near(mal) < near(ben);
  }
  (mercuryMalefic ? malefics : benefics).push(MERCURY);
  return { benefics, malefics };
}

/** Parashari graduated (sputa) drishti of aspecting planet q on a point d degrees ahead of it (0..360). */
export function sputaDrishti(d, q, special = 'parasara') {
  let v = 0;
  if (d >= 30 && d < 60) v = (d - 30) / 2;
  else if (d >= 60 && d < 90) v = d - 45;
  else if (d >= 90 && d < 120) v = (120 - d) / 2 + 30;
  else if (d >= 120 && d < 150) v = 150 - d;
  else if (d >= 150 && d < 180) v = 2 * (d - 150);
  else if (d >= 180 && d < 300) v = (300 - d) / 2;
  if (special === 'raman') {
    if (q === SATURN && ((d >= 60 && d < 90) || (d >= 270 && d < 300))) v += 45;
    if (q === MARS && ((d >= 90 && d < 120) || (d >= 210 && d < 240))) v += 15;
    if (q === JUPITER && ((d >= 120 && d < 150) || (d >= 240 && d < 270))) v += 30;
  } else { // BPHS 26.9-12 replacement formulas
    if (q === SATURN) {
      if (d >= 30 && d < 60) v = 2 * (d - 30);
      else if (d >= 60 && d < 90) v = 60 - (d - 60) / 2;
      else if (d >= 240 && d < 270) v = 30 + (d - 240);
      else if (d >= 270 && d < 300) v = 2 * (300 - d);
    } else if (q === MARS) {
      if (d >= 60 && d < 90) v = 15 + 1.5 * (d - 60);
      else if (d >= 90 && d < 120) v = 150 - d;
      else if (d >= 210 && d < 240) v = 270 - d;
    } else if (q === JUPITER) {
      if (d >= 90 && d < 120) v = 45 + (d - 90) / 2;
      else if (d >= 120 && d < 150) v = 60 - (d - 120);
      else if (d >= 210 && d < 240) v = 45 + (d - 210) / 2;
      else if (d >= 240 && d < 270) v = 60 - (d - 240);
    }
  }
  return Math.max(0, Math.min(60, v));
}

/** Meeus mean longitudes (mean equinox of date), tropical degrees. T in Julian centuries from J2000 (TT). */
export function meeusMeanLongitudes(T) {
  const L = (a, b, c, d) => norm360(a + b * T + c * T * T + d * T * T * T);
  const earth = L(100.466457, 36000.7698278, 0.00030322, 0.000000020);
  return {
    [SUN]: norm360(earth + 180),
    [MERCURY]: L(252.250906, 149474.0722491, 0.00030350, 0.000000018),
    [VENUS]: L(181.979801, 58519.2130302, 0.00031014, 0.000000015),
    [MARS]: L(355.433000, 19141.6964471, 0.00031052, 0.000000016),
    [JUPITER]: L(34.351519, 3036.3027748, 0.00022330, 0.000000037),
    [SATURN]: L(50.077444, 1223.5110686, 0.00051908, -0.000000030),
  };
}

/** B.V. Raman's mean (nirayana) longitudes: epoch 1900-01-01 0h Ujjain LMT, linear daily motions, secular corrections. */
export function ramanMeanLongitudes(jdUt, year) {
  const UJJAIN_LON = 75.7885;
  const epoch = julianDay(1900, 1, 1, 0) - UJJAIN_LON / 360; // 0h Ujjain local mean time in UT
  const d = jdUt - epoch;
  const t = year - 1900;
  return {
    [SUN]: norm360(257.4568 + 0.9856 * d),
    [MARS]: norm360(270.22 + 0.524 * d),
    [MERCURY]: norm360(164.0 + 4.0923 * d + (6.67 - 0.00133 * t)),      // seeghrochcha
    [JUPITER]: norm360(220.04 + 0.0831 * d - (3.33 + 0.0067 * t)),
    [VENUS]: norm360(328.51 + 1.60215 * d - (5 + 0.0001 * t)),          // seeghrochcha
    [SATURN]: norm360(236.74 + 0.03344 * d + (5 + 0.001 * t)),
  };
}

/** Mean obliquity of the ecliptic (degrees), Meeus 22.2. */
export function meanObliquity(T) { return 23.4392911 - (46.8150 * T + 0.00059 * T * T - 0.001813 * T * T * T) / 3600; }

/** Surya-Siddhanta kranti (declination, degrees) from a sayana longitude; north positive. */
export function ssKranti(tropLon) {
  const TABLE = [0, 362, 703, 1002, 1238, 1388, 1440]; // minutes of arc at bhuja 0°,15°,…,90°
  const l = norm360(tropLon);
  const bhuja = l <= 90 ? l : l <= 180 ? 180 - l : l <= 270 ? l - 180 : 360 - l;
  const i = Math.min(5, Math.floor(bhuja / 15));
  const k = (TABLE[i] + (TABLE[i + 1] - TABLE[i]) * (bhuja - 15 * i) / 15) / 60;
  return l < 180 ? k : -k;
}

/** Raman's condensed ahargana: days from 2 May 1827 (a Wednesday), day 1 = the epoch date. jd0 = JD at 0h of the (Vedic) civil date. */
export function ramanAhargana(jd0Local) { return Math.round(jd0Local - julianDay(1827, 5, 2, 0)) + 1; }

export function computeShadbala(chart, options = {}) {
  const opt = { ...SHADBALA_DEFAULTS, ...options };
  const P = chart.planets;
  const signs = SEVEN.map(p => P[p].sign);
  const compound = compoundMatrix(signs);
  const notes = [];
  const jd = chart.jdUt, day = chart.day, polar = day.polar;

  // ---------- Sthana bala ----------
  const uchcha = SEVEN.map(p => sep(P[p].lon, EXALTATION_DEG[p] + 180) / 3);

  const saptavargajaDetail = SEVEN.map(() => ({}));
  const saptavargaja = SEVEN.map((p) => {
    let sum = 0;
    for (const D of SAPTAVARGA) {
      const s = vargaSign(P[p].lon, D);
      const mt = D === 1 ? isMoolatrikona(p, s, opt.moolatrikonaRasi === 'degrees' ? P[p].deg : null)
                         : (opt.moolatrikonaInVargas === 'sign' && isMoolatrikona(p, s));
      let pts, dig;
      if (mt) { pts = SAPTAVARGAJA_POINTS.moolatrikona; dig = 'MT'; }
      else if (isOwnSign(p, s)) { pts = SAPTAVARGAJA_POINTS.own; dig = 'own'; }
      else { const rel = compound[p][SIGN_LORD[s]]; pts = SAPTAVARGAJA_POINTS[rel]; dig = rel; }
      saptavargajaDetail[p][D] = { sign: s, points: pts, dignity: dig };
      sum += pts;
    }
    return sum;
  });

  const ojhayugma = SEVEN.map((p) => {
    const rs = P[p].sign, ns = navamsaSign(P[p].lon);
    const wantsEven = p === MOON || p === VENUS;
    const ok = (s) => (wantsEven ? !ODD_SIGN(s) : ODD_SIGN(s));
    return (ok(rs) ? 15 : 0) + (ok(ns) ? 15 : 0);
  });

  const kendradi = SEVEN.map((p) => { const h = P[p].house; return [1, 4, 7, 10].includes(h) ? 60 : [2, 5, 8, 11].includes(h) ? 30 : 15; });

  const drekkana = SEVEN.map((p) => {
    const part = Math.min(2, Math.floor(P[p].deg / 10));
    const second = opt.drekkanaOrder === 'bphs' ? [MOON, VENUS] : [MERCURY, SATURN];
    const want = [SUN, MARS, JUPITER].includes(p) ? 0 : second.includes(p) ? 1 : 2;
    return part === want ? 15 : 0;
  });

  const sthana = SEVEN.map(i => uchcha[i] + saptavargaja[i] + ojhayugma[i] + kendradi[i] + drekkana[i]);

  // ---------- Dig bala ----------
  const weakHouse = { [SUN]: 4, [MARS]: 4, [MOON]: 10, [VENUS]: 10, [MERCURY]: 7, [JUPITER]: 7, [SATURN]: 1 };
  const dig = SEVEN.map(p => sep(P[p].lon, chart.bhavas.madhya[weakHouse[p]]) / 3);

  // ---------- Kala bala ----------
  // Natonnata
  let hoursFromMidnight;
  const lmt = (((jd + 0.5 + chart.input.lon / 360) % 1) + 1) % 1 * 24;
  if (opt.natonnataReference === 'apparent' && !polar) {
    const midnights = [day.prevSunset != null ? (day.prevSunset + day.sunrise) / 2 : null, (day.sunset + day.nextSunrise) / 2].filter(x => x != null);
    hoursFromMidnight = Math.min(12, Math.min(...midnights.map(m => Math.abs(jd - m))) * 24);
  } else {
    const lat = opt.natonnataReference === 'lat' ? ((lmt + (chart.equationOfTime || 0) * 24) % 24 + 24) % 24 : lmt;
    hoursFromMidnight = Math.min(lat, 24 - lat);
  }
  const unnata = hoursFromMidnight * 5; // 12 h → 60
  const natonnata = SEVEN.map(p => (p === MERCURY ? 60 : [SUN, JUPITER, VENUS].includes(p) ? unnata : 60 - unnata));

  // Paksha
  const { benefics, malefics } = beneficsAndMalefics(chart, opt.nodesInMercuryTest);
  const elong = sep(P[SUN].lon, P[MOON].lon);
  const pakshaBase = SEVEN.map(p => (benefics.includes(p) ? elong / 3 : (180 - elong) / 3));
  const paksha = pakshaBase.map((v, i) => (SEVEN[i] === MOON && opt.moonPakshaDoubled ? 2 * v : v));

  // Tribhaga
  const tribhaga = SEVEN.map(() => 0);
  tribhaga[JUPITER] = 60;
  let tribhagaLord = null;
  if (!polar) {
    if (day.isDay) tribhagaLord = [MERCURY, SUN, SATURN][Math.min(2, Math.floor((jd - day.sunrise) / (day.dayLength / 3)))];
    else tribhagaLord = [MOON, VENUS, MARS][Math.min(2, Math.floor((jd - day.sunset) / (day.nightLength / 3)))];
    tribhaga[tribhagaLord] = 60;
  } else notes.push('Tribhaga bala: no sunrise/sunset at this latitude; only Jupiter credited.');

  // Abda, Masa, Vara, Hora
  const dayStartLocal = (!polar ? day.sunrise : jd) + chart.input.utcOffset / 24; // Vedic date
  const jd0Local = Math.floor(dayStartLocal + 0.5) - 0.5;                            // 0h of that civil date
  let abdaLord, masaLord, ahargana;
  if (opt.ahargana === 'kali') {
    ahargana = Math.floor(jd0Local + 0.5 - 588465.5);
    abdaLord = WEEKDAY_LORD[(4 + 3 * Math.floor(ahargana / 360)) % 7];
    masaLord = WEEKDAY_LORD[(4 + 2 * Math.floor(ahargana / 30)) % 7];
  } else {
    ahargana = ramanAhargana(jd0Local);
    const wd = (r) => WEEKDAY_LORD[(((r % 7) + 7) % 7 + 2) % 7]; // remainder 1 → Wednesday
    abdaLord = wd(Math.floor(ahargana / 360) * 3 + 1);
    masaLord = wd(Math.floor(ahargana / 30) * 2 + 1);
  }
  const varaLord = chart.weekdayLord;
  const abda = SEVEN.map(p => (p === abdaLord ? 15 : 0));
  const masa = SEVEN.map(p => (p === masaLord ? 30 : 0));
  const vara = SEVEN.map(p => (p === varaLord ? 45 : 0));
  let horaLord = null, horaIndex = null;
  if (!polar) {
    if (opt.horaMethod === 'equalHours') horaIndex = Math.floor((jd - day.sunrise) * 24);
    else if (day.isDay) horaIndex = Math.min(11, Math.floor((jd - day.sunrise) / (day.dayLength / 12)));
    else horaIndex = 12 + Math.min(11, Math.floor((jd - day.sunset) / (day.nightLength / 12)));
    horaLord = HORA_SEQUENCE[(HORA_SEQUENCE.indexOf(varaLord) + horaIndex) % 7];
  }
  const hora = SEVEN.map(p => (p === horaLord ? 60 : 0));

  // Ayana
  const T = (jd + chart.deltaT / 86400 - 2451545) / 36525;
  const eps = meanObliquity(T);
  const declination = SEVEN.map(p => (opt.declination === 'true' ? P[p].dec
    : opt.declination === 'ecliptic' ? Math.asin(Math.sin(eps * Math.PI / 180) * Math.sin(P[p].tropLon * Math.PI / 180)) * 180 / Math.PI
    : ssKranti(P[p].tropLon)));
  const ayanaBase = SEVEN.map((p) => {
    const d = declination[p];
    let v = p === MERCURY ? (24 + Math.abs(d)) * 1.25 : [MOON, SATURN].includes(p) ? (24 - d) * 1.25 : (24 + d) * 1.25;
    if (opt.clampAyana) v = Math.max(0, Math.min(60, v));
    return v;
  });
  const ayana = ayanaBase.map((v, i) => (SEVEN[i] === SUN && opt.sunAyanaDoubled ? 2 * v : v));

  // Yuddha
  const yuddha = SEVEN.map(() => 0);
  const kalaToHora = SEVEN.map(i => natonnata[i] + paksha[i] + tribhaga[i] + abda[i] + masa[i] + vara[i] + hora[i]);
  const yuddhaDetail = [];
  for (const w of chart.wars) {
    const base = (p) => sthana[p] + dig[p] + kalaToHora[p];
    const diff = Math.abs(base(w.winner) - base(w.loser));
    const dd = Math.abs(DISC_DIAMETER[w.winner] - DISC_DIAMETER[w.loser]);
    const y = dd ? diff / dd : 0;
    yuddha[w.winner] += y; yuddha[w.loser] -= y;
    yuddhaDetail.push({ ...w, value: y });
  }
  const kala = SEVEN.map(i => kalaToHora[i] + ayana[i] + yuddha[i]);

  // ---------- Chesta bala ----------
  const year = chart.input.year;
  const means = opt.chestaMeans === 'meeus' ? meeusMeanLongitudes(T) : ramanMeanLongitudes(jd, year);
  const trueFor = (p) => (opt.chestaMeans === 'meeus' ? P[p].tropLon : P[p].lon); // frame must match the means
  const chestaDetail = {};
  const chestaKendra = {};
  const chesta = SEVEN.map((p) => {
    if (p === SUN) return ayana[SUN];
    if (p === MOON) return paksha[MOON];
    const inner = p === MERCURY || p === VENUS;
    const madhya = inner ? means[SUN] : means[p];
    const seeghra = inner ? means[p] : means[SUN];
    const trueLon = trueFor(p);
    let diff = norm360(trueLon - madhya); if (diff > 180) diff -= 360;
    const avg = norm360(madhya + diff / 2);
    let k = norm360(seeghra - avg); if (k > 180) k = 360 - k;
    chestaKendra[p] = k;
    chestaDetail[p] = { madhya, seeghrochcha: seeghra, trueLon, chestaKendra: k, frame: opt.chestaMeans === 'meeus' ? 'sayana' : 'nirayana' };
    return k / 3;
  });
  const chestaInTotal = SEVEN.map(p => ((p === SUN || p === MOON) && !opt.luminaryChestaInTotal ? 0 : chesta[p]));

  // ---------- Naisargika ----------
  const naisargika = SEVEN.map(p => NAISARGIKA_BALA[p]);

  // ---------- Drik bala ----------
  const drishti = SEVEN.map(() => SEVEN.map(() => 0)); // [aspected][aspecting]
  const drik = SEVEN.map((p) => {
    let plus = 0, minus = 0;
    for (const q of SEVEN) {
      if (q === p) continue;
      const v = sputaDrishti(arc(P[q].lon, P[p].lon), q, opt.drishtiSpecial);
      drishti[p][q] = v;
      if (benefics.includes(q)) plus += v; else minus += v;
    }
    return (plus - minus) / opt.drikDivisor;
  });

  // ---------- Totals ----------
  const total = SEVEN.map(i => sthana[i] + dig[i] + kala[i] + chestaInTotal[i] + naisargika[i] + drik[i]);
  const rupas = total.map(t => t / 60);
  const required = opt.requiredMinima === 'raman' ? [5, 6, 5, 7, 6.5, 5.5, 5] : REQUIRED_RUPAS;
  const ratio = rupas.map((r, i) => r / required[i]);
  const rank = SEVEN.map(i => 1 + SEVEN.filter(j => ratio[j] > ratio[i]).length);

  // ---------- Ishta / Kashta (Raman) ----------
  // Sun's chesta for this purpose = fold(sayana Sun + 90°)/3; Moon's = fold(Moon − Sun)/3; others = chesta kendra/3.
  const sunIK = sep(P[SUN].tropLon + 90, 0) / 3;
  const moonIK = elong / 3;
  const chestaIK = SEVEN.map(p => Math.max(0, Math.min(60, p === SUN ? sunIK : p === MOON ? moonIK : chesta[p])));
  const uchchaC = uchcha.map(u => Math.max(0, Math.min(60, u)));
  const ishta = SEVEN.map(i => Math.sqrt(uchchaC[i] * chestaIK[i]));
  const kashta = SEVEN.map(i => Math.sqrt((60 - uchchaC[i]) * (60 - chestaIK[i])));

  return {
    options: opt, notes,
    components: {
      uchcha, saptavargaja, ojhayugma, kendradi, drekkana, sthana,
      dig,
      natonnata, paksha, tribhaga, abda, masa, vara, hora, ayana, yuddha, kala,
      chesta, chestaInTotal, naisargika, drik, total, rupas, required, ratio, rank,
    },
    detail: {
      saptavargaja: saptavargajaDetail, compound, benefics, malefics, elongation: elong, hoursFromMidnight, lmt,
      tribhagaLord, abdaLord, masaLord, varaLord, horaLord, horaIndex, ahargana, declination, obliquity: eps,
      chesta: chestaDetail, means, drishti, yuddha: yuddhaDetail, ayanaBase, pakshaBase,
    },
    ishtaKashta: { ishta, kashta, uchcha: uchchaC, chesta: chestaIK },
  };
}
