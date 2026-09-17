// QA screenshots of the preview page (sections), run with NODE_PATH=$(npm root -g)
const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2] || '/tmp/shots';
  const fs = require('fs'); fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  page.on('console', m => { if (m.type() === 'error') console.log('console error:', m.text()); });
  page.on('requestfailed', r => console.log('request failed:', r.url()));
  await page.goto('file:///home/user/Asman/preview/index.html', { waitUntil: 'load' });
  await page.evaluate(async () => { document.querySelectorAll('img[loading=lazy]').forEach(i => i.loading = 'eager'); await new Promise(r => setTimeout(r, 1500)); });
  const ids = await page.$$eval('section', s => s.map(x => x.id));
  const want = process.argv.slice(3);
  let n = 0;
  for (const id of ids) {
    if (want.length && !want.includes(id)) continue;
    const el = await page.$('#' + id);
    await el.scrollIntoViewIfNeeded(); await page.waitForTimeout(400);
    const box = await el.boundingBox();
    if (!box) continue;
    await el.screenshot({ path: `${out}/${id}.png` }); n++;
  }
  // broken images report
  const broken = await page.$$eval('img', imgs => imgs.filter(i => i.complete && i.naturalWidth === 0).map(i => i.getAttribute('src')));
  console.log('sections shot:', n, '| broken images:', broken.length); broken.slice(0, 40).forEach(b => console.log('  BROKEN', b));
  await browser.close();
})();
