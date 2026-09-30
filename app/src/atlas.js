// Embedded atlas: GeoNames cities (population ≥ 5000) with region, country, coordinates and time zone.
// Data is a gzip'd tab-separated text (data/atlas.tsv.gz) inlined as base64 by the build.

const fold = (s) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9\s,]/g, ' ').replace(/\s+/g, ' ').trim();

export async function loadAtlas(gzBytes) {
  let text;
  if (typeof DecompressionStream === 'function') {
    const stream = new Blob([gzBytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    text = await new Response(stream).text();
  } else {
    throw new Error('This browser cannot decompress the built-in atlas.');
  }
  const places = [];
  const dict = {};
  for (const line of text.split('\n')) {
    if (!line) continue;
    if (line[0] === '#') { const [k, v] = line.slice(1).split('\t'); dict[k] = v.split('|'); continue; }
    const [name, ri, ci, lat, lon, ti, popK, alts] = line.split('\t');
    const region = dict.regions[+ri] || '', country = dict.countries[+ci] || '', tz = dict.timezones[+ti];
    const names = [fold(name), ...(alts ? alts.split('|').map(fold) : [])];
    places.push({ name, region, country, lat: +lat, lon: +lon, tz, pop: +popK * 1000, names, label: [name, region, country].filter(Boolean).join(', ') });
  }
  return new Atlas(places);
}

export class Atlas {
  constructor(places) { this.places = places; }

  /** Parse "13.08, 80.27" or "13.0827 80.2707" style coordinates; returns {lat, lon} or null. */
  static parseCoordinates(text) {
    const m = String(text).trim().match(/^([+-]?\d+(?:\.\d+)?)\s*[, ]\s*([+-]?\d+(?:\.\d+)?)$/);
    if (!m) return null;
    const lat = parseFloat(m[1]), lon = parseFloat(m[2]);
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
    return { lat, lon };
  }

  /** Nearest place to a coordinate (for the time zone of typed coordinates). */
  nearest(lat, lon) {
    let best = null, bestD = Infinity;
    const cl = Math.cos(lat * Math.PI / 180);
    for (const p of this.places) {
      const dLat = p.lat - lat, dLon = ((p.lon - lon + 540) % 360 - 180) * cl;
      const d = dLat * dLat + dLon * dLon;
      if (d < bestD) { bestD = d; best = p; }
    }
    return best;
  }

  /** Ranked matches for a free-text query such as "Chennai", "Chennai, India", "Springfield Illinois". */
  search(query, limit = 8) {
    const q = fold(query);
    if (!q) return [];
    const parts = q.split(',').map(s => s.trim()).filter(Boolean);
    const head = parts[0];
    const rest = parts.slice(1).join(' ').split(' ').filter(Boolean);
    const words = head.split(' ');
    const scored = [];
    for (const p of this.places) {
      let best = 0;
      for (const n of p.names) {
        if (n === head) { best = Math.max(best, 4); break; }
        if (n.startsWith(head)) best = Math.max(best, 3);
        else if (n.startsWith(words[0]) && words.every(w => n.includes(w))) best = Math.max(best, 2);
        else if (words.length > 1 && head.startsWith(n)) best = Math.max(best, 1.5); // "chennai india" without a comma
      }
      if (!best) continue;
      const ctx = fold(p.region + ' ' + p.country);
      const extra = words.length > 1 && best === 1.5 ? words.slice(1) : rest;
      if (extra.length && !extra.every(w => ctx.includes(w))) continue;
      scored.push([best, p]);
    }
    scored.sort((a, b) => b[0] - a[0] || b[1].pop - a[1].pop);
    return scored.slice(0, limit).map(x => x[1]);
  }

  /** Resolve a query to a place: coordinates, else best match. */
  resolve(query) {
    const c = Atlas.parseCoordinates(query);
    if (c) { const n = this.nearest(c.lat, c.lon); return { name: `${c.lat}, ${c.lon}`, region: n ? n.label : '', country: '', lat: c.lat, lon: c.lon, tz: n ? n.tz : 'UTC', label: `${c.lat}, ${c.lon}` + (n ? ` (time zone of ${n.name})` : ''), coordinates: true }; }
    return this.search(query, 1)[0] || null;
  }
}
