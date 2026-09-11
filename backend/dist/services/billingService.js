"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingService = void 0;
const prisma_1 = require("../lib/prisma");
const DEFAULT_RATES = {
    USD: 87.50, INR: 1.00, EUR: 94.20, GBP: 110.80, SGD: 65.40,
    AUD: 57.30, CAD: 63.80, AED: 23.82, JPY: 0.58, CHF: 98.40,
};
class BillingService {
    static getCurrentMonthYear() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
    static parseRateAmount(rateStr) {
        const num = parseFloat(rateStr.replace(/[^0-9.]/g, ''));
        return isNaN(num) ? 0 : num;
    }
    static extractCurrencyCode(currStr) {
        for (const c of ['USD', 'INR', 'EUR', 'GBP', 'SGD', 'AUD', 'CAD', 'AED', 'JPY', 'CHF']) {
            if (currStr.includes(c))
                return c;
        }
        return currStr.includes('₹') ? 'INR' : 'USD';
    }
    static async getExchangeRates() {
        const monthYear = this.getCurrentMonthYear();
        const rates = await prisma_1.prisma.exchangeRate.findMany({ where: { monthYear } });
        return rates.length === 0 ? this.syncLiveExchangeRates() : rates;
    }
    static async syncLiveExchangeRates() {
        const monthYear = this.getCurrentMonthYear();
        let liveUsdRates = {};
        try {
            const res = await fetch('https://open.er-api.com/v6/latest/USD', { signal: AbortSignal.timeout(6000) });
            if (res.ok)
                liveUsdRates = (await res.json()).rates || {};
        }
        catch { /* Fallback to defaults */ }
        const usdToInr = liveUsdRates['INR'] || DEFAULT_RATES['USD'];
        const updatedRates = [];
        for (const curr of Object.keys(DEFAULT_RATES)) {
            let rateToINR = curr === 'INR' ? 1.0 : curr === 'USD' ? usdToInr : (liveUsdRates[curr] ? parseFloat((usdToInr / liveUsdRates[curr]).toFixed(4)) : DEFAULT_RATES[curr] || 1.0);
            const existing = await prisma_1.prisma.exchangeRate.findFirst({ where: { currency: curr, monthYear } });
            const record = await prisma_1.prisma.exchangeRate.upsert({
                where: { id: existing?.id || 0 },
                update: { rateToINR, fetchedAt: new Date(), source: liveUsdRates['INR'] ? 'open.er-api.com' : 'studio-default' },
                create: { currency: curr, rateToINR, monthYear, source: liveUsdRates['INR'] ? 'open.er-api.com' : 'studio-default' },
            });
            updatedRates.push(record);
        }
        return updatedRates;
    }
    static parseFiscalYear(fy) {
        const match = (fy || '').match(/(\d{4})[-/](\d{2,4})/);
        let startYear = 2026;
        if (match)
            startYear = parseInt(match[1], 10);
        const endYear = startYear + 1;
        const shortEnd = String(endYear).slice(-2);
        return {
            startDate: `${startYear}-04-01`,
            endDate: `${endYear}-03-31`,
            fyLabel: `FY ${startYear}-${shortEnd}`,
        };
    }
    static async getBillingSummary(role, fy) {
        if (role === 'Employee')
            throw new Error('Access Denied: Employees cannot view billing financials.');
        const { startDate: fyStart, endDate: fyEnd, fyLabel } = this.parseFiscalYear(fy);
        const exchangeRates = await this.getExchangeRates();
        const rateMap = new Map(exchangeRates.map((r) => [r.currency, r.rateToINR]));
        const projects = await prisma_1.prisma.project.findMany({
            include: {
                client: true,
                dailyEntries: {
                    where: { date: { gte: fyStart, lte: fyEnd } },
                },
            },
        });
        let totalRevenueINR = 0, tmRevenueINR = 0, monthlyFixedRevenueINR = 0, projectFixedRevenueINR = 0, totalHoursLogged = 0;
        let activeProjectsInFYCount = 0;
        const isCurrentFY = fyLabel === 'FY 2026-27';
        const projectSummaries = projects.map((p) => {
            const rateVersions = Array.isArray(p.rateVersions) ? p.rateVersions : [];
            const activeVersion = rateVersions.length > 0 ? rateVersions[0] : null;
            const currency = activeVersion?.currency || p.currency || p.client.billingCurrency;
            const rateToINR = rateMap.get(this.extractCurrencyCode(currency)) || DEFAULT_RATES[this.extractCurrencyCode(currency)] || 1.0;
            const rateAmount = activeVersion ? activeVersion.rateAmount : this.parseRateAmount(p.rate);
            const bTypeRaw = p.billingType || 'T&M';
            const billingType = bTypeRaw === 'Hourly Rate (T&M)' ? 'T&M' :
                bTypeRaw === 'Monthly Resource Cost (Fixed)' || bTypeRaw === 'Monthly Res Cost (Fixed)' ? 'Fixed RC' :
                    bTypeRaw === 'Project Cost (Fixed)' ? 'Fixed PC' : bTypeRaw;
            const entriesHours = p.dailyEntries?.reduce((sum, d) => sum + (d.hours || 0), 0) || 0;
            const loggedHours = entriesHours > 0 ? entriesHours : (isCurrentFY ? (p.loggedHours || 0) : 0);
            const pStart = p.startDate || '2026-04-01';
            const pEnd = p.endDate || '2099-12-31';
            const isProjectActiveInFY = pStart <= fyEnd && pEnd >= fyStart;
            if (isProjectActiveInFY && p.status === 'Active')
                activeProjectsInFYCount++;
            totalHoursLogged += loggedHours;
            let nativeAmountBilled = 0;
            if (billingType === 'T&M' || billingType === 'Hourly Rate (T&M)') {
                nativeAmountBilled = loggedHours * rateAmount;
            }
            else if (isProjectActiveInFY) {
                nativeAmountBilled = rateAmount;
            }
            const inrAmountBilled = Math.round(nativeAmountBilled * rateToINR);
            totalRevenueINR += inrAmountBilled;
            if (billingType === 'T&M' || billingType === 'Hourly Rate (T&M)')
                tmRevenueINR += inrAmountBilled;
            else if (billingType === 'Fixed RC' || billingType === 'Monthly Resource Cost (Fixed)')
                monthlyFixedRevenueINR += inrAmountBilled;
            else if (billingType === 'Fixed PC' || billingType === 'Project Cost (Fixed)')
                projectFixedRevenueINR += inrAmountBilled;
            return {
                projectId: p.id, projectName: p.name, clientId: p.clientId, clientName: p.client.displayName || p.client.name,
                billingType, currency, rateAmount, rateFormatted: `${currency.replace(/\s*\(.*\)/, '')} ${rateAmount.toLocaleString()}`,
                budgetHours: p.budgetHours, loggedHours, nativeAmountBilled, exchangeRateToINR: rateToINR,
                inrAmountBilled, status: isProjectActiveInFY ? p.status : 'Archived', effectiveStartDate: activeVersion?.effectiveStartDate || 'Initial',
            };
        });
        return {
            totalRevenueINR, tmRevenueINR, monthlyFixedRevenueINR, projectFixedRevenueINR,
            totalHoursLogged, activeProjectsCount: activeProjectsInFYCount || (isCurrentFY ? projects.filter((p) => p.status === 'Active').length : 0),
            exchangeRates, projects: projectSummaries, activeMonthYear: fyLabel,
        };
    }
    static async getProjectRateVersions(projectId) {
        const project = await prisma_1.prisma.project.findUnique({
            where: { id: projectId },
            select: { rateVersions: true },
        });
        if (!project || !Array.isArray(project.rateVersions))
            return [];
        return project.rateVersions.sort((a, b) => b.id - a.id);
    }
    static async addProjectRateVersion(role, projectId, data) {
        if (role !== 'Super Admin')
            throw new Error('Access Denied: Only Super Admins can update rate versions.');
        const project = await prisma_1.prisma.project.findUnique({ where: { id: projectId } });
        if (!project)
            throw new Error(`Project ${projectId} not found.`);
        const existingVersions = Array.isArray(project.rateVersions)
            ? project.rateVersions
            : [];
        const updatedOldVersions = existingVersions.map((v) => !v.effectiveEndDate ? { ...v, effectiveEndDate: data.effectiveStartDate } : v);
        const newVersion = {
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
        await prisma_1.prisma.project.update({
            where: { id: projectId },
            data: { rateVersions: finalVersions },
        });
        return newVersion;
    }
    static async getProjectMonthlyBudgets(projectId) {
        const currentMonth = this.getCurrentMonthYear();
        const project = await prisma_1.prisma.project.findUnique({
            where: { id: projectId },
            select: { monthlyBudgets: true },
        });
        if (!project || !Array.isArray(project.monthlyBudgets))
            return [];
        const list = project.monthlyBudgets;
        return list
            .map((b) => ({ ...b, isLocked: b.isLocked || b.monthYear < currentMonth }))
            .sort((a, b) => b.monthYear.localeCompare(a.monthYear));
    }
    static async setProjectMonthlyBudget(role, projectId, monthYear, budgetHours) {
        if (role === 'Employee')
            throw new Error('Access Denied: Employees cannot modify budget hours.');
        const currentMonth = this.getCurrentMonthYear();
        if (monthYear < currentMonth && role !== 'Super Admin')
            throw new Error('Month has closed. Budget hours are locked.');
        const project = await prisma_1.prisma.project.findUnique({ where: { id: projectId } });
        if (!project)
            throw new Error(`Project ${projectId} not found.`);
        const existingList = Array.isArray(project.monthlyBudgets)
            ? project.monthlyBudgets
            : [];
        const existingIndex = existingList.findIndex((b) => b.monthYear === monthYear);
        const updatedEntry = {
            id: existingIndex >= 0 ? existingList[existingIndex].id : Date.now(),
            projectId,
            monthYear,
            budgetHours: Number(budgetHours),
            isLocked: monthYear < currentMonth,
            updatedAt: new Date().toISOString(),
        };
        let finalList;
        if (existingIndex >= 0) {
            finalList = [...existingList];
            finalList[existingIndex] = updatedEntry;
        }
        else {
            finalList = [updatedEntry, ...existingList];
        }
        const updateData = { monthlyBudgets: finalList };
        if (monthYear === currentMonth) {
            updateData.budgetHours = Math.round(Number(budgetHours));
        }
        await prisma_1.prisma.project.update({
            where: { id: projectId },
            data: updateData,
        });
        return updatedEntry;
    }
}
exports.BillingService = BillingService;
