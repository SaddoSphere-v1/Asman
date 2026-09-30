"""Varnada lagnas of the twelve houses (B.V. Raman / Narasimha Rao method) from PyJHora for the test charts.
Usage: python tools/oracle_varnada.py <ephe_dir> test/fixtures/varnada.json"""
import sys, json, warnings, os
warnings.filterwarnings('ignore')
sys.path.insert(0, os.path.dirname(__file__))
from oracle_positions import CHARTS
from jhora import utils
from jhora.panchanga import drik
from jhora.horoscope.chart import charts
import swisseph as swe
def main(ephe, out_path):
    swe.set_ephe_path(ephe); drik.set_ayanamsa_mode('LAHIRI')
    out = []
    for c in CHARTS:
        dob = drik.Date(c["year"], c["month"], c["day"]); tob = (c["hour"], c["minute"], c["second"])
        place = drik.Place(c["id"], c["lat"], c["lon"], c["utcOffset"])
        rec = {"input": c, "varnada": []}
        for h in range(1, 13):
            try:
                r = charts.varnada_lagna(dob, tob, place, house_index=h, varnada_method=1)
                rec["varnada"].append(r[0] * 30 + r[1])
            except Exception:
                rec["varnada"].append(None)
        out.append(rec)
    with open(out_path, 'w') as f: json.dump(out, f, indent=1)
if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
