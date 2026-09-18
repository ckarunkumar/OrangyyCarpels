"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimesheetPmSummaryService = void 0;
const prisma_1 = require("../lib/prisma");
const billingCalculator_1 = require("./billingCalculator");
const timesheetService_1 = require("./timesheetService");
class TimesheetPmSummaryService {
    static async getPmSummary(role, userId, fy, fromDate, toDate, clientIdFilter, scopeParam) {
        const isSelfScope = role === 'Employee' || scopeParam === 'self';
        const { startDate: fyStart, endDate: fyEnd, fyLabel } = billingCalculator_1.BillingCalculator.parseFiscalYear(fy);
        const rangeStart = fromDate ? billingCalculator_1.BillingCalculator.normalizeDate(fromDate) : fyStart;
        const rangeEnd = toDate ? billingCalculator_1.BillingCalculator.normalizeDate(toDate) : fyEnd;
        const hasDateFilter = Boolean(fromDate && toDate);
        const [allProjects, allClients, employees] = await Promise.all([
            prisma_1.prisma.project.findMany({
                include: {
                    client: true,
                    dailyEntries: { where: { date: { gte: rangeStart, lte: rangeEnd } } },
                },
            }),
            prisma_1.prisma.client.findMany({ include: { projects: true } }),
            prisma_1.prisma.employee.findMany(),
        ]);
        const emp = employees.find(e => e.employeeId.toLowerCase() === (userId || '').toLowerCase() ||
            e.fullName.toLowerCase() === (userId || '').toLowerCase() ||
            e.email.toLowerCase() === (userId || '').toLowerCase());
        const curEmpId = (emp?.employeeId || userId || '').toLowerCase();
        const curEmpName = (emp?.fullName || '').toLowerCase();
        const isAssigned = (p) => {
            if (role === 'Super Admin' && !isSelfScope)
                return true;
            const assigned = (p.assignedEmployees || '').split(',').map((s) => s.trim().toLowerCase());
            if (isSelfScope)
                return Boolean((curEmpId && assigned.includes(curEmpId)) || (curEmpName && assigned.includes(curEmpName)));
            const mgr = (p.managerId || '').toLowerCase().trim();
            const mgrName = (p.managerName || '').toLowerCase().trim();
            if (curEmpId && (mgr === curEmpId || mgrName === curEmpName || mgrName.includes(curEmpName)))
                return true;
            return Boolean((curEmpId && assigned.includes(curEmpId)) || (curEmpName && assigned.includes(curEmpName)));
        };
        let tmHours = 0, retainerHours = 0, fixedHours = 0, totalHours = 0, activeProjectsCount = 0;
        const assignedProjects = allProjects.filter(p => isAssigned(p));
        const projectSummaries = [];
        for (const p of assignedProjects) {
            if (clientIdFilter && p.clientId !== clientIdFilter)
                continue;
            const pStartNorm = billingCalculator_1.BillingCalculator.normalizeDate(p.startDate);
            const pEndNorm = billingCalculator_1.BillingCalculator.normalizeDate(p.endDate);
            const isActiveInPeriod = billingCalculator_1.BillingCalculator.isProjectActiveInRange(pStartNorm, pEndNorm, rangeStart, rangeEnd);
            const relevantEntries = isSelfScope
                ? (p.dailyEntries || []).filter(d => {
                    const eid = (d.employeeId || '').toLowerCase();
                    return eid === curEmpId || eid === curEmpName;
                })
                : (p.dailyEntries || []);
            const entriesHours = relevantEntries.reduce((sum, d) => sum + (d.hours || 0), 0);
            let projectHours = entriesHours;
            if (!isActiveInPeriod && entriesHours === 0)
                continue;
            if (hasDateFilter && projectHours === 0)
                continue;
            if (projectHours === 0 && !hasDateFilter && isActiveInPeriod && !isSelfScope) {
                projectHours = p.loggedHours || 0;
            }
            const bTypeRaw = p.billingType || p.client?.defaultBillingType || 'T&M';
            const billingModel = bTypeRaw.includes('T&M') || bTypeRaw.includes('Hourly') ? 'T&M' :
                bTypeRaw.includes('RC') || bTypeRaw.includes('Resource') || bTypeRaw.includes('Retainer') ? 'Resources Cost (Fix)' : 'Project Cost (Fix)';
            if (p.status === 'Active')
                activeProjectsCount++;
            totalHours += projectHours;
            if (billingModel === 'T&M')
                tmHours += projectHours;
            else if (billingModel === 'Resources Cost (Fix)')
                retainerHours += projectHours;
            else if (billingModel === 'Project Cost (Fix)')
                fixedHours += projectHours;
            const budgetHours = (0, timesheetService_1.getMonthlyBudgetHours)(p);
            const hoursBurnedPercent = budgetHours > 0 ? Math.min(100, Math.round((projectHours / budgetHours) * 100)) : 0;
            projectSummaries.push({
                projectId: p.id,
                projectCode: p.id,
                projectName: p.name,
                clientId: p.clientId,
                clientName: p.client?.displayName || p.client?.name || p.clientId,
                startDate: billingCalculator_1.BillingCalculator.formatDisplayDate(p.startDate),
                endDate: billingCalculator_1.BillingCalculator.formatDisplayDate(p.endDate),
                billingModel,
                budgetHours,
                loggedHours: projectHours,
                hoursBurnedPercent,
                status: p.status,
                totalLoggedHours: projectHours,
            });
        }
        const clientSummaries = [];
        for (const c of allClients) {
            const activeStudioProjects = (c.projects || []).filter(p => {
                const pStartNorm = billingCalculator_1.BillingCalculator.normalizeDate(p.startDate);
                const pEndNorm = billingCalculator_1.BillingCalculator.normalizeDate(p.endDate);
                return billingCalculator_1.BillingCalculator.isProjectActiveInRange(pStartNorm, pEndNorm, rangeStart, rangeEnd);
            });
            const myActiveProjectsForClient = assignedProjects.filter(p => {
                if (p.clientId !== c.id)
                    return false;
                const pStartNorm = billingCalculator_1.BillingCalculator.normalizeDate(p.startDate);
                const pEndNorm = billingCalculator_1.BillingCalculator.normalizeDate(p.endDate);
                const isActive = billingCalculator_1.BillingCalculator.isProjectActiveInRange(pStartNorm, pEndNorm, rangeStart, rangeEnd);
                const hasEntries = (p.dailyEntries || []).some(d => {
                    if (isSelfScope) {
                        const eid = (d.employeeId || '').toLowerCase();
                        return eid === curEmpId || eid === curEmpName;
                    }
                    return true;
                });
                return isActive || hasEntries;
            });
            const assignedCount = myActiveProjectsForClient.length;
            if (assignedCount === 0)
                continue;
            let clientHours = 0;
            for (const p of myActiveProjectsForClient) {
                const relevantEntries = isSelfScope
                    ? (p.dailyEntries || []).filter(d => {
                        const eid = (d.employeeId || '').toLowerCase();
                        return eid === curEmpId || eid === curEmpName;
                    })
                    : (p.dailyEntries || []);
                const sum = relevantEntries.reduce((acc, d) => acc + (d.hours || 0), 0);
                clientHours += sum > 0 ? sum : (!hasDateFilter && !isSelfScope ? (p.loggedHours || 0) : 0);
            }
            if (hasDateFilter && clientHours === 0)
                continue;
            const defaultBType = c.defaultBillingType || (myActiveProjectsForClient[0]?.billingType) || 'T&M';
            const billingMethod = defaultBType.includes('T&M') || defaultBType.includes('Hourly') ? 'T & M' :
                defaultBType.includes('RC') || defaultBType.includes('Resource') || defaultBType.includes('Retainer') ? 'Resources Cost (Fix)' : 'Project Cost (Fix)';
            clientSummaries.push({
                clientId: c.id,
                clientName: c.displayName || c.name,
                billingMethod,
                totalProjects: activeStudioProjects.length || assignedCount,
                assignedProjects: assignedCount,
                totalLoggedHours: clientHours,
            });
        }
        return {
            tmHours, retainerHours, fixedHours, totalHours, activeProjectsCount,
            selectedFY: fyLabel, fromDate, toDate, hasDateFilter,
            clients: clientSummaries, projects: projectSummaries,
        };
    }
}
exports.TimesheetPmSummaryService = TimesheetPmSummaryService;
