export const DEFAULT_RATES: Record<string, number> = {
  USD: 87.50, INR: 1.00, EUR: 94.20, GBP: 110.80, SGD: 65.40,
  AUD: 57.30, CAD: 63.80, AED: 23.82, JPY: 0.58, CHF: 98.40,
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export class BillingCalculator {
  static parseRateAmount(rateStr: string): number {
    if (!rateStr) return 0;
    const num = parseFloat(rateStr.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 0 : num;
  }

  static extractCurrencyCode(currStr: string): string {
    if (!currStr) return 'USD';
    for (const c of ['USD', 'INR', 'EUR', 'GBP', 'SGD', 'AUD', 'CAD', 'AED', 'JPY', 'CHF']) {
      if (currStr.includes(c)) return c;
    }
    return currStr.includes('₹') ? 'INR' : 'USD';
  }

  static formatDisplayDate(dateStr?: string | null): string {
    if (!dateStr || dateStr.trim() === '') return '—';
    // If already in DD-MMM-YYYY format
    if (/^\d{2}-[A-Za-z]{3}-\d{4}$/.test(dateStr)) return dateStr;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = MONTH_SHORT[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  static normalizeDate(dateStr?: string | null): string {
    if (!dateStr || dateStr.trim() === '') return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    // Check if DD-MMM-YYYY or DD MMM YYYY
    const parts = dateStr.split(/[- ]/);
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const monthIdx = MONTH_SHORT.findIndex(m => m.toLowerCase() === parts[1].slice(0, 3).toLowerCase());
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && monthIdx >= 0 && !isNaN(year)) {
        return `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
  }

  static parseFiscalYear(fy?: string): { startDate: string; endDate: string; fyLabel: string } {
    const match = (fy || '').match(/(\d{4})[-/](\d{2,4})/);
    let startYear = 2026;
    if (match) startYear = parseInt(match[1], 10);
    const endYear = startYear + 1;
    const shortEnd = String(endYear).slice(-2);
    return {
      startDate: `${startYear}-04-01`,
      endDate: `${endYear}-03-31`,
      fyLabel: `FY ${startYear}-${shortEnd}`,
    };
  }

  static parseMonth(monthStr?: string, defaultYear = 2026): { startDate: string; endDate: string; monthLabel: string; monthYearKey: string } {
    let year = defaultYear;
    let monthIndex = 3; // Default April (0-indexed: 3)

    if (monthStr) {
      if (/^\d{4}-\d{2}$/.test(monthStr)) {
        const [y, m] = monthStr.split('-');
        year = parseInt(y, 10);
        monthIndex = parseInt(m, 10) - 1;
      } else {
        const parts = monthStr.trim().split(/\s+/);
        if (parts.length >= 2) {
          const mIdx = MONTH_NAMES.findIndex(m => m.toLowerCase() === parts[0].toLowerCase());
          const shortIdx = MONTH_SHORT.findIndex(m => m.toLowerCase() === parts[0].toLowerCase());
          if (mIdx >= 0) monthIndex = mIdx;
          else if (shortIdx >= 0) monthIndex = shortIdx;
          const y = parseInt(parts[1], 10);
          if (!isNaN(y)) year = y;
        } else {
          const mIdx = MONTH_NAMES.findIndex(m => m.toLowerCase() === parts[0].toLowerCase());
          if (mIdx >= 0) monthIndex = mIdx;
        }
      }
    }

    const start = new Date(Date.UTC(year, monthIndex, 1));
    const end = new Date(Date.UTC(year, monthIndex + 1, 0));
    const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
    const monthLabel = `${MONTH_NAMES[monthIndex]} ${year}`;

    return {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      monthLabel,
      monthYearKey: monthKey,
    };
  }

  static isProjectActiveInRange(pStartNorm: string, pEndNorm: string, rangeStart: string, rangeEnd: string): boolean {
    const start = pStartNorm || '1970-01-01';
    const end = pEndNorm || '2099-12-31';
    return start <= rangeEnd && end >= rangeStart;
  }
}
