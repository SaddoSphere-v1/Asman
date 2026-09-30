"""Bhava and graha arudhas from PyJHora for the test charts, in the rasi and in every divisional chart.
Usage: python tools/oracle_arudhas.py <ephe_dir> test/fixtures/arudhas.json"""
import sys, json, warnings, os
warnings.filterwarnings('ignore')
sys.path.insert(0, os.path.dirname(__file__))
from oracle_positions import CHARTS
from jhora import const, utils
from jhora.panchanga import drik
from jhora.horoscope.chart import charts, arudhas
import swisseph as swe
VARGAS = [1, 2, 3, 4, 7, 9, 10, 12, 16, 20, 24, 27, 30, 40, 45, 60]
def main(ephe, out_path):
    swe.set_ephe_path(ephe); drik.set_ayanamsa_mode('LAHIRI')
    out = []
    for c in CHARTS:
        dob = drik.Date(c["year"], c["month"], c["day"]); tob = (c["hour"], c["minute"], c["second"])
        place = drik.Place(c["id"], c["lat"], c["lon"], c["utcOffset"])
        jd = utils.julian_day_number(dob, tob)
        rec = {"input": c, "vargas": {}}
        for D in VARGAS:
            # D2 with chart_method=2: traditional Parasara hora (Leo / Cancer only), the page's convention; PyJHora's own default is PVR's parivritti hora
            kw = {'chart_method': 2} if D == 2 else {}
            pp = charts.divisional_chart(jd, place, divisional_chart_factor=D, **kw)[:const._pp_count_upto_ketu]
            rec["vargas"][str(D)] = {"lagnaSign": pp[0][1][0], "planetSigns": [p[1][0] for p in pp[1:]],
                                     "bhava": arudhas.bhava_arudhas_from_planet_positions(pp),
                                     "graha": arudhas.graha_arudhas_from_planet_positions(pp)[1:]}
        out.append(rec)
    with open(out_path, 'w') as f: json.dump(out, f, indent=1)
if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
