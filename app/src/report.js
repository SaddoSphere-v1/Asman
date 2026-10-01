// The Word report: the key results as thirteen sections of plain tables, derived from the same computed objects the page renders.
import { fmtDMS, fmtHours, formatOffset, localHours } from './time.js';
import { SEVEN, NINE, RAHU, KETU, PLANET_NAMES, SIGN_NAMES, SIGN_LORD, WEEKDAY_NAMES } from './constants.js';
import { aspectMatrix, relationshipTables } from './tables.js';
import { compoundMatrix, dignity } from './relations.js';
import { divisionalCharts, VARGA_NAMES } from './vargas.js';
import { computeArgala, ARGALA_HOUSES } from './argala.js';
import { computeArudhas, bhavaArudhas, signAspects } from './arudhas.js';
import { varnadaLagnas, karakamsa } from './lagnas.js';
import { signDeg, cardinal, nak, tithiName, REL_WORD, DIGNITY_WORD, argalaText } from './render.js';
import { buildDocx } from './docx.js';

const pname = (p) => PLANET_NAMES[p];
const n2 = (x) => (x == null || !Number.isFinite(x) ? 'none' : (Math.round(x * 100) / 100).toFixed(2));
const list = (ps) => (ps.length ? ps.map(pname).join(', ') : 'none');
const none = (s) => (s == null || s === '' ? 'none' : String(s));
const GRAHA_HEAD = NINE.map(pname);

