import json, re
R='/home/user/Asman'; e=json.load(open(f'{R}/docs/sources.json'))
def cls(l):
    l=l.lower()
    if 'by-sa' in l: return 'sa'
    if 'mixed' in l: return 'mixed'
    if 'cc by' in l: return 'by'
    return 'perm'
c={'perm':[], 'by':[], 'sa':[], 'mixed':[]}
for x in e: c[cls(x['license'])].append(x['path'].replace('assets/',''))
tot=sum(x['bytes'] for x in e); files=sum(len(x['files']) for x in e)
line=(f"See `docs/ATTRIBUTION.md` for the per-folder table. Summary: {len(c['perm'])} folders are permissive or public domain (MIT/ISC/BSD/Apache/OFL/PD/CC0/NASA), "
      f"{len(c['by'])} are CC BY (credit required: {', '.join('`'+p+'`' for p in c['by'])}), "
      f"{len(c['sa'])} are CC BY-SA (credit + share-alike on derivative images: {', '.join('`'+p+'`' for p in c['sa'])}), "
      f"and {len(c['mixed'])} mixed-license folder carries a per-file table (`{c['mixed'][0] if c['mixed'] else ''}`). Nothing GPL/AGPL is bundled.")
p=f'{R}/docs/ASSET_CATALOG.md'; s=open(p).read()
s=re.sub(r"See `docs/ATTRIBUTION\.md` for the per-folder table\. Summary:.*?Nothing GPL/AGPL is bundled\.", line, s, flags=re.S)
s=re.sub(r"Bundle size: about [^\n]*", f"Bundle size: {tot/1024/1024:.0f} MB across {files} files in {len(e)} source folders, all relative-path, no build step needed.", s)
open(p,'w').write(s); print(line[:200], '...'); print('bundle', round(tot/1024/1024), 'MB', files, 'files')
