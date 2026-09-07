import { prisma } from '../lib/prisma';

export interface ExchangeRateInfo {
  id?: number; currency: string; rateToINR: number; monthYear: string;
  isLocked: boolean; source: string; fetchedAt: Date;
}

export interface ProjectBillingSummary {
  projectId: string; projectName: string; clientId: string; clientName: string;
  billingType: 'T&M' | 'Fixed RC' | 'Fixed PC' | 'Hourly Rate (T&M)' | 'Monthly Resource Cost (Fixed)' | 'Project Cost (Fixed)';
  currency: string; rateAmount: number; rateFormatted: string; budgetHours: number;
  loggedHours: number; nativeAmountBilled: number; exchangeRateToINR: number;
  inrAmountBilled: number; status: string; effectiveStartDate: string;
}

export interface BillingOverview {
  totalRevenueINR: number; tmRevenueINR: number; monthlyFixedRevenueINR: number;
  projectFixedRevenueINR: number; totalHoursLogged: number; activeProjectsCount: number;
  exchangeRates: ExchangeRateInfo[]; projects: ProjectBillingSummary[]; activeMonthYear: string;
}

export interface RateVersionItem {
  id: number;
  projectId: string;
  billingType: string;
  rateAmount: number;
  currency: string;
  effectiveStartDate: string;
  effectiveEndDate?: string;
  notes?: string;
  createdAt: string;
}

export interface MonthlyBudgetItem {
  id?: number;
  projectId: string;
  monthYear: string;
  budgetHours: number;
  isLocked: boolean;
  updatedAt: string;
}

const DEFAULT_RATES: Record<string, number> = {
  USD: 87.50, INR: 1.00, EUR: 94.20, GBP: 110.80, SGD: 65.40,
  AUD: 57.30, CAD: 63.80, AED: 23.82, JPY: 0.58, CHF: 98.40,
};

