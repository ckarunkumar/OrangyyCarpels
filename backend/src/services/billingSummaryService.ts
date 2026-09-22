import { prisma } from '../lib/prisma';
import { BillingCalculator, DEFAULT_RATES } from './billingCalculator';
import { BillingOverview, ClientBillingSummary, ProjectBillingSummary, RateVersionItem } from './billingTypes';
import { getMonthlyBudgetHours } from './timesheetService';

export class BillingSummaryService {
  static async getSummary(
    role: string,
    fy?: string,
    month?: string,
    periodTypeParam?: string,
    clientIdFilter?: string
  ): Promise<BillingOverview> {
    if (role !== 'Super Admin' && role !== 'Project Manager') {
      throw new Error('Access Denied: You do not have permission to view billing financials.');
    }

    const periodType = (periodTypeParam || 'yearly').toLowerCase() === 'monthly' ? 'monthly' : 'yearly';
    const { startDate: fyStart, endDate: fyEnd, fyLabel } = BillingCalculator.parseFiscalYear(fy);
    const startYear = parseInt(fyStart.slice(0, 4), 10);
    const { startDate: mStart, endDate: mEnd, monthLabel, monthYearKey } = BillingCalculator.parseMonth(month, startYear);

    const rangeStart = periodType === 'monthly' ? mStart : fyStart;
    const rangeEnd = periodType === 'monthly' ? mEnd : fyEnd;

    const [allRates, allMonthlyRates] = await Promise.all([
      prisma.exchangeRate.findMany(),
      prisma.monthlyExchangeRate.findMany({ where: { targetCurrency: 'INR' } }),
    ]);

    const monthRates = allRates.filter(r => r.monthYear === monthYearKey);
    const activeRates = (periodType === 'monthly' && monthRates.length > 0) ? monthRates : allRates;
    const rateMap = new Map<string, number>(activeRates.map(r => [r.currency, r.rateToINR]));

    // Fast lookup for monthly snapshot rates by currency + year + month
    const monthlyRateMap = new Map<string, number>();
    for (const r of allMonthlyRates) {
      monthlyRateMap.set(`${r.sourceCurrency}_${r.year}_${r.month}`, r.rate);
    }

    const getEntryFxRate = (curr: string, dateStr: string): number => {
      const year = parseInt(dateStr.slice(0, 4), 10);
      const m = parseInt(dateStr.slice(5, 7), 10);
      return monthlyRateMap.get(`${curr}_${year}_${m}`) || rateMap.get(curr) || DEFAULT_RATES[curr] || 1.0;
    };

    const projectsRaw = await prisma.project.findMany({
      where: clientIdFilter ? { clientId: clientIdFilter } : undefined,
      include: {
        client: true,
        dailyEntries: { where: { date: { gte: rangeStart, lte: rangeEnd } } },
      },
    });

    let totalRevenueINR = 0, tmRevenueINR = 0, monthlyFixedRevenueINR = 0, projectFixedRevenueINR = 0;
    let totalHoursLogged = 0, activeProjectsCount = 0;
    const projectSummaries: ProjectBillingSummary[] = [];

    for (const p of projectsRaw) {
      const pStartNorm = BillingCalculator.normalizeDate(p.startDate);
      const pEndNorm = BillingCalculator.normalizeDate(p.endDate);
      const isActiveInPeriod = BillingCalculator.isProjectActiveInRange(pStartNorm, pEndNorm, rangeStart, rangeEnd);

      const rateVersions: RateVersionItem[] = Array.isArray(p.rateVersions) ? (p.rateVersions as any) : [];
      const activeVersion = rateVersions.length > 0 ? rateVersions[0] : null;
      const currency = activeVersion?.currency || p.currency || p.client.billingCurrency || 'USD';
      const currCode = BillingCalculator.extractCurrencyCode(currency);
      const defaultFxRate = rateMap.get(currCode) || DEFAULT_RATES[currCode] || 1.0;
      const rateAmount = activeVersion ? activeVersion.rateAmount : BillingCalculator.parseRateAmount(p.rate);

      const bTypeRaw = p.billingType || p.client.defaultBillingType || 'T&M';
      const billingModel: 'T&M' | 'Resources Cost (Fix)' | 'Project Cost (Fix)' =
        bTypeRaw.includes('T&M') || bTypeRaw.includes('Hourly') ? 'T&M' :
        bTypeRaw.includes('RC') || bTypeRaw.includes('Resource') || bTypeRaw.includes('Retainer') ? 'Resources Cost (Fix)' : 'Project Cost (Fix)';

      let loggedHours = 0;
      let nativeAmountBilled = 0;
      let inrAmountBilled = 0;

      if (billingModel === 'T&M') {
        if (p.dailyEntries && p.dailyEntries.length > 0) {
          for (const d of p.dailyEntries) {
            const h = d.hours || 0;
            loggedHours += h;
            const entryFxRate = getEntryFxRate(currCode, d.date);
            const entryNative = h * rateAmount;
            nativeAmountBilled += entryNative;
            inrAmountBilled += Math.round(entryNative * entryFxRate);
          }
        } else if (p.loggedHours && isActiveInPeriod && periodType === 'yearly') {
          loggedHours = p.loggedHours;
          nativeAmountBilled = loggedHours * rateAmount;
          inrAmountBilled = Math.round(nativeAmountBilled * defaultFxRate);
        }
      } else if (isActiveInPeriod) {
        nativeAmountBilled = rateAmount;
        inrAmountBilled = Math.round(nativeAmountBilled * defaultFxRate);
        loggedHours = p.dailyEntries?.reduce((sum: number, d: any) => sum + (d.hours || 0), 0) || 0;
      }

      const isVisible = isActiveInPeriod || inrAmountBilled > 0 || loggedHours > 0;
      if (!isVisible) continue;

      totalRevenueINR += inrAmountBilled;
      totalHoursLogged += loggedHours;
      if (p.status === 'Active') activeProjectsCount++;

      if (billingModel === 'T&M') tmRevenueINR += inrAmountBilled;
      else if (billingModel === 'Resources Cost (Fix)') monthlyFixedRevenueINR += inrAmountBilled;
      else if (billingModel === 'Project Cost (Fix)') projectFixedRevenueINR += inrAmountBilled;

      const budgetHours = getMonthlyBudgetHours(p);
      const hoursBurnedPercent = budgetHours > 0 ? Math.min(100, Math.round((loggedHours / budgetHours) * 100)) : 0;

      projectSummaries.push({
        projectId: p.id,
        projectCode: p.id,
        projectName: p.name,
        clientId: p.clientId,
        clientName: p.client.displayName || p.client.name,
        startDate: BillingCalculator.formatDisplayDate(p.startDate),
        endDate: BillingCalculator.formatDisplayDate(p.endDate),
        billingType: bTypeRaw as any,
        billingModel,
        currency,
        rateAmount,
        rateFormatted: `${currency.replace(/\s*\(.*\)/, '')} ${rateAmount.toLocaleString()}`,
        budgetHours,
        loggedHours,
        hoursBurnedPercent,
        nativeAmountBilled,
        exchangeRateToINR: defaultFxRate,
        inrAmountBilled,
        status: p.status,
        effectiveStartDate: activeVersion?.effectiveStartDate || p.startDate || '—',
      });
    }

    const clientMap = new Map<string, ClientBillingSummary>();
    for (const proj of projectSummaries) {
      const existing = clientMap.get(proj.clientId);
      if (!existing) {
        clientMap.set(proj.clientId, {
          clientId: proj.clientId,
          clientName: proj.clientName,
          billingMethod: proj.billingModel,
          billingCurrency: proj.currency.replace(/\s*\(.*\)/, ''),
          totalProjects: 1,
          totalRevenueINR: proj.inrAmountBilled,
          tmRevenueINR: proj.billingModel === 'T&M' ? proj.inrAmountBilled : 0,
          monthlyFixedRevenueINR: proj.billingModel === 'Resources Cost (Fix)' ? proj.inrAmountBilled : 0,
          projectFixedRevenueINR: proj.billingModel === 'Project Cost (Fix)' ? proj.inrAmountBilled : 0,
          totalHoursLogged: proj.loggedHours,
        });
      } else {
        existing.totalProjects += 1;
        existing.totalRevenueINR += proj.inrAmountBilled;
        existing.totalHoursLogged += proj.loggedHours;
        if (proj.billingModel === 'T&M') existing.tmRevenueINR += proj.inrAmountBilled;
        if (proj.billingModel === 'Resources Cost (Fix)') existing.monthlyFixedRevenueINR += proj.inrAmountBilled;
        if (proj.billingModel === 'Project Cost (Fix)') existing.projectFixedRevenueINR += proj.inrAmountBilled;
      }
    }

    const clients = Array.from(clientMap.values()).filter(c => periodType === 'yearly' || c.totalRevenueINR > 0 || c.totalProjects > 0);

    return {
      totalRevenueINR,
      tmRevenueINR,
      monthlyFixedRevenueINR,
      projectFixedRevenueINR,
      totalHoursLogged,
      activeProjectsCount,
      activeMonthYear: periodType === 'monthly' ? monthLabel : fyLabel,
      periodType,
      selectedMonth: monthLabel,
      selectedFY: fyLabel,
      exchangeRates: activeRates.map(r => ({
        id: r.id,
        currency: r.currency,
        rateToINR: r.rateToINR,
        monthYear: r.monthYear,
        isLocked: r.isLocked,
        source: r.source,
        fetchedAt: r.fetchedAt,
      })),
      clients,
      projects: projectSummaries,
    };
  }
}
