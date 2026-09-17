#!/usr/bin/env python3
import json, os, collections
R='/home/user/Asman'; e=json.load(open(f'{R}/docs/sources.json'))
by=collections.OrderedDict()
order=['Public domain','CC0','MIT','ISC','BSD','Apache','Pictogrammers','SIL OFL','CC BY 4.0','CC BY 3.0','CC BY-SA','Mixed']
def key(l):
    for o in order:
        if o.lower() in l.lower(): return o
    return 'Other'
for x in e: by.setdefault(key(x['license']),[]).append(x)
out=['# Attribution and license summary','','Generated from `docs/sources.json`. Every folder under `assets/` also carries its own `SOURCE.md` with the same information and, where required, the full license text.','',
'| Folder | License | Required credit line |','|---|---|---|']
for x in e: out.append(f"| `{x['path']}` | {x['license']} | {x['credit']} |")
out+=['','## Grouped by license class','']
for k in order+['Other']:
    if k not in by: continue
    out.append(f'### {k}'); out.append('')
    for x in by[k]: out.append(f"- `{x['path']}` — {x['title']} — {x['source']}")
    out.append('')
out+=['## Obligations cheat-sheet','',
'- **Public domain / CC0 / NASA**: no attribution required (NASA asks that its insignia not imply endorsement). Credit lines are still included as good practice.',
'- **MIT / ISC / BSD / Apache 2.0 / Pictogrammers**: keep the license notice with the files (the `LICENSE` copies in each folder satisfy this); no share-alike.',
'- **SIL OFL 1.1 (fonts)**: may be embedded and bundled freely; do not sell the fonts on their own; a modified font must be renamed if it has a Reserved Font Name (Astronomicon, Noto, Tiro, Yatra One, Zodiac Fonts).',
'- **CC BY 3.0 / 4.0**: credit the author + license + link in an about/credits screen (Solar System Scope, ESO/S. Brunier, game-icons authors, Solar icons, Twemoji, Stellarium nakshatra sketches).',
'- **CC BY-SA 4.0**: as CC BY, and derivative *images* (e.g. a recoloured glyph) must stay CC BY-SA (Wikipedia fixed-width glyphs, OpenMoji, Stellarium "Indian Vedic" illustrations/data). Bundling unmodified files next to differently-licensed code is fine.',
'- **Mixed folders** (`art/paintings-and-sculpture-commons`): the per-file table in `SOURCE.md` is authoritative.','']
open(f'{R}/docs/ATTRIBUTION.md','w').write('\n'.join(out)); print('attribution written', len(out), 'lines')
