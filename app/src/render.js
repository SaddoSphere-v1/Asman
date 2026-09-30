// HTML + plain-text rendering of the results. No interpretation, tables only.
import { fmtDMS, fmtHours, formatOffset, localHours } from './time.js';
import { SEVEN, NINE, PLANET_NAMES, SIGN_NAMES, WEEKDAY_NAMES } from './constants.js';
import { aspectMatrix, relationshipTables, dignityTable } from './tables.js';
import { divisionalCharts, VARGA_NAMES } from './vargas.js';
import { specialLagnaTables } from './lagnatables.js';
import { computeArgala, ARGALA_HOUSES } from './argala.js';

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

export function renderAll({ chart, shadbala, upagrahas, avasthas, ashtakavarga, lagnas, karakas, meta }) {
  const c = chart, off = c.input.utcOffset;
  const parts = [];
  parts.push(renderHeader(c));
  parts.push(renderPlacements(c, karakas));
  if (lagnas) parts.push(renderLagnas(c, lagnas, ashtakavarga, shadbala.options.drishtiSpecial));
  parts.push(renderDivisional(c, upagrahas, lagnas));
  parts.push(renderDignities(c));
  parts.push(renderRelationships(c));
  parts.push(renderAspects(c, shadbala.options.drishtiSpecial));
  parts.push(renderArgala(c));
  parts.push(renderUpagrahas(c, upagrahas));
  parts.push(renderShadbala(c, shadbala));
  parts.push(renderIshtaKashta(shadbala));
  if (ashtakavarga) parts.push(renderAshtakavarga(ashtakavarga));
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

function renderPlacements(c, karakas) {
  const karakaOf = Object.fromEntries((karakas || []).map(k => [k.planet, k.karaka]));
  const rows = [];
  const L = c.lagna;
  rows.push(['Lagna', txt(signDeg(L.lon)), txt(nak(L.nakshatra)), txt(pname(L.nakshatra.lord)), txt(pname(L.signLord)), txt('1'), txt('1'), txt(''), txt('')]);
  for (const p of NINE) {
    const P = c.planets[p];
    const status = [P.retro ? 'retrograde' : '', P.combust ? 'combust' : '', P.war ? (P.war.won ? `wins war against ${pname(P.war.with)}` : `loses war to ${pname(P.war.with)}`) : ''].filter(Boolean).join(', ');
    rows.push([pname(p), txt(signDeg(P.lon)), txt(nak(P.nakshatra)), txt(pname(P.nakshatra.lord)), txt(pname(P.signLord)), txt(String(P.house)), txt(String(P.bhava)), txt(karakaOf[p] || ''), txt(status, 'wrap')]);
  }
  return `<section id="placements"><h2>Placements</h2>${table('', ['Graha', 'Sign and degree', 'Nakshatra and pada', 'Nakshatra lord', 'Sign lord', 'House', 'Bhava', 'Chara karaka', 'Status'], rows)}</section>`;
}

function renderUpagrahas(c, ups) {
  const off = c.input.utcOffset;
  const rows = ups.map((u) => {
    if (u.lon == null) return [u.name, txt(u.unavailable || '—', 'wrap'), txt('—'), txt('—'), txt('—'), txt('—')];
    return [u.name, txt(signDeg(u.lon)), txt(nak(u.nakshatra)), txt(pname(u.nakshatra.lord)), txt(String(u.house)), txt(String(u.bhava))];
  });
  return `<section id="upagrahas"><h2>Upagrahas</h2>${table('', ['Upagraha', 'Sign and degree', 'Nakshatra and pada', 'Nakshatra lord', 'House', 'Bhava'], rows)}</section>`;
}

const TARA = [2, 3, 4, 5, 6];     // Mars, Mercury, Jupiter, Venus, Saturn
const LUMINARIES = [0, 1];        // Sun, Moon

function shadbalaTable(sb, planets, withYuddha) {
  const C = sb.components;
  const head = ['', ...planets.map(pname)];
  const row = (label, arr, cls = '') => [{ html: esc(label) }, ...planets.map(p => ({ html: esc(n2(arr[p])), cls: 'num ' + cls }))];
  const rows = [
    row('Uchcha bala', C.uchcha), row('Saptavargaja bala', C.saptavargaja), row('Ojhayugma bala', C.ojhayugma), row('Kendradi bala', C.kendradi), row('Drekkana bala', C.drekkana),
    row('Sthana bala', C.sthana, 'sub'),
    row('Dig bala', C.dig, 'sub'),
    row('Natonnata bala', C.natonnata), row('Paksha bala', C.paksha), row('Tribhaga bala', C.tribhaga), row('Abda bala', C.abda), row('Masa bala', C.masa), row('Vara bala', C.vara), row('Hora bala', C.hora), row('Ayana bala', C.ayana),
    ...(withYuddha ? [row('Yuddha bala', C.yuddha)] : []),
    row('Kala bala', C.kala, 'sub'),
    row('Chesta bala', C.chesta, 'sub'),
    row('Naisargika bala', C.naisargika, 'sub'),
    row('Drik bala', C.drik, 'sub'),
    row('Shadbala (shashtiamsas)', C.total, 'total'),
    row('Shadbala (rupas)', C.rupas, 'total'),
    row('Required (rupas)', C.required),
    row('Ratio', C.ratio, 'total'),
    [{ html: 'Rank' }, ...planets.map(p => ({ html: String(C.rank[p]), cls: 'num' }))],
  ];
  let html = table('', head, rows, 'matrix');
  html = html.replace(/<tr><th scope="row">(Sthana bala|Dig bala|Kala bala|Chesta bala|Naisargika bala|Drik bala|Shadbala \(shashtiamsas\)|Shadbala \(rupas\)|Ratio)<\/th>/g, (m, l) => `<tr class="${l.startsWith('Shadbala') || l === 'Ratio' ? 'total' : 'sub'}"><th scope="row">${l}</th>`);
  return html;
}

function renderShadbala(c, sb) {
  return `<section id="shadbala"><h2>Shadbala</h2>${shadbalaTable(sb, TARA, true)}<h2>Shadbala of the Sun and Moon</h2>${shadbalaTable(sb, LUMINARIES, false)}</section>`;
}

function ishtaTable(sb, planets) {
  const ik = sb.ishtaKashta;
  const head = ['', ...planets.map(pname)];
  const rows = [
    ['Ishta phala', ...planets.map(p => num(ik.ishta[p]))],
    ['Kashta phala', ...planets.map(p => num(ik.kashta[p]))],
  ];
  return table('', head, rows, 'matrix');
}

function renderIshtaKashta(sb) {
  return `<section id="ishta"><h2>Ishta / Kashta phala</h2>${ishtaTable(sb, TARA)}<h2>Ishta / Kashta phala of the Sun and Moon</h2>${ishtaTable(sb, LUMINARIES)}</section>`;
}

function renderAvasthas(av) {
  const d = SEVEN.map(p => [pname(p), txt(av.deeptadi[p].states.join(', ') || '—')]);
  const l = SEVEN.map(p => [pname(p), txt(av.lajjitadi[p].states.join(', ') || '—')]);
  return `<section id="avasthas"><h2>Deeptadi avasthas</h2>${table('', ['Graha', 'Avasthas'], d)}<h2>Lajjitadi avasthas</h2>${table('', ['Graha', 'Avasthas'], l)}</section>`;
}

function renderAshtakavarga(av) {
  const head = ['', ...SIGN_NAMES, 'Total'];
  const intCell = (v) => ({ html: String(v), cls: 'num' });
  const rowsOf = (m, withSav, savRow) => {
    const rows = SEVEN.map(p => [pname(p), ...m[p].map(intCell), intCell(m[p].reduce((a, b) => a + b, 0))]);
    if (withSav) rows.push([{ html: 'Sarvashtakavarga' }, ...savRow.map(intCell), intCell(savRow.reduce((a, b) => a + b, 0))]);
    return rows;
  };
  let bav = table('', head, rowsOf(av.bav, true, av.sav), 'matrix');
  bav = bav.replace('<tr><th scope="row">Sarvashtakavarga</th>', '<tr class="total"><th scope="row">Sarvashtakavarga</th>');
  const trik = table('', head, rowsOf(av.trikona, false), 'matrix');
  let eka = table('', head, rowsOf(av.ekadhipatya, true, av.savReduced), 'matrix');
  eka = eka.replace('<tr><th scope="row">Sarvashtakavarga</th>', '<tr class="total"><th scope="row">Sarvashtakavarga</th>');
  const pindas = table('', ['', 'Rasi pinda', 'Graha pinda', 'Shodhya pinda'], SEVEN.map(p => [pname(p), intCell(av.rasiPinda[p]), intCell(av.grahaPinda[p]), intCell(av.shodhyaPinda[p])]));
  return `<section id="ashtakavarga"><h2>Ashtakavarga</h2>${bav}<h2>After Trikona shodhana</h2>${trik}<h2>After Ekadhipatya shodhana</h2>${eka}<h2>Shodhya pindas</h2>${pindas}</section>`;
}

const REL_WORD = { F: 'Friend', N: 'Neutral', E: 'Enemy', adhimitra: 'Great friend', mitra: 'Friend', sama: 'Neutral', satru: 'Enemy', adhisatru: 'Great enemy' };
const yes = (b) => ({ html: b ? 'Yes' : '', cls: b ? '' : 'muted' });

function renderDignities(c) {
  const rows = dignityTable(c).map(d => [pname(d.planet), txt(SIGN_NAMES[d.sign]), txt(pname(d.lord)), yes(d.exalted), yes(d.debilitated), yes(d.own), yes(d.moolatrikona),
    txt(d.natural ? REL_WORD[d.natural] : '—'), txt(d.compound ? REL_WORD[d.compound] : '—')]);
  return `<section id="dignities"><h2>Dignities</h2>${table('', ['Graha', 'Sign', 'Sign lord', 'Exaltation', 'Debilitation', 'Own sign', 'Moolatrikona', 'Natural relation to lord', 'Compound relation to lord'], rows)}</section>`;
}

function renderRelationships(c) {
  const r = relationshipTables(c);
  const head = ['', ...SEVEN.map(pname)];
  const grid = (m) => SEVEN.map(p => [pname(p), ...SEVEN.map(q => txt(p === q ? '—' : REL_WORD[m[p][q]]))]);
  return `<section id="relationships"><h2>Natural relationships</h2>${table('', head, grid(r.natural), 'matrix')}<h2>Temporal relationships</h2>${table('', head, grid(r.temporal), 'matrix')}<h2>Compound relationships</h2>${table('', head, grid(r.compound), 'matrix')}</section>`;
}

function renderAspects(c, special) {
  const m = aspectMatrix(c, special);
  const head = ['Aspecting graha', ...NINE.map(pname), 'Lagna'];
  const rows = NINE.map(q => [pname(q), ...m.rows[q].map(v => (v == null ? txt('—') : num(v)))]);
  return `<section id="aspects"><h2>Aspects</h2>${table('', head, rows, 'matrix')}</section>`;
}

const DIGNITY_WORD = { exalted: 'Exalted', moolatrikona: 'Moolatrikona', own: 'Own sign', debilitated: 'Debilitated', adhimitra: "Great friend's sign", mitra: "Friend's sign", sama: "Neutral's sign", satru: "Enemy's sign", adhisatru: "Great enemy's sign" };

function renderDivisional(c, upagrahas = [], lagnas = []) {
  const extra = [...upagrahas.map(u => ({ name: u.name, lon: u.lon, group: 'upagraha' })), ...lagnas.map(l => ({ name: l.name, lon: l.lon, group: 'lagna' }))];
  const dv = divisionalCharts(c, extra);
  const head = ['Chart', 'Lagna', ...NINE.map(pname)];
  const summary = dv.charts.map(v => [v.name, txt(SIGN_NAMES[v.lagna.sign]), ...v.planets.map(x => txt(SIGN_NAMES[x.sign]))]);
  let html = `<section id="vargas"><h2>Divisional charts</h2>${table('', head, summary, 'matrix')}`;
  for (const v of dv.charts) {
    if (v.D === 1) continue;
    const rows = [['Lagna', txt(`${SIGN_NAMES[v.lagna.sign]} ${fmtDMS(v.lagna.deg, 2)}`), txt('1'), txt(''), txt('')]];
    v.planets.forEach((x, p) => rows.push([pname(p), txt(`${SIGN_NAMES[x.sign]} ${fmtDMS(x.deg, 2)}`), txt(String(x.house)), txt(x.dignity ? DIGNITY_WORD[x.dignity] : ''), yes(x.vargottama)]));
    for (const x of v.points) rows.push([{ html: `<span class="${x.group}">${esc(x.name)}</span>` }, txt(`${SIGN_NAMES[x.sign]} ${fmtDMS(x.deg, 2)}`), txt(String(x.house)), txt(''), yes(x.vargottama)]);
    let t = table('', ['Point', 'Sign and degree', 'House', 'Dignity', 'Vargottama'], rows);
    t = t.replace('<tr><th scope="row"><span class="upagraha">', '<tr class="group"><th scope="row"><span class="upagraha">').replace('<tr><th scope="row"><span class="lagna">', '<tr class="group"><th scope="row"><span class="lagna">');
    html += `<h2>${esc(v.name)}</h2>${t}`;
  }
  const schemes = Object.keys(dv.vimshopaka[0]);
  const vb = SEVEN.map(p => [pname(p), ...schemes.map(sch => num(dv.vimshopaka[p][sch]))]);
  html += `<h2>Vimshopaka bala</h2>${table('', ['Graha', ...schemes], vb, 'matrix')}`;
  const vv = SEVEN.map(p => [pname(p), ...schemes.map(sch => { const e = dv.vishwa[p][sch]; return txt(`${e.count}${e.name ? ' · ' + e.name : ''}`); })]);
  html += `<h2>Varga vishwa</h2>${table('', ['Graha', ...schemes], vv, 'matrix')}</section>`;
  return html;
}

function renderLagnas(c, lagnas, ashtakavarga, special) {
  const T = specialLagnaTables({ chart: c, lagnas, ashtakavarga, special });
  const main = lagnas.map(u => (u.lon == null ? [u.name, txt(u.unavailable || '—', 'wrap'), txt('—'), txt('—'), txt('—'), txt('—'), txt('—')]
    : [u.name, txt(signDeg(u.lon)), txt(nak(u.nakshatra)), txt(pname(u.nakshatra.lord)), txt(pname(u.signLord)), txt(String(u.house)), txt(String(u.bhava))]));
  let html = `<section id="lagnas"><h2>Special lagnas</h2>${table('', ['Lagna', 'Sign and degree', 'Nakshatra and pada', 'Nakshatra lord', 'Sign lord', 'House', 'Bhava'], main)}`;
  const avail = T.filter(t => t.lon != null);
  if (!avail.length) return html + '</section>';
  const grahaHead = ['Lagna', ...NINE.map(pname)];
  const withSign = (t) => `${t.name} · ${SIGN_NAMES[t.sign]}`;
  html += `<h2>Houses of the grahas from the special lagnas</h2>${table('', grahaHead, avail.map(t => [withSign(t), ...t.houses.map(h => txt(String(h)))]), 'matrix')}`;
  html += `<h2>Bhavas of the grahas from the special lagnas</h2>${table('', grahaHead, avail.map(t => [withSign(t), ...t.bhavas.map(h => txt(String(h)))]), 'matrix')}`;
  const place = (x) => { const st = [x.retro ? 'Retrograde' : null, x.combust ? 'Combust' : null].filter(Boolean).join(', '); return `${SIGN_NAMES[x.sign]} ${fmtDMS(x.deg, 2)}${st ? ' · ' + st : ''}`; };
  const lordCells = (x) => [txt(pname(x.planet)), txt(place(x)), txt(String(x.house)), txt(x.dignity ? DIGNITY_WORD[x.dignity] : '—')];
  html += `<h2>Sign lords of the special lagnas</h2>${table('', ['Lagna', 'Sign lord', 'Placement', 'House from the lagna', 'Dignity'], avail.map(t => [withSign(t), ...lordCells(t.lord)]))}`;
  html += `<h2>Nakshatra lords of the special lagnas</h2>${table('', ['Lagna', 'Nakshatra lord', 'Placement', 'House from the lagna', 'Dignity'], avail.map(t => [withSign(t), ...lordCells(t.nakshatraLord)]))}`;
  html += `<h2>Aspects on the special lagnas</h2>${table('', [...grahaHead, 'Total'], avail.map(t => [withSign(t), ...t.aspects.map(v => num(v)), num(t.aspectTotal)]), 'matrix')}`;
  html += `<h2>Argala on the special lagnas</h2>${table('', ['Lagna', 'Second house', 'Fourth house', 'Eleventh house', 'Fifth house', 'Third house (malefics)'], avail.map(t => [withSign(t), ...ARGALA_HOUSES.map(a => argalaCell(t.argala[a.key])), argalaCell(t.argala.vipareeta)]))}`;
  if (ashtakavarga) html += `<h2>Ashtakavarga bindus of the special lagnas</h2>${table('', ['Lagna', ...SEVEN.map(pname), 'Total', 'After shodhana'], avail.map(t => [withSign(t), ...t.bindus.perPlanet.map(b => txt(String(b))), txt(String(t.bindus.total)), txt(String(t.bindus.reduced))]), 'matrix')}`;
  html += `<h2>Special lagnas in the divisional charts</h2>${table('', ['Chart', ...avail.map(t => t.name)], avail[0].vargas.map((v, k) => [VARGA_NAMES[v.D], ...avail.map(t => txt(SIGN_NAMES[t.vargas[k].sign]))]), 'matrix')}`;
  return html + '</section>';
}

function argalaCell(a) {
  if (!a.giving.length) return txt('—', 'muted');
  const who = a.giving.map(pname).join(', ');
  if (a.house === 3) return txt(who, 'wrap');
  const obs = a.obstructing.length ? ` · ${a.obstructed ? 'obstructed by' : 'not obstructed by'} ${a.obstructing.map(pname).join(', ')}` : ' · unobstructed';
  return txt(who + obs, 'wrap');
}

function renderArgala(c) {
  const ag = computeArgala(c);
  const head = ['Reference', 'Second house', 'Fourth house', 'Eleventh house', 'Fifth house', 'Third house (malefics)'];
  const rows = [...ag.houses, ...ag.planets].map(r => [`${r.label} · ${SIGN_NAMES[r.sign]}`, ...ARGALA_HOUSES.map(a => argalaCell(r.argala[a.key])), argalaCell(r.argala.vipareeta)]);
  return `<section id="argala"><h2>Argala</h2>${table('', head, rows)}</section>`;
}
