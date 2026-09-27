import React from 'react';
import { UserCheck, User, ChevronDown } from 'lucide-react';
import { Client, Employee, ClientUser } from '../../types/registry';
import ProjectMonthlyBudgetAllocator from './ProjectMonthlyBudgetAllocator';

const CURRENCIES = ['USD ($)', 'INR (₹)', 'EUR (€)', 'GBP (£)', 'SGD ($)', 'AUD ($)', 'CAD ($)', 'AED (د.إ)', 'JPY (¥)', 'CHF (Fr.)'];

interface ProjectFormInfoSectionProps {
  mode: 'add' | 'edit';
  projectId: string; setProjectId: (v: string) => void;
  name: string; setName: (v: string) => void;
  clientId: string; handleClientChange: (v: string) => void;
  clients: Client[]; defaultClientId?: string;
  status: 'Active' | 'Inactive'; setStatus: (v: 'Active' | 'Inactive') => void;
  isSA: boolean; managerId: string; setManagerId: (v: string) => void; pmEmployees: Employee[];
  clientUsers: ClientUser[]; clientContactPersonId: string; setClientContactPersonId: (v: string) => void;
  billingType: string; setBillingType: (v: string) => void;
  rateAmount: string; setRateAmount: (v: string) => void; getRateLabel: () => string;
  currency: string; setCurrency: (v: string) => void;
  startDate: string; setStartDate: (v: string) => void;
  endDate: string; setEndDate: (v: string) => void;
  isHourly: boolean; budgetType: 'Monthly' | 'Total Project'; setBudgetType: (v: 'Monthly' | 'Total Project') => void;
  budgetHours: string; handleBudgetHoursChange: (v: string) => void;
  allocatedHoursList: number[]; setAllocatedHoursList: React.Dispatch<React.SetStateAction<number[]>>;
  inputRef?: any;
}

