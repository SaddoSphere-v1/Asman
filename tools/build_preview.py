#!/usr/bin/env python3
"""Generate preview/index.html — a contact sheet of every asset in assets/."""
import os, json, html, re
R = '/home/user/Asman'; A = os.path.join(R, 'assets'); P = os.path.join(R, 'preview')
os.makedirs(P, exist_ok=True)
entries = json.load(open(os.path.join(R, 'docs', 'sources.json')))
IMG = ('.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif')
FONT = ('.woff2', '.ttf', '.otf')

DEV_SAMPLE = 'ॐ ज्योतिषम् · नवग्रह · सूर्य चन्द्र मङ्गल बुध गुरु शुक्र शनि राहु केतु · अश्विनी भरणी कृत्तिका रोहिणी'
LAT_SAMPLE = 'Jyotiṣa · Asman · Navagraha 0123456789 · Aśvinī Bharaṇī Kṛttikā'
ASCII_ROWS = ['ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz', '0123456789', '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~']
UNI_ASTRO = '☉☽☾☿♀♂♃♄♅♆♇⯓☊☋⚷⚸ ♈♉♊♋♌♍♎♏♐♑♒♓⛎ ★☆✦✧'

def font_face(name, url):
    return f"@font-face{{font-family:'{name}';src:url('{url}');font-display:swap;}}"

css_faces, sections, toc = [], [], []
n_img = n_font = 0
for i, e in enumerate(entries):
    rel = e['path']  # assets/...
    d = os.path.join(R, rel)
    sid = 's%02d' % i
    items = []
    fonts_here = []
    for f in e['files']:
        ext = os.path.splitext(f)[1].lower()
        url = '../' + rel + '/' + f
        if ext in IMG:
            n_img += 1
            cls = 'tile svgtile' if ext == '.svg' else 'tile'
            dark = ' ondark' if ('glyph' in rel or 'icon' in rel or 'emoji' in rel or rel.endswith('vedastro')) else ''
            items.append(f'<figure class="{cls}{dark}"><img loading="lazy" src="{url}" alt="{html.escape(f)}"><figcaption>{html.escape(f)}</figcaption></figure>')
        elif ext in FONT:
            if ext == '.ttf' and (f[:-4] + '.woff2') in e['files']:
                continue  # prefer woff2 twin
            n_font += 1
            fam = 'f_' + re.sub(r'[^A-Za-z0-9]', '_', rel + '_' + f)
            css_faces.append(font_face(fam, url))
            fonts_here.append((fam, f))
        else:
            items.append(f'<a class="file" href="{url}">{html.escape(f)}</a>')
    spec = ''
    for fam, f in fonts_here:
        low = (rel + f).lower()
        if 'astronomicon' in low or 'hamburg' in low or 'starfont' in low:
            rows = ''.join(f'<div class="keyrow">' + ''.join(f'<span class="k"><b style="font-family:\'{fam}\'">{html.escape(c)}</b><i>{html.escape(c)}</i></span>' for c in row) + '</div>' for row in ASCII_ROWS)
            spec += f'<div class="spec"><h4>{html.escape(f)} — key map (glyph above its keyboard character)</h4>{rows}</div>'
        elif 'symbols' in low or 'astromoony' in low:
            spec += f'<div class="spec"><h4>{html.escape(f)}</h4><p class="big" style="font-family:\'{fam}\'">{UNI_ASTRO}</p><p style="font-family:\'{fam}\'">{DEV_SAMPLE}</p></div>'
        elif 'weathericons' in low or 'zodiacfont' in low:
            spec += f'<div class="spec"><h4>{html.escape(f)}</h4><p class="muted">Icon font (PUA code points): see the CSS/JSON in this folder for class names.</p></div>'
        else:
            spec += f'<div class="spec"><h4>{html.escape(f)}</h4><p class="big" style="font-family:\'{fam}\'">{DEV_SAMPLE}</p><p class="mid" style="font-family:\'{fam}\'">{LAT_SAMPLE}</p></div>'
    grid = f'<div class="grid">{"".join(items)}</div>' if items else ''
    lic = html.escape(e['license']); src = html.escape(e['source'])
    sections.append(f'''<section id="{sid}">
<h2>{html.escape(e['title'])}</h2>
<p class="meta"><span class="tier t{e['tier']}">Tier {e['tier']}</span> <span class="lic">{lic}</span> · <code>{html.escape(rel)}</code> · {len(e['files'])} files · {e['bytes']/1024:.0f} KB<br><span class="muted">Source: {src}</span><br><span class="muted">Credit: {html.escape(e['credit'])}</span></p>
{('<p class="notes">' + html.escape(e['notes']) + '</p>') if e.get('notes') else ''}
{spec}{grid}
</section>''')
    toc.append(f'<li><a href="#{sid}">{html.escape(e["title"].split(" — ")[0][:70])}</a></li>')

