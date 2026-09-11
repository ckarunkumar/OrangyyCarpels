export interface EmployeeProfile {
  employeeId: string; id?: string; fullName: string; dob?: string; designation: string;
  department: string; email: string; personalEmail?: string; phone: string; secondaryPhone?: string;
  permanentAddress?: string; gender?: string; guardianName?: string; motherName?: string; bloodGroup?: string;
  linkedInUrl?: string; aadhaarNumber?: string; panNumber?: string; costRate: string; capacity: string;
  joiningDate?: string; relievingDate?: string; status: 'Active' | 'Inactive';
  role: 'Super Admin' | 'Project Manager' | 'Employee'; location?: string; avatar?: string | null;
  password?: string | null;
  education: Array<{ degree: string; school: string; year: string }>;
  experience: Array<{ company: string; role: string; period: string }>;
  assignedProjectsCount?: number;
  assignedProjects?: Array<{ id: string; name: string; status: string }>;
}


export interface ProjectDetail {
  id: string; name: string;
  billingType: 'T&M' | 'Fixed RC' | 'Fixed PC' | 'Hourly Rate (T&M)' | 'Monthly Resource Cost (Fixed)' | 'Monthly Res Cost (Fixed)' | 'Project Cost (Fixed)';
  rate: string; businessLine?: string; service?: string; startDate?: string; endDate?: string;
  budgetHours: number; loggedHours: number; status: 'Active' | 'Inactive';
  managerId?: string; managerName?: string; assignedEmployees?: string[];
}

export interface ProjectWithClient extends ProjectDetail {
  clientId: string; clientName: string; clientCurrency: string;
}

export interface ClientProfile {
  id: string; name: string; legalName?: string; displayName?: string;
  contactPerson?: string; email?: string; phone?: string;
  accountsPerson?: string; accountsEmail?: string; accountsPhone?: string;
  address?: string; country?: string;
  cinNumber?: string; gstNumber?: string; panNumber?: string; msmeNumber?: string;
  billingCurrency: string; defaultBillingType: string; dueTime?: string;
  status: 'Active' | 'Inactive'; projects: ProjectDetail[];
}

export interface RateVersionRecord {
  id: number; projectId: string; billingType: string; rateAmount: number;
  currency: string; effectiveStartDate: string; effectiveEndDate?: string;
  notes?: string; createdAt: string;
}

export type RateHistoryRecord = RateVersionRecord;
