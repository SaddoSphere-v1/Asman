// Tables. Planet index order follows JHora: 0 Sun, 1 Moon, 2 Mars, 3 Mercury, 4 Jupiter, 5 Venus, 6 Saturn, 7 Rahu, 8 Ketu.

export const SUN = 0, MOON = 1, MARS = 2, MERCURY = 3, JUPITER = 4, VENUS = 5, SATURN = 6, RAHU = 7, KETU = 8;
export const SEVEN = [SUN, MOON, MARS, MERCURY, JUPITER, VENUS, SATURN];
export const NINE = [SUN, MOON, MARS, MERCURY, JUPITER, VENUS, SATURN, RAHU, KETU];
export const FIVE_TARA = [MARS, MERCURY, JUPITER, VENUS, SATURN]; // non-luminaries, non-nodes

export const PLANET_NAMES = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
export const PLANET_ABBR = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke'];
/** Swiss Ephemeris body ids for the first eight (Ketu derived from Rahu). */
export const SE_BODY = [0, 1, 4, 2, 5, 3, 6, 11 /* true node */];

export const SIGN_NAMES = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
export const SIGN_ABBR = ['Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi'];
export const SIGN_LORD = [MARS, VENUS, MERCURY, MOON, SUN, MERCURY, VENUS, MARS, JUPITER, SATURN, SATURN, JUPITER];
export const ODD_SIGN = (s) => s % 2 === 0;           // Aries (0) is odd (1st)
export const MOVABLE = [0, 3, 6, 9], FIXED = [1, 4, 7, 10], DUAL = [2, 5, 8, 11];
export const WATERY_SIGNS = [3, 7, 11];               // Cancer, Scorpio, Pisces
export const signQuality = (s) => (MOVABLE.includes(s) ? 'movable' : FIXED.includes(s) ? 'fixed' : 'dual');

/** Deep exaltation longitudes (degrees, 0 = 0° Aries). Debilitation = +180. */
export const EXALTATION_DEG = [10, 33, 298, 165, 95, 357, 200];
export const EXALTATION_SIGN = [0, 1, 9, 5, 3, 11, 6];
export const DEBILITATION_SIGN = [6, 7, 3, 11, 9, 5, 0];
/** Moolatrikona: [sign, fromDeg, toDeg]. */
export const MOOLATRIKONA = [[4, 0, 20], [1, 3, 30], [0, 0, 12], [5, 15, 20], [8, 0, 10], [6, 0, 15], [10, 0, 20]];
export const OWN_SIGNS = [[4], [3], [0, 7], [2, 5], [8, 11], [1, 6], [9, 10]];

/** Naisargika (natural) relationship: 'F' friend, 'N' neutral, 'E' enemy. Row = planet, col = other planet (7x7). */
export const NATURAL_RELATION = [
  // Su   Mo   Ma   Me   Ju   Ve   Sa
  ['-', 'F', 'F', 'N', 'F', 'E', 'E'], // Sun
  ['F', '-', 'N', 'F', 'N', 'N', 'N'], // Moon
  ['F', 'F', '-', 'E', 'F', 'N', 'N'], // Mars
  ['F', 'E', 'N', '-', 'N', 'F', 'N'], // Mercury
  ['F', 'F', 'F', 'E', '-', 'E', 'N'], // Jupiter
  ['E', 'E', 'N', 'F', 'N', '-', 'F'], // Venus
  ['E', 'E', 'E', 'F', 'N', 'F', '-'], // Saturn
];

export const NAKSHATRA_NAMES = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha',
  'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishtha', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
];
/** Vimshottari lords repeating Ketu, Venus, Sun, Moon, Mars, Rahu, Jupiter, Saturn, Mercury. */
export const NAKSHATRA_LORD_CYCLE = [KETU, VENUS, SUN, MOON, MARS, RAHU, JUPITER, SATURN, MERCURY];
export const nakshatraLord = (n) => NAKSHATRA_LORD_CYCLE[n % 9];

export const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
/** Weekday lord by weekday index (Sunday=0). */
export const WEEKDAY_LORD = [SUN, MOON, MARS, MERCURY, JUPITER, VENUS, SATURN];
/** Hora lords in sequence starting from the Sun. */
export const HORA_SEQUENCE = [SUN, VENUS, MERCURY, MOON, SATURN, JUPITER, MARS];

/** Combustion orbs (degrees) from the Sun, direct and retrograde: Moon, Mars, Mercury, Jupiter, Venus, Saturn. */
export const COMBUST_ORB = { [MOON]: [12, 12], [MARS]: [17, 17], [MERCURY]: [14, 12], [JUPITER]: [11, 11], [VENUS]: [10, 8], [SATURN]: [15, 15] };
/** Planetary war orb (degrees). */
export const WAR_ORB = 1;

/** Naisargika bala (shashtiamsas): 60·k/7 with k = 7,6,2,3,4,5,1 for Sun..Saturn. */
export const NAISARGIKA_BALA = [60, 360 / 7, 120 / 7, 180 / 7, 240 / 7, 300 / 7, 60 / 7];
/** Required minimum Shadbala in rupas (BPHS): Sun 6.5, Moon 6, Mars 5, Mercury 7, Jupiter 6.5, Venus 5.5, Saturn 5. */
export const REQUIRED_RUPAS = [6.5, 6, 5, 7, 6.5, 5.5, 5];
/** Disc diameters (bimba) for Yuddha bala, Mars..Saturn (B.V. Raman / PyJHora). */
export const DISC_DIAMETER = { [MARS]: 9.4, [MERCURY]: 6.6, [JUPITER]: 190.4, [VENUS]: 16.6, [SATURN]: 158.0 };

/** Saptavargaja points by dignity in a varga. */
export const SAPTAVARGAJA_POINTS = { moolatrikona: 45, own: 30, adhimitra: 22.5, mitra: 15, sama: 7.5, satru: 3.75, adhisatru: 1.875 };

/** Full (sign) graha drishti offsets (houses counted from the aspecting planet, 1-based). */
export const FULL_ASPECT_HOUSES = {
  default: [7], [MARS]: [4, 7, 8], [JUPITER]: [5, 7, 9], [SATURN]: [3, 7, 10],
};

export const UPAGRAHA_NAMES = ['Dhuma', 'Vyatipata', 'Parivesha', 'Indrachapa', 'Upaketu', 'Kala', 'Mrityu', 'Ardhaprahara', 'Yamaghantaka', 'Gulika', 'Mandi', 'Pranapada'];
