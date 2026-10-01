// Minimal Word (.docx) writer: headings, paragraphs and tables, no dependencies.
// A .docx is a zip of WordprocessingML parts; entries are stored uncompressed (deflate is not needed for files this size).

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---- zip (STORED) ----
const CRC_TABLE = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(bytes) { let c = 0xFFFFFFFF; for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function dosDateTime(d) {
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  return { time, date };
}
/** @param {Array<{name:string, data:Uint8Array}>} entries */
export function zipStored(entries, now = new Date()) {
  const enc = new TextEncoder(), { time, date } = dosDateTime(now);
  const locals = [], centrals = []; let offset = 0;
  for (const e of entries) {
    const name = enc.encode(e.name), crc = crc32(e.data), n = e.data.length;
    const local = new Uint8Array(30 + name.length + n), lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true); lv.setUint16(4, 20, true); lv.setUint16(6, 0x0800, true); lv.setUint16(8, 0, true);
    lv.setUint16(10, time, true); lv.setUint16(12, date, true); lv.setUint32(14, crc, true); lv.setUint32(18, n, true); lv.setUint32(22, n, true);
    lv.setUint16(26, name.length, true); lv.setUint16(28, 0, true);
    local.set(name, 30); local.set(e.data, 30 + name.length);
    const central = new Uint8Array(46 + name.length), cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true); cv.setUint16(8, 0x0800, true); cv.setUint16(10, 0, true);
    cv.setUint16(12, time, true); cv.setUint16(14, date, true); cv.setUint32(16, crc, true); cv.setUint32(20, n, true); cv.setUint32(24, n, true);
    cv.setUint16(28, name.length, true); cv.setUint16(30, 0, true); cv.setUint16(32, 0, true); cv.setUint16(34, 0, true); cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true); cv.setUint32(42, offset, true);
    central.set(name, 46);
    locals.push(local); centrals.push(central); offset += local.length;
  }
  const cdSize = centrals.reduce((a, c) => a + c.length, 0);
  const end = new Uint8Array(22), ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true); ev.setUint16(4, 0, true); ev.setUint16(6, 0, true); ev.setUint16(8, entries.length, true); ev.setUint16(10, entries.length, true);
  ev.setUint32(12, cdSize, true); ev.setUint32(16, offset, true); ev.setUint16(20, 0, true);
  const out = new Uint8Array(offset + cdSize + 22); let pos = 0;
  for (const b of [...locals, ...centrals, end]) { out.set(b, pos); pos += b.length; }
  return out;
}

// ---- WordprocessingML ----
const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const run = (text, bold = false) => `<w:r>${bold ? '<w:rPr><w:b/></w:rPr>' : ''}<w:t xml:space="preserve">${esc(text)}</w:t></w:r>`;
const para = (text, style = null, bold = false) => `<w:p>${style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ''}${text === '' ? '' : run(text, bold)}</w:p>`;
const cell = (text, header) => `<w:tc><w:tcPr>${header ? '<w:shd w:val="clear" w:color="auto" w:fill="EDEDED"/>' : ''}</w:tcPr>${para(text == null ? '' : String(text), null, header)}</w:tc>`;
const borders = ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(b => `<w:${b} w:val="single" w:sz="4" w:space="0" w:color="999999"/>`).join('');

/** One table: `head` is an array of column titles, `rows` an array of arrays of plain strings or numbers. */
export function tableXml(head, rows) {
  const tr = (cells, header) => `<w:tr>${header ? '<w:trPr><w:tblHeader/></w:trPr>' : ''}${cells.map(c => cell(c, header)).join('')}</w:tr>`;
  return `<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders>${borders}</w:tblBorders><w:tblLook w:val="04A0"/></w:tblPr>` +
    `<w:tblGrid>${head.map(() => '<w:gridCol/>').join('')}</w:tblGrid>${tr(head, true)}${rows.map(r => tr(r, false)).join('')}</w:tbl>`;
}

/**
 * Build a .docx from sections: [{ title, lines?: string[], tables: [{ title?, head, rows }] }].
 * Returns a Uint8Array of the zip. Tables wider than `landscapeFrom` columns are placed on landscape pages.
 */
export function buildDocx({ title, subtitle = null, sections }, { landscapeFrom = 9 } = {}) {
  const portrait = '<w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/>';
  const landscape = '<w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/>';
  let body = para(title, 'Title');
  if (subtitle) body += para(subtitle);
  let orient = 'portrait';
  const switchTo = (o) => { if (o === orient) return; body += `<w:p><w:pPr><w:sectPr>${orient === 'portrait' ? portrait : landscape}</w:sectPr></w:pPr></w:p>`; orient = o; };
  sections.forEach((s, i) => {
    body += para(`${i + 1}. ${s.title}`, 'Heading1');
    for (const line of s.lines || []) body += para(line);
    for (const t of s.tables) {
      switchTo(t.head.length >= landscapeFrom ? 'landscape' : 'portrait');
      if (t.title) body += para(t.title, 'Heading2');
      body += tableXml(t.head, t.rows);
      body += para('');
    }
  });
  body += `<w:sectPr>${orient === 'portrait' ? portrait : landscape}</w:sectPr>`;
  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="${W}"><w:body>${body}</w:body></w:document>`;
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="${W}">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/><w:sz w:val="20"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="60" w:line="240" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="120"/></w:pPr><w:rPr><w:b/><w:sz w:val="36"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="280" w:after="100"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:sz w:val="28"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="160" w:after="60"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:sz w:val="22"/></w:rPr></w:style>
</w:styles>`;
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>`;
  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;
  const docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
  const enc = new TextEncoder();
  return zipStored([
    { name: '[Content_Types].xml', data: enc.encode(contentTypes) },
    { name: '_rels/.rels', data: enc.encode(rels) },
    { name: 'word/document.xml', data: enc.encode(document) },
    { name: 'word/_rels/document.xml.rels', data: enc.encode(docRels) },
    { name: 'word/styles.xml', data: enc.encode(styles) },
  ]);
}
