// Browser entry point. Five inputs: name, gender, birthday, birthtime, birthplace. Everything else is fixed in the engine.
import createSwissEphModule from '../vendor/swisseph/swisseph.mjs';
import wasmB64 from '../vendor/swisseph/swisseph.wasm';
import seplB64 from '../vendor/ephe/sepl_18.se1';
import semoB64 from '../vendor/ephe/semo_18.se1';
import atlasB64 from '../data/atlas.tsv.gz';
import { createEphemeris } from './sweph.js';
import { computeChart } from './chart.js';
import { computeShadbala } from './shadbala.js';
import { computeUpagrahas } from './upagrahas.js';
import { computeAvasthas } from './avasthas.js';
import { ashtakavargaFromChart } from './ashtakavarga.js';
import { renderAll } from './render.js';
import { zoneOffsetHours, formatOffset } from './time.js';
import { loadAtlas, Atlas } from './atlas.js';

const b64 = (s) => { const bin = atob(s); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; };
const $ = (id) => document.getElementById(id);

let eph = null, atlas = null, chosen = null, activeIndex = -1;

// ---------- birthplace suggestions ----------
function showSuggestions(list) {
  const box = $('suggest');
  box.innerHTML = '';
  activeIndex = -1;
  if (!list.length) { box.hidden = true; $('place').setAttribute('aria-expanded', 'false'); return; }
  list.forEach((p, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.role = 'option'; b.dataset.index = String(i);
    b.innerHTML = `<span>${esc(p.name)}</span><small>${esc([p.region, p.country].filter(Boolean).join(', '))}</small>`;
    b.addEventListener('mousedown', (ev) => { ev.preventDefault(); choose(p); });
    box.appendChild(b);
  });
  box.hidden = false; $('place').setAttribute('aria-expanded', 'true');
  box._list = list;
}
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function choose(p) {
  chosen = p;
  $('place').value = p.label;
  showSuggestions([]);
  updatePlaceInfo();
}
function updatePlaceInfo() {
  if (!chosen) { $('placeinfo').textContent = ''; return; }
  const off = offsetFor(chosen.tz);
  $('placeinfo').textContent = `${Math.abs(chosen.lat).toFixed(4)}° ${chosen.lat >= 0 ? 'north' : 'south'}, ${Math.abs(chosen.lon).toFixed(4)}° ${chosen.lon >= 0 ? 'east' : 'west'} · ${chosen.tz}${off == null ? '' : `, ${formatOffset(off)} from Greenwich`}`;
}
function offsetFor(tz) {
  const [y, m, d] = ($('date').value || '2000-01-01').split('-').map(Number);
  const [hh, mm, ss] = ($('time').value || '12:00:00').split(':').map(Number);
  return zoneOffsetHours(tz, y, m, d, hh || 0, mm || 0, ss || 0);
}
function onPlaceInput() {
  chosen = null; $('placeinfo').textContent = '';
  if (!atlas) return;
  const q = $('place').value;
  showSuggestions(q.trim().length >= 2 && !Atlas.parseCoordinates(q) ? atlas.search(q, 8) : []);
}
function onPlaceKey(ev) {
  const box = $('suggest'); const list = box._list || [];
  if (box.hidden || !list.length) return;
  if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
    ev.preventDefault();
    activeIndex = (activeIndex + (ev.key === 'ArrowDown' ? 1 : -1) + list.length) % list.length;
    [...box.children].forEach((b, i) => b.classList.toggle('active', i === activeIndex));
  } else if (ev.key === 'Enter') {
    ev.preventDefault(); choose(list[activeIndex >= 0 ? activeIndex : 0]);
  } else if (ev.key === 'Escape') { showSuggestions([]); }
}

// ---------- compute ----------
function compute() {
  const status = $('status');
  status.classList.remove('error');
  try {
    if (!eph || !atlas) throw new Error('Still loading, one moment.');
    const [year, month, day] = $('date').value.split('-').map(Number);
    const [hour, minute, second] = $('time').value.split(':').map(Number);
    if (!year || hour == null || Number.isNaN(hour)) throw new Error('Please enter the birthday and birthtime.');
    const place = chosen || atlas.resolve($('place').value);
    if (!place) throw new Error(`Birthplace "${$('place').value}" was not found. Try "City, Country" or coordinates such as 13.08, 80.27.`);
    if (!chosen) choose(place);
    const utcOffset = zoneOffsetHours(place.tz, year, month, day, hour, minute || 0, second || 0);
    if (utcOffset == null) throw new Error(`The time zone ${place.tz} is not known to this browser.`);
    const input = {
      year, month, day, hour, minute: minute || 0, second: second || 0, utcOffset,
      lat: place.lat, lon: place.lon, alt: 0, zone: place.tz, place: place.label,
      name: $('name').value.trim() || null, gender: $('gender').value || null,
    };
    if (year < 1800 || year > 2399) status.textContent = 'Date outside 1800 to 2399: reduced precision.';
    else status.textContent = '';
    const chart = computeChart(eph, input);
    const shadbala = computeShadbala(chart);
    const upagrahas = computeUpagrahas(eph, chart);
    const avasthas = computeAvasthas(chart);
    const ashtakavarga = ashtakavargaFromChart(chart);
    $('results').innerHTML = renderAll({ chart, shadbala, upagrahas, avasthas, ashtakavarga, meta: { sweVersion: eph.version } });
    try { localStorage.setItem('grahabala.last', JSON.stringify({ name: input.name, gender: input.gender, date: $('date').value, time: $('time').value, place })); } catch (e) { /* ignore */ }
  } catch (e) {
    status.textContent = e.message || String(e); status.classList.add('error');
    console.error(e);
  }
}

function restore() {
  try {
    const s = JSON.parse(localStorage.getItem('grahabala.last') || 'null');
    if (!s) return false;
    $('name').value = s.name || ''; $('gender').value = s.gender || ''; $('date').value = s.date || ''; $('time').value = s.time || '';
    if (s.place) { chosen = s.place; $('place').value = s.place.label; }
    return !!(s.date && s.time && s.place);
  } catch (e) { return false; }
}

async function init() {
  $('place').addEventListener('input', onPlaceInput);
  $('place').addEventListener('keydown', onPlaceKey);
  $('place').addEventListener('blur', () => setTimeout(() => showSuggestions([]), 150));
  for (const id of ['date', 'time']) $(id).addEventListener('input', updatePlaceInfo);
  $('form').addEventListener('submit', (ev) => { ev.preventDefault(); compute(); });
  const had = restore();
  try {
    [eph, atlas] = await Promise.all([
      createEphemeris({ createModule: createSwissEphModule, wasmBinary: b64(wasmB64), files: { 'sepl_18.se1': b64(seplB64), 'semo_18.se1': b64(semoB64) } }),
      loadAtlas(b64(atlasB64)),
    ]);
    $('status').textContent = '';
    updatePlaceInfo();
    if (had) compute();
  } catch (e) {
    $('status').textContent = 'Failed to start: ' + (e.message || e); $('status').classList.add('error');
    $('compute').disabled = true;
  }
}
init();
