// HTML + plain-text rendering of the results. No interpretation, tables only.
import { fmtDMS, fmtHours, fmtLocalDateTime, formatOffset, localHours } from './time.js';
import { SEVEN, NINE, PLANET_NAMES, SIGN_NAMES, WEEKDAY_NAMES } from './constants.js';
import { SAPTAVARGA } from './vargas.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const n2 = (x) => (x == null || !Number.isFinite(x) ? '—' : (Math.round(x * 100) / 100).toFixed(2));
const n1 = (x) => (x == null || !Number.isFinite(x) ? '—' : x.toFixed(1));
const n4 = (x) => (x == null || !Number.isFinite(x) ? '—' : x.toFixed(4));
const signDeg = (lon) => `${SIGN_NAMES[Math.floor(lon / 30) % 12]} ${fmtDMS(lon % 30, 2)}`;
const VARGA_NAMES = { 1: 'Rasi', 2: 'Hora', 3: 'Drekkana', 7: 'Saptamsa', 9: 'Navamsa', 12: 'Dwadasamsa', 30: 'Trimsamsa' };
const DIGNITY_NAMES = { MT: 'moolatrikona', own: 'own sign', adhimitra: 'great friend', mitra: 'friend', sama: 'neutral', satru: 'enemy', adhisatru: 'great enemy' };
const cardinal = (v, pos, neg) => `${Math.abs(v).toFixed(4)}° ${v >= 0 ? pos : neg}`;
const nak = (n) => `${n.name} ${n.pada}`;
const pname = (p) => PLANET_NAMES[p];
const TITHI_NAMES = ['Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima'];
const tithiName = (t) => (t === 30 ? 'Amavasya' : t === 15 ? 'Purnima' : TITHI_NAMES[(t - 1) % 15]);

function table(caption, head, rows, cls = '') {
  const th = head.map((h, i) => `<th scope="col"${i ? '' : ' class="rowhead"'}>${esc(h)}</th>`).join('');
  const body = rows.map((r) => `<tr>${r.map((c, i) => (i === 0 ? `<th scope="row">${c.html ? c.html : esc(c)}</th>` : `<td${c && c.cls ? ` class="${c.cls}"` : ''}>${c && c.html != null ? c.html : esc(c == null ? '' : c)}</td>`)).join('')}</tr>`).join('');
  return `<figure class="tbl ${cls}"><table><caption>${esc(caption)}</caption><thead><tr>${th}</tr></thead><tbody>${body}</tbody></table></figure>`;
}
const num = (x, d = 2) => ({ html: esc(d === 4 ? n4(x) : d === 2 ? n2(x) : n1(x)), cls: 'num' });
const txt = (s, cls) => ({ html: esc(s), cls });

export function renderAll({ chart, shadbala, upagrahas, avasthas, meta }) {
  const c = chart, off = c.input.utcOffset;
  const parts = [];
  parts.push(renderHeader(c, shadbala, meta));
  parts.push(renderPlacements(c));
  parts.push(renderUpagrahas(c, upagrahas));
  parts.push(renderShadbala(c, shadbala));
  parts.push(renderIshtaKashta(shadbala));
  parts.push(renderAvasthas(avasthas));
  parts.push(renderDetails({ ...c, upagrahas }, shadbala, meta));
  return parts.join('\n');
}

function renderHeader(c, sb, meta) {
  const off = c.input.utcOffset;
  const d = c.day;
  const rows = [
    ...(c.input.name || c.input.gender ? [['Name', [c.input.name, c.input.gender].filter(Boolean).join(' · ')]] : []),
    ['Birth', `${c.input.year}-${String(c.input.month).padStart(2, '0')}-${String(c.input.day).padStart(2, '0')} ${fmtHours(c.input.hour + c.input.minute / 60 + (c.input.second || 0) / 3600)} local time, ${formatOffset(off)} from Greenwich${c.input.zone ? ' · ' + c.input.zone : ''}`],
    ['Birthplace', `${c.input.place ? c.input.place + ' · ' : ''}${cardinal(c.input.lat, 'north', 'south')}, ${cardinal(c.input.lon, 'east', 'west')}`],
    ['Ayanamsa', `Lahiri ${fmtDMS(c.ayanamsa, 2)}`],
    ['Sunrise / sunset', d.polar ? 'no sunrise or sunset at this latitude' : `${fmtHours(localHours(d.sunrise, off))} / ${fmtHours(localHours(d.sunset, off))} · ${d.isDay ? 'day' : 'night'} birth`],
    ['Weekday', `${WEEKDAY_NAMES[c.weekday]}`],
    ['Tithi', `${tithiName(c.tithi)} · ${c.waxing ? 'Shukla' : 'Krishna'} paksha`],
  ];
  return `<section id="header"><h2>Chart data</h2><dl class="kv">${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></section>`;
}

