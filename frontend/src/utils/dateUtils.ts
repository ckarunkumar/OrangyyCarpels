const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FULL_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/**
 * Returns current Indian Fiscal Year string, e.g. "FY 2026-27"
 */
export function getCurrentFiscalYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed, April is 3
  const startYear = month >= 3 ? year : year - 1;
  const endYearShort = (startYear + 1).toString().slice(-2);
  return `FY ${startYear}-${endYearShort}`;
}

/**
 * Returns current month string in short form, e.g. "Sep 2026"
 */
export function getCurrentMonthShort(): string {
  const now = new Date();
  return `${SHORT_MONTHS[now.getMonth()]} ${now.getFullYear()}`;
}

/**
 * Returns current month string in YYYY-MM format, e.g. "2026-09"
 */
export function getCurrentMonthIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Returns a list of fiscal year strings starting with current fiscal year
 */
export function getAvailableFiscalYears(countBefore = 2, countAfter = 0): string[] {
  const currentFY = getCurrentFiscalYear();
  const match = currentFY.match(/FY (\d{4})-(\d{2})/);
  const startYear = match ? parseInt(match[1], 10) : new Date().getFullYear();

  const years: string[] = [];
  for (let i = countAfter; i >= -countBefore; i--) {
    const y = startYear + i;
    const endShort = (y + 1).toString().slice(-2);
    years.push(`FY ${y}-${endShort}`);
  }
  return years;
}

/**
 * Normalizes any month string ("September 2026", "2026-09", "Sep 2026") into short form "Sep 2026"
 */
export function formatMonthShort(monthStr: string): string {
  if (!monthStr) return getCurrentMonthShort();
  if (/^\d{4}-\d{2}$/.test(monthStr)) {
    const [y, m] = monthStr.split('-');
    const idx = parseInt(m, 10) - 1;
    if (idx >= 0 && idx < 12) {
      return `${SHORT_MONTHS[idx]} ${y}`;
    }
  }
  const parts = monthStr.trim().split(/\s+/);
  if (parts.length >= 2) {
    const fullIdx = FULL_MONTHS.findIndex((m) => m.toLowerCase() === parts[0].toLowerCase());
    const shortIdx = SHORT_MONTHS.findIndex((m) => m.toLowerCase() === parts[0].toLowerCase());
    const mName = shortIdx >= 0 ? SHORT_MONTHS[shortIdx] : fullIdx >= 0 ? SHORT_MONTHS[fullIdx] : parts[0];
    return `${mName} ${parts[1]}`;
  }
  return monthStr;
}
