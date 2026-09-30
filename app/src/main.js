// Browser entry point. Bundled by build.mjs into a single HTML file (WASM and .se1 data inlined as base64).
import createSwissEphModule from '../vendor/swisseph/swisseph.mjs';
import wasmB64 from '../vendor/swisseph/swisseph.wasm';
import seplB64 from '../vendor/ephe/sepl_18.se1';
import semoB64 from '../vendor/ephe/semo_18.se1';
import { createEphemeris } from './sweph.js';
import { computeChart, DEFAULT_OPTIONS } from './chart.js';
import { computeShadbala, SHADBALA_DEFAULTS } from './shadbala.js';
import { computeUpagrahas, UPAGRAHA_DEFAULTS } from './upagrahas.js';
import { computeAvasthas, AVASTHA_DEFAULTS } from './avasthas.js';
import { renderAll, renderText } from './render.js';
import { zoneOffsetHours, supportedZones, formatOffset, parseOffset } from './time.js';

const b64 = (s) => { const bin = atob(s); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; };
const $ = (id) => document.getElementById(id);

/** Options exposed in the UI: [group, key, label, choices]. */
const OPTION_SPECS = [
  ['chart', 'houseSystem', 'Bhava (house) system', { sripati: 'Sripati (JHora default)', equal: 'Equal, lagna mid-house', kp: 'KP / Placidus cusps' }],
  ['chart', 'warWinner', 'Graha yuddha winner', { lowerLongitude: 'Lower longitude (Raman)', north: 'Northern latitude', higherLongitude: 'Higher longitude' }],
  ['chart', 'truePositions', 'Planet positions', { true: 'Geometric / true (JHora)', false: 'Apparent' }],
  ['shadbala', 'natonnataReference', 'Natonnata time basis', { lat: 'Local apparent time (Raman)', lmt: 'Local mean time', apparent: 'Midpoint of sunset & sunrise' }],
  ['shadbala', 'horaMethod', 'Hora bala horas', { equalHours: '60-minute horas from sunrise (Raman)', unequal: 'Day/12 and night/12' }],
  ['shadbala', 'declination', 'Ayana bala kranti', { 'ss-table': 'Surya Siddhanta table on sayana longitude (Raman)', ecliptic: 'sin δ = sin ε · sin λ', true: 'True declination (Swiss Ephemeris)' }],
  ['shadbala', 'ahargana', 'Abda/Masa lords', { raman: 'Raman condensed ahargana (1827 epoch)', kali: 'Kali-yuga ahargana' }],
  ['shadbala', 'chestaMeans', 'Chesta mean longitudes', { raman: 'Raman 1900 Ujjain elements', meeus: 'Meeus modern mean elements' }],
  ['shadbala', 'drishtiSpecial', 'Sputa drishti special aspects', { parasara: 'Parasara formulas (JHora default)', raman: 'Raman additive +15/+30/+45' }],
  ['shadbala', 'drekkanaOrder', 'Drekkana bala order', { raman: 'Me/Sa 2nd, Mo/Ve 3rd (Raman)', bphs: 'Mo/Ve 2nd, Me/Sa 3rd' }],
  ['shadbala', 'moolatrikonaRasi', 'Saptavargaja moolatrikona (rasi)', { sign: 'Whole sign (Raman)', degrees: 'Degree range only' }],
  ['shadbala', 'luminaryChestaInTotal', "Sun/Moon Chesta in total", { false: 'Shown, not added (Raman)', true: 'Added to total' }],
  ['shadbala', 'requiredMinima', 'Required minima', { bphs: 'BPHS (Sun 390)', raman: 'Raman (Sun 300)' }],
  ['upagraha', 'gulika', 'Gulika point in Saturn\'s part', { begin: 'Beginning (JHora)', middle: 'Middle', end: 'End' }],
  ['upagraha', 'mandi', 'Mandi point in Saturn\'s part', { middle: 'Middle (JHora)', begin: 'Beginning', end: 'End' }],
  ['avastha', 'relation', 'Avastha relationships', { compound: 'Compound / panchadha (PVR)', natural: 'Natural only' }],
  ['avastha', 'khala', 'Khala rule', { maleficSign: "Malefic's sign (PVR book)", adhisatru: "Great enemy's sign (Santhanam)" }],
  ['avastha', 'nodesAspect', 'Rahu/Ketu aspect (7th) in avasthas', { true: 'Yes', false: 'No' }],
];
const DEFAULTS = { chart: DEFAULT_OPTIONS, shadbala: SHADBALA_DEFAULTS, upagraha: UPAGRAHA_DEFAULTS, avastha: AVASTHA_DEFAULTS };