function renderPlacements(c) {
  const rows = [];
  const L = c.lagna;
  rows.push(['Lagna', txt(signDeg(L.lon)), txt(nak(L.nakshatra)), txt(pname(L.nakshatra.lord)), txt(pname(L.signLord)), txt('1'), txt('1'), txt('')]);
  for (const p of NINE) {
    const P = c.planets[p];
    const status = [P.retro ? 'retrograde' : '', P.combust ? 'combust' : '', P.war ? (P.war.won ? `wins war against ${pname(P.war.with)}` : `loses war to ${pname(P.war.with)}`) : ''].filter(Boolean).join(', ');
    rows.push([pname(p), txt(signDeg(P.lon)), txt(nak(P.nakshatra)), txt(pname(P.nakshatra.lord)), txt(pname(P.signLord)), txt(String(P.house)), txt(String(P.bhava)), txt(status, 'wrap')]);
  }
  return `<section id="placements"><h2>Placements</h2>${table('Sidereal (Lahiri) positions', ['Graha', 'Sign and degree', 'Nakshatra and pada', 'Nakshatra lord', 'Sign lord', 'House', 'Bhava', 'Status'], rows)}</section>`;
}

function renderUpagrahas(c, ups) {
  const off = c.input.utcOffset;
  const rows = ups.map((u) => {
    if (u.lon == null) return [u.name, txt(u.unavailable || '—', 'wrap'), txt('—'), txt('—'), txt('—'), txt('—')];
    return [u.name, txt(signDeg(u.lon)), txt(nak(u.nakshatra)), txt(pname(u.nakshatra.lord)), txt(String(u.house)), txt(String(u.bhava))];
  });
  return `<section id="upagrahas"><h2>Upagrahas</h2>${table('Sun-based upagrahas, kalavelas and Pranapada', ['Upagraha', 'Sign and degree', 'Nakshatra and pada', 'Nakshatra lord', 'House', 'Bhava'], rows)}</section>`;
}

function renderShadbala(c, sb) {
  const C = sb.components;
  const head = ['Component', ...SEVEN.map(p => pname(p))];
  const row = (label, arr, cls = '') => [{ html: esc(label) }, ...arr.map(v => ({ html: esc(n2(v)), cls: 'num ' + cls }))];
  const rows = [
    row('Uchcha bala', C.uchcha), row('Saptavargaja bala', C.saptavargaja), row('Ojhayugma bala', C.ojhayugma), row('Kendradi bala', C.kendradi), row('Drekkana bala', C.drekkana),
    row('Sthana bala', C.sthana, 'sub'),
    row('Dig bala', C.dig, 'sub'),
    row('Natonnata bala', C.natonnata), row('Paksha bala', C.paksha), row('Tribhaga bala', C.tribhaga), row('Abda bala', C.abda), row('Masa bala', C.masa), row('Vara bala', C.vara), row('Hora bala', C.hora), row('Ayana bala', C.ayana), row('Yuddha bala', C.yuddha),
    row('Kala bala', C.kala, 'sub'),
    row('Chesta bala', C.chesta, 'sub'),
    row('Naisargika bala', C.naisargika, 'sub'),
    row('Drik bala', C.drik, 'sub'),
    row('Shadbala (shashtiamsas)', C.total, 'total'),
    row('Shadbala (rupas)', C.rupas, 'total'),
    row('Required (rupas)', C.required),
    row('Ratio', C.ratio, 'total'),
    [{ html: 'Rank' }, ...C.rank.map(v => ({ html: String(v), cls: 'num' }))],
  ];
  const groups = { 'Sthana bala': 'sthana', 'Dig bala': 'dig', 'Kala bala': 'kala', 'Chesta bala': 'chesta', 'Naisargika bala': 'nais', 'Drik bala': 'drik' };
  let html = table('Shadbala — every component in shashtiamsas (virupas); 60 shashtiamsas = 1 rupa', head, rows, 'matrix');
  html = html.replace(/<tr><th scope="row">(Sthana bala|Dig bala|Kala bala|Chesta bala|Naisargika bala|Drik bala|Shadbala \(shashtiamsas\)|Shadbala \(rupas\)|Ratio)<\/th>/g, (m, l) => `<tr class="${l.startsWith('Shadbala') || l === 'Ratio' ? 'total' : 'sub'}"><th scope="row">${l}</th>`);
  const notes = [
    `Benefics: ${sb.detail.benefics.map(pname).join(', ')}. Malefics: ${sb.detail.malefics.map(pname).join(', ')}.`,
    `The Sun's Chesta bala is its Ayana bala and the Moon's is its Paksha bala; both are already counted in Kala bala and are ${sb.options.luminaryChestaInTotal ? 'added again to' : 'not added again to'} the total.`,
    ...(sb.detail.yuddha.length ? [`Graha yuddha: ${sb.detail.yuddha.map(w => `${pname(w.winner)} defeats ${pname(w.loser)}`).join('; ')}.`] : []),
    ...sb.notes,
  ];
  return `<section id="shadbala"><h2>Shadbala</h2>${html}<p class="note">${notes.map(esc).join('<br>')}</p></section>`;
}

