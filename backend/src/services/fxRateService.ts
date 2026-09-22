import { prisma } from '../lib/prisma';
import { DEFAULT_RATES } from './billingCalculator';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'SGD', 'CAD', 'JPY', 'CHF', 'INR'];

export class FxRateService {
  static getCurrentPeriod() {
    const d = new Date();
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const monthName = MONTH_NAMES[month - 1];
    return { year, month, effectivePeriod: `${monthName} ${year}`, monthYearKey: `${year}-${String(month).padStart(2, '0')}` };
  }

  static async syncLiveExchangeRates(targetCurrency: string = 'INR') {
    const { year, month, effectivePeriod, monthYearKey } = this.getCurrentPeriod();
    let liveRates: Record<string, number> = {};
    let source = 'open.er-api.com';

    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD', { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const data: any = await res.json();
        liveRates = data.rates || {};
      }
    } catch {
      source = 'fallback-cached';
    }

    const usdToTarget = targetCurrency === 'USD' ? 1.0 : (liveRates[targetCurrency] || DEFAULT_RATES['USD'] || 87.5);
    const results: any[] = [];

    for (const curr of SUPPORTED_CURRENCIES) {
      let calculatedRate = 1.0;
      if (curr === targetCurrency) {
        calculatedRate = 1.0;
      } else if (curr === 'USD') {
        calculatedRate = parseFloat(usdToTarget.toFixed(4));
      } else {
        const usdToCurr = liveRates[curr];
        if (usdToCurr && usdToCurr > 0) {
          calculatedRate = parseFloat((usdToTarget / usdToCurr).toFixed(4));
        } else {
          calculatedRate = DEFAULT_RATES[curr] || 1.0;
        }
      }

      // 1. Upsert into MonthlyExchangeRate (Snapshot for current month/year)
      const record = await prisma.monthlyExchangeRate.upsert({
        where: {
          sourceCurrency_targetCurrency_year_month: {
            sourceCurrency: curr,
            targetCurrency,
            year,
            month,
          },
        },
        update: {
          rate: calculatedRate,
          effectivePeriod,
          syncedAt: new Date(),
          source,
        },
        create: {
          sourceCurrency: curr,
          targetCurrency,
          rate: calculatedRate,
          year,
          month,
          effectivePeriod,
          syncedAt: new Date(),
          source,
        },
      });

      // 2. Also keep legacy ExchangeRate updated for backward compatibility
      if (targetCurrency === 'INR') {
        const existingLegacy = await prisma.exchangeRate.findFirst({ where: { currency: curr, monthYear: monthYearKey } });
        await prisma.exchangeRate.upsert({
          where: { id: existingLegacy?.id || 0 },
          update: { rateToINR: calculatedRate, fetchedAt: new Date(), source },
          create: { currency: curr, rateToINR: calculatedRate, monthYear: monthYearKey, source },
        });
      }

      results.push(record);
    }

    return results;
  }

  static async getMonthlyRate(sourceCurrency: string, targetCurrency: string = 'INR', year: number, month: number): Promise<number> {
    const cleanSource = sourceCurrency.replace(/[^A-Za-z]/g, '').toUpperCase() || 'USD';
    const cleanTarget = targetCurrency.replace(/[^A-Za-z]/g, '').toUpperCase() || 'INR';
    if (cleanSource === cleanTarget) return 1.0;

    // 1. Query exact month/year record
    const exact = await prisma.monthlyExchangeRate.findUnique({
      where: {
        sourceCurrency_targetCurrency_year_month: {
          sourceCurrency: cleanSource,
          targetCurrency: cleanTarget,
          year,
          month,
        },
      },
    });
    if (exact) return exact.rate;

    // 2. Query closest previous monthly snapshot
    const closest = await prisma.monthlyExchangeRate.findFirst({
      where: {
        sourceCurrency: cleanSource,
        targetCurrency: cleanTarget,
        OR: [
          { year: { lt: year } },
          { year, month: { lte: month } },
        ],
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
    if (closest) return closest.rate;

    // 3. Fallback to default
    return DEFAULT_RATES[cleanSource] || 1.0;
  }

  static async getCurrentRates(targetCurrency: string = 'INR') {
    const { year, month } = this.getCurrentPeriod();
    const rates = await prisma.monthlyExchangeRate.findMany({
      where: { targetCurrency, year, month },
      orderBy: { sourceCurrency: 'asc' },
    });
    return rates.length > 0 ? rates : this.syncLiveExchangeRates(targetCurrency);
  }

  static async getRateHistory(targetCurrency: string = 'INR') {
    return prisma.monthlyExchangeRate.findMany({
      where: { targetCurrency },
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { sourceCurrency: 'asc' }],
    });
  }
}
