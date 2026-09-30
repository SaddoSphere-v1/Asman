// Calendar / time helpers. Pure functions, no ephemeris needed.

export const norm360 = (x) => ((x % 360) + 360) % 360;
/** Smallest angular separation 0..180. */
export const sep = (a, b) => { const d = Math.abs(norm360(a) - norm360(b)); return d > 180 ? 360 - d : d; };
/** Directed arc from a to b, 0..360. */
export const arc = (a, b) => norm360(b - a);

/** Julian Day from Gregorian calendar date and decimal hours (UT). Same algorithm as swe_julday. */
export function julianDay(year, month, day, hours = 0) {
  let y = year, m = month;
  if (m <= 2) { y -= 1; m += 12; }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + B - 1524.5 + hours / 24;
}

/** Gregorian calendar date from Julian Day. Returns {year, month, day, hours}. */
export function calendarDate(jd) {
  const Z = Math.floor(jd + 0.5);
  const F = jd + 0.5 - Z;
  let A = Z;
  if (Z >= 2299161) {
    const alpha = Math.floor((Z - 1867216.25) / 36524.25);
    A = Z + 1 + alpha - Math.floor(alpha / 4);
  }
  const B = A + 1524;
  const C = Math.floor((B - 122.1) / 365.25);
  const D = Math.floor(365.25 * C);
  const E = Math.floor((B - D) / 30.6001);
  const day = B - D - Math.floor(30.6001 * E);
  const month = E < 14 ? E - 1 : E - 13;
  const year = month > 2 ? C - 4716 : C - 4715;
  return { year, month, day, hours: F * 24 };
}

/** Weekday of a Julian Day taken at local time (0 = Sunday ... 6 = Saturday). */
export function weekdayOfJd(jdLocal) {
  return ((Math.floor(jdLocal + 1.5) % 7) + 7) % 7;
}

/**
 * UTC offset (hours) of an IANA time zone at a given local wall-clock time.
 * Handles DST by iterating once; falls back to null if the zone is unknown.
 */
export function zoneOffsetHours(timeZone, year, month, day, hour = 0, minute = 0, second = 0) {
  let dtf;
  try {
    dtf = new Intl.DateTimeFormat('en-US', {
      timeZone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric',
    });
  } catch (e) { return null; }
  const offsetAt = (utcMs) => {
    const parts = {};
    for (const p of dtf.formatToParts(new Date(utcMs))) parts[p.type] = p.value;
    const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour % 24, +parts.minute, +parts.second);
    return (asUtc - utcMs) / 3600000;
  };
  const guess = Date.UTC(year, month - 1, day, hour, minute, second);
  const o1 = offsetAt(guess);
  const o2 = offsetAt(guess - o1 * 3600000);
  return o2;
}

/** List of IANA zones supported by this runtime (may be empty on old engines). */
export function supportedZones() {
  try { return Intl.supportedValuesOf('timeZone'); } catch (e) { return []; }
}

/** "+05:30" style offset string. */
export function formatOffset(h) {
  const sign = h < 0 ? '-' : '+';
  const a = Math.abs(h);
  const hh = Math.floor(a + 1e-9);
  const mm = Math.round((a - hh) * 60);
  return `${sign}${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/** Parse "+05:30", "5.5", "-3", "+0530". Returns hours or NaN. */
export function parseOffset(s) {
  if (s == null) return NaN;
  const t = String(s).trim();
  if (t === '') return NaN;
  let m = t.match(/^([+-])?(\d{1,2}):?(\d{2})$/);
  if (m) { const v = +m[2] + +m[3] / 60; return m[1] === '-' ? -v : v; }
  const v = parseFloat(t);
  return Number.isFinite(v) ? v : NaN;
}

/** Degrees to D°M′S″ (within 360 or within sign). */
export function fmtDMS(deg, secDecimals = 0) {
  let d = Math.abs(deg);
  const factor = Math.pow(10, secDecimals);
  let totalSec = Math.round(d * 3600 * factor) / factor;
  let D = Math.floor(totalSec / 3600); totalSec -= D * 3600;
  let Mn = Math.floor(totalSec / 60); let S = totalSec - Mn * 60;
  if (Math.round(S * factor) / factor >= 60) { S = 0; Mn += 1; }
  if (Mn >= 60) { Mn = 0; D += 1; }
  const sStr = secDecimals ? S.toFixed(secDecimals).padStart(3 + secDecimals, '0') : String(Math.round(S)).padStart(2, '0');
  return `${deg < 0 ? '-' : ''}${D}°${String(Mn).padStart(2, '0')}′${sStr}″`;
}

/** Decimal hours to HH:MM:SS (wraps at 24). */
export function fmtHours(h) {
  if (h == null || !Number.isFinite(h)) return '—';
  let x = ((h % 24) + 24) % 24;
  let total = Math.round(x * 3600);
  const H = Math.floor(total / 3600); total -= H * 3600;
  const Mn = Math.floor(total / 60); const S = total - Mn * 60;
  return `${String(H).padStart(2, '0')}:${String(Mn).padStart(2, '0')}:${String(S).padStart(2, '0')}`;
}

/** Local decimal hours of a JD(UT) given UTC offset. */
export function localHours(jdUt, offsetHours) {
  return (((jdUt + 0.5 + offsetHours / 24) % 1) + 1) % 1 * 24;
}

/** Local calendar date+time string of a JD(UT). */
export function fmtLocalDateTime(jdUt, offsetHours) {
  const c = calendarDate(jdUt + offsetHours / 24);
  return `${c.year}-${String(c.month).padStart(2, '0')}-${String(c.day).padStart(2, '0')} ${fmtHours(c.hours)}`;
}

export const round2 = (x) => Math.round(x * 100) / 100;
