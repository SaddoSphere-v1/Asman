// HTML + plain-text rendering of the results. No interpretation, tables only.
import { fmtDMS, fmtHours, formatOffset, localHours } from './time.js';
import { SEVEN, NINE, PLANET_NAMES, SIGN_NAMES, WEEKDAY_NAMES } from './constants.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const n2 = (x) => (x == null || !Number.isFinite(x) ? '—' : (Math.round(x * 100) / 100).toFixed(2));
const n1 = (x) => (x == null || !Number.isFinite(x) ? '—' : x.toFixed(1));
const n4 = (x) => (x == null || !Number.isFinite(x) ? '—' : x.toFixed(4));
const signDeg = (lon) => `${SIGN_NAMES[Math.floor(lon / 30) % 12]} ${fmtDMS(lon % 30, 2)}`;
const cardinal = (v, pos, neg) => `${Math.abs(v).toFixed(4)}° ${v >= 0 ? pos : neg}`;
const nak = (n) => `${n.name} ${n.pada}`;
const pname = (p) => PLANET_NAMES[p];
const TITHI_NAMES = ['Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima'];
const tithiName = (t) => (t === 30 ? 'Amavasya' : t === 15 ? 'Purnima' : TITHI_NAMES[(t - 1) % 15]);

function table(caption, head, rows, cls = '') {
  const th = head.map((h, i) => `<th scope="col"${i ? '' : ' class="rowhead"'}>${esc(h)}</th>`).join('');
  const body = rows.map((r) => `<tr>${r.map((c, i) => (i === 0 ? `<th scope="row">${c.html ? c.html : esc(c)}</th>` : `<td${c && c.cls ? ` class="${c.cls}"` : ''}>${c && c.html != null ? c.html : esc(c == null ? '' : c)}</td>`)).join('')}</tr>`).join('');
  return `<figure class="tbl ${cls}"><table>${caption ? `<caption>${esc(caption)}</caption>` : ''}<thead><tr>${th}</tr></thead><tbody>${body}</tbody></table></figure>`;
}
const num = (x, d = 2) => ({ html: esc(d === 4 ? n4(x) : d === 2 ? n2(x) : n1(x)), cls: 'num' });
const txt = (s, cls) => ({ html: esc(s), cls });

export function renderAll({ chart, shadbala, upagrahas, avasthas, meta }) {
  const c = chart, off = c.input.utcOffset;
  const parts = [];
  parts.push(renderHeader(c));
  parts.push(renderPlacements(c));
  parts.push(renderUpagrahas(c, upagrahas));
  parts.push(renderShadbala(c, shadbala));
  parts.push(renderIshtaKashta(shadbala));
  parts.push(renderAvasthas(avasthas));
  return parts.join('\n');
}

function renderHeader(c) {
  const off = c.input.utcOffset;
  const d = c.day;
  const rows = [
    ...(c.input.name || c.input.gender ? [['Name', [c.input.name, c.input.gender].filter(Boolean).join(' · ')]] : []),
    ['Birth', `${c.input.year}-${String(c.input.month).padStart(2, '0')}-${String(c.input.day).padStart(2, '0')} ${fmtHours(c.input.hour + c.input.minute / 60 + (c.input.second || 0) / 3600)} · ${formatOffset(off)} from Greenwich`],
    ['Birthplace', `${c.input.place ? c.input.place + ' · ' : ''}${cardinal(c.input.lat, 'north', 'south')}, ${cardinal(c.input.lon, 'east', 'west')}`],
    ['Ayanamsa', fmtDMS(c.ayanamsa, 2)],
    ['Sunrise / sunset', d.polar ? '—' : `${fmtHours(localHours(d.sunrise, off))} / ${fmtHours(localHours(d.sunset, off))} · ${d.isDay ? 'day' : 'night'} birth`],
    ['Weekday', WEEKDAY_NAMES[c.weekday]],
    ['Tithi', `${tithiName(c.tithi)} · ${c.waxing ? 'Shukla' : 'Krishna'} paksha`],
  ];
  return `<section id="header"><dl class="kv">${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></section>`;
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
  return `<section id="placements"><h2>Placements</h2>${table('', ['Graha', 'Sign and degree', 'Nakshatra and pada', 'Nakshatra lord', 'Sign lord', 'House', 'Bhava', 'Status'], rows)}</section>`;
}

function renderUpagrahas(c, ups) {
  const off = c.input.utcOffset;
  const rows = ups.map((u) => {
    if (u.lon == null) return [u.name, txt(u.unavailable || '—', 'wrap'), txt('—'), txt('—'), txt('—'), txt('—')];
    return [u.name, txt(signDeg(u.lon)), txt(nak(u.nakshatra)), txt(pname(u.nakshatra.lord)), txt(String(u.house)), txt(String(u.bhava))];
  });
  return `<section id="upagrahas"><h2>Upagrahas</h2>${table('', ['Upagraha', 'Sign and degree', 'Nakshatra and pada', 'Nakshatra lord', 'House', 'Bhava'], rows)}</section>`;
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
  let html = table('', head, rows, 'matrix');
  html = html.replace(/<tr><th scope="row">(Sthana bala|Dig bala|Kala bala|Chesta bala|Naisargika bala|Drik bala|Shadbala \(shashtiamsas\)|Shadbala \(rupas\)|Ratio)<\/th>/g, (m, l) => `<tr class="${l.startsWith('Shadbala') || l === 'Ratio' ? 'total' : 'sub'}"><th scope="row">${l}</th>`);
  return `<section id="shadbala"><h2>Shadbala</h2>${html}</section>`;
}

function renderIshtaKashta(sb) {
  const ik = sb.ishtaKashta;
  const head = ['', ...SEVEN.map(pname)];
  const rows = [
    ['Ishta phala', ...ik.ishta.map(v => num(v))],
    ['Kashta phala', ...ik.kashta.map(v => num(v))],
  ];
  return `<section id="ishta"><h2>Ishta / Kashta phala</h2>${table('', head, rows, 'matrix')}</section>`;
}

function renderAvasthas(av) {
  const d = SEVEN.map(p => [pname(p), txt(av.deeptadi[p].states.join(', ') || '—')]);
  const l = SEVEN.map(p => [pname(p), txt(av.lajjitadi[p].states.join(', ') || '—')]);
  return `<section id="avasthas"><h2>Deeptadi avasthas</h2>${table('', ['Graha', 'Avasthas'], d)}<h2>Lajjitadi avasthas</h2>${table('', ['Graha', 'Avasthas'], l)}</section>`;
}
