import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import createSwissEphModule from '../vendor/swisseph/swisseph.mjs';
import { createEphemeris } from '../src/sweph.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const vendor = path.join(here, '..', 'vendor');
let cached;
export async function getEph() {
  if (cached) return cached;
  cached = await createEphemeris({
    createModule: createSwissEphModule,
    wasmBinary: fs.readFileSync(path.join(vendor, 'swisseph', 'swisseph.wasm')),
    files: {
      'sepl_18.se1': fs.readFileSync(path.join(vendor, 'ephe', 'sepl_18.se1')),
      'semo_18.se1': fs.readFileSync(path.join(vendor, 'ephe', 'semo_18.se1')),
    },
  });
  return cached;
}
export const FIXTURE_DIR = path.join(here, 'fixtures');
export function loadFixtures() {
  if (!fs.existsSync(FIXTURE_DIR)) return [];
  return fs.readdirSync(FIXTURE_DIR).filter(f => f.endsWith('.json')).map(f => JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, f), 'utf8')));
}
