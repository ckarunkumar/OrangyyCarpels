export interface Client {
  id: string;
  name: string;
  legalName?: string;
  displayName?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  accountsPerson?: string;
  accountsEmail?: string;
  accountsPhone?: string;
  address?: string;
  country?: string;
  cinNumber?: string;
  gstNumber?: string;
  panNumber?: string;
  msmeNumber?: string;
  billingCurrency: string;
  defaultBillingType?: 'T&M' | 'Fixed RC' | 'Fixed PC' | 'Hourly Rate (T&M)' | 'Monthly Res Cost (Fixed)' | 'Project Cost (Fixed)' | string;
  dueTime?: '15 days' | '30 days' | '45 days' | '60 days' | '90 days' | string;
  status: 'Active' | 'Inactive';
  projects?: Array<{
    id: string;
    name: string;
    billingType: string;
    rate: string;
    budgetHours: number;
    loggedHours: number;
    status: 'Active' | 'Inactive';
  }>;
}

export interface Employee {
  employeeId: string;
  id?: string;
  fullName: string;
  dob?: string;
  designation: string;
  department: string;
  email: string;
  personalEmail?: string;
  phone: string;
  secondaryPhone?: string;
  permanentAddress?: string;
  gender?: string;
  guardianName?: string;
  motherName?: string;
  bloodGroup?: string;
  linkedInUrl?: string;
  aadhaarNumber?: string;
  panNumber?: string;
  bankName?: string;
  branchName?: string;
  ifscCode?: string;
  accountNumber?: string;
  accountHolderName?: string;
  accountType?: string;
  upiId?: string;
  joiningDate?: string;
  relievingDate?: string;
  status: 'Active' | 'Inactive';
  role: 'Super Admin' | 'Project Manager' | 'Employee';
  location?: string;
  avatar?: string | null;
  education?: Array<{ degree: string; school: string; year: string }>;
  experience?: Array<{ company: string; role: string; period: string }>;
  assignedProjectsCount?: number;
  assignedProjects?: Array<{ id: string; name: string; status: string }>;
}

export interface Project {
  id: string;
  name: string;
  clientId: string;
  clientName?: string;
  billingType: string;
  rate: string;
  currency?: string;
  clientCurrency?: string;
  businessLine?: string;
  service?: string;
  startDate?: string;
  endDate?: string;
  budgetHours?: number;
  budgetType?: 'Monthly' | 'Total Project';
  loggedHours?: number;
  status: 'Active' | 'Inactive';
  managerId?: string;
  managerName?: string;
  assignedEmployees?: string[];
  clientContactPersonId?: string;
  clientContactPersonName?: string;
  monthlyBudgets?: Array<{ monthYear: string; budgetHours: number; isLocked?: boolean }>;
}

export interface ClientUser {
  id: string;
  name: string;
  username: string;
  email: string;
  phone?: string;
  status: 'Active' | 'Inactive';
  clientId: string;
  client?: {
    id: string;
    name: string;
    displayName?: string;
  };
  projects?: Array<{
    id: number;
    projectId: string;
    project: {
      id: string;
      name: string;
      status: string;
    };
  }>;
  createdAt?: string;
  updatedAt?: string;
}
