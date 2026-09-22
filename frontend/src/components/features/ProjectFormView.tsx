import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Project, Client, Employee, ClientUser } from '../../types/registry';
import { UserRole } from '../ui/Layout';
import Breadcrumbs from '../ui/Breadcrumbs';
import { computeMonthlyBreakdown } from './ProjectMonthlyBudgetAllocator';
import ProjectFormInfoSection from './ProjectFormInfoSection';
import ProjectFormBLSection from './ProjectFormBLSection';

interface ProjectFormViewProps {
  mode: 'add' | 'edit'; project: Project | null; clients: Client[]; employees?: Employee[];
  activeRole?: UserRole; defaultClientId?: string; clientContextName?: string;
  onBack: () => void; onSaved: (msg?: string) => void;
}

export default function ProjectFormView({ mode, project, clients, employees = [], activeRole, defaultClientId, clientContextName, onBack, onSaved }: ProjectFormViewProps) {
  const isSA = activeRole === 'Super Admin';
  const [projectId, setProjectId] = useState(''); const [name, setName] = useState(''); const [clientId, setClientId] = useState('');
  const [clientUsers, setClientUsers] = useState<ClientUser[]>([]);
  const [clientContactPersonId, setClientContactPersonId] = useState('');
  const [selectedBLs, setSelectedBLs] = useState<string[]>([]);
  const [blInventory, setBlInventory] = useState<Array<{ id: number; name: string; services: Array<{ id: number; name: string }> }>>([]);
  const [billingType, setBillingType] = useState<string>('T&M'); const [rateAmount, setRateAmount] = useState('50');
  const [currency, setCurrency] = useState('USD ($)'); const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(''); const [budgetHours, setBudgetHours] = useState('100');
  const [budgetType, setBudgetType] = useState<'Monthly' | 'Total Project'>('Monthly');
  const [allocatedHoursList, setAllocatedHoursList] = useState<number[]>([]);
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [managerId, setManagerId] = useState(''); const [assignedEmployees, setAssignedEmployees] = useState<string[]>([]);
  const [saving, setSaving] = useState(false); const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const normalizeBType = (bt?: string) => (!bt || bt === 'Hourly Rate (T&M)' || bt === 'T&M') ? 'T&M' : (bt?.includes('Monthly') || bt?.includes('RC') || bt?.includes('Resources')) ? 'Resources Cost (Fix)' : 'Project Cost (Fix)';
  useEffect(() => { fetch('/api/settings/business-lines').then((r) => r.json()).then((d) => { if (Array.isArray(d)) setBlInventory(d); }).catch(() => {}); }, []);

  const fetchClientUsers = (cId: string) => {
    if (!cId) { setClientUsers([]); return; }
    fetch(`/api/clients/${cId}/client-users`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setClientUsers(d); })
      .catch(() => setClientUsers([]));
  };

  useEffect(() => {
    setError(null);
    if (mode === 'edit' && project) {
      setProjectId(project.id); setName(project.name); setClientId(project.clientId);
      setClientContactPersonId(project.clientContactPersonId || '');
      fetchClientUsers(project.clientId);
      setSelectedBLs(project.businessLine ? project.businessLine.split(',').map((s) => s.trim()).filter(Boolean) : []);
      setBillingType(normalizeBType(project.billingType));
      const parsed = parseFloat(project.rate.replace(/[^0-9.]/g, ''));
      setRateAmount(isNaN(parsed) ? '50' : String(parsed)); setCurrency(project.currency || project.clientCurrency || 'USD ($)');
      setStartDate(project.startDate || new Date().toISOString().split('T')[0]); setEndDate(project.endDate || ''); setBudgetHours(String(project.budgetHours || 100));
      setBudgetType(project.budgetType || 'Monthly');
      setAllocatedHoursList(Array.isArray(project.monthlyBudgets) ? project.monthlyBudgets.map((b) => Number(b.budgetHours) || 0) : []);
      setStatus(project.status); setManagerId(project.managerId || ''); setAssignedEmployees(project.assignedEmployees || []);
    } else {
      const initC = (defaultClientId && clients.find((c) => c.id === defaultClientId)) || clients[0];
      const targetCId = defaultClientId || initC?.id || '';
      setProjectId(''); setName(''); setClientId(targetCId); setSelectedBLs([]); setClientContactPersonId('');
      fetchClientUsers(targetCId);
      setBillingType(normalizeBType(initC?.defaultBillingType)); setRateAmount('50'); setCurrency(initC?.billingCurrency || 'USD ($)');
      setStartDate(new Date().toISOString().split('T')[0]); setEndDate(''); setBudgetHours('100'); setBudgetType('Monthly'); setAllocatedHoursList([]); setStatus('Active');
      const defaultPM = employees.find((e) => e.role === 'Project Manager' || e.role === 'Super Admin');
      setManagerId(defaultPM?.employeeId || ''); setAssignedEmployees([]);
      fetch('/api/projects/next-id').then((res) => res.json()).then((d) => { if (d.nextId) setProjectId(d.nextId); }).catch(() => setProjectId('PC0001'));
    }
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [mode, project, clients, employees, defaultClientId]);

  const handleBudgetHoursChange = (newVal: string) => {
    setBudgetHours(newVal);
    const total = Number(newVal) || 0;
    if (budgetType === 'Total Project') {
      setAllocatedHoursList((prev) => {
        let currentSum = 0; const valid: number[] = [];
        for (const h of prev) {
          if (currentSum + h <= total) { valid.push(h); currentSum += h; }
          else if (total - currentSum > 0) { valid.push(total - currentSum); currentSum = total; break; }
          else break;
        }
        return valid;
      });
    }
  };

  const handleClientChange = (newId: string) => {
    setClientId(newId);
    setClientContactPersonId('');
    fetchClientUsers(newId);
    if (mode === 'add') {
      const sel = clients.find((c) => c.id === newId);
      if (sel?.defaultBillingType) setBillingType(normalizeBType(sel.defaultBillingType));
      if (sel?.billingCurrency) setCurrency(sel.billingCurrency);
    }
  };

  const removeEmployee = (empId: string) => setAssignedEmployees((prev) => prev.filter((id) => id !== empId));
  const addEmployee = (empId: string) => { if (empId && !assignedEmployees.includes(empId)) setAssignedEmployees((prev) => [...prev, empId]); };
  const getRateLabel = () => (billingType === 'T&M') ? 'Hourly Cost *' : (billingType === 'Resources Cost (Fix)') ? 'Monthly Cost *' : 'Project Cost *';
  const isHourly = billingType === 'T&M';
  const pmEmployees = employees.filter((e) => e.status === 'Active' && (e.role === 'Project Manager' || e.role === 'Super Admin'));
  const staffEmployees = employees.filter((e) => e.status === 'Active' && e.role === 'Employee');
  const unassigned = staffEmployees.filter((e) => !assignedEmployees.includes(e.employeeId || String(e.id)));
  const availableServices = (selectedBLs.length > 0 ? blInventory.filter((b) => selectedBLs.includes(b.name)) : []).flatMap((b) => b.services);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !clientId) { setError('Project name and Client are required.'); return; }
    const amount = Number(rateAmount);
    if (isNaN(amount) || amount < 0) { setError('Please enter a valid rate amount.'); return; }
    let hours = isHourly ? Number(budgetHours) : 0;
    if (isHourly && (!hours || hours <= 0)) { setError('Budget hours must be positive.'); return; }
    const monthlyBudgets = (isHourly && budgetType === 'Total Project') ? computeMonthlyBreakdown(startDate, allocatedHoursList).map((m) => ({ monthYear: m.monthYear, budgetHours: m.hours })) : undefined;

    setSaving(true); setError(null);
    try {
      const formattedRate = `${currency.replace(/\s*\(.*\)/, '')} ${amount.toLocaleString()}${isHourly ? '/hr' : billingType === 'Resources Cost (Fix)' ? '/mo' : ''}`;
      const selectedPM = employees.find((e) => e.employeeId === managerId);
      const selectedCU = clientUsers.find((cu) => cu.id === clientContactPersonId);
      const url = mode === 'edit' ? `/api/projects/${project!.id}` : '/api/projects';
      const body = JSON.stringify({
        ...(projectId.trim() && { id: projectId.trim().toUpperCase() }),
        clientId, name: name.trim(), businessLine: selectedBLs.join(', '), service: availableServices.map((s) => s.name).join(', '),
        billingType, rate: formattedRate, startDate, endDate, budgetHours: hours, budgetType, status,
        managerId, managerName: selectedPM?.fullName || '',
        clientContactPersonId: clientContactPersonId || null,
        clientContactPersonName: selectedCU?.name || '',
        assignedEmployees, monthlyBudgets: monthlyBudgets || []
      });
      const res = await fetch(url, { method: mode === 'edit' ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save project.');
      onSaved(mode === 'edit' ? `Project ${name} updated successfully.` : `Project ${name} created successfully.`);
    } catch (err: any) { setError(err.message); } finally { setSaving(false); }
  };

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-200">
      <Breadcrumbs items={[{ label: 'Clientele', onClick: onBack }, ...(clientContextName ? [{ label: clientContextName, onClick: onBack }, { label: 'Projects', onClick: onBack }] : []), { label: mode === 'edit' ? `Edit Project (${project?.name || ''})` : 'New Project' }]} />
      <div className="flex items-center justify-between border-b border-studio-border pb-3">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onBack} className="p-1.5 rounded-lg border border-studio-border bg-white hover:bg-studio-sidebar text-studio-text transition-colors cursor-pointer" title="Back"><ArrowLeft className="w-4 h-4" /></button>
          <div><h2 className="text-[20px] font-bold tracking-tight text-studio-text">{mode === 'edit' ? `Edit Project (${project?.name})` : 'New Project'}</h2></div>
        </div>
        <div className="flex items-center gap-2.5">
          <button type="button" onClick={onBack} className="px-4 py-2 border border-studio-border rounded-md text-[12px] font-semibold text-studio-text hover:bg-studio-sidebar cursor-pointer">Cancel</button>
          <button type="submit" form="project-full-form" disabled={saving} className="px-5 py-2 bg-brand-orange text-white rounded-md text-[12px] font-semibold hover:bg-opacity-95 shadow-sm disabled:opacity-50 cursor-pointer">{saving ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Create Project'}</button>
        </div>
      </div>
      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-[12px] font-medium">{error}</div>}

      <form id="project-full-form" onSubmit={handleSubmit} className="bg-white border border-studio-border rounded-lg shadow-sm p-6 space-y-7">
        <ProjectFormInfoSection
          mode={mode} projectId={projectId} setProjectId={setProjectId} name={name} setName={setName} clientId={clientId} handleClientChange={handleClientChange}
          clients={clients} defaultClientId={defaultClientId} status={status} setStatus={setStatus} isSA={isSA} managerId={managerId} setManagerId={setManagerId} pmEmployees={pmEmployees}
          clientUsers={clientUsers} clientContactPersonId={clientContactPersonId} setClientContactPersonId={setClientContactPersonId}
          billingType={billingType} setBillingType={setBillingType} rateAmount={rateAmount} setRateAmount={setRateAmount} getRateLabel={getRateLabel}
          currency={currency} setCurrency={setCurrency} startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate}
          isHourly={isHourly} budgetType={budgetType} setBudgetType={setBudgetType} budgetHours={budgetHours} handleBudgetHoursChange={handleBudgetHoursChange}
          allocatedHoursList={allocatedHoursList} setAllocatedHoursList={setAllocatedHoursList} inputRef={inputRef}
        />
        <ProjectFormBLSection
          selectedBLs={selectedBLs} setSelectedBLs={setSelectedBLs} blInventory={blInventory} availableServices={availableServices}
          assignedEmployees={assignedEmployees} addEmployee={addEmployee} removeEmployee={removeEmployee} unassigned={unassigned} staffEmployees={staffEmployees}
        />
      </form>
    </div>
  );
}
