"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingSummaryService = void 0;
const prisma_1 = require("../lib/prisma");
const billingCalculator_1 = require("./billingCalculator");
class BillingSummaryService {
    static async getSummary(role, fy, month, periodTypeParam, clientIdFilter) {
        if (role !== 'Super Admin' && role !== 'Project Manager') {
            throw new Error('Access Denied: You do not have permission to view billing financials.');
        }
        const periodType = (periodTypeParam || 'yearly').toLowerCase() === 'monthly' ? 'monthly' : 'yearly';
        const { startDate: fyStart, endDate: fyEnd, fyLabel } = billingCalculator_1.BillingCalculator.parseFiscalYear(fy);
        const startYear = parseInt(fyStart.slice(0, 4), 10);
        const { startDate: mStart, endDate: mEnd, monthLabel, monthYearKey } = billingCalculator_1.BillingCalculator.parseMonth(month, startYear);
        const rangeStart = periodType === 'monthly' ? mStart : fyStart;
        const rangeEnd = periodType === 'monthly' ? mEnd : fyEnd;
        const allRates = await prisma_1.prisma.exchangeRate.findMany();
        const monthRates = allRates.filter(r => r.monthYear === monthYearKey);
        const activeRates = (periodType === 'monthly' && monthRates.length > 0) ? monthRates : allRates;
        const rateMap = new Map(activeRates.map(r => [r.currency, r.rateToINR]));
        const projectsRaw = await prisma_1.prisma.project.findMany({
            where: clientIdFilter ? { clientId: clientIdFilter } : undefined,
            include: {
                client: true,
                dailyEntries: {
                    where: { date: { gte: rangeStart, lte: rangeEnd } },
                },
            },
        });
        let totalRevenueINR = 0, tmRevenueINR = 0, monthlyFixedRevenueINR = 0, projectFixedRevenueINR = 0;
        let totalHoursLogged = 0, activeProjectsCount = 0;
        const projectSummaries = [];
        for (const p of projectsRaw) {
            const pStartNorm = billingCalculator_1.BillingCalculator.normalizeDate(p.startDate);
            const pEndNorm = billingCalculator_1.BillingCalculator.normalizeDate(p.endDate);
            const isActiveInPeriod = billingCalculator_1.BillingCalculator.isProjectActiveInRange(pStartNorm, pEndNorm, rangeStart, rangeEnd);
            const rateVersions = Array.isArray(p.rateVersions) ? p.rateVersions : [];
            const activeVersion = rateVersions.length > 0 ? rateVersions[0] : null;
            const currency = activeVersion?.currency || p.currency || p.client.billingCurrency || 'USD';
            const currCode = billingCalculator_1.BillingCalculator.extractCurrencyCode(currency);
            const rateToINR = rateMap.get(currCode) || billingCalculator_1.DEFAULT_RATES[currCode] || 1.0;
            const rateAmount = activeVersion ? activeVersion.rateAmount : billingCalculator_1.BillingCalculator.parseRateAmount(p.rate);
            const bTypeRaw = p.billingType || p.client.defaultBillingType || 'T&M';
            const billingModel = bTypeRaw.includes('T&M') || bTypeRaw.includes('Hourly') ? 'T&M' :
                bTypeRaw.includes('RC') || bTypeRaw.includes('Resource') || bTypeRaw.includes('Retainer') ? 'Fixed RC' : 'Fixed PC';
            const entriesHours = p.dailyEntries?.reduce((sum, d) => sum + (d.hours || 0), 0) || 0;
            let loggedHours = entriesHours;
            if (loggedHours === 0 && isActiveInPeriod && periodType === 'yearly') {
                loggedHours = p.loggedHours || 0;
            }
            let nativeAmountBilled = 0;
            if (billingModel === 'T&M') {
                nativeAmountBilled = loggedHours * rateAmount;
            }
            else if (billingModel === 'Fixed RC' || billingModel === 'Fixed PC') {
                if (isActiveInPeriod)
                    nativeAmountBilled = rateAmount;
            }
            const inrAmountBilled = Math.round(nativeAmountBilled * rateToINR);
            const isVisible = isActiveInPeriod || inrAmountBilled > 0 || loggedHours > 0;
            if (!isVisible)
                continue;
            totalRevenueINR += inrAmountBilled;
            totalHoursLogged += loggedHours;
            if (p.status === 'Active')
                activeProjectsCount++;
            if (billingModel === 'T&M')
                tmRevenueINR += inrAmountBilled;
            else if (billingModel === 'Fixed RC')
                monthlyFixedRevenueINR += inrAmountBilled;
            else if (billingModel === 'Fixed PC')
                projectFixedRevenueINR += inrAmountBilled;
            const budgetHours = p.budgetHours || 0;
            const hoursBurnedPercent = budgetHours > 0 ? Math.min(100, Math.round((loggedHours / budgetHours) * 100)) : 0;
            projectSummaries.push({
                projectId: p.id,
                projectCode: p.id,
                projectName: p.name,
                clientId: p.clientId,
                clientName: p.client.displayName || p.client.name,
                startDate: billingCalculator_1.BillingCalculator.formatDisplayDate(p.startDate),
                endDate: billingCalculator_1.BillingCalculator.formatDisplayDate(p.endDate),
                billingType: bTypeRaw,
                billingModel,
                currency,
                rateAmount,
                rateFormatted: `${currency.replace(/\s*\(.*\)/, '')} ${rateAmount.toLocaleString()}`,
                budgetHours,
                loggedHours,
                hoursBurnedPercent,
                nativeAmountBilled,
                exchangeRateToINR: rateToINR,
                inrAmountBilled,
                status: p.status,
                effectiveStartDate: activeVersion?.effectiveStartDate || p.startDate || '—',
            });
        }
        // Client summaries
        const clientMap = new Map();
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
                    monthlyFixedRevenueINR: proj.billingModel === 'Fixed RC' ? proj.inrAmountBilled : 0,
                    projectFixedRevenueINR: proj.billingModel === 'Fixed PC' ? proj.inrAmountBilled : 0,
                    totalHoursLogged: proj.loggedHours,
                });
            }
            else {
                existing.totalProjects += 1;
                existing.totalRevenueINR += proj.inrAmountBilled;
                existing.totalHoursLogged += proj.loggedHours;
                if (proj.billingModel === 'T&M')
                    existing.tmRevenueINR += proj.inrAmountBilled;
                if (proj.billingModel === 'Fixed RC')
                    existing.monthlyFixedRevenueINR += proj.inrAmountBilled;
                if (proj.billingModel === 'Fixed PC')
                    existing.projectFixedRevenueINR += proj.inrAmountBilled;
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
exports.BillingSummaryService = BillingSummaryService;