let eph = null, last = null;

function buildOptionControls() {
  const grid = $('optgrid');
  for (const [group, key, label, choices] of OPTION_SPECS) {
    const lab = document.createElement('label');
    lab.textContent = label;
    const sel = document.createElement('select');
    sel.id = `opt-${group}-${key}`; sel.dataset.group = group; sel.dataset.key = key;
    for (const [v, text] of Object.entries(choices)) { const o = document.createElement('option'); o.value = v; o.textContent = text; sel.appendChild(o); }
    sel.value = String(DEFAULTS[group][key]);
    lab.appendChild(sel); grid.appendChild(lab);
  }
}
function readOptions() {
  const out = { chart: {}, shadbala: {}, upagraha: {}, avastha: {} };
  for (const sel of $('optgrid').querySelectorAll('select')) {
    let v = sel.value; if (v === 'true') v = true; else if (v === 'false') v = false;
    out[sel.dataset.group][sel.dataset.key] = v;
  }
  return out;
}

function buildZoneSelect() {
  const sel = $('zone');
  const zones = supportedZones();
  const local = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const list = zones.length ? zones : ['UTC', local];
  if (!list.includes('UTC')) list.unshift('UTC');
  if (!list.includes(local)) list.push(local);
  for (const z of list) { const o = document.createElement('option'); o.value = z; o.textContent = z; sel.appendChild(o); }
  sel.value = local;
}

/** Select a zone by name, accepting aliases (Asia/Kolkata → Asia/Calcutta); fall back to the stored offset if unknown. */
function selectZone(name, storedOffset) {
  const sel = $('zone');
  const has = (z) => [...sel.options].some(o => o.value === z);
  let z = name;
  if (!has(z)) { try { z = new Intl.DateTimeFormat('en-US', { timeZone: name }).resolvedOptions().timeZone; } catch (e) { z = null; } }
  if (z && !has(z)) { const o = document.createElement('option'); o.value = z; o.textContent = z; sel.appendChild(o); }
  if (z) sel.value = z;
  else if (storedOffset != null && !$('offset').value) $('offset').value = storedOffset;
}

function currentOffset() {
  const manual = parseOffset($('offset').value);
  if (Number.isFinite(manual)) return { offset: manual, source: 'manual' };
  const [y, m, d] = ($('date').value || '2000-01-01').split('-').map(Number);
  const [hh, mm, ss] = ($('time').value || '12:00:00').split(':').map(Number);
  const off = zoneOffsetHours($('zone').value, y, m, d, hh || 0, mm || 0, ss || 0);
  return { offset: off == null ? 0 : off, source: 'zone' };
}
function updateTzInfo() {
  const { offset, source } = currentOffset();
  $('tzinfo').textContent = `UTC${formatOffset(offset)}${source === 'manual' ? ' (override)' : ''}`;
}

function readInput() {
  const [year, month, day] = $('date').value.split('-').map(Number);
  const [hour, minute, second] = $('time').value.split(':').map(Number);
  const { offset } = currentOffset();
  return {
    year, month, day, hour, minute: minute || 0, second: second || 0, utcOffset: offset,
    lat: parseFloat($('lat').value), lon: parseFloat($('lon').value), alt: 0,
    zone: parseOffset($('offset').value) ? null : $('zone').value, place: $('place').value.trim() || null,
  };
}

