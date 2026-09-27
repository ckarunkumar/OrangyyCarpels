import { prisma } from '../lib/prisma';

export interface StudioIdentityData {
  studioName?: string;
  legalName?: string;
  contactEmail?: string;
  studioDomain?: string;
}

export interface OperationalStandardsData {
  standardCapacity?: string;
  timezone?: string;
  approvalWorkflow?: string;
}

export interface CurrencyBillingData {
  defaultCurrency?: string;
  defaultPaymentTerms?: string;
  defaultBillingType?: string;
}

export class SettingsService {
  private static async getOrCreateSetting() {
    let setting = await prisma.studioSetting.findUnique({ where: { id: 'default' } });
    if (!setting) {
      setting = await prisma.studioSetting.create({
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

  static async updateStudioIdentity(role: string, data: StudioIdentityData) {
    if (role !== 'Super Admin') throw new Error('Access Denied: Super Admin only.');
    await this.getOrCreateSetting();
    return prisma.studioSetting.update({
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

  static async updateConfigurations(
    role: string,
    data: { operational?: OperationalStandardsData; currencyBilling?: CurrencyBillingData }
  ) {
    if (role !== 'Super Admin') throw new Error('Access Denied: Super Admin only.');
    await this.getOrCreateSetting();
    const updateData: any = {};
    if (data.operational) {
      if (data.operational.standardCapacity !== undefined) updateData.standardCapacity = data.operational.standardCapacity;
      if (data.operational.timezone !== undefined) updateData.timezone = data.operational.timezone;
      if (data.operational.approvalWorkflow !== undefined) updateData.approvalWorkflow = data.operational.approvalWorkflow;
    }
    if (data.currencyBilling) {
      if (data.currencyBilling.defaultCurrency !== undefined) updateData.defaultCurrency = data.currencyBilling.defaultCurrency;
      if (data.currencyBilling.defaultPaymentTerms !== undefined) updateData.defaultPaymentTerms = data.currencyBilling.defaultPaymentTerms;
      if (data.currencyBilling.defaultBillingType !== undefined) updateData.defaultBillingType = data.currencyBilling.defaultBillingType;
    }
    return prisma.studioSetting.update({
      where: { id: 'default' },
      data: updateData,
    });
  }
}
