import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAtlas, Atlas } from '../src/atlas.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const atlasP = loadAtlas(fs.readFileSync(path.join(here, '..', 'data', 'atlas.tsv.gz')));

test('atlas loads and finds major cities by name, old name and with country', async () => {
  const atlas = await atlasP;
  assert.ok(atlas.places.length > 60000);
  const chennai = atlas.search('Chennai')[0];
  assert.equal(chennai.name, 'Chennai'); assert.equal(chennai.country, 'India'); assert.equal(chennai.tz, 'Asia/Kolkata');
  assert.ok(Math.abs(chennai.lat - 13.0878) < 0.01 && Math.abs(chennai.lon - 80.2785) < 0.01);
  assert.equal(atlas.search('Madras')[0].name, 'Chennai');
  assert.equal(atlas.search('Bangalore')[0].name, 'Bengaluru');
  assert.equal(atlas.search('Bombay')[0].name, 'Mumbai');
  assert.equal(atlas.search('Springfield, Illinois')[0].region, 'Illinois');
  assert.equal(atlas.search('paris france')[0].country, 'France');
  assert.equal(atlas.search('New York')[0].name, 'New York City');
  assert.equal(atlas.search('São Paulo')[0].name, 'São Paulo');
  assert.equal(atlas.search('sao paulo')[0].name, 'São Paulo');
});

test('coordinates resolve with the nearest place\'s time zone', async () => {
  const atlas = await atlasP;
  assert.deepEqual(Atlas.parseCoordinates('13.08, 80.27'), { lat: 13.08, lon: 80.27 });
  assert.equal(Atlas.parseCoordinates('Chennai'), null);
  const r = atlas.resolve('13.0827 80.2707');
  assert.equal(r.tz, 'Asia/Kolkata'); assert.ok(r.coordinates);
  assert.equal(atlas.resolve('no-such-place-xyz'), null);
});
