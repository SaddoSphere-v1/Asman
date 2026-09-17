// Rewrite SVG viewBox to the content bounding box (geometry untouched). Usage: node normalize_svg.js <srcdir> <dstdir>
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => {
  const [src, dst] = process.argv.slice(2); fs.mkdirSync(dst, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  for (const f of fs.readdirSync(src).filter(n => n.endsWith('.svg'))) {
    const xml = fs.readFileSync(path.join(src, f), 'utf8');
    await page.setContent(`<!DOCTYPE html><body style="margin:0">${xml}</body>`);
    const box = await page.evaluate(() => { const s = document.querySelector('svg'); if (!s) return null; const b = s.getBBox(); return { x: b.x, y: b.y, w: b.width, h: b.height, vb: s.getAttribute('viewBox'), wd: s.getAttribute('width'), ht: s.getAttribute('height') }; });
    if (!box || box.w === 0 || box.h === 0) { fs.copyFileSync(path.join(src, f), path.join(dst, f)); console.log('skip', f); continue; }
    const pad = Math.max(box.w, box.h) * 0.06;
    const vb = `${(box.x - pad).toFixed(3)} ${(box.y - pad).toFixed(3)} ${(box.w + 2 * pad).toFixed(3)} ${(box.h + 2 * pad).toFixed(3)}`;
    let out = xml.replace(/<svg\b([^>]*)>/, (m, attrs) => {
      let a = attrs.replace(/\s(viewBox|width|height)="[^"]*"/g, '');
      return `<svg${a} viewBox="${vb}" width="100%" height="100%">`;
    });
    fs.writeFileSync(path.join(dst, f), out);
    console.log('ok', f, 'bbox', box.w.toFixed(1), 'x', box.h.toFixed(1), 'old viewBox:', box.vb, box.wd, box.ht);
  }
  await browser.close();
})();