function renderIshtaKashta(sb) {
  const ik = sb.ishtaKashta;
  const head = ['', ...SEVEN.map(pname)];
  const rows = [
    ['Uchcha bala', ...ik.uchcha.map(v => num(v))],
    ['Chesta bala (as used)', ...ik.chesta.map(v => num(v))],
    ['Ishta phala', ...ik.ishta.map(v => num(v))],
    ['Kashta phala', ...ik.kashta.map(v => num(v))],
  ];
  return `<section id="ishta"><h2>Ishta / Kashta phala</h2>${table('Ishta phala = square root of (Uchcha bala × Chesta bala); Kashta phala = square root of ((60 − Uchcha bala) × (60 − Chesta bala))', head, rows, 'matrix')}</section>`;
}

function renderAvasthas(av) {
  const d = SEVEN.map(p => [pname(p), txt(av.deeptadi[p].states.join(', ')), txt(av.deeptadi[p].why.join(' · '))]);
  const l = SEVEN.map(p => [pname(p), txt(av.lajjitadi[p].states.join(', ') || '—'), txt(av.lajjitadi[p].why.join(' · '))]);
  return `<section id="avasthas"><h2>Avasthas</h2>${table('Deeptadi avasthas (Brihat Parashara Hora Shastra 45.7: Deepta, Swastha, Pramudita, Shanta, Deena, Dukhita by dignity; Vikala with a malefic; Khala in a malefic\'s sign; Kopa when combust)', ['Graha', 'Avasthas', 'Basis'], d)}${table('Lajjitadi avasthas (Brihat Parashara Hora Shastra 45.11 to 45.18; all that apply; sign aspects, compound friendship)', ['Graha', 'Avasthas', 'Basis'], l)}</section>`;
}

