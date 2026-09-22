"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingService = void 0;
const prisma_1 = require("../lib/prisma");
const billingSummaryService_1 = require("./billingSummaryService");
const fxRateService_1 = require("./fxRateService");
__exportStar(require("./billingTypes"), exports);
class BillingService {
    static getCurrentMonthYear() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
    static async getExchangeRates() {
        return fxRateService_1.FxRateService.getCurrentRates('INR');
    }
    static async syncLiveExchangeRates() {
        return fxRateService_1.FxRateService.syncLiveExchangeRates('INR');
    }
    static async getBillingSummary(role, fy, month, periodType, clientId) {
        return billingSummaryService_1.BillingSummaryService.getSummary(role, fy, month, periodType, clientId);
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
