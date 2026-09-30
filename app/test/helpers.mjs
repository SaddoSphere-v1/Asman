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
let cachedRaman;
/** Second instance with the Raman ayanamsa (SE_SIDM_RAMAN = 3) for B.V. Raman's textbook example. */
export async function getEphRaman() {
  if (cachedRaman) return cachedRaman;
  cachedRaman = await createEphemeris({
    createModule: createSwissEphModule,
    wasmBinary: fs.readFileSync(path.join(vendor, 'swisseph', 'swisseph.wasm')),
    files: {
      'sepl_18.se1': fs.readFileSync(path.join(vendor, 'ephe', 'sepl_18.se1')),
      'semo_18.se1': fs.readFileSync(path.join(vendor, 'ephe', 'semo_18.se1')),
    },
    sidMode: 3,
  });
  return cachedRaman;
}
export const FIXTURE_DIR = path.join(here, 'fixtures');
export function loadFixtures() {
  if (!fs.existsSync(FIXTURE_DIR)) return [];
  return fs.readdirSync(FIXTURE_DIR).filter(f => f.endsWith('.json')).map(f => JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, f), 'utf8')));
}

const cachedSid = new Map();
/** Instance with an arbitrary Swiss Ephemeris sidereal mode (e.g. 29 = True Pushya) for external references computed with other ayanamsas. */
export async function getEphSid(sidMode) {
  if (cachedSid.has(sidMode)) return cachedSid.get(sidMode);
  const e = await createEphemeris({
    createModule: createSwissEphModule,
    wasmBinary: fs.readFileSync(path.join(vendor, 'swisseph', 'swisseph.wasm')),
    files: {
      'sepl_18.se1': fs.readFileSync(path.join(vendor, 'ephe', 'sepl_18.se1')),
      'semo_18.se1': fs.readFileSync(path.join(vendor, 'ephe', 'semo_18.se1')),
    },
    sidMode,
  });
  cachedSid.set(sidMode, e);
  return e;
}
