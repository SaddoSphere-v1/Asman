"""Tithi, yoga and karana at the birth moment from pyswisseph (Lahiri, geometric positions) for the test charts.
Usage: python tools/oracle_panchanga.py <ephe_dir> test/fixtures/panchanga.json"""
import sys, json, math
sys.path.insert(0, __import__('os').path.dirname(__file__))
from oracle_positions import CHARTS
import swisseph as swe
FLAGS = swe.FLG_SWIEPH | swe.FLG_SPEED | swe.FLG_SIDEREAL | swe.FLG_TRUEPOS
def main(ephe, out_path):
    swe.set_ephe_path(ephe); swe.set_sid_mode(swe.SIDM_LAHIRI, 0, 0)
    out = []
    for c in CHARTS:
        jd = swe.julday(c["year"], c["month"], c["day"], c["hour"] + c["minute"] / 60 + c["second"] / 3600 - c["utcOffset"])
        sun = swe.calc_ut(jd, swe.SUN, FLAGS)[0][0]; moon = swe.calc_ut(jd, swe.MOON, FLAGS)[0][0]
        elong = (moon - sun) % 360
        out.append({"input": c, "tithi": math.floor(elong / 12) + 1, "karana": math.floor(elong / 6), "yoga": math.floor(((sun + moon) % 360) / (360 / 27))})
    with open(out_path, 'w') as f: json.dump(out, f, indent=1)
if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