function renderDetails(c, sb, meta) {
  const svHead = ['Graha', ...SAPTAVARGA.map(D => VARGA_NAMES[D]), 'Total'];
  const svRows = SEVEN.map(p => [pname(p), ...SAPTAVARGA.map(D => { const e = sb.detail.saptavargaja[p][D]; return txt(`${SIGN_NAMES[e.sign]}, ${DIGNITY_NAMES[e.dignity] || e.dignity}: ${e.points}`, 'wrap'); }), num(sb.components.saptavargaja[p])]);
  const drHead = ['Aspected planet (rows) by aspecting planet (columns)', ...SEVEN.map(p => pname(p))];
  const drRows = SEVEN.map(p => [pname(p), ...SEVEN.map(q => num(sb.detail.drishti[p][q]))]);
  const bhHead = ['Bhava', 'Start', 'Madhya', 'End'];
  const bhRows = []; for (let i = 1; i <= 12; i++) bhRows.push([String(i), txt(signDeg(c.bhavas.start[i])), txt(signDeg(c.bhavas.madhya[i])), txt(signDeg(c.bhavas.end[i]))]);
  const chHead = ['Graha', 'Madhya (mean longitude)', 'Seeghrochcha', 'True longitude', 'Chesta kendra', 'Declination used'];
  const chRows = SEVEN.map(p => { const e = sb.detail.chesta[p]; return [pname(p), num(e ? e.madhya : NaN), num(e ? e.seeghrochcha : NaN), num(e ? e.trueLon : c.planets[p].tropLon), num(e ? e.chestaKendra : NaN), txt(fmtDMS(sb.detail.declination[p]))]; });
  const upHead = ['Upagraha', 'Longitude (degrees)', 'Portion', 'Point', 'Rising at (local time)'];
  const upRows = (c.upagrahas || []).map(u => [u.name, num(u.lon, 2), txt(u.time != null ? `${u.isDay ? 'day' : 'night'} portion ${u.portion} of ${pname(u.lord)}` : (u.basis || u.unavailable || '')), txt(u.point ? (u.point === 'begin' ? 'beginning' : u.point) : ''), txt(u.time != null ? fmtLocalDateTime(u.time, c.input.utcOffset) : '')]);
  const kalaRows = [
    ['Time', `Julian Day ${c.jdUt.toFixed(6)} (Universal Time) · Delta T ${c.deltaT.toFixed(1)} seconds · local sidereal time ${fmtDMS(c.lst)}`],
    ['Sunrise, sunset, next sunrise', c.day.polar ? '—' : `${fmtLocalDateTime(c.day.sunrise, c.input.utcOffset)} · ${fmtLocalDateTime(c.day.sunset, c.input.utcOffset)} · ${fmtLocalDateTime(c.day.nextSunrise, c.input.utcOffset)} (disc centre, no refraction) · day ${fmtHours(c.day.dayLength * 24)}, night ${fmtHours(c.day.nightLength * 24)}`],
    ['Natonnata', `${n2(sb.detail.hoursFromMidnight)} hours from local apparent midnight`],
    ['Tribhaga lord', sb.detail.tribhagaLord == null ? '—' : pname(sb.detail.tribhagaLord)],
    ['Vara, hora, abda, masa lords', `${pname(sb.detail.varaLord)} · ${sb.detail.horaLord == null ? '—' : pname(sb.detail.horaLord) + ` (hora ${sb.detail.horaIndex + 1} from sunrise)`} · ${pname(sb.detail.abdaLord)} · ${pname(sb.detail.masaLord)} · Raman ahargana ${sb.detail.ahargana}`],
    ['Moon − Sun', `${fmtDMS(c.elongation)} · tithi ${c.tithi}`],
    ['Houses', 'Sripati bhava madhyas (Porphyry) · whole-sign houses for sign-based rules · Rahu: true node · Swiss Ephemeris ' + meta.sweVersion],
  ];
  const spHead = ['Graha', 'Longitude (degrees)', 'Speed (degrees per day)', 'Ecliptic latitude', 'Declination'];
  const spRows = NINE.map(p => [pname(p), num(c.planets[p].lon, 4), { html: esc((c.planets[p].speed >= 0 ? '+' : '') + c.planets[p].speed.toFixed(4)), cls: 'num' }, txt(fmtDMS(c.planets[p].lat)), txt(fmtDMS(c.planets[p].dec))]);
  return `<section id="details"><details><summary>Working tables (time, positions, kalavela timings, Saptavargaja by varga, sputa drishti, bhava cusps, Chesta inputs)</summary>
<dl class="kv">${kalaRows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
${table('Planetary longitude, speed, latitude and declination', spHead, spRows)}
${table('Upagraha longitudes and kalavela timings', upHead, upRows)}
${table('Saptavargaja: sign, dignity and points in each of the seven vargas', svHead, svRows)}
${table('Sputa drishti (shashtiamsas) received by each planet from each planet', drHead, drRows, 'matrix')}
${table('Bhava boundaries', bhHead, bhRows)}
${table('Chesta bala inputs (degrees, in the frame of the chosen mean elements)', chHead, chRows)}
</details></section>`;
}

