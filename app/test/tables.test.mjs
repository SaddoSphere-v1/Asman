import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { getEph, FIXTURE_DIR } from './helpers.mjs';
import { computeChart } from '../src/chart.js';
import { aspectMatrix, relationshipTables, dignityTable } from '../src/tables.js';

const fixtures = JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, 'aspects.json'), 'utf8'));

test('sputa drishti matrix (Raman special aspects) matches PyJHora for all nine grahas', async () => {
  const eph = await getEph();
  for (const fx of fixtures) {
    const chart = computeChart(eph, fx.input);
    const m = aspectMatrix(chart, 'raman');
    for (let q = 0; q < 9; q++) for (let p = 0; p < 9; p++) {
      if (p === q) continue;
      assert.ok(Math.abs(m.rows[q][p] - fx.aspects[q][p]) < 0.02, `${fx.input.id}: aspect of ${q} on ${p}: ${m.rows[q][p]} vs ${fx.aspects[q][p]}`);
    }
  }
});

test('compound relationships match PyJHora', async () => {
  const eph = await getEph();
  for (const fx of fixtures) {
    const chart = computeChart(eph, fx.input);
    const r = relationshipTables(chart);
    for (let p = 0; p < 7; p++) for (let q = 0; q < 7; q++) if (p !== q) assert.equal(r.compound[p][q], fx.compound[p][q], `${fx.input.id}: ${p}→${q}`);
  }
});

test('dignity flags are mutually consistent', async () => {
  const eph = await getEph();
  const chart = computeChart(eph, fixtures[0].input);
  for (const d of dignityTable(chart)) {
    assert.ok(!(d.exalted && d.debilitated));
    if (d.moolatrikona) assert.ok(d.moolatrikonaSign);
    if (d.own) assert.equal(d.natural, null);
  }
});
