import { prisma } from '../lib/prisma';
import { DEFAULT_RATES } from './billingCalculator';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'SGD', 'CAD', 'JPY', 'CHF', 'INR'];

export interface FxObservationItem {
  slot: '1st' | '15th' | 'Month-End';
  day: number;
  rate: number;
  effectiveDate: string;
  source: string;
}

export class FxRateService {
  static getLastDayOfMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
  }

  static getPeriodInfo(d: Date = new Date()) {
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const lastDay = this.getLastDayOfMonth(year, month);
    const monthName = MONTH_NAMES[month - 1];
    const effectivePeriod = `${monthName} ${year}`;
    const monthYearKey = `${year}-${String(month).padStart(2, '0')}`;

    let slot: '1st' | '15th' | 'Month-End' = '1st';
    let scheduledDay = 1;
    if (day >= lastDay) {
      slot = 'Month-End';
      scheduledDay = lastDay;
    } else if (day >= 15) {
      slot = '15th';
      scheduledDay = 15;
    }

    return { year, month, day, lastDay, effectivePeriod, monthYearKey, slot, scheduledDay };
  }

  static async fetchLiveRates(): Promise<{ liveRates: Record<string, number>; source: string }> {
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD', { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const data = (await res.json()) as any;
        return { liveRates: data.rates || {}, source: 'open.er-api.com' };
      }
    } catch {
      // Fallback on network or API failure
    }
    return { liveRates: {}, source: 'fallback-cached' };
  }

  static async syncObservationForDate(targetCurrency: string = 'INR', date: Date = new Date()) {
    const { year, month, lastDay, effectivePeriod, monthYearKey, slot, scheduledDay } = this.getPeriodInfo(date);
    const effectiveDate = `${year}-${String(month).padStart(2, '0')}-${String(scheduledDay).padStart(2, '0')}`;
    const { liveRates, source } = await this.fetchLiveRates();
    const usdToTarget = targetCurrency === 'USD' ? 1.0 : (liveRates[targetCurrency] || DEFAULT_RATES['USD'] || 87.5);

    for (const curr of SUPPORTED_CURRENCIES) {
      let calculatedRate = 1.0;
      if (curr === targetCurrency) {
        calculatedRate = 1.0;
      } else if (curr === 'USD') {
        calculatedRate = parseFloat(usdToTarget.toFixed(4));
      } else {
        const usdToCurr = liveRates[curr];
        calculatedRate = usdToCurr && usdToCurr > 0 ? parseFloat((usdToTarget / usdToCurr).toFixed(4)) : (DEFAULT_RATES[curr] || 1.0);
      }

      await prisma.exchangeRateObservation.upsert({
        where: {
          sourceCurrency_targetCurrency_year_month_slot: {
            sourceCurrency: curr,
            targetCurrency,
            year,
            month,
            slot,
          },
        },
        update: { rate: calculatedRate, effectiveDate, day: scheduledDay, source, fetchedAt: new Date() },
        create: { sourceCurrency: curr, targetCurrency, rate: calculatedRate, year, month, day: scheduledDay, slot, effectiveDate, source, fetchedAt: new Date() },
      });

      await this.recalculateMonthlyAverage(curr, targetCurrency, year, month, effectivePeriod, monthYearKey);
    }
  }

  static async recalculateMonthlyAverage(curr: string, targetCurrency: string, year: number, month: number, effectivePeriod: string, monthYearKey: string) {
    const observations = await prisma.exchangeRateObservation.findMany({
      where: { sourceCurrency: curr, targetCurrency, year, month },
      orderBy: { day: 'asc' },
    });

    const count = observations.length;
    const avgRate = count > 0 ? parseFloat((observations.reduce((acc, o) => acc + o.rate, 0) / count).toFixed(4)) : (DEFAULT_RATES[curr] || 1.0);
    const status = count >= 3 ? 'Finalized (3/3 observations)' : `In Progress (${count}/3 observations)`;
    const lastSource = observations[observations.length - 1]?.source || 'open.er-api.com';

    await prisma.monthlyExchangeRate.upsert({
      where: { sourceCurrency_targetCurrency_year_month: { sourceCurrency: curr, targetCurrency, year, month } },
      update: { rate: avgRate, observationsCount: count, calculationStatus: status, effectivePeriod, syncedAt: new Date(), source: lastSource },
      create: { sourceCurrency: curr, targetCurrency, rate: avgRate, year, month, effectivePeriod, observationsCount: count, calculationStatus: status, syncedAt: new Date(), source: lastSource },
    });

    if (targetCurrency === 'INR') {
      const existing = await prisma.exchangeRate.findFirst({ where: { currency: curr, monthYear: monthYearKey } });
      await prisma.exchangeRate.upsert({
        where: { id: existing?.id || 0 },
        update: { rateToINR: avgRate, fetchedAt: new Date(), source: lastSource },
        create: { currency: curr, rateToINR: avgRate, monthYear: monthYearKey, source: lastSource },
      });
    }
  }

  static async autoCheckAndSyncScheduledRates(targetCurrency: string = 'INR') {
    const now = new Date();
    const { year, month, day, lastDay } = this.getPeriodInfo(now);
    const slotsToEnsure: { slot: '1st' | '15th' | 'Month-End'; checkDay: number; simDate: Date }[] = [];

    if (day >= 1) slotsToEnsure.push({ slot: '1st', checkDay: 1, simDate: new Date(year, month - 1, 1, 10, 0, 0) });
    if (day >= 15) slotsToEnsure.push({ slot: '15th', checkDay: 15, simDate: new Date(year, month - 1, 15, 10, 0, 0) });
    if (day >= lastDay) slotsToEnsure.push({ slot: 'Month-End', checkDay: lastDay, simDate: new Date(year, month - 1, lastDay, 10, 0, 0) });

    for (const item of slotsToEnsure) {
      const existing = await prisma.exchangeRateObservation.findFirst({
        where: { targetCurrency, year, month, slot: item.slot },
      });
      if (!existing) {
        await this.syncObservationForDate(targetCurrency, item.simDate);
      }
    }
  }

  static async syncLiveExchangeRates(targetCurrency: string = 'INR') {
    await this.syncObservationForDate(targetCurrency, new Date());
    return this.getCurrentRates(targetCurrency);
  }

  static async getMonthlyRate(sourceCurrency: string, targetCurrency: string = 'INR', year: number, month: number): Promise<number> {
    const cleanSource = sourceCurrency.replace(/[^A-Za-z]/g, '').toUpperCase() || 'USD';
    const cleanTarget = targetCurrency.replace(/[^A-Za-z]/g, '').toUpperCase() || 'INR';
    if (cleanSource === cleanTarget) return 1.0;

    const exact = await prisma.monthlyExchangeRate.findUnique({
      where: { sourceCurrency_targetCurrency_year_month: { sourceCurrency: cleanSource, targetCurrency: cleanTarget, year, month } },
    });
    if (exact) return exact.rate;

    const closest = await prisma.monthlyExchangeRate.findFirst({
      where: { sourceCurrency: cleanSource, targetCurrency: cleanTarget, OR: [{ year: { lt: year } }, { year, month: { lte: month } }] },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
    if (closest) return closest.rate;

    return DEFAULT_RATES[cleanSource] || 1.0;
  }

  static async getCurrentRates(targetCurrency: string = 'INR') {
    const { year, month } = this.getPeriodInfo();
    const rates = await prisma.monthlyExchangeRate.findMany({
      where: { targetCurrency, year, month },
      orderBy: { sourceCurrency: 'asc' },
    });
    if (rates.length > 0) return rates;
    await this.syncLiveExchangeRates(targetCurrency);
    return prisma.monthlyExchangeRate.findMany({ where: { targetCurrency, year, month }, orderBy: { sourceCurrency: 'asc' } });
  }

  static async getRateHistory(targetCurrency: string = 'INR') {
    const [monthlyRates, observations] = await Promise.all([
      prisma.monthlyExchangeRate.findMany({ where: { targetCurrency }, orderBy: [{ year: 'desc' }, { month: 'desc' }, { sourceCurrency: 'asc' }] }),
      prisma.exchangeRateObservation.findMany({ where: { targetCurrency }, orderBy: [{ year: 'desc' }, { month: 'desc' }, { day: 'asc' }] }),
    ]);

    return monthlyRates.map((mr) => ({
      ...mr,
      observations: observations.filter((o) => o.sourceCurrency === mr.sourceCurrency && o.year === mr.year && o.month === mr.month),
    }));
  }
}
