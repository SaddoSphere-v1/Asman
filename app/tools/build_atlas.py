"""Build the embedded atlas (app/data/atlas.tsv.gz) from GeoNames dumps.
Usage: python tools/build_atlas.py <dir with cities5000.txt admin1CodesASCII.txt countryInfo.txt>
Three header lines (#timezones, #countries, #regions: |-separated dictionaries), then one line per place:\nname TAB regionIndex TAB countryIndex TAB lat TAB lon TAB timezoneIndex TAB populationThousands TAB alternates(|-separated)
Sorted by population, descending. Source: GeoNames (CC BY 4.0), https://www.geonames.org/"""
import sys, os, gzip, unicodedata

def ascii_fold(s):
    return ''.join(c for c in unicodedata.normalize('NFKD', s) if not unicodedata.combining(c))

def main(d):
    admin1 = {}
    for line in open(os.path.join(d, 'admin1CodesASCII.txt'), encoding='utf-8'):
        p = line.rstrip('\n').split('\t')
        if len(p) >= 2: admin1[p[0]] = p[1]
    countries = {}
    for line in open(os.path.join(d, 'countryInfo.txt'), encoding='utf-8'):
        if line.startswith('#'): continue
        p = line.rstrip('\n').split('\t')
        if len(p) >= 5: countries[p[0]] = p[4]
    rows = []
    for line in open(os.path.join(d, 'cities5000.txt'), encoding='utf-8'):
        p = line.rstrip('\n').split('\t')
        name, ascii_name, alts = p[1], p[2], p[3]
        lat, lon, cc, a1, pop, tz = float(p[4]), float(p[5]), p[8], p[10], int(p[14] or 0), p[17]
        if not tz: continue
        region = admin1.get(f'{cc}.{a1}', '')
        country = countries.get(cc, cc)
        folded = ascii_fold(name).lower()
        alt_list = []
        seen = {folded}
        if ascii_name and ascii_name.lower() != folded:
            alt_list.append(ascii_name); seen.add(ascii_name.lower())
        cap = 16 if pop >= 500000 else 12 if pop >= 100000 else 6 if pop >= 50000 else 0
        if cap and alts:
            for a in alts.split(','):
                a = a.strip()
                if len(a) < 4 or len(a) > 24 or not a.isascii() or a.lower() in seen: continue
                if not all(ch.isalpha() or ch in " -'" for ch in a): continue
                alt_list.append(a); seen.add(a.lower())
                if len(alt_list) >= cap: break
        rows.append((pop, name, region, country, lat, lon, tz, alt_list))
    rows.sort(key=lambda r: -r[0])
    # dictionary-encode the repeated strings; rows carry indices
    def dictionary(values):
        uniq = sorted(set(values)); return uniq, {v: i for i, v in enumerate(uniq)}
    tzs, tz_i = dictionary(r[6] for r in rows)
    countries_l, co_i = dictionary(r[3] for r in rows)
    regions_l, re_i = dictionary(r[2] for r in rows)
    out = os.path.join(os.path.dirname(__file__), '..', 'data', 'atlas.tsv.gz')
    with gzip.open(out, 'wt', encoding='utf-8', compresslevel=9, newline='\n') as f:
        f.write('#timezones\t' + '|'.join(tzs) + '\n')
        f.write('#countries\t' + '|'.join(countries_l) + '\n')
        f.write('#regions\t' + '|'.join(regions_l) + '\n')
        for pop, name, region, country, lat, lon, tz, alts in rows:
            f.write('\t'.join([name, str(re_i[region]), str(co_i[country]), f'{lat:.4f}', f'{lon:.4f}', str(tz_i[tz]), str(round(pop / 1000)), '|'.join(alts)]) + '\n')
    print(f'{len(rows)} places, {len(tzs)} zones, {len(countries_l)} countries, {len(regions_l)} regions -> {out} ({os.path.getsize(out)/1024:.0f} KB)')

if __name__ == '__main__':
    main(sys.argv[1])