export default function ProjectFormInfoSection({
  mode, projectId, setProjectId, name, setName, clientId, handleClientChange,
  clients, defaultClientId, status, setStatus, isSA, managerId, setManagerId, pmEmployees,
  clientUsers, clientContactPersonId, setClientContactPersonId,
  billingType, setBillingType, rateAmount, setRateAmount, getRateLabel,
  currency, setCurrency, startDate, setStartDate, endDate, setEndDate,
  isHourly, budgetType, setBudgetType, budgetHours, handleBudgetHoursChange,
  allocatedHoursList, setAllocatedHoursList, inputRef
}: ProjectFormInfoSectionProps) {
  const inputCls = "w-full px-3 py-2 border border-studio-border hover:border-studio-muted/60 rounded-md text-[12.5px] text-studio-text bg-white focus:outline-none focus:border-brand-orange transition-colors";
  const labelCls = "block text-[11px] font-medium text-studio-muted mb-1";

  return (
    <div className="space-y-3">
      <h3 className="text-[13px] font-bold text-studio-text uppercase tracking-wider pb-1.5 border-b border-studio-border/70">1. Project Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
        <div><label className="block text-[11px] font-bold text-brand-orange mb-1">Project ID *</label><input type="text" placeholder="PC0001" disabled={mode === 'edit'} value={projectId} onChange={(e) => setProjectId(e.target.value)} className={`${inputCls} font-mono uppercase font-semibold ${mode === 'edit' ? 'bg-studio-sidebar opacity-75' : ''}`} /></div>
        <div>
          <label className={labelCls}>Client * {defaultClientId && <span className="text-[10px] text-brand-orange font-semibold ml-1">(Current Client)</span>}</label>
          <div className="relative">
            <select value={clientId} disabled={!!defaultClientId} onChange={(e) => handleClientChange(e.target.value)} className={`${inputCls} appearance-none pr-8 ${defaultClientId ? 'bg-studio-sidebar/70 opacity-90 cursor-not-allowed' : ''}`}>
              {clients.map((c) => (<option key={c.id} value={c.id}>{c.displayName || c.name}</option>))}
            </select>
            <ChevronDown className="w-4 h-4 text-studio-muted pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>
        <div>
          <label className={labelCls}>Status</label>
          <div className="relative">
            <select value={status} onChange={(e) => setStatus(e.target.value as any)} className={`${inputCls} appearance-none pr-8`}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <ChevronDown className="w-4 h-4 text-studio-muted pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <div><label className={labelCls}>Project Name *</label><input ref={inputRef} type="text" placeholder="e.g. Design System V2" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} /></div>
        
        {isSA ? (
          <div>
            <label className="flex items-center gap-1 text-[11px] font-bold text-studio-text mb-1"><UserCheck className="w-3.5 h-3.5 text-brand-orange" /> Assign PM</label>
            <div className="relative">
              <select value={managerId} onChange={(e) => setManagerId(e.target.value)} className={`${inputCls} appearance-none pr-8`}>
                <option value="">-- Select PM --</option>
                {pmEmployees.map((emp) => (<option key={emp.employeeId} value={emp.employeeId}>{emp.fullName}</option>))}
              </select>
              <ChevronDown className="w-4 h-4 text-studio-muted pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        ) : <div />}

        <div>
          <label className="flex items-center gap-1 text-[11px] font-bold text-studio-text mb-1"><User className="w-3.5 h-3.5 text-blue-600" /> Client Contact Person</label>
          <div className="relative">
            <select value={clientContactPersonId} onChange={(e) => setClientContactPersonId(e.target.value)} className={`${inputCls} appearance-none pr-8`}>
              <option value="">-- Select Client Contact Person --</option>
              {clientUsers.map((cu) => (<option key={cu.id} value={cu.id}>{cu.name} ({cu.email})</option>))}
            </select>
            <ChevronDown className="w-4 h-4 text-studio-muted pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <div>
          <label className={labelCls}>Billing Type</label>
          <div className="relative">
            <select value={billingType} onChange={(e) => setBillingType(e.target.value)} className={`${inputCls} appearance-none pr-8`}>
              <option value="T&M">T&M</option>
              <option value="Resources Cost (Fix)">Resources Cost (Fix)</option>
              <option value="Project Cost (Fix)">Project Cost (Fix)</option>
            </select>
            <ChevronDown className="w-4 h-4 text-studio-muted pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <div><label className={labelCls}>{getRateLabel()}</label><input type="number" placeholder="50" value={rateAmount} onChange={(e) => setRateAmount(e.target.value)} className={inputCls} /></div>
        <div>
          <label className={labelCls}>Currency</label>
          <div className="relative">
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={`${inputCls} appearance-none pr-8`}>
              {CURRENCIES.map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
            <ChevronDown className="w-4 h-4 text-studio-muted pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>
        <div><label className={labelCls}>Start Date *</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} /></div>

        <div><label className={labelCls}>End Date</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} /></div>
        {isHourly && (
          <>
            <div>
              <label className={labelCls}>Budget Type</label>
              <div className="relative">
                <select value={budgetType} onChange={(e) => setBudgetType(e.target.value as any)} className={`${inputCls} appearance-none pr-8`}>
                  <option value="Monthly">Monthly Budget</option>
                  <option value="Total Project">Total Project Budget</option>
                </select>
                <ChevronDown className="w-4 h-4 text-studio-muted pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
            <div>
              <label className={labelCls}>{budgetType === 'Total Project' ? 'Total Project Budget Hours *' : 'Monthly Budget Hours *'}</label>
              <input type="number" placeholder="100" value={budgetHours} onChange={(e) => handleBudgetHoursChange(e.target.value)} className={inputCls} />
            </div>
            {budgetType === 'Total Project' && (
              <ProjectMonthlyBudgetAllocator
                startDate={startDate}
                totalBudgetHours={Number(budgetHours) || 0}
                allocatedHoursList={allocatedHoursList}
                onChange={setAllocatedHoursList}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
