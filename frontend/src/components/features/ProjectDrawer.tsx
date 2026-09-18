import React, { useState, useEffect, useRef } from 'react';
import { X, UserCheck, Layers, ChevronDown } from 'lucide-react';
import { Client } from './ClientDrawer';
import { Employee } from './EmployeeDrawer';

export interface Project {
  id: string; name: string; clientId: string; clientName?: string; billingType: string; rate: string;
  currency?: string; clientCurrency?: string; businessLine?: string; service?: string; startDate?: string;
  endDate?: string; budgetHours?: number; budgetType?: 'Monthly' | 'Total Project'; loggedHours?: number; status: 'Active' | 'Inactive';
  managerId?: string; managerName?: string; assignedEmployees?: string[];
}

const CURRENCIES = ['USD ($)', 'INR (₹)', 'EUR (€)', 'GBP (£)', 'SGD ($)', 'AUD ($)', 'CAD ($)', 'AED (د.إ)', 'JPY (¥)', 'CHF (Fr.)'];

interface ProjectDrawerProps {
  open: boolean; mode: 'add' | 'edit'; project: Project | null; clients: Client[];
  employees?: Employee[]; isSA?: boolean; onClose: () => void; onSaved: (msg?: string) => void;
}

export default function ProjectDrawer({ open, mode, project, clients, employees = [], isSA = false, onClose, onSaved }: ProjectDrawerProps) {
  const [projectId, setProjectId] = useState(''); const [name, setName] = useState(''); const [clientId, setClientId] = useState('');
  const [selectedBLs, setSelectedBLs] = useState<string[]>([]); const [billingType, setBillingType] = useState<string>('T&M');
  const [blInventory, setBlInventory] = useState<Array<{ id: number; name: string; services: Array<{ id: number; name: string }> }>>([]);
  const [rateAmount, setRateAmount] = useState('50'); const [currency, setCurrency] = useState('USD ($)');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]); const [endDate, setEndDate] = useState('');
  const [budgetHours, setBudgetHours] = useState('100'); const [budgetType, setBudgetType] = useState<'Monthly' | 'Total Project'>('Monthly');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [managerId, setManagerId] = useState(''); const [assignedEmployees, setAssignedEmployees] = useState<string[]>([]);
  const [saving, setSaving] = useState(false); const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const normalizeBType = (bt?: string) => (!bt || bt === 'Hourly Rate (T&M)' || bt === 'T&M') ? 'T&M' : (bt?.includes('Monthly') || bt?.includes('Resource') || bt === 'Fixed RC' || bt === 'Resources Cost (Fix)') ? 'Resources Cost (Fix)' : 'Project Cost (Fix)';
  useEffect(() => { fetch('/api/settings/business-lines').then((r) => r.json()).then((d) => { if (Array.isArray(d)) setBlInventory(d); }).catch(() => {}); }, []);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (mode === 'edit' && project) {
      setProjectId(project.id); setName(project.name); setClientId(project.clientId);
      setSelectedBLs(project.businessLine ? project.businessLine.split(',').map((s) => s.trim()).filter(Boolean) : []);
      setBillingType(normalizeBType(project.billingType));
      const parsed = parseFloat(project.rate.replace(/[^0-9.]/g, ''));
      setRateAmount(isNaN(parsed) ? '50' : String(parsed)); setCurrency(project.currency || project.clientCurrency || 'USD ($)');
      setStartDate(project.startDate || new Date().toISOString().split('T')[0]); setEndDate(project.endDate || ''); setBudgetHours(String(project.budgetHours || 100));
      setBudgetType(project.budgetType || 'Monthly');
      setStatus(project.status || 'Active'); setManagerId(project.managerId || ''); setAssignedEmployees(project.assignedEmployees || []);
    } else {
      const initC = clients[0];
      setProjectId(''); setName(''); setClientId(initC?.id || ''); setSelectedBLs([]);
      setBillingType(normalizeBType(initC?.defaultBillingType)); setRateAmount('50'); setCurrency(initC?.billingCurrency || 'USD ($)');
      setStartDate(new Date().toISOString().split('T')[0]); setEndDate(''); setBudgetHours('100'); setBudgetType('Monthly'); setStatus('Active');
      const defaultPM = employees.find((e) => e.role === 'Project Manager');
      setManagerId(defaultPM?.employeeId || ''); setAssignedEmployees([]);
      fetch('/api/projects/next-id')
        .then((res) => res.json())
        .then((d) => { if (d.nextId) setProjectId(d.nextId); })
        .catch(() => setProjectId('PC0001'));
    }
    setTimeout(() => inputRef.current?.focus(), 150);
  }, [open, mode, project, clients, employees]);

  const handleClientChange = (newId: string) => { setClientId(newId); if (mode === 'add') { const sel = clients.find((c) => c.id === newId); if (sel?.defaultBillingType) setBillingType(normalizeBType(sel.defaultBillingType)); if (sel?.billingCurrency) setCurrency(sel.billingCurrency); } };

  const removeEmployee = (empId: string) => setAssignedEmployees((p) => p.filter((id) => id !== empId));
  const addEmployee = (empId: string) => { if (empId && !assignedEmployees.includes(empId)) setAssignedEmployees((p) => [...p, empId]); };
  const getRateLabel = () => (billingType === 'T&M') ? 'Hourly Cost *' : (billingType === 'Resources Cost (Fix)') ? 'Monthly Cost *' : 'Project Cost *';
  const isHourly = billingType === 'T&M';
  const pmEmployees = employees.filter((e) => e.status === 'Active' && (e.role === 'Project Manager' || e.role === 'Super Admin'));
  const staffEmployees = employees.filter((e) => e.status === 'Active' && e.role === 'Employee');
  const unassigned = staffEmployees.filter((e) => !assignedEmployees.includes(e.employeeId || String(e.id)));
  const availableServices = (selectedBLs.length > 0 ? blInventory.filter((b) => selectedBLs.includes(b.name)) : []).flatMap((b) => b.services);

  const calculateMonthBreakdown = () => {
    if (budgetType !== 'Total Project') return null;
    const hours = Number(budgetHours);
    if (isNaN(hours) || hours <= 0 || !startDate || !endDate) return null;
    const [sY, sM] = startDate.split('-').map(Number);
    const [eY, eM] = endDate.split('-').map(Number);
    if (!sY || !sM || !eY || !eM) return null;
    const count = (eY - sY) * 12 + (eM - sM) + 1;
    if (count <= 0) return null;
    const perMonth = Math.round(hours / count);
    return `${hours} hrs ÷ ${count} mo = ~${perMonth} hrs/mo`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !clientId) { setError('Project name and Client are required.'); return; }
    const amount = Number(rateAmount);
    if (isNaN(amount) || amount < 0) { setError('Please enter a valid rate amount.'); return; }
    let hours = isHourly ? Number(budgetHours) : 0;
    if (isHourly && (!hours || hours <= 0)) { setError('Budget hours must be positive.'); return; }
    setSaving(true);
    try {
      const formattedRate = `${currency.replace(/\s*\(.*\)/, '')} ${amount.toLocaleString()}${isHourly ? '/hr' : billingType === 'Resources Cost (Fix)' ? '/mo' : ''}`;
      const selectedPM = employees.find((e) => e.employeeId === managerId);
      const url = mode === 'edit' ? `/api/projects/${project!.id}` : '/api/projects';
      const body = JSON.stringify({
        ...(projectId.trim() && { id: projectId.trim().toUpperCase() }),
        clientId, name: name.trim(), businessLine: selectedBLs.join(', '), service: availableServices.map((s) => s.name).join(', '),
        billingType, rate: formattedRate, startDate, endDate, budgetHours: hours, budgetType, status,
        managerId, managerName: selectedPM?.fullName || '', assignedEmployees
      });
      const res = await fetch(url, { method: mode === 'edit' ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save project.');
      onSaved(); onClose();
    } catch (err: any) { setError(err.message); } finally { setSaving(false); }
  };

  const inputCls = "w-full px-3 py-1.5 border border-studio-border hover:border-studio-muted/50 rounded text-[12.5px] text-studio-text bg-white focus:outline-none focus:border-brand-orange transition-colors";
  const selectCls = "w-full px-3 py-1.5 pr-8 border border-studio-border hover:border-studio-muted/50 rounded text-[12.5px] text-studio-text bg-white appearance-none focus:outline-none focus:border-brand-orange transition-colors cursor-pointer";
  const labelCls = "block text-[11px] font-medium text-studio-muted mb-1";

  return (
    <>
      <div onClick={onClose} className={`fixed inset-0 z-40 bg-black/15 backdrop-blur-[1px] transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />
      <div className={`fixed top-0 right-0 z-50 h-full w-full max-w-4xl bg-white shadow-xl flex flex-col transition-transform duration-250 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-7 py-3.5 border-b border-studio-border shrink-0">
          <div>
            <h3 className="text-[16px] font-semibold text-studio-text">{mode === 'edit' ? 'Edit Project' : 'New Project'}</h3>
            <p className="text-[11px] text-studio-muted mt-0.5">{mode === 'edit' ? `Project: ${project?.name} (${project?.id})` : 'Fill in project specifications & resource mapping'}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-studio-muted hover:bg-studio-sidebar transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
        </div>

        <form id="project-drawer-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-7 py-5 space-y-4">
          {error && <div className="p-2.5 bg-red-50 text-red-700 rounded text-[11px] font-medium">{error}</div>}

          {/* 1. Project Info (3-Column Layout Grid) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3.5">
            {/* Row 1 */}
            <div><label className="block text-[11px] font-bold text-brand-orange mb-1">Project ID *</label><input type="text" placeholder="PC0001" disabled={mode === 'edit'} value={projectId} onChange={(e) => setProjectId(e.target.value)} className={`${inputCls} font-mono uppercase ${mode === 'edit' ? 'bg-studio-sidebar opacity-75' : ''}`} /></div>
            <div>
              <label className={labelCls}>Client *</label>
              <div className="relative">
                <select value={clientId} onChange={(e) => handleClientChange(e.target.value)} className={selectCls}>{clients.map((c) => (<option key={c.id} value={c.id}>{c.displayName || c.name}</option>))}</select>
                <ChevronDown className="w-3.5 h-3.5 text-studio-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Status *</label>
              <div className="relative">
                <select value={status} onChange={(e) => setStatus(e.target.value as any)} className={selectCls}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-studio-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Row 2 */}
            <div><label className={labelCls}>Project Name *</label><input ref={inputRef} type="text" placeholder="e.g. Design System V2" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} /></div>
            <div>
              <label className="flex items-center gap-1 text-[11px] font-bold text-studio-text mb-1"><UserCheck className="w-3.5 h-3.5 text-brand-orange" /> Assign PM</label>
              <div className="relative">
                <select value={managerId} onChange={(e) => setManagerId(e.target.value)} className={selectCls} disabled={!isSA}>
                  <option value="">-- Select PM --</option>
                  {pmEmployees.map((emp) => (<option key={emp.employeeId} value={emp.employeeId}>{emp.fullName}</option>))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-studio-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Billing Type</label>
              <div className="relative">
                <select value={billingType} onChange={(e) => setBillingType(e.target.value)} className={selectCls}>
                  <option value="T&M">T&M</option>
                  <option value="Resources Cost (Fix)">Resources Cost (Fix)</option>
                  <option value="Project Cost (Fix)">Project Cost (Fix)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-studio-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Row 3 */}
            <div><label className={labelCls}>{getRateLabel()}</label><input type="number" placeholder="50" value={rateAmount} onChange={(e) => setRateAmount(e.target.value)} className={inputCls} /></div>
            <div>
              <label className={labelCls}>Currency</label>
              <div className="relative">
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={selectCls}>{CURRENCIES.map((c) => (<option key={c} value={c}>{c}</option>))}</select>
                <ChevronDown className="w-3.5 h-3.5 text-studio-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
            <div><label className={labelCls}>Start Date *</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} /></div>

            {/* Row 4 */}
            <div><label className={labelCls}>End Date</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} /></div>
            {isHourly && (
              <>
                <div>
                  <label className={labelCls}>Budget Type</label>
                  <div className="relative">
                    <select value={budgetType} onChange={(e) => setBudgetType(e.target.value as any)} className={selectCls}>
                      <option value="Monthly">Monthly Budget</option>
                      <option value="Total Project">Total Project Budget</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-studio-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>{budgetType === 'Total Project' ? 'Total Budget Hours *' : 'Monthly Budget Hours *'}</label>
                  <input type="number" placeholder="100" value={budgetHours} onChange={(e) => setBudgetHours(e.target.value)} className={inputCls} />
                  {calculateMonthBreakdown() && (
                    <span className="text-[10.5px] font-medium text-brand-orange bg-orange-50 px-2 py-0.5 rounded border border-orange-200 mt-1 inline-block">
                      {calculateMonthBreakdown()}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* 2. BL & Resource Grouping */}
          <div className="space-y-3 pt-3 border-t border-studio-border/70">
            <h4 className="text-[12px] font-bold text-studio-text flex items-center gap-1.5 uppercase tracking-wider"><Layers className="w-3.5 h-3.5 text-brand-orange" /> BL & Resource</h4>
            
            {/* Line 1: Business Lines & Mapped Services */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
              <div>
                <label className={labelCls}>Business Lines ({selectedBLs.length})</label>
                <select value="" onChange={(e) => { if (e.target.value && !selectedBLs.includes(e.target.value)) setSelectedBLs((p) => [...p, e.target.value]); }} className={inputCls}>
                  <option value="">+ Select Business Line...</option>
                  {blInventory.filter((bl) => !selectedBLs.includes(bl.name)).map((bl) => (<option key={bl.id} value={bl.name}>{bl.name}</option>))}
                </select>
                {selectedBLs.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1 max-h-14 overflow-y-auto">
                    {selectedBLs.map((bl) => (<span key={bl} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-medium bg-orange-50 text-brand-orange border border-orange-200"><span>{bl}</span><button type="button" onClick={() => setSelectedBLs((p) => p.filter((x) => x !== bl))} className="hover:text-red-600"><X className="w-2.5 h-2.5" /></button></span>))}
                  </div>
                )}
              </div>

              <div>
                <label className={labelCls}>Mapped Services ({availableServices.length})</label>
                <div className="p-1.5 border border-studio-border/70 rounded bg-studio-sidebar/30 min-h-[34px] max-h-20 overflow-y-auto flex flex-wrap gap-1">
                  {availableServices.length > 0 ? (
                    availableServices.map((svc) => (<span key={svc.id} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">{svc.name}</span>))
                  ) : (<span className="text-[11px] text-studio-muted italic p-0.5">Select Business Line to auto-map services</span>)}
                </div>
              </div>
            </div>

            {/* Line 2: Select Team Member */}
            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                <div>
                  <label className={labelCls}>Select Team Member ({assignedEmployees.length} assigned)</label>
                  <select value="" onChange={(e) => addEmployee(e.target.value)} className={inputCls}>
                    <option value="">+ Select Employee to Assign...</option>
                    {unassigned.map((emp) => (<option key={emp.id} value={emp.employeeId || String(emp.id)}>{emp.fullName}</option>))}
                  </select>
                </div>
              </div>
              {assignedEmployees.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 bg-studio-sidebar/40 border border-studio-border rounded-lg max-h-20 overflow-y-auto">
                  {assignedEmployees.map((empCode) => {
                    const emp = staffEmployees.find((e) => (e.employeeId || String(e.id)) === empCode);
                    return (<span key={empCode} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-orange-50 text-brand-orange border border-brand-orange/30 shadow-2xs"><span>{emp ? emp.fullName : empCode}</span><button type="button" onClick={() => removeEmployee(empCode)} className="w-3.5 h-3.5 rounded-full flex items-center justify-center hover:bg-brand-orange/20 cursor-pointer"><X className="w-2.5 h-2.5" /></button></span>);
                  })}
                </div>
              )}
            </div>
          </div>
        </form>

        <div className="shrink-0 px-7 py-3.5 border-t border-studio-border flex items-center justify-end gap-3 bg-white">
          <button type="button" onClick={onClose} className="px-4 py-1.5 text-[12px] font-medium text-studio-muted hover:text-studio-text cursor-pointer">Cancel</button>
          <button type="submit" form="project-drawer-form" disabled={saving} className="px-4 py-1.5 text-[12px] font-semibold text-white bg-brand-orange rounded hover:bg-opacity-95 disabled:opacity-50 cursor-pointer">{saving ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Create Project'}</button>
        </div>
      </div>
    </>
  );
}