page = f'''<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Asman Asset Preview</title>
<meta name="description" content="Contact sheet of the curated Jyotisa visual asset library: planet textures, glyph fonts, nakshatra art, icons, Devanagari type.">
<style>
{''.join(css_faces)}
:root{{--bg:#0b0a14;--panel:#14122a;--ink:#ece6d6;--muted:#a49c8a;--gold:#d9b25c;--line:#2b2848;--tileA:#1b1836;--tileB:#f4efe2;}}
*{{box-sizing:border-box}} html{{scroll-behavior:smooth}}
body{{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}}
header{{padding:28px 16px 12px;border-bottom:1px solid var(--line);background:radial-gradient(1200px 400px at 20% -10%,#2a2352,transparent 70%),var(--bg)}}
h1{{margin:0 0 6px;font-weight:700;font-size:28px;letter-spacing:.02em;color:var(--gold)}}
header p{{margin:0;color:var(--muted)}}
.wrap{{display:grid;grid-template-columns:280px 1fr;gap:0}}
nav{{position:sticky;top:0;align-self:start;max-height:100vh;overflow:auto;padding:12px 16px;border-right:1px solid var(--line);font-size:13px}}
nav ol{{list-style:none;margin:0;padding:0}} nav li{{margin:0 0 6px}} nav a{{color:var(--ink);text-decoration:none;opacity:.85}} nav a:hover{{color:var(--gold);opacity:1}}
main{{padding:8px 16px 80px;min-width:0}}
section{{padding:22px 0;border-bottom:1px solid var(--line)}}
h2{{margin:0 0 6px;font-size:20px;color:var(--gold)}}
.meta{{margin:0 0 8px;font-size:13px;color:var(--ink)}} .muted{{color:var(--muted)}} .notes{{max-width:90ch;color:#cfc7b4;font-size:14px}}
.tier{{display:inline-block;padding:1px 8px;border-radius:10px;font-size:12px;font-weight:600;background:#3a3660}} .tA{{background:#2f6b3a}} .tB{{background:#6b5a2f}} .tC{{background:#6b2f2f}}
.lic{{font-size:12px;padding:1px 8px;border:1px solid var(--line);border-radius:10px;color:var(--muted)}}
code{{font-size:12px;color:#bcd}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-top:10px}}
.tile{{margin:0;background:var(--tileA);border:1px solid var(--line);border-radius:8px;padding:6px;text-align:center;min-width:0}}
.tile img{{width:100%;height:120px;object-fit:contain;display:block;background:#000;border-radius:4px}}
.svgtile img{{object-fit:contain;padding:8px;background:#fff}}
.ondark img{{background:#f4efe2}}
figcaption{{font-size:11px;color:var(--muted);margin-top:4px;word-break:break-all;line-height:1.25}}
a.file{{display:block;font-size:12px;color:#9fc5ff;text-decoration:none;padding:6px;border:1px dashed var(--line);border-radius:6px;word-break:break-all;background:#0f0e20}}
.spec{{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:10px 14px;margin:10px 0}}
.spec h4{{margin:0 0 6px;font-size:13px;color:var(--muted);font-weight:500}}
.big{{font-size:34px;line-height:1.3;margin:4px 0}} .mid{{font-size:22px;margin:4px 0}}
.keyrow{{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}} .k{{display:inline-flex;flex-direction:column;align-items:center;width:34px}} .k b{{font-weight:400;font-size:26px;line-height:1.1}} .k i{{font-style:normal;font-size:10px;color:var(--muted)}}
@media (max-width:900px){{.wrap{{grid-template-columns:1fr}} nav{{position:static;max-height:none;border-right:0;border-bottom:1px solid var(--line)}}}}
@media (prefers-color-scheme: light){{:root:not([data-theme="dark"]){{--bg:#faf7f0;--panel:#fff;--ink:#1d1a2e;--muted:#5d5870;--gold:#8a6a1a;--line:#e0dbcf;--tileA:#fff}}}}
</style></head>
<body>
<header><h1>Asman · Jyotiṣa asset library preview</h1><p>{len(entries)} source folders · {n_img} images · {n_font} font files. Every section names its license and credit line; see docs/ASSET_CATALOG.md for the full research write-up. Open this file directly in a browser (all paths are relative).</p></header>
<div class="wrap"><nav><ol>{''.join(toc)}</ol></nav><main>{''.join(sections)}</main></div>
</body></html>'''
open(os.path.join(P, 'index.html'), 'w').write(page)
print('preview written:', len(page)//1024, 'KB;', n_img, 'images;', n_font, 'fonts')
