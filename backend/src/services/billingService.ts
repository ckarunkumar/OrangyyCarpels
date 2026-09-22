import { prisma } from '../lib/prisma';
import { BillingCalculator, DEFAULT_RATES } from './billingCalculator';
import { BillingSummaryService } from './billingSummaryService';
import {
  ExchangeRateInfo,
  BillingOverview,
  RateVersionItem,
  MonthlyBudgetItem,
} from './billingTypes';

import { FxRateService } from './fxRateService';

export * from './billingTypes';

export class BillingService {
  static getCurrentMonthYear(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  static async getExchangeRates(): Promise<ExchangeRateInfo[]> {
    return FxRateService.getCurrentRates('INR') as any;
  }

  static async syncLiveExchangeRates(): Promise<ExchangeRateInfo[]> {
    return FxRateService.syncLiveExchangeRates('INR') as any;
  }

  static async getBillingSummary(
    role: string,
    fy?: string,
    month?: string,
    periodType?: string,
    clientId?: string
  ): Promise<BillingOverview> {
    return BillingSummaryService.getSummary(role, fy, month, periodType, clientId);
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
