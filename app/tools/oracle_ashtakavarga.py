"""Ashtakavarga reference values from PyJHora (AGPL, oracle only) for the test charts, with the standard Parashari Moon table.
Usage: python tools/oracle_ashtakavarga.py <ephe_dir> test/fixtures/ashtakavarga.json"""
import sys, json, warnings, os
warnings.filterwarnings('ignore')
sys.path.insert(0, os.path.dirname(__file__))
from oracle_positions import CHARTS
from jhora import const, utils
from jhora.panchanga import drik
from jhora.horoscope.chart import charts, ashtakavarga
import swisseph as swe

# Standard table for the Moon (Parashara / Raman); PyJHora's copy differs in three contributor rows.
const.ashtaka_varga_dict["1"] = [[3,6,7,8,10,11],[1,3,6,7,10,11],[2,3,5,6,9,10,11],[1,3,4,5,7,8,10,11],[1,4,7,8,10,11,12],[3,4,5,7,9,10,11],[3,5,6,11],[3,6,10,11]]

def main(ephe, out_path):
    swe.set_ephe_path(ephe)
    drik.set_ayanamsa_mode('LAHIRI')
    out = []
    for c in CHARTS:
        dob = drik.Date(c["year"], c["month"], c["day"]); tob = (c["hour"], c["minute"], c["second"])
        place = drik.Place(c["id"], c["lat"], c["lon"], c["utcOffset"])
        jd = utils.julian_day_number(dob, tob)
        pp = charts.rasi_chart(jd, place)
        h_to_p = utils.get_house_planet_list_from_planet_positions(pp)
        bav, sav, _ = ashtakavarga.get_ashtaka_varga(h_to_p)
        trik = ashtakavarga._trikona_sodhana([row[:] for row in bav])
        # Ekadhipatya shodhana per B.V. Raman / Parashara, applied in every planet's table (PyJHora only reduces the owner's table).
        signs = [pp[i + 1][1][0] for i in range(7)]
        occupied = set(signs)
        eka = [row[:] for row in trik[:7]]
        for row in eka:
            for a, b in [(0, 7), (2, 5), (8, 11), (1, 6), (9, 10)]:
                va, vb = row[a], row[b]
                if va == 0 or vb == 0: continue
                oa, ob = a in occupied, b in occupied
                if oa and ob: continue
                if not oa and not ob:
                    if va == vb: row[a] = row[b] = 0
                    else: row[a] = row[b] = min(va, vb)
                    continue
                full, empty = (a, b) if oa else (b, a)
                row[empty] = 0 if row[empty] < row[full] else row[full]
        rasimana = [7, 10, 8, 4, 10, 6, 7, 8, 9, 5, 11, 12]; grahamana = [5, 5, 8, 5, 10, 7, 5]
        rp = [sum(v * m for v, m in zip(row, rasimana)) for row in eka]
        gp = [sum(row[signs[q]] * grahamana[q] for q in range(7)) for row in eka]
        sp = [r + g for r, g in zip(rp, gp)]
        out.append({"input": c, "signs": [pp[i + 1][1][0] for i in range(7)] + [pp[0][1][0]],
                    "bav": bav[:7], "sav": sav, "trikona": trik[:7], "ekadhipatya": eka[:7],
                    "rasiPinda": [int(x) for x in rp], "grahaPinda": [int(x) for x in gp], "shodhyaPinda": [int(x) for x in sp]})
    with open(out_path, 'w') as f: json.dump(out, f, indent=1)

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
