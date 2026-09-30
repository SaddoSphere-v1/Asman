"""Independent implementation of the kalavela / Pranapada rules with pyswisseph, used only as a cross-check of the JS mechanics.
Usage: python tools/oracle_upagrahas.py <ephe_dir> > test/fixtures/upagrahas.json"""
import sys, json, math
import swisseph as swe
sys.path.insert(0, __import__('os').path.dirname(__file__))
from oracle_positions import CHARTS

R = swe.CALC_RISE | swe.BIT_HINDU_RISING; S = swe.CALC_SET | swe.BIT_HINDU_RISING
POINTS = {'Kala': (0, .5), 'Mrityu': (2, .5), 'Ardhaprahara': (3, .5), 'Yamaghantaka': (4, .5), 'Gulika': (6, 0), 'Mandi': (6, .5)}

def rt(jd, rsmi, geo):
    r, t = swe.rise_trans(jd, swe.SUN, rsmi, geo, 1013.25, 15, swe.FLG_SWIEPH)
    return t[0] if r == 0 else None

def main(ephe):
    swe.set_ephe_path(ephe); swe.set_sid_mode(swe.SIDM_LAHIRI, 0, 0)
    out = []
    for c in CHARTS:
        tz = c["utcOffset"]; h = c["hour"] + c["minute"]/60 + c["second"]/3600
        jd = swe.julday(c["year"], c["month"], c["day"], h - tz); jd0 = swe.julday(c["year"], c["month"], c["day"], -tz)
        geo = (c["lon"], c["lat"], 0)
        rise = rt(jd0, R, geo); exp = {}
        if rise is None:
            exp = {k: None for k in list(POINTS) + ['Pranapada']}
        else:
            if jd < rise:
                nxt = rise; rise = rt(jd0 - 1, R, geo); sset = rt(rise, S, geo)
            else:
                sset = rt(rise, S, geo); nxt = rt(sset, R, geo) if sset else None
            if sset is None or nxt is None:
                exp = {k: None for k in list(POINTS) + ['Pranapada']}
            else:
                wd = int(math.floor(rise + tz/24 + 1.5)) % 7
                is_day = rise <= jd < sset
                start = wd if is_day else (wd + 4) % 7
                lords = [(start + i) % 7 for i in range(7)] + [None]
                a, b = (rise, sset) if is_day else (sset, nxt)
                part = (b - a) / 8
                for name, (lord, f) in POINTS.items():
                    t = a + (lords.index(lord) + f) * part
                    exp[name] = swe.houses_ex(t, c["lat"], c["lon"], b'P', swe.FLG_SIDEREAL)[1][0]
                sun = swe.calc_ut(jd, swe.SUN, swe.FLG_SWIEPH | swe.FLG_SIDEREAL | swe.FLG_TRUEPOS)[0][0]
                q = int(sun // 30); off = 0 if q % 3 == 0 else 240 if q % 3 == 1 else 120
                exp['Pranapada'] = (sun + off + (jd - rise) * 86400 / 24 * 2) % 360
        out.append({"input": c, "expected": exp})
    json.dump(out, sys.stdout, indent=1)

if __name__ == "__main__":
    main(sys.argv[1])
