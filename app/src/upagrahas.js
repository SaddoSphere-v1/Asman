// Upagrahas: five Sun-based aprakasha grahas, six kalavelas (Kala … Mandi) and Pranapada.
import { norm360, arc } from './time.js';
import { SUN, MOON, MARS, MERCURY, JUPITER, VENUS, SATURN, WEEKDAY_LORD, SIGN_LORD, signQuality } from './constants.js';
import { nakshatraOf, wholeSignHouse, bhavaOf } from './chart.js';

export const UPAGRAHA_DEFAULTS = Object.freeze({
  /** Point in the ruling planet's portion whose rising ascendant gives the upagraha: 'begin' | 'middle' | 'end'. JHora defaults. */
  kala: 'middle', mrityu: 'middle', ardhaprahara: 'middle', yamaghantaka: 'middle', gulika: 'begin', mandi: 'middle',
  /** Night portion lords start from the lord of the 5th weekday; the 8th portion is lordless ('eighth').
   *  'rotate' continues the 8-slot cycle so the lordless slot moves (PyJHora behaviour). */
  lordlessPortion: 'eighth',
});

const WEEKDAY_ORDER = [SUN, MOON, MARS, MERCURY, JUPITER, VENUS, SATURN];

/** Lords of the eight portions of day or night for a weekday (0=Sunday). null = lordless. */
export function portionLords(weekday, isDay, mode = 'eighth') {
  const startDay = WEEKDAY_ORDER.indexOf(WEEKDAY_LORD[weekday]);
  const start = isDay ? startDay : (startDay + 4) % 7; // night starts from the 5th weekday lord
  if (mode === 'rotate') {
    const cycle = [...WEEKDAY_ORDER, null];
    const dayStart = startDay; // day sequence as an 8-cycle starting at the weekday lord
    const out = [];
    const s = isDay ? dayStart : (dayStart + 4) % 8;
    for (let i = 0; i < 8; i++) out.push(cycle[(s + i) % 8]);
    return out;
  }
  const out = [];
  for (let i = 0; i < 7; i++) out.push(WEEKDAY_ORDER[(start + i) % 7]);
  out.push(null);
  return out;
}

const FRACTION = { begin: 0, middle: 0.5, end: 1 };

/**
 * @param eph ephemeris facade
 * @param chart result of computeChart
 * @param options UPAGRAHA_DEFAULTS overrides
 * @returns array of upagraha records
 */
export function computeUpagrahas(eph, chart, options = {}) {
  const opt = { ...UPAGRAHA_DEFAULTS, ...options };
  const sun = chart.planets[SUN].lon;
  const out = [];
  const push = (name, lon, extra = {}) => {
    const L = norm360(lon);
    const sign = Math.floor(L / 30);
    out.push({
      name, lon: L, sign, deg: L - sign * 30, signLord: SIGN_LORD[sign], nakshatra: nakshatraOf(L),
      house: wholeSignHouse(L, chart.lagnaSign), bhava: bhavaOf(L, chart.bhavas), ...extra,
    });
  };
  // Sun-based (BPHS): Dhuma = Sun + 133°20′; Vyatipata = 360 − Dhuma; Parivesha = Vyatipata + 180; Indrachapa = 360 − Parivesha; Upaketu = Indrachapa + 16°40′.
  const dhuma = norm360(sun + 133 + 20 / 60);
  const vyatipata = norm360(360 - dhuma);
  const parivesha = norm360(vyatipata + 180);
  const indrachapa = norm360(360 - parivesha);
  const upaketu = norm360(indrachapa + 16 + 40 / 60);
  push('Dhuma', dhuma, { basis: 'Sun + 133°20′' });
  push('Vyatipata', vyatipata, { basis: '360° − Dhuma' });
  push('Parivesha', parivesha, { basis: 'Vyatipata + 180°' });
  push('Indrachapa', indrachapa, { basis: '360° − Parivesha' });
  push('Upaketu', upaketu, { basis: 'Indrachapa + 16°40′' });

  // Kalavelas
  const day = chart.day;
  const kalavelas = [
    ['Kala', SUN, opt.kala], ['Mrityu', MARS, opt.mrityu], ['Ardhaprahara', MERCURY, opt.ardhaprahara],
    ['Yamaghantaka', JUPITER, opt.yamaghantaka], ['Gulika', SATURN, opt.gulika], ['Mandi', SATURN, opt.mandi],
  ];
  if (!day.polar) {
    const isDay = day.isDay;
    const spanStart = isDay ? day.sunrise : day.sunset;
    const spanEnd = isDay ? day.sunset : day.nextSunrise;
    const portion = (spanEnd - spanStart) / 8;
    const lords = portionLords(chart.weekday, isDay, opt.lordlessPortion);
    for (const [name, lord, point] of kalavelas) {
      const idx = lords.indexOf(lord);
      const t = spanStart + (idx + FRACTION[point]) * portion;
      const asc = eph.houses(t, chart.input.lat, chart.input.lon, 'P', true).asc;
      push(name, asc, { time: t, portion: idx + 1, point, lord, isDay });
    }
  } else {
    for (const [name, lord, point] of kalavelas) out.push({ name, lon: null, lord, point, unavailable: 'no sunrise/sunset at this latitude' });
  }

  // Pranapada: time from sunrise in vighatis / 15 → signs; i.e. 2° per vighati (24 s). Added to Sun (movable), Sun+240° (fixed), Sun+120° (dual).
  if (!day.polar) {
    const vighatis = (chart.jdUt - day.sunrise) * 86400 / 24;
    const offset = { movable: 0, fixed: 240, dual: 120 }[signQuality(Math.floor(sun / 30))];
    push('Pranapada', sun + offset + vighatis * 2, { basis: 'Sun + 2° per vighati elapsed since sunrise' + (offset ? ` + ${offset}° (Sun in a ${offset === 240 ? 'fixed' : 'dual'} sign)` : ' (Sun in a movable sign)') });
  } else {
    out.push({ name: 'Pranapada', lon: null, unavailable: 'no sunrise at this latitude' });
  }
  return out;
}
