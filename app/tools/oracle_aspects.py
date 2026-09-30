"""Sputa drishti matrix (Raman additive special aspects) and compound relationships from PyJHora, for the test charts.
Usage: python tools/oracle_aspects.py <ephe_dir> test/fixtures/aspects.json"""
import sys, json, warnings, os
warnings.filterwarnings('ignore')
sys.path.insert(0, os.path.dirname(__file__))
from oracle_positions import CHARTS
from jhora import const, utils
from jhora.panchanga import drik
from jhora.horoscope.chart import charts, strength, house
import swisseph as swe

def main(ephe, out_path):
    swe.set_ephe_path(ephe); drik.set_ayanamsa_mode('LAHIRI')
    out = []
    for c in CHARTS:
        dob = drik.Date(c["year"], c["month"], c["day"]); tob = (c["hour"], c["minute"], c["second"])
        place = drik.Place(c["id"], c["lat"], c["lon"], c["utcOffset"])
        jd = utils.julian_day_number(dob, tob)
        pp = charts.rasi_chart(jd, place)
        # rows = aspecting planet (Sun..Ketu), columns = aspected planet (Sun..Ketu), shashtiamsas, Raman additive special aspects
        tbl = strength.planet_aspect_relationship_table(pp, include_houses=False)
        h_to_p = utils.get_house_planet_list_from_planet_positions(pp)
        cr = house._get_compound_relationships_of_planets(h_to_p)  # cr[p][q]: 4 great friend, 3 friend, 2 neutral, 1 enemy, 0 great enemy
        names = {4: 'adhimitra', 3: 'mitra', 2: 'sama', 1: 'satru', 0: 'adhisatru'}
        compound = [[(names[cr[p][q]] if p != q else None) for q in range(7)] for p in range(7)]
        out.append({"input": c, "aspects": tbl, "compound": compound})
    with open(out_path, 'w') as f: json.dump(out, f, indent=1)

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
