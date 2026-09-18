export interface ExchangeRateInfo {
  id?: number;
  currency: string;
  rateToINR: number;
  monthYear: string;
  isLocked: boolean;
  source: string;
  fetchedAt: Date;
}

export interface ProjectBillingSummary {
  projectId: string;
  projectCode: string;
  projectName: string;
  clientId: string;
  clientName: string;
  startDate: string;
  endDate: string;
  billingType: 'T&M' | 'Resources Cost (Fix)' | 'Project Cost (Fix)' | 'Fixed RC' | 'Fixed PC' | 'Hourly Rate (T&M)' | 'Monthly Resource Cost (Fixed)' | 'Project Cost (Fixed)';
  billingModel: 'T&M' | 'Resources Cost (Fix)' | 'Project Cost (Fix)';
  currency: string;
  rateAmount: number;
  rateFormatted: string;
  budgetHours: number;
  loggedHours: number;
  hoursBurnedPercent: number;
  nativeAmountBilled: number;
  exchangeRateToINR: number;
  inrAmountBilled: number;
  status: string;
  effectiveStartDate: string;
}

export interface ClientBillingSummary {
  clientId: string;
  clientName: string;
  billingMethod: string;
  billingCurrency: string;
  totalProjects: number;
  totalRevenueINR: number;
  tmRevenueINR: number;
  monthlyFixedRevenueINR: number;
  projectFixedRevenueINR: number;
  totalHoursLogged: number;
}

export interface BillingOverview {
  totalRevenueINR: number;
  tmRevenueINR: number;
  monthlyFixedRevenueINR: number;
  projectFixedRevenueINR: number;
  totalHoursLogged: number;
  activeProjectsCount: number;
  activeMonthYear: string;
  periodType: string;
  selectedMonth: string;
  selectedFY: string;
  exchangeRates: ExchangeRateInfo[];
  clients: ClientBillingSummary[];
  projects: ProjectBillingSummary[];
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