/** Sections for the report, as plain strings; `renderAll` receives the same inputs. */
export function reportSections({ chart: c, shadbala, upagrahas, avasthas, ashtakavarga, lagnas, karakas }) {
  const off = c.input.utcOffset, d = c.day, P = c.planets;
  const sections = [];

  // 1. Identity
  const fmtDate = `${c.input.year}-${String(c.input.month).padStart(2, '0')}-${String(c.input.day).padStart(2, '0')}`;
  sections.push({ title: 'Identity', tables: [{ head: ['Field', 'Value'], rows: [
    ['Name', none(c.input.name)], ['Gender', none(c.input.gender)], ['Date', fmtDate],
    ['Local time', fmtHours(c.input.hour + c.input.minute / 60 + (c.input.second || 0) / 3600)], ['Offset from Greenwich', formatOffset(off)],
    ['Place', none(c.input.place)], ['Latitude', cardinal(c.input.lat, 'north', 'south')], ['Longitude', cardinal(c.input.lon, 'east', 'west')],
    ['Ayanamsa (Lahiri)', fmtDMS(c.ayanamsa, 2)],
    ['Sunrise', d.polar ? 'none' : fmtHours(localHours(d.sunrise, off))], ['Sunset', d.polar ? 'none' : fmtHours(localHours(d.sunset, off))],
    ['Day or night birth', d.polar ? 'none' : d.isDay ? 'day' : 'night'], ['Weekday', WEEKDAY_NAMES[c.weekday]],
    ['Tithi', `${tithiName(c.tithi)}, ${c.waxing ? 'Shukla' : 'Krishna'} paksha`], ['Yoga', c.yoga.name], ['Karana', c.karana.name],
  ] }] });

  // 2. Placements (with dignity)
  const compound = compoundMatrix(SEVEN.map(p => P[p].sign));
  const karakaOf = Object.fromEntries((karakas || []).map(k => [k.planet, k.karaka]));
  const status = (x) => [x.retro ? 'retrograde' : '', x.combust ? 'combust' : '', x.war ? (x.war.won ? `wins war against ${pname(x.war.with)}` : `loses war to ${pname(x.war.with)}`) : ''].filter(Boolean).join(', ');
  const placements = [['Lagna', signDeg(c.lagna.lon), nak(c.lagna.nakshatra), pname(c.lagna.nakshatra.lord), pname(c.lagna.signLord), '1', '1', 'none', 'none', 'none']];
  for (const p of NINE) {
    const x = P[p];
    const dig = p === RAHU || p === KETU ? 'none' : DIGNITY_WORD[dignity(p, x.sign, x.deg, compound)];
    placements.push([pname(p), signDeg(x.lon), nak(x.nakshatra), pname(x.nakshatra.lord), pname(x.signLord), String(x.house), String(x.bhava), dig, none(karakaOf[p]), none(status(x))]);
  }
  sections.push({ title: 'Placements', tables: [{ head: ['Point', 'Sign and degree', 'Nakshatra and pada', 'Nakshatra lord', 'Sign lord', 'House', 'Bhava', 'Dignity', 'Chara karaka', 'Status'], rows: placements }] });

  // 3. House lords
  const placed = (p) => `${SIGN_NAMES[P[p].sign]}, house ${P[p].house}`;
  sections.push({ title: 'House lords', tables: [{ head: ['House', 'Sign', 'Lord', "Lord's sign and house", 'Co-lord', "Co-lord's sign and house"], rows: Array.from({ length: 12 }, (_, i) => {
    const sign = (c.lagnaSign + i) % 12, lord = SIGN_LORD[sign], co = sign === 7 ? KETU : sign === 10 ? RAHU : null;
    return [`House ${i + 1}`, SIGN_NAMES[sign], pname(lord), placed(lord), co == null ? 'none' : pname(co), co == null ? 'none' : placed(co)];
  }) }] });

  // 4. Special lagnas
  const lagnaRows = (lagnas || []).map(u => (u.lon == null ? [u.name, u.unavailable || 'none', 'none', 'none', 'none'] : [u.name, signDeg(u.lon), nak(u.nakshatra), String(u.house), String(u.bhava)]));
  const varnada = varnadaLagnas(c, lagnas || []);
  const t4 = [{ title: 'Special lagnas', head: ['Lagna', 'Sign and degree', 'Nakshatra and pada', 'House', 'Bhava'], rows: lagnaRows }];
  if (varnada.length) t4.push({ title: 'Varnada lagnas', head: ['House', 'Sign', 'House from Lagna'], rows: varnada.map(v => [`House ${v.house}`, SIGN_NAMES[v.sign], String(v.houseFromLagna)]) });
  sections.push({ title: 'Special lagnas', tables: t4 });

  // 5. Arudha padas
  const A = computeArudhas(c);
  sections.push({ title: 'Arudha padas', tables: [
    { title: 'Bhava arudhas', head: ['Arudha', 'Of house', 'Sign', 'Lord', 'House from Lagna', 'Grahas in the sign', 'Grahas aspecting the sign'], rows: A.bhava.map(a => [a.name, `${a.index}, ${SIGN_NAMES[a.houseSign]}`, SIGN_NAMES[a.sign], pname(a.lord), String(a.house), list(a.occupants), list(a.aspecting)]) },
    { title: 'Graha arudhas', head: ['Graha', 'Sign owned', 'Arudha sign', 'House from Lagna', 'Grahas in the sign', 'Grahas aspecting the sign'], rows: A.graha.map(g => [pname(g.planet), SIGN_NAMES[g.ownSign], SIGN_NAMES[g.sign], String(g.house), list(g.occupants), list(g.aspecting)]) },
  ] });

  // 6. Karakamsa
  const K = karakamsa(c);
  sections.push({ title: 'Karakamsa', lines: [`Atmakaraka ${pname(K.atmakaraka)}. Karakamsa ${SIGN_NAMES[K.sign]}, lord ${pname(K.lord)}.`],
    tables: [{ head: ['Graha', 'Rasi sign', 'House from Karakamsa', 'Navamsa sign', 'House from Swamsa'], rows: K.planets.map(x => [pname(x.planet), SIGN_NAMES[x.rasiSign], String(x.rasiHouse), SIGN_NAMES[x.navamsaSign], String(x.navamsaHouse)]) }] });

  // 7. Divisional charts
  const dv = divisionalCharts(c);
  const matrix = dv.charts.map(v => [v.name, SIGN_NAMES[v.lagna.sign], ...v.planets.map(x => SIGN_NAMES[x.sign])]);
  const nav = dv.charts.find(v => v.D === 9);
  const navRows = [['Lagna', `${SIGN_NAMES[nav.lagna.sign]} ${fmtDMS(nav.lagna.deg, 2)}`, '1', 'none', 'none']];
  nav.planets.forEach((x, p) => navRows.push([pname(p), `${SIGN_NAMES[x.sign]} ${fmtDMS(x.deg, 2)}`, String(x.house), x.dignity ? DIGNITY_WORD[x.dignity] : 'none', x.vargottama ? 'yes' : 'no']));
  const navArudhas = bhavaArudhas({ planets: nav.planets.map(x => ({ sign: x.sign, deg: x.deg })), lagnaSign: nav.lagna.sign });
  for (const a of [navArudhas[0], navArudhas[11]]) navRows.push([a.name, SIGN_NAMES[a.sign], String(a.house), 'none', 'none']);
  const schemes = Object.keys(dv.vimshopaka[0]);
  sections.push({ title: 'Divisional charts', tables: [
    { title: 'Signs in the sixteen divisional charts', head: ['Chart', 'Lagna', ...GRAHA_HEAD], rows: matrix },
    { title: 'Navamsa', head: ['Point', 'Sign and degree', 'House', 'Dignity', 'Vargottama'], rows: navRows },
    { title: 'Vimshopaka bala', head: ['Graha', ...schemes], rows: SEVEN.map(p => [pname(p), ...schemes.map(s => n2(dv.vimshopaka[p][s]))]) },
  ] });

  // 8. Aspects and relationships
  const m = aspectMatrix(c, shadbala.options.drishtiSpecial);
  const aspectRows = NINE.map(q => [pname(q), ...m.rows[q].map(v => (v == null ? 'none' : n2(v)))]);
  const points = [{ name: 'Lagna', sign: c.lagnaSign, self: -1 }, ...NINE.map(p => ({ name: pname(p), sign: P[p].sign, self: p }))];
  const signRows = points.map(pt => [pt.name, SIGN_NAMES[pt.sign], list(NINE.filter(q => q !== pt.self && P[q].sign === pt.sign)), list(NINE.filter(q => signAspects(P[q].sign, pt.sign)))]);
  const rel = relationshipTables(c).compound;
  sections.push({ title: 'Aspects and relationships', tables: [
    { title: 'Sputa drishti (virupas), aspecting graha by row', head: ['Aspecting graha', ...GRAHA_HEAD, 'Lagna'], rows: aspectRows },
    { title: 'Sign aspects', head: ['Point', 'Sign', 'Grahas in the sign', 'Grahas aspecting the sign'], rows: signRows },
    { title: 'Compound relationships', head: ['Graha', ...SEVEN.map(pname)], rows: SEVEN.map(p => [pname(p), ...SEVEN.map(q => (p === q ? 'none' : REL_WORD[rel[p][q]]))]) },
  ] });

  // 9. Argala
  const ag = computeArgala(c);
  sections.push({ title: 'Argala', tables: [{ head: ['House', 'Second house', 'Fourth house', 'Eleventh house', 'Fifth house', 'Third house (malefics)'], rows: ag.houses.map(r => [`${r.label}, ${SIGN_NAMES[r.sign]}`, ...ARGALA_HOUSES.map(a => none(argalaText(r.argala[a.key]))), none(argalaText(r.argala.vipareeta))]) }] });

  // 10. Upagrahas
  sections.push({ title: 'Upagrahas', tables: [{ head: ['Upagraha', 'Sign and degree', 'Nakshatra and pada', 'House', 'Bhava'], rows: (upagrahas || []).map(u => (u.lon == null ? [u.name, u.unavailable || 'none', 'none', 'none', 'none'] : [u.name, signDeg(u.lon), nak(u.nakshatra), String(u.house), String(u.bhava)])) }] });

  // 11. Shadbala
  const C = shadbala.components, ik = shadbala.ishtaKashta;
  sections.push({ title: 'Shadbala', tables: [{ head: ['Graha', 'Total (shashtiamsas)', 'Rupas', 'Required rupas', 'Ratio', 'Rank', 'Ishta phala', 'Kashta phala'], rows: SEVEN.map(p => [pname(p), n2(C.total[p]), n2(C.rupas[p]), n2(C.required[p]), n2(C.ratio[p]), String(C.rank[p]), n2(ik.ishta[p]), n2(ik.kashta[p])]) }] });

  // 12. Ashtakavarga
  if (ashtakavarga) {
    const av = ashtakavarga;
    const sum = (r) => r.reduce((a, b) => a + b, 0);
    sections.push({ title: 'Ashtakavarga', tables: [
      { title: 'Bhinnashtakavarga', head: ['Graha', ...SIGN_NAMES, 'Total'], rows: SEVEN.map(p => [pname(p), ...av.bav[p].map(String), String(sum(av.bav[p]))]) },
      { title: 'Sarvashtakavarga', head: ['Row', ...SIGN_NAMES, 'Total'], rows: [['Sarvashtakavarga', ...av.sav.map(String), String(sum(av.sav))], ['After Trikona and Ekadhipatya shodhana', ...av.savReduced.map(String), String(sum(av.savReduced))]] },
      { title: 'Shodhya pindas', head: ['Graha', 'Rasi pinda', 'Graha pinda', 'Shodhya pinda'], rows: SEVEN.map(p => [pname(p), String(av.rasiPinda[p]), String(av.grahaPinda[p]), String(av.shodhyaPinda[p])]) },
    ] });
  }

  // 13. Avasthas
  sections.push({ title: 'Avasthas', tables: [{ head: ['Graha', 'Deeptadi', 'Lajjitadi'], rows: SEVEN.map(p => [pname(p), avasthas.deeptadi[p].states.join(', ') || 'none', avasthas.lajjitadi[p].states.join(', ') || 'none']) }] });

  return sections;
}

/** The .docx bytes for a computed chart. */
export function buildReport(results) {
  const c = results.chart;
  const who = [c.input.name, c.input.gender].filter(Boolean).join(', ');
  const date = `${c.input.year}-${String(c.input.month).padStart(2, '0')}-${String(c.input.day).padStart(2, '0')} ${fmtHours(c.input.hour + c.input.minute / 60 + (c.input.second || 0) / 3600)}`;
  const title = who ? `${who}. ${date}, ${c.input.place || ''}`.trim() : `${date}, ${c.input.place || ''}`.trim();
  const subtitle = 'Lahiri ayanamsa, true Rahu, geometric positions, whole-sign houses, Parashara equal bhavas, Hindu sunrise. Planets in the order Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu.';
  return buildDocx({ title, subtitle, sections: reportSections(results) });
}

/** File name for the report. */
export function reportFileName(chart) {
  const i = chart.input;
  const who = (i.name || 'chart').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${who}-${i.year}-${String(i.month).padStart(2, '0')}-${String(i.day).padStart(2, '0')}.docx`;
}
