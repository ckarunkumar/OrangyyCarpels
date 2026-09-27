"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const prisma_1 = require("../lib/prisma");
class SettingsService {
    static async getOrCreateSetting() {
        let setting = await prisma_1.prisma.studioSetting.findUnique({ where: { id: 'default' } });
        if (!setting) {
            setting = await prisma_1.prisma.studioSetting.create({
                data: {
                    id: 'default',
                    studioName: 'Orangyy Design Studio',
                    legalName: 'Orangyy Design Private Limited',
                    contactEmail: 'admin@orangy.design',
                    studioDomain: 'orangy.design',
                    standardCapacity: '40',
                    timezone: 'Asia/Kolkata (IST +5:30)',
                    approvalWorkflow: 'Two-Step (PM -> Super Admin Lock)',
                    defaultCurrency: 'USD ($)',
                    defaultPaymentTerms: '30 days',
                    defaultBillingType: 'T&M',
                },
            });
        }
        return setting;
    }
    static async getStudioIdentity() {
        const s = await this.getOrCreateSetting();
        return {
            studioName: s.studioName,
            legalName: s.legalName,
            contactEmail: s.contactEmail,
            studioDomain: s.studioDomain,
            updatedAt: s.updatedAt,
        };
    }
    static async updateStudioIdentity(role, data) {
        if (role !== 'Super Admin')
            throw new Error('Access Denied: Super Admin only.');
        await this.getOrCreateSetting();
        return prisma_1.prisma.studioSetting.update({
            where: { id: 'default' },
            data: {
                ...(data.studioName !== undefined && { studioName: data.studioName }),
                ...(data.legalName !== undefined && { legalName: data.legalName }),
                ...(data.contactEmail !== undefined && { contactEmail: data.contactEmail }),
                ...(data.studioDomain !== undefined && { studioDomain: data.studioDomain }),
            },
        });
    }
    static async getConfigurations() {
        const s = await this.getOrCreateSetting();
        return {
            operational: {
                standardCapacity: s.standardCapacity,
                timezone: s.timezone,
                approvalWorkflow: s.approvalWorkflow,
            },
            currencyBilling: {
                defaultCurrency: s.defaultCurrency,
                defaultPaymentTerms: s.defaultPaymentTerms,
                defaultBillingType: s.defaultBillingType,
            },
            updatedAt: s.updatedAt,
        };
    }
    static async updateConfigurations(role, data) {
        if (role !== 'Super Admin')
            throw new Error('Access Denied: Super Admin only.');
        await this.getOrCreateSetting();
        const updateData = {};
        if (data.operational) {
            if (data.operational.standardCapacity !== undefined)
                updateData.standardCapacity = data.operational.standardCapacity;
            if (data.operational.timezone !== undefined)
                updateData.timezone = data.operational.timezone;
            if (data.operational.approvalWorkflow !== undefined)
                updateData.approvalWorkflow = data.operational.approvalWorkflow;
        }
        if (data.currencyBilling) {
            if (data.currencyBilling.defaultCurrency !== undefined)
                updateData.defaultCurrency = data.currencyBilling.defaultCurrency;
            if (data.currencyBilling.defaultPaymentTerms !== undefined)
                updateData.defaultPaymentTerms = data.currencyBilling.defaultPaymentTerms;
            if (data.currencyBilling.defaultBillingType !== undefined)
                updateData.defaultBillingType = data.currencyBilling.defaultBillingType;
        }
        return prisma_1.prisma.studioSetting.update({
            where: { id: 'default' },
            data: updateData,
        });
    }
}
exports.SettingsService = SettingsService;