/** Plain-text version for clipboard: tab-separated tables. */
export function renderText({ chart, shadbala, upagrahas, avasthas, meta }) {
  const c = chart, off = c.input.utcOffset, out = [];
  const line = (...a) => out.push(a.join('\t'));
  line('BIRTH', `${c.input.year}-${String(c.input.month).padStart(2, '0')}-${String(c.input.day).padStart(2, '0')} ${fmtHours(c.input.hour + c.input.minute / 60 + (c.input.second || 0) / 3600)} local, ${formatOffset(off)} from Greenwich`, `latitude ${c.input.lat}`, `longitude ${c.input.lon}`);
  line('Julian Day (Universal Time)', c.jdUt.toFixed(6), 'Ayanamsa Lahiri', fmtDMS(c.ayanamsa, 2), 'Rahu: true node', `Swiss Ephemeris ${meta.sweVersion}`);
  if (!c.day.polar) line('Sunrise', fmtLocalDateTime(c.day.sunrise, off), 'Sunset', fmtLocalDateTime(c.day.sunset, off), c.day.isDay ? 'day birth' : 'night birth');
  line('Weekday', WEEKDAY_NAMES[c.weekday], 'Tithi', `${c.tithi} ${tithiName(c.tithi)}`, 'Hora lord', shadbala.detail.horaLord == null ? '-' : pname(shadbala.detail.horaLord));
  out.push('');
  line('PLACEMENTS', 'Sign and degree', 'Longitude', 'Nakshatra and pada', 'Nakshatra lord', 'Sign lord', 'House', 'Bhava', 'Speed', 'Status', 'Latitude', 'Declination');
  line('Lagna', signDeg(c.lagna.lon), c.lagna.lon.toFixed(4), nak(c.lagna.nakshatra), pname(c.lagna.nakshatra.lord), pname(c.lagna.signLord), 1, 1, '', '', '', '');
  for (const p of NINE) { const P = c.planets[p]; line(pname(p), signDeg(P.lon), P.lon.toFixed(4), nak(P.nakshatra), pname(P.nakshatra.lord), pname(P.signLord), P.house, P.bhava, P.speed.toFixed(4), [P.retro ? 'retrograde' : '', P.combust ? 'combust' : '', P.war ? (P.war.won ? `wins war against ${pname(P.war.with)}` : `loses war to ${pname(P.war.with)}`) : ''].filter(Boolean).join(', '), fmtDMS(P.lat), fmtDMS(P.dec)); }
  out.push('');
  line('UPAGRAHAS', 'Sign and degree', 'Longitude', 'Nakshatra and pada', 'Nakshatra lord', 'House', 'Bhava', 'Basis');
  for (const u of upagrahas) line(u.name, u.lon == null ? '-' : signDeg(u.lon), u.lon == null ? '-' : u.lon.toFixed(4), u.lon == null ? '-' : nak(u.nakshatra), u.lon == null ? '-' : pname(u.nakshatra.lord), u.house ?? '-', u.bhava ?? '-', u.time != null ? `${u.isDay ? 'day' : 'night'} portion ${u.portion}, ${u.point === 'begin' ? 'beginning' : u.point}, rising at ${fmtLocalDateTime(u.time, off)}` : (u.basis || u.unavailable || ''));
  out.push('');
  const C = shadbala.components;
  line('SHADBALA', ...SEVEN.map(pname));
  for (const [label, key] of [['Uchcha', 'uchcha'], ['Saptavargaja', 'saptavargaja'], ['Ojhayugma', 'ojhayugma'], ['Kendradi', 'kendradi'], ['Drekkana', 'drekkana'], ['Sthana', 'sthana'], ['Dig', 'dig'], ['Natonnata', 'natonnata'], ['Paksha', 'paksha'], ['Tribhaga', 'tribhaga'], ['Abda', 'abda'], ['Masa', 'masa'], ['Vara', 'vara'], ['Hora', 'hora'], ['Ayana', 'ayana'], ['Yuddha', 'yuddha'], ['Kala', 'kala'], ['Chesta', 'chesta'], ['Naisargika', 'naisargika'], ['Drik', 'drik'], ['Total', 'total'], ['Rupas', 'rupas'], ['Required', 'required'], ['Ratio', 'ratio'], ['Rank', 'rank']]) line(label, ...C[key].map(v => (key === 'rank' ? v : n2(v))));
  out.push('');
  line('ISHTA/KASHTA', ...SEVEN.map(pname));
  line('Ishta phala', ...shadbala.ishtaKashta.ishta.map(n2)); line('Kashta phala', ...shadbala.ishtaKashta.kashta.map(n2));
  out.push('');
  line('DEEPTADI', 'Avasthas', 'Basis'); for (const p of SEVEN) line(pname(p), avasthas.deeptadi[p].states.join(', '), avasthas.deeptadi[p].why.join(' / '));
  out.push('');
  line('LAJJITADI', 'Avasthas', 'Basis'); for (const p of SEVEN) line(pname(p), avasthas.lajjitadi[p].states.join(', ') || '-', avasthas.lajjitadi[p].why.join(' / '));
  return out.join('\n');
}
