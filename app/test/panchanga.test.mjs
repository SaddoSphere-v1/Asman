import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { getEph, FIXTURE_DIR } from './helpers.mjs';
import { computeChart } from '../src/chart.js';
import { karanaName, YOGA_NAMES } from '../src/constants.js';

const fixtures = JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, 'panchanga.json'), 'utf8'));

test('tithi, karana and yoga at the birth moment match pyswisseph for the eight test charts', async () => {
  const eph = await getEph();
  for (const fx of fixtures) {
    const c = computeChart(eph, fx.input);
    assert.equal(c.tithi, fx.tithi, `${fx.input.id} tithi`);
    assert.equal(c.karana.index, fx.karana, `${fx.input.id} karana`);
    assert.equal(c.yoga.index, fx.yoga, `${fx.input.id} yoga`);
    assert.equal(c.yoga.name, YOGA_NAMES[fx.yoga]);
    assert.equal(c.karana.name, karanaName(fx.karana));
  }
});

test('karana sequence: Kimstughna, seven movable karanas eight times, Shakuni, Chatushpada, Naga', () => {
  assert.equal(karanaName(0), 'Kimstughna'); assert.equal(karanaName(1), 'Bava'); assert.equal(karanaName(7), 'Vishti'); assert.equal(karanaName(8), 'Bava');
  assert.equal(karanaName(56), 'Vishti'); assert.equal(karanaName(57), 'Shakuni'); assert.equal(karanaName(58), 'Chatushpada'); assert.equal(karanaName(59), 'Naga');
  assert.equal(YOGA_NAMES.length, 27);
});