function stateToHash() {
  const p = new URLSearchParams();
  p.set('d', $('date').value); p.set('t', $('time').value); p.set('z', $('zone').value); p.set('off', formatOffset(currentOffset().offset));
  if ($('offset').value.trim()) p.set('o', $('offset').value.trim());
  p.set('lat', $('lat').value); p.set('lon', $('lon').value);
  if ($('place').value.trim()) p.set('pl', $('place').value.trim());
  for (const sel of $('optgrid').querySelectorAll('select')) if (sel.value !== String(DEFAULTS[sel.dataset.group][sel.dataset.key])) p.set(`${sel.dataset.group}.${sel.dataset.key}`, sel.value);
  history.replaceState(null, '', '#' + p.toString());
  try { localStorage.setItem('grahabala.last', p.toString()); } catch (e) { /* ignore */ }
}
function hashToState() {
  let src = location.hash.slice(1);
  if (!src) { try { src = localStorage.getItem('grahabala.last') || ''; } catch (e) { src = ''; } }
  if (!src) return false;
  const p = new URLSearchParams(src);
  if (p.get('d')) $('date').value = p.get('d');
  if (p.get('t')) $('time').value = p.get('t');
  if (p.get('z')) selectZone(p.get('z'), p.get('off'));
  if (p.get('o')) $('offset').value = p.get('o');
  if (p.get('lat')) $('lat').value = p.get('lat');
  if (p.get('lon')) $('lon').value = p.get('lon');
  if (p.get('pl')) $('place').value = p.get('pl');
  for (const [k, v] of p.entries()) if (k.includes('.')) { const sel = $(`opt-${k.replace('.', '-')}`); if (sel) sel.value = v; }
  return !!(p.get('d') && p.get('lat'));
}

function compute() {
  const status = $('status');
  try {
    const input = readInput();
    if (!Number.isFinite(input.lat) || !Number.isFinite(input.lon) || !input.year) throw new Error('Please fill in date, time, latitude and longitude.');
    if (input.year < 1800 || input.year > 2399) status.textContent = 'Outside 1800–2399: using the built-in Moshier theory instead of the data files.';
    const opts = readOptions();
    const chart = computeChart(eph, input, opts.chart);
    const shadbala = computeShadbala(chart, opts.shadbala);
    const upagrahas = computeUpagrahas(eph, chart, opts.upagraha);
    const avasthas = computeAvasthas(chart, opts.avastha);
    last = { chart, shadbala, upagrahas, avasthas, meta: { sweVersion: eph.version } };
    $('results').innerHTML = renderAll(last);
    status.textContent = ''; status.classList.remove('error');
    for (const id of ['copy', 'json', 'print']) $(id).disabled = false;
    stateToHash();
  } catch (e) {
    status.textContent = e.message || String(e); status.classList.add('error');
    console.error(e);
  }
}

function stripForJson(x) {
  return JSON.parse(JSON.stringify(x, (k, v) => (k === '_module' ? undefined : v)));
}

async function init() {
  buildOptionControls();
  buildZoneSelect();
  const had = hashToState();
  if (!$('date').value) {
    const now = new Date();
    $('date').value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    $('time').value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
  }
  updateTzInfo();
  for (const id of ['date', 'time', 'zone', 'offset']) $(id).addEventListener('input', updateTzInfo);
  $('form').addEventListener('submit', (ev) => { ev.preventDefault(); compute(); });
  $('copy').addEventListener('click', async () => { if (!last) return; try { await navigator.clipboard.writeText(renderText(last)); $('status').textContent = 'Copied.'; } catch (e) { $('status').textContent = 'Clipboard unavailable.'; } });
  $('json').addEventListener('click', () => {
    if (!last) return;
    const blob = new Blob([JSON.stringify(stripForJson({ input: last.chart.input, options: { chart: last.chart.options, shadbala: last.shadbala.options, upagraha: null, avastha: last.avasthas.options }, chart: last.chart, shadbala: last.shadbala, upagrahas: last.upagrahas, avasthas: last.avasthas }), null, 1)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'chart.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  $('print').addEventListener('click', () => window.print());
  try {
    eph = await createEphemeris({ createModule: createSwissEphModule, wasmBinary: b64(wasmB64), files: { 'sepl_18.se1': b64(seplB64), 'semo_18.se1': b64(semoB64) } });
    $('status').textContent = `Ready · Swiss Ephemeris ${eph.version}`;
    if (had) compute();
  } catch (e) {
    $('status').textContent = 'Failed to start the ephemeris: ' + (e.message || e); $('status').classList.add('error');
    $('compute').disabled = true;
  }
}
init();
