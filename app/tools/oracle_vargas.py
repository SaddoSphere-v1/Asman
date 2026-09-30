"""Divisional-chart signs from PyJHora for the test charts. Usage: python tools/oracle_vargas.py <ephe_dir> test/fixtures/vargas.json"""
import sys, json, warnings, os
warnings.filterwarnings('ignore')
sys.path.insert(0, os.path.dirname(__file__))
from oracle_positions import CHARTS
from jhora import const, utils
from jhora.panchanga import drik
from jhora.horoscope.chart import charts
import swisseph as swe
D_LIST = [1, 2, 3, 4, 7, 9, 10, 12, 16, 20, 24, 27, 30, 40, 45, 60]
def main(ephe, out_path):
    swe.set_ephe_path(ephe); drik.set_ayanamsa_mode('LAHIRI')
    out = []
    for c in CHARTS:
        dob = drik.Date(c["year"], c["month"], c["day"]); tob = (c["hour"], c["minute"], c["second"])
        place = drik.Place(c["id"], c["lat"], c["lon"], c["utcOffset"])
        jd = utils.julian_day_number(dob, tob)
        rec = {"input": c, "vargas": {}}
        for D in D_LIST:
            pp = charts.divisional_chart(jd, place, divisional_chart_factor=D)
            rec["vargas"][str(D)] = {"lagna": pp[0][1][0], "planets": [pp[i + 1][1][0] for i in range(9)]}
        out.append(rec)
    with open(out_path, 'w') as f: json.dump(out, f, indent=1)
if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
