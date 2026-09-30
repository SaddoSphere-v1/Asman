"""Reference values straight from pyswisseph (geometric/true positions, SEFLG_TRUEPOS, as JHora) (same Swiss Ephemeris version as the WASM build).
Usage: python tools/oracle_positions.py <ephe_dir> > test/fixtures/positions.json
Charts are defined in CHARTS below; each entry -> sidereal Lahiri positions, true node, houses, Hindu sunrise/sunset."""
import sys, json
import swisseph as swe

CHARTS = [
  {"id": "chennai-1985", "year": 1985, "month": 6, "day": 15, "hour": 14, "minute": 30, "second": 0, "utcOffset": 5.5, "lat": 13.0827, "lon": 80.2707},
  {"id": "delhi-1981-night", "year": 1981, "month": 9, "day": 13, "hour": 1, "minute": 30, "second": 0, "utcOffset": 5.5, "lat": 28.65, "lon": 77.2167},
  {"id": "bangalore-1918", "year": 1918, "month": 10, "day": 16, "hour": 14, "minute": 22, "second": 16, "utcOffset": 5.5, "lat": 13.0, "lon": 77.5833},
  {"id": "sydney-1999-dst", "year": 1999, "month": 12, "day": 31, "hour": 23, "minute": 59, "second": 0, "utcOffset": 11.0, "lat": -33.8688, "lon": 151.2093},
  {"id": "reykjavik-2010-summer", "year": 2010, "month": 6, "day": 21, "hour": 3, "minute": 15, "second": 0, "utcOffset": 0.0, "lat": 64.1466, "lon": -21.9426},
  {"id": "newyork-1969", "year": 1969, "month": 7, "day": 20, "hour": 22, "minute": 56, "second": 0, "utcOffset": -4.0, "lat": 40.7128, "lon": -74.0060},
  {"id": "ujjain-2000-noon", "year": 2000, "month": 1, "day": 1, "hour": 12, "minute": 0, "second": 0, "utcOffset": 5.5, "lat": 23.1765, "lon": 75.7885},
  {"id": "london-1900", "year": 1900, "month": 1, "day": 1, "hour": 0, "minute": 0, "second": 1, "utcOffset": 0.0, "lat": 51.5074, "lon": -0.1278},
]
BODIES = [(0, swe.SUN), (1, swe.MOON), (2, swe.MARS), (3, swe.MERCURY), (4, swe.JUPITER), (5, swe.VENUS), (6, swe.SATURN), (7, swe.TRUE_NODE)]

def main(ephe):
    swe.set_ephe_path(ephe)
    swe.set_sid_mode(swe.SIDM_LAHIRI, 0, 0)
    out = []
    for c in CHARTS:
        h = c["hour"] + c["minute"]/60 + c["second"]/3600
        jd = swe.julday(c["year"], c["month"], c["day"], h - c["utcOffset"])
        jd0 = swe.julday(c["year"], c["month"], c["day"], -c["utcOffset"])
        rec = {"input": c, "jdUt": jd, "ayanamsa": swe.get_ayanamsa_ex_ut(jd, swe.FLG_SWIEPH)[1], "equationOfTime": swe.time_equ(jd), "planets": {}}
        for idx, b in BODIES:
            xx, _ = swe.calc_ut(jd, b, swe.FLG_SWIEPH | swe.FLG_SPEED | swe.FLG_SIDEREAL | swe.FLG_TRUEPOS)
            ap, _ = swe.calc_ut(jd, b, swe.FLG_SWIEPH | swe.FLG_SPEED | swe.FLG_SIDEREAL)
            eq, _ = swe.calc_ut(jd, b, swe.FLG_SWIEPH | swe.FLG_SPEED | swe.FLG_EQUATORIAL | swe.FLG_TRUEPOS)
            rec["planets"][idx] = {"lon": xx[0], "lat": xx[1], "speed": xx[3], "dec": eq[1], "apparentLon": ap[0]}
        cusps, ascmc = swe.houses_ex(jd, c["lat"], c["lon"], b'P', swe.FLG_SIDEREAL)
        rec["asc"] = ascmc[0]; rec["mc"] = ascmc[1]; rec["cusps"] = list(cusps)
        geo = (c["lon"], c["lat"], 0)
        rsmi_r = swe.CALC_RISE | swe.BIT_HINDU_RISING
        rsmi_s = swe.CALC_SET | swe.BIT_HINDU_RISING
        try:
            r, t = swe.rise_trans(jd0, swe.SUN, rsmi_r, geo, 1013.25, 15, swe.FLG_SWIEPH)
            sunrise = t[0] if r == 0 else None
            if sunrise is not None and jd < sunrise:
                next_sunrise = sunrise
                r, t = swe.rise_trans(jd0 - 1, swe.SUN, rsmi_r, geo, 1013.25, 15, swe.FLG_SWIEPH); sunrise = t[0] if r == 0 else None
                r, t = swe.rise_trans(sunrise, swe.SUN, rsmi_s, geo, 1013.25, 15, swe.FLG_SWIEPH); sunset = t[0] if r == 0 else None
            elif sunrise is not None:
                r, t = swe.rise_trans(sunrise, swe.SUN, rsmi_s, geo, 1013.25, 15, swe.FLG_SWIEPH); sunset = t[0] if r == 0 else None
                r, t = swe.rise_trans(sunset, swe.SUN, rsmi_r, geo, 1013.25, 15, swe.FLG_SWIEPH); next_sunrise = t[0] if r == 0 else None
            rec["day"] = {"sunrise": sunrise, "sunset": sunset, "nextSunrise": next_sunrise}
        except Exception as e:
            rec["day"] = {"error": str(e)}
        out.append(rec)
    json.dump(out, sys.stdout, indent=1)

if __name__ == "__main__":
    main(sys.argv[1])