export class BillingService {
  static getCurrentMonthYear(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  static parseRateAmount(rateStr: string): number {
    const num = parseFloat(rateStr.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 0 : num;
  }

  static extractCurrencyCode(currStr: string): string {
    for (const c of ['USD', 'INR', 'EUR', 'GBP', 'SGD', 'AUD', 'CAD', 'AED', 'JPY', 'CHF']) {
      if (currStr.includes(c)) return c;
    }
    return currStr.includes('₹') ? 'INR' : 'USD';
  }

  static async getExchangeRates(): Promise<ExchangeRateInfo[]> {
    const monthYear = this.getCurrentMonthYear();
    const rates = await prisma.exchangeRate.findMany({ where: { monthYear } });
    return rates.length === 0 ? this.syncLiveExchangeRates() : rates;
  }

  static async syncLiveExchangeRates(): Promise<ExchangeRateInfo[]> {
    const monthYear = this.getCurrentMonthYear();
    let liveUsdRates: Record<string, number> = {};
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD', { signal: AbortSignal.timeout(6000) });
      if (res.ok) liveUsdRates = ((await res.json()) as any).rates || {};
    } catch { /* Fallback to defaults */ }

    const usdToInr = liveUsdRates['INR'] || DEFAULT_RATES['USD'];
    const updatedRates: ExchangeRateInfo[] = [];

    for (const curr of Object.keys(DEFAULT_RATES)) {
      let rateToINR = curr === 'INR' ? 1.0 : curr === 'USD' ? usdToInr : (liveUsdRates[curr] ? parseFloat((usdToInr / liveUsdRates[curr]).toFixed(4)) : DEFAULT_RATES[curr] || 1.0);
      const existing = await prisma.exchangeRate.findFirst({ where: { currency: curr, monthYear } });
      const record = await prisma.exchangeRate.upsert({
        where: { id: existing?.id || 0 },
        update: { rateToINR, fetchedAt: new Date(), source: liveUsdRates['INR'] ? 'open.er-api.com' : 'studio-default' },
        create: { currency: curr, rateToINR, monthYear, source: liveUsdRates['INR'] ? 'open.er-api.com' : 'studio-default' },
      });
      updatedRates.push(record);
    }
    return updatedRates;
  }

  static async getBillingSummary(role: string): Promise<BillingOverview> {
    if (role === 'Employee') throw new Error('Access Denied: Employees cannot view billing financials.');
    const monthYear = this.getCurrentMonthYear();
    const exchangeRates = await this.getExchangeRates();
    const rateMap = new Map<string, number>(exchangeRates.map((r) => [r.currency, r.rateToINR]));

    const projects = await prisma.project.findMany({
      include: { client: true },
    });

    let totalRevenueINR = 0, tmRevenueINR = 0, monthlyFixedRevenueINR = 0, projectFixedRevenueINR = 0, totalHoursLogged = 0;

    const projectSummaries: ProjectBillingSummary[] = projects.map((p: any) => {
      const rateVersions: RateVersionItem[] = Array.isArray(p.rateVersions) ? p.rateVersions : [];
      const activeVersion = rateVersions.length > 0 ? rateVersions[0] : null;
      const currency = activeVersion?.currency || p.currency || p.client.billingCurrency;
      const rateToINR = rateMap.get(this.extractCurrencyCode(currency)) || DEFAULT_RATES[this.extractCurrencyCode(currency)] || 1.0;
      const rateAmount = activeVersion ? activeVersion.rateAmount : this.parseRateAmount(p.rate);
      const bTypeRaw = p.billingType || 'T&M';
      const billingType: ProjectBillingSummary['billingType'] =
        bTypeRaw === 'Hourly Rate (T&M)' ? 'T&M' :
        bTypeRaw === 'Monthly Resource Cost (Fixed)' || bTypeRaw === 'Monthly Res Cost (Fixed)' ? 'Fixed RC' :
        bTypeRaw === 'Project Cost (Fixed)' ? 'Fixed PC' : bTypeRaw;
      const loggedHours = p.loggedHours || 0;
      totalHoursLogged += loggedHours;

      let nativeAmountBilled = (billingType === 'T&M' || billingType === 'Hourly Rate (T&M)') ? loggedHours * rateAmount : rateAmount;
      const inrAmountBilled = Math.round(nativeAmountBilled * rateToINR);
      totalRevenueINR += inrAmountBilled;
      if (billingType === 'T&M' || billingType === 'Hourly Rate (T&M)') tmRevenueINR += inrAmountBilled;
      else if (billingType === 'Fixed RC' || billingType === 'Monthly Resource Cost (Fixed)') monthlyFixedRevenueINR += inrAmountBilled;
      else if (billingType === 'Fixed PC' || billingType === 'Project Cost (Fixed)') projectFixedRevenueINR += inrAmountBilled;

      return {
        projectId: p.id, projectName: p.name, clientId: p.clientId, clientName: p.client.displayName || p.client.name,
        billingType, currency, rateAmount, rateFormatted: `${currency.replace(/\s*\(.*\)/, '')} ${rateAmount.toLocaleString()}`,
        budgetHours: p.budgetHours, loggedHours, nativeAmountBilled, exchangeRateToINR: rateToINR,
        inrAmountBilled, status: p.status, effectiveStartDate: activeVersion?.effectiveStartDate || 'Initial',
      };
    });

    return {
      totalRevenueINR, tmRevenueINR, monthlyFixedRevenueINR, projectFixedRevenueINR,
      totalHoursLogged, activeProjectsCount: projects.filter((p: any) => p.status === 'Active').length,
      exchangeRates, projects: projectSummaries, activeMonthYear: monthYear,
    };
  }

  static async getProjectRateVersions(projectId: string): Promise<RateVersionItem[]> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { rateVersions: true },
    });
    if (!project || !Array.isArray(project.rateVersions)) return [];
    return (project.rateVersions as unknown as RateVersionItem[]).sort((a, b) => b.id - a.id);
  }

  static async addProjectRateVersion(role: string, projectId: string, data: any): Promise<RateVersionItem> {
    if (role !== 'Super Admin') throw new Error('Access Denied: Only Super Admins can update rate versions.');
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new Error(`Project ${projectId} not found.`);

    const existingVersions: RateVersionItem[] = Array.isArray(project.rateVersions)
      ? (project.rateVersions as unknown as RateVersionItem[])
      : [];

    const updatedOldVersions = existingVersions.map((v) =>
      !v.effectiveEndDate ? { ...v, effectiveEndDate: data.effectiveStartDate } : v
    );

    const newVersion: RateVersionItem = {
      id: Date.now(),
      projectId,
      billingType: data.billingType,
      rateAmount: Number(data.rateAmount),
      currency: data.currency,
      effectiveStartDate: data.effectiveStartDate,
      effectiveEndDate: data.effectiveEndDate || '',
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
    };

    const finalVersions = [newVersion, ...updatedOldVersions];

    await prisma.project.update({
      where: { id: projectId },
      data: { rateVersions: finalVersions as any },
    });

    return newVersion;
  }

  static async getProjectMonthlyBudgets(projectId: string): Promise<MonthlyBudgetItem[]> {
    const currentMonth = this.getCurrentMonthYear();
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { monthlyBudgets: true },
    });
    if (!project || !Array.isArray(project.monthlyBudgets)) return [];
    const list = project.monthlyBudgets as unknown as MonthlyBudgetItem[];
    return list
      .map((b) => ({ ...b, isLocked: b.isLocked || b.monthYear < currentMonth }))
      .sort((a, b) => b.monthYear.localeCompare(a.monthYear));
  }

  static async setProjectMonthlyBudget(role: string, projectId: string, monthYear: string, budgetHours: number): Promise<MonthlyBudgetItem> {
    if (role === 'Employee') throw new Error('Access Denied: Employees cannot modify budget hours.');
    const currentMonth = this.getCurrentMonthYear();
    if (monthYear < currentMonth && role !== 'Super Admin') throw new Error('Month has closed. Budget hours are locked.');

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new Error(`Project ${projectId} not found.`);

    const existingList: MonthlyBudgetItem[] = Array.isArray(project.monthlyBudgets)
      ? (project.monthlyBudgets as unknown as MonthlyBudgetItem[])
      : [];

    const existingIndex = existingList.findIndex((b) => b.monthYear === monthYear);
    const updatedEntry: MonthlyBudgetItem = {
      id: existingIndex >= 0 ? existingList[existingIndex].id : Date.now(),
      projectId,
      monthYear,
      budgetHours: Number(budgetHours),
      isLocked: monthYear < currentMonth,
      updatedAt: new Date().toISOString(),
    };

    let finalList: MonthlyBudgetItem[];
    if (existingIndex >= 0) {
      finalList = [...existingList];
      finalList[existingIndex] = updatedEntry;
    } else {
      finalList = [updatedEntry, ...existingList];
    }

    const updateData: any = { monthlyBudgets: finalList as any };
    if (monthYear === currentMonth) {
      updateData.budgetHours = Math.round(Number(budgetHours));
    }

    await prisma.project.update({
      where: { id: projectId },
      data: updateData,
    });

    return updatedEntry;
  }
}

