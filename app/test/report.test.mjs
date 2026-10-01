import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { getEph } from './helpers.mjs';
import { computeChart } from '../src/chart.js';
import { computeShadbala } from '../src/shadbala.js';
import { computeUpagrahas } from '../src/upagrahas.js';
import { computeAvasthas } from '../src/avasthas.js';
import { ashtakavargaFromChart } from '../src/ashtakavarga.js';
import { computeSpecialLagnas, charaKarakas } from '../src/lagnas.js';
import { reportSections, buildReport, reportFileName } from '../src/report.js';
import { zipStored } from '../src/docx.js';

async function results(input) {
  const eph = await getEph();
  const chart = computeChart(eph, input);
  return { chart, shadbala: computeShadbala(chart), upagrahas: computeUpagrahas(eph, chart), avasthas: computeAvasthas(chart), ashtakavarga: ashtakavargaFromChart(chart), lagnas: computeSpecialLagnas(eph, chart), karakas: charaKarakas(chart) };
}
const INPUT = { year: 2003, month: 7, day: 20, hour: 20, minute: 40, second: 0, utcOffset: -4, lat: 43.4254, lon: -80.5112, name: 'Test Person', gender: 'Male', place: 'Kitchener, Ontario, Canada' };

test('report has thirteen sections of rectangular tables with no empty cells and no abbreviations', async () => {
  const S = reportSections(await results(INPUT));
  assert.deepEqual(S.map(s => s.title), ['Identity', 'Placements', 'House lords', 'Special lagnas', 'Arudha padas', 'Karakamsa', 'Divisional charts', 'Aspects and relationships', 'Argala', 'Upagrahas', 'Shadbala', 'Ashtakavarga', 'Avasthas']);
  const counts = {}; let cells = 0;
  for (const s of S) {
    counts[s.title] = s.tables.map(t => t.rows.length);
    for (const t of s.tables) {
      for (const r of t.rows) {
        assert.equal(r.length, t.head.length, `${s.title}: row width`);
        for (const v of r) { cells++; assert.equal(typeof v, 'string', `${s.title}: ${v}`); assert.notEqual(v.trim(), '', `${s.title}: empty cell`); assert.ok(!/—/.test(v), `${s.title}: dash in "${v}"`); }
      }
    }
  }
  assert.deepEqual(counts.Placements, [10]); assert.deepEqual(counts['House lords'], [12]); assert.deepEqual(counts['Special lagnas'], [10, 12]);
  assert.deepEqual(counts['Arudha padas'], [12, 9]); assert.deepEqual(counts.Karakamsa, [9]); assert.deepEqual(counts['Divisional charts'], [16, 12, 7]);
  assert.deepEqual(counts['Aspects and relationships'], [9, 10, 7]); assert.deepEqual(counts.Argala, [12]); assert.deepEqual(counts.Upagrahas, [11]);
  assert.deepEqual(counts.Shadbala, [7]); assert.deepEqual(counts.Ashtakavarga, [7, 2, 7]); assert.deepEqual(counts.Avasthas, [7]);
  assert.ok(cells > 1000);
  const text = JSON.stringify(S);
  assert.ok(!/\b(Ar|Ta|Ge|Cn|Le|Vi|Li|Sc|Sg|Cp|Aq|Pi|Su|Mo|Ma|Me|Ju|Ve|Sa|Ra|Ke|D\d{1,2})\b/.test(text));
  // Shadbala carries totals and Ishta / Kashta only
  assert.deepEqual(S[10].tables[0].head, ['Graha', 'Total (shashtiamsas)', 'Rupas', 'Required rupas', 'Ratio', 'Rank', 'Ishta phala', 'Kashta phala']);
});

test('the zip writer produces archives Python can read back byte for byte', () => {
  const enc = new TextEncoder();
  const bytes = zipStored([{ name: 'a.txt', data: enc.encode('hello') }, { name: 'dir/b.xml', data: enc.encode('<x/>') }]);
  const tmp = path.join(os.tmpdir(), `zt-${process.pid}.zip`); fs.writeFileSync(tmp, bytes);
  const out = execFileSync('python3', ['-c', `import zipfile,sys; z=zipfile.ZipFile(sys.argv[1]); assert z.testzip() is None; print(z.read('a.txt').decode(), z.read('dir/b.xml').decode(), len(z.namelist()))`, tmp]).toString().trim();
  fs.unlinkSync(tmp);
  assert.equal(out, 'hello <x/> 2');
});

test('the Word file opens in python-docx with the expected headings and tables', async () => {
  const R = await results(INPUT);
  const bytes = buildReport(R);
  assert.equal(reportFileName(R.chart), 'Test-Person-2003-07-20.docx');
  const tmp = path.join(os.tmpdir(), `rp-${process.pid}.docx`); fs.writeFileSync(tmp, bytes);
  const py = '/tmp/claude-0/-home-user-Asman/fdeff403-7752-51ba-8347-b7c267df73d8/scratchpad/venv/bin/python';
  const code = `
import sys, docx
d = docx.Document(sys.argv[1])
h1 = [p.text for p in d.paragraphs if p.style.name == 'Heading 1']
h2 = [p.text for p in d.paragraphs if p.style.name == 'Heading 2']
print(len(h1), len(h2), len(d.tables), d.paragraphs[0].text)
print('|'.join(h1))
t = d.tables[0]; print(t.rows[0].cells[0].text, t.rows[0].cells[1].text, len(t.rows))
sb = [t for t in d.tables if t.rows[0].cells[1].text == 'Total (shashtiamsas)'][0]; print(len(sb.rows), len(sb.columns))
print(sum(1 for t in d.tables for r in t.rows for c in r.cells if c.text.strip() == ''))
`;
  const out = execFileSync(py, ['-c', code, tmp]).toString().trim().split('\n');
  fs.unlinkSync(tmp);
  const [n1, n2, nt, title] = out[0].split(' ', 4);
  assert.equal(n1, '13'); assert.equal(nt, '21'); assert.ok(title.startsWith('Test Person, Male. 2003-07-20 20:40:00, Kitchener'));
  assert.equal(out[1], '1. Identity|2. Placements|3. House lords|4. Special lagnas|5. Arudha padas|6. Karakamsa|7. Divisional charts|8. Aspects and relationships|9. Argala|10. Upagrahas|11. Shadbala|12. Ashtakavarga|13. Avasthas');
  assert.equal(out[2], 'Field Value 17');
  assert.equal(out[3], '8 8');
  assert.equal(out[4], '0');
});
