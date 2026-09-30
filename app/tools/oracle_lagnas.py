"""Special lagnas and chara karakas from PyJHora for the test charts. Usage: python tools/oracle_lagnas.py <ephe_dir> test/fixtures/lagnas.json"""
import sys, json, warnings, os
warnings.filterwarnings('ignore')
sys.path.insert(0, os.path.dirname(__file__))
from oracle_positions import CHARTS
from jhora import const, utils
from jhora.panchanga import drik
from jhora.horoscope.chart import charts, house
import swisseph as swe
def lon(x): return x[0] * 30 + x[1]
def main(ephe, out_path):
    swe.set_ephe_path(ephe); drik.set_ayanamsa_mode('LAHIRI')
    out = []
    for c in CHARTS:
        dob = drik.Date(c["year"], c["month"], c["day"]); tob = (c["hour"], c["minute"], c["second"])
        place = drik.Place(c["id"], c["lat"], c["lon"], c["utcOffset"])
        jd = utils.julian_day_number(dob, tob)
        pp = charts.rasi_chart(jd, place)
        rec = {"input": c, "lagnas": {}, "karakas": house.chara_karakas(pp)}
        for name, fn in [("bhava", drik.bhava_lagna), ("hora", drik.hora_lagna), ("ghati", drik.ghati_lagna), ("vighati", drik.vighati_lagna),
                         ("sree", drik.sree_lagna), ("indu", drik.indu_lagna), ("bhrigu", drik.bhrigu_bindhu_lagna), ("pranapada", drik.pranapada_lagna)]:
            try: rec["lagnas"][name] = lon(fn(jd, place))
            except Exception as e: rec["lagnas"][name] = None
        try: rec["lagnas"]["varnada"] = lon(charts.varnada_lagna(dob, tob, place, house_index=1, varnada_method=1))
        except Exception as e: rec["lagnas"]["varnada"] = None
        out.append(rec)
    with open(out_path, 'w') as f: json.dump(out, f, indent=1)
if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
