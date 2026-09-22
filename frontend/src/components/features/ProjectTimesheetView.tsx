import { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowLeft, Download, AlertTriangle, Check, ChevronDown, FileSpreadsheet, FileText, Lock, RotateCcw, Save, Send } from 'lucide-react';
import { UserRole } from '../ui/Layout';
import { useAuth } from '../../context/AuthContext';
import { ProjectTimesheetItem } from './TimesheetsView';
import Breadcrumbs from '../ui/Breadcrumbs';
import BillingBadge from '../ui/BillingBadge';
import SlideToActionDrawer, { TimesheetActionType } from './SlideToActionDrawer';
import ProjectTimesheetGridRow, { DailyEntry, DateGroupItem } from './ProjectTimesheetGridRow';
import MonthYearPicker from '../ui/MonthYearPicker';
import { exportTimesheetToExcel, exportTimesheetToPDF } from '../../utils/timesheetExport';
import { getCurrentMonthIso } from '../../utils/dateUtils';

export default function ProjectTimesheetView({
  project, month = getCurrentMonthIso(), activeRole, onBack, onRefresh,
}: { project: ProjectTimesheetItem; month?: string; activeRole?: UserRole; onBack: (msg?: string) => void; onRefresh: () => void; }) {
  const { role: authRole, user } = useAuth();
  const role = activeRole || authRole || 'Employee';
  const isEmp = role === 'Employee'; const isPM = role === 'Project Manager'; const isSA = role === 'Super Admin';

  const [currentMonth, setCurrentMonth] = useState(month);
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [status, setStatus] = useState<string>('Draft');
  const [myStatus, setMyStatus] = useState<string>('Draft');
  const [pendingResources, setPendingResources] = useState<string[]>([]);
  const [projectServices, setProjectServices] = useState<string[]>([]);
  const [counts, setCounts] = useState({ total: 1, submitted: 0 });
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [pendingAction, setPendingAction] = useState<TimesheetActionType | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [monthlyAllocatedBudget, setMonthlyAllocatedBudget] = useState<number>(project.budgetHours || 0);
  const [isMonthUnallocated, setIsMonthUnallocated] = useState<boolean>(false);
  const [isBackendBudgetExhausted, setIsBackendBudgetExhausted] = useState<boolean>(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const totalHours = entries.reduce((s, e) => s + (Number(e.hours) || 0), 0);
  const myTotalHours = entries.filter((e) => e.isOwner !== false).reduce((s, e) => s + (Number(e.hours) || 0), 0);
  const isHourly = project.billingType === 'T&M' || project.billingType === 'Hourly Rate (T&M)';

  const isBudgetExhausted = isBackendBudgetExhausted || (isHourly && monthlyAllocatedBudget > 0 && totalHours >= monthlyAllocatedBudget);

  const baseIsLocked = isEmp
    ? (myStatus === 'Approved' || myStatus === 'PM_Approved' || myStatus === 'Submitted')
    : isPM
    ? (status === 'Approved' || status === 'PM_Approved')
    : (status === 'Approved');

  const isLocked = isMonthUnallocated || baseIsLocked || isBudgetExhausted;

  const fetchEntries = () => {
    setLoading(true);
    fetch(`/api/timesheets/daily-entries?projectId=${project.id}&month=${currentMonth}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch project timesheet.');
        return data;
      })
      .then((data) => {
        setEntries(data.entries || []);
        setStatus(data.overallStatus || data.status || 'Draft');
        setMyStatus(data.myStatus || 'Draft');
        setPendingResources(data.pendingResources || []);
        setCounts({ total: data.totalAssigned || 1, submitted: data.submittedCount || 0 });
        if (data.services) setProjectServices(data.services.split(',').map((s: string) => s.trim()).filter(Boolean));
        if (data.monthlyAllocatedHours !== undefined) {
          setMonthlyAllocatedBudget(Number(data.monthlyAllocatedHours) || 0);
        }
        setIsMonthUnallocated(!!data.isMonthUnallocated);
        setIsBackendBudgetExhausted(!!data.isBudgetExhausted);
        setFetchError(null);
      })
      .catch((err) => { setFetchError(err.message); setEntries([]); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEntries(); }, [project.id, currentMonth]);
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => { if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportMenuOpen(false); };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const autoSaveTimerRef = useRef<any>(null);

  const triggerAutoSave = (currentEntries: DailyEntry[], delay: number = 0) => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(async () => {
      if (isLocked) return;
      try {
        setSaveMsg('Saving...');
        const userEntries = isEmp ? currentEntries.filter((e) => e.isOwner !== false) : currentEntries;
        const res = await fetch('/api/timesheets/daily-entries/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId: project.id, month: currentMonth, entries: userEntries }),
        });
        const data = await res.json();
        if (res.ok) {
          setSaveMsg('Auto-saved');
          setTimeout(() => setSaveMsg(''), 2500);
          onRefresh();
        } else {
          console.error('Auto-save error:', data.error);
        }
      } catch (err) {
        console.error('Auto-save network error:', err);
      }
    }, delay);
  };

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  const handleEntryChange = (idx: number, field: keyof DailyEntry, val: any) => {
    if (isLocked) return;
    if (isEmp && entries[idx]?.isReadOnly) return;
    const updated = [...entries];
    updated[idx] = { ...updated[idx], [field]: val };
    setEntries(updated);

    // Auto-save immediately for logged time, debounced for text inputs
    triggerAutoSave(updated, field === 'hours' ? 0 : 500);
  };

  const handleSave = async () => {
    if (isLocked) return;
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    setActionLoading(true);
    try {
      const userEntries = isEmp ? entries.filter((e) => e.isOwner !== false) : entries;
      const res = await fetch('/api/timesheets/daily-entries/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, month: currentMonth, entries: userEntries }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to save');
        return;
      }
      setSaveMsg('Saved successfully!');
      setTimeout(() => setSaveMsg(''), 2500);
      onRefresh();
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) return;
    setActionLoading(true);
    try {
      const endpoint = pendingAction === 'Submit' ? 'submit' : (pendingAction === 'Approve' || pendingAction === 'Lock') ? 'approve' : 'reopen';
      const userEntries = isEmp ? entries.filter((e) => e.isOwner !== false) : entries;
      const body = pendingAction === 'Submit' ? { projectId: project.id, month: currentMonth, entries: userEntries } : { projectId: project.id, month: currentMonth };
      const res = await fetch(`/api/timesheets/daily-entries/${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Operation failed'); return; }
      setPendingAction(null);
      onRefresh();
      fetchEntries();
    } finally { setActionLoading(false); }
  };

  if (fetchError) {
    return (
      <div className="w-full space-y-4">
        <Breadcrumbs items={[{ label: 'Time Sheet', onClick: () => onBack() }, { label: project.projectName }]} />
        <div className="p-6 border border-red-200 bg-red-50/70 rounded-xl text-center space-y-3 shadow-sm">
          <AlertTriangle className="w-8 h-8 text-red-600 mx-auto" />
          <h3 className="text-[15px] font-bold text-red-900">Access Restricted</h3>
          <p className="text-[12.5px] text-red-700 max-w-md mx-auto">{fetchError}</p>
          <div><button onClick={() => onBack()} className="px-4 py-1.5 bg-white border border-red-300 text-red-800 rounded-lg text-[12px] font-semibold hover:bg-red-50 cursor-pointer shadow-2xs">Back to Timesheets</button></div>
        </div>
      </div>
    );
  }

  const canExport = (isPM || isSA) && status !== 'Draft';
  const isPartial = status === 'Partially_Submitted';

  const dateGroups: DateGroupItem[] = useMemo(() => {
    const map = new Map<string, DateGroupItem>();
    entries.forEach((entry, idx) => {
      const isWeekend = !!(entry.isWeekend || entry.dayLabel?.includes('Sat') || entry.dayLabel?.includes('Sun'));
      if (!map.has(entry.date)) {
        map.set(entry.date, { date: entry.date, sno: entry.sno, dayLabel: entry.dayLabel, isWeekend, items: [] });
      }
      map.get(entry.date)!.items.push({ entry, idx });
    });
    return Array.from(map.values());
  }, [entries]);

  return (
    <>
      {pendingAction && (
        <SlideToActionDrawer open={!!pendingAction} actionType={pendingAction} project={project} month={currentMonth} totalHours={totalHours} billableHours={totalHours} isPM={isPM} submitting={actionLoading} onClose={() => setPendingAction(null)} onConfirm={handleConfirmAction} />
      )}
      <div className="w-full flex-1 flex flex-col h-[calc(100vh-8.5rem)] justify-between space-y-3 pb-0">
        {/* Breadcrumb: Home > Time Sheet > Client Name > Project Name */}
        <Breadcrumbs items={[
          { label: 'Time Sheet', onClick: () => onBack() },
          { label: project.client || project.clientName || 'Client', onClick: () => onBack() },
          { label: project.projectName },
        ]} />

        {/* Level 3 Top Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-studio-border pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => onBack()} className="p-1.5 rounded-lg border border-studio-border bg-white hover:bg-studio-sidebar text-studio-text transition-colors cursor-pointer" title="Back">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2.5">
              <h2 className="text-[18px] font-bold text-studio-text">{project.projectName}</h2>
              <BillingBadge type={project.billingType} />
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Progress indicator */}
            {isHourly && (monthlyAllocatedBudget > 0) && (
              <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono text-studio-muted mr-1">
                <span>{totalHours}/{monthlyAllocatedBudget}h</span>
                <div className="w-20 h-1.5 bg-studio-sidebar rounded-full overflow-hidden border border-studio-border">
                  <div className="h-full bg-brand-orange transition-all duration-300" style={{ width: `${Math.min(100, Math.round((totalHours / monthlyAllocatedBudget) * 100))}%` }} />
                </div>
                <span className="font-bold text-brand-orange">{Math.min(100, Math.round((totalHours / monthlyAllocatedBudget) * 100))}%</span>
              </div>
            )}

            {/* Month selector with date bounds */}
            <MonthYearPicker
              value={currentMonth}
              onChange={setCurrentMonth}
              minMonth={project.startDate ? project.startDate.slice(0, 7) : undefined}
              maxMonth={project.endDate ? project.endDate.slice(0, 7) : undefined}
            />

            {/* Export menu */}
            {(isSA || isPM) && (
              <div ref={exportRef} className="relative">
                <button type="button" disabled={!canExport} onClick={() => setExportMenuOpen((v) => !v)} title={!canExport ? 'Export enabled once submitted' : 'Export Timesheet'} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11.5px] font-semibold transition-all shadow-2xs ${canExport ? 'bg-white border-studio-border text-studio-text hover:bg-studio-sidebar cursor-pointer' : 'bg-studio-sidebar/50 border-studio-border text-studio-muted opacity-50 cursor-not-allowed'}`}>
                  <Download className="w-3.5 h-3.5 text-brand-orange" /><span>Export</span><ChevronDown className="w-3 h-3 text-studio-muted" />
                </button>
                {exportMenuOpen && canExport && (
                  <div className="absolute right-0 top-full mt-1.5 bg-white border border-studio-border rounded-lg shadow-xl py-1 z-50 w-44 text-[12px] animate-in fade-in slide-in-from-top-1">
                    <button type="button" onClick={() => { setExportMenuOpen(false); exportTimesheetToExcel(project, currentMonth, entries, totalHours); }} className="w-full px-3 py-2 text-left flex items-center gap-2 text-studio-text hover:bg-studio-sidebar font-medium cursor-pointer"><FileSpreadsheet className="w-4 h-4 text-green-600" /> Excel Spreadsheet</button>
                    <button type="button" onClick={() => { setExportMenuOpen(false); exportTimesheetToPDF(project, currentMonth, entries, totalHours); }} className="w-full px-3 py-2 text-left flex items-center gap-2 text-studio-text hover:bg-studio-sidebar font-medium border-t border-studio-border/50 cursor-pointer"><FileText className="w-4 h-4 text-red-600" /> PDF Document</button>
                  </div>
                )}
              </div>
            )}

            {/* Stage 1: Draft badge appears in Row 1 for all roles */}
            {status === 'Draft' && (
              <span className="px-3 py-1 rounded-full border text-[11px] font-semibold flex items-center gap-1 shadow-2xs bg-amber-50 text-amber-800 border-amber-300">
                Draft
              </span>
            )}

            {/* Stage 4 for PM & EMY: PM Approved badge in Row 1 */}
            {!isSA && status === 'PM_Approved' && (
              <span className="px-3 py-1 rounded-full border text-[11px] font-semibold flex items-center gap-1 shadow-2xs bg-purple-50 text-purple-700 border-purple-200">
                PM Approved
              </span>
            )}

            {/* Stage 5 for PM & EMY: Locked badge in Row 1 */}
            {!isSA && status === 'Approved' && (
              <span className="px-3 py-1 rounded-full border text-[11px] font-semibold flex items-center gap-1 bg-green-50 text-green-700 border-green-200 shadow-2xs">
                <Lock className="w-3 h-3 text-green-700" /> Locked
              </span>
            )}

            {/* Stage 3 PM Approve button */}
            {isPM && status === 'Submitted' && (
              <button type="button" onClick={() => setPendingAction('Approve')} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-green-600 text-white text-[11.5px] font-bold shadow-2xs hover:bg-green-700 cursor-pointer">
                <Check className="w-3.5 h-3.5" /> Approve
              </button>
            )}

            {/* Stage 3 & 4 SA Lock Timesheet button */}
            {isSA && (status === 'Submitted' || status === 'PM_Approved') && (
              <button type="button" onClick={() => setPendingAction('Lock')} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-orange text-white text-[11.5px] font-bold shadow-2xs hover:bg-opacity-90 cursor-pointer">
                <Lock className="w-3.5 h-3.5" /> Lock Timesheet
              </button>
            )}

            {/* Stage 5 SA Unlock / Reopen button */}
            {isSA && status === 'Approved' && (
              <button type="button" onClick={() => setPendingAction('ReOpen')} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-orange text-white text-[11.5px] font-bold shadow-2xs hover:bg-opacity-90 cursor-pointer">
                <Lock className="w-3.5 h-3.5" /> Unlock / Reopen
              </button>
            )}

            {/* Employee submit */}
            {isEmp && myStatus === 'Draft' && (
              <button type="button" onClick={() => setPendingAction('Submit')} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-orange text-white text-[11.5px] font-bold shadow-2xs hover:bg-opacity-90 cursor-pointer"><Send className="w-3.5 h-3.5" /> Submit</button>
            )}
          </div>
        </div>

        {/* Row 2: Sub-bar with Status Badge, Warning Banner & Reopen All button */}
        {isPartial && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0 -mt-1">
            <div className="bg-[#FFF8F0] border border-[#FFE4C4] rounded-lg px-4 py-2 text-[12px] text-[#8C4A00] flex items-center gap-2 shadow-2xs">
              <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0" />
              <span>Waiting for <strong>{pendingResources.join(', ')}</strong> to submit timesheet before approval & lock can be completed.</span>
            </div>
            <div className="flex items-center gap-2.5 self-end sm:self-auto">
              <span className="px-3 py-1 rounded-full border text-[11px] font-semibold flex items-center gap-1 shadow-2xs bg-amber-50 text-amber-800 border-amber-300">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" /> Partially Submitted ({counts.submitted}/{counts.total})
              </span>
              {(isPM || isSA) && (
                <button type="button" onClick={() => setPendingAction('ReOpen')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-studio-border bg-white text-studio-text text-[11.5px] font-semibold shadow-2xs hover:bg-studio-sidebar cursor-pointer">
                  <RotateCcw className="w-3.5 h-3.5 text-studio-muted" /> Reopen All
                </button>
              )}
            </div>
          </div>
        )}

        {status === 'Submitted' && (
          <div className="flex justify-end items-center gap-2.5 shrink-0 -mt-1">
            <span className="px-3 py-1 rounded-full border text-[11px] font-semibold flex items-center gap-1 shadow-2xs bg-blue-50 text-blue-700 border-blue-200">
              Submitted ({counts.submitted}/{counts.total})
            </span>
            {(isPM || isSA) && (
              <button type="button" onClick={() => setPendingAction('ReOpen')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-studio-border bg-white text-studio-text text-[11.5px] font-semibold shadow-2xs hover:bg-studio-sidebar cursor-pointer">
                <RotateCcw className="w-3.5 h-3.5 text-studio-muted" /> Reopen All
              </button>
            )}
          </div>
        )}

        {status === 'PM_Approved' && isSA && (
          <div className="flex justify-end items-center gap-2.5 shrink-0 -mt-1">
            <span className="px-3 py-1 rounded-full border text-[11px] font-semibold flex items-center gap-1 shadow-2xs bg-purple-50 text-purple-700 border-purple-200">
              PM Approved
            </span>
            <button type="button" onClick={() => setPendingAction('ReOpen')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-studio-border bg-white text-studio-text text-[11.5px] font-semibold shadow-2xs hover:bg-studio-sidebar cursor-pointer">
              <RotateCcw className="w-3.5 h-3.5 text-studio-muted" /> Reopen All
            </button>
          </div>
        )}

        {status === 'Approved' && isSA && (
          <div className="flex justify-end items-center gap-2.5 shrink-0 -mt-1">
            <span className="px-3 py-1 rounded-full border text-[11px] font-semibold flex items-center gap-1 bg-green-50 text-green-700 border-green-200 shadow-2xs">
              <Lock className="w-3 h-3 text-green-700" /> Locked
            </span>
          </div>
        )}

        {/* Unallocated Month Lock Alert Banner */}
        {isMonthUnallocated && (
          <div className="px-3.5 py-2 bg-slate-100 border border-slate-300 rounded-lg flex items-center justify-between text-[11.5px] text-slate-800 shadow-2xs animate-in fade-in shrink-0">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-600 shrink-0" />
              <span>
                <strong>No Budget Allocated for {currentMonth}:</strong> Timesheet logging and editing are disabled for this month because no budget hours have been allocated in Project Registry.
              </span>
            </div>
          </div>
        )}

        {/* Budget Lock Alert Banner */}
        {isBudgetExhausted && !isMonthUnallocated && (
          <div className="px-3.5 py-2 bg-amber-50 border border-amber-300 rounded-lg flex items-center justify-between text-[11.5px] text-amber-900 shadow-2xs animate-in fade-in shrink-0">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>Monthly Budget Exhausted ({totalHours}/{monthlyAllocatedBudget}h — 100% burned):</strong> This month's timesheet is locked to prevent further logging. To unlock, extend the project's budget hours in Project Registry.
              </span>
            </div>
          </div>
        )}

        {/* Main Grid View */}
        <div className="bg-white border border-studio-border rounded-lg overflow-hidden shadow-sm flex flex-col flex-1 min-h-0">
          {/* Header Row Columns */}
          <div className="bg-studio-sidebar border-b border-studio-border px-5 py-2.5 text-[10px] font-bold text-studio-muted uppercase tracking-wider grid grid-cols-12 gap-3 items-center sticky top-0 z-10 shadow-2xs shrink-0">
            <div className="col-span-1">SNO</div>
            <div className="col-span-1">DATE</div>
            <div className="col-span-1">DAY</div>
            <div className="col-span-4">DESCRIPTION</div>
            <div className="col-span-2">SERVICES</div>
            <div className="col-span-2">RESOURCE</div>
            <div className="col-span-1 text-right">TIME LOGGED</div>
          </div>

          <div className="divide-y divide-studio-border bg-white flex-1 overflow-y-auto min-h-0">
            {loading ? <div className="p-8 text-center text-[12px] text-studio-muted">Loading full month records...</div> : dateGroups.map((group) => (
              <ProjectTimesheetGridRow key={group.date} group={group} isLocked={isLocked} isSA={isSA} isPM={isPM} isEmp={isEmp} user={user} availableServices={projectServices} onEntryChange={handleEntryChange} />
            ))}
          </div>

          {/* Footer Bar */}
          <div className="bg-studio-sidebar border-t border-studio-border px-5 py-2.5 flex justify-between items-center text-[12px] shadow-xs shrink-0">
            <div className="flex items-center gap-2">
              {isLocked ? (
                <span className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1.5 text-[11px] border ${isMonthUnallocated ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-green-50 border-green-200 text-green-800'}`}>
                  <Lock className={`w-3.5 h-3.5 ${isMonthUnallocated ? 'text-slate-600' : 'text-green-700'}`} />
                  Locked for edits ({
                    isMonthUnallocated
                      ? 'No Budget Allocated'
                      : isBudgetExhausted
                      ? 'Monthly Budget Exhausted'
                      : isEmp
                      ? (status === 'Approved' ? 'Locked' : (myStatus === 'PM_Approved' || status === 'PM_Approved') ? 'PM Approved' : 'Submitted')
                      : isPM
                      ? (status === 'Approved' ? 'Locked' : 'PM Approved')
                      : 'Locked'
                  }).
                </span>
              ) : isEmp ? (
                <span className="text-studio-text font-semibold text-[12px]">
                  My Logged : <strong className="font-sans text-studio-text font-bold">{myTotalHours}hrs</strong>
                </span>
              ) : null}
            </div>
            <div className="font-bold text-studio-text">
              Monthly Total : <span className="font-sans text-[#F25624] text-[14px] font-extrabold">{totalHours}hrs</span>
            </div>
          </div>
        </div>

        {/* Save button footer row */}
        <div className="flex justify-between items-center gap-3 pt-1 shrink-0">
          <div className="text-[11.5px] text-studio-muted">{saveMsg && <span className="text-green-600 font-semibold">{saveMsg}</span>}</div>
          <div>
            <button
              onClick={handleSave}
              disabled={isLocked || actionLoading}
              className={`flex items-center gap-1.5 px-4 py-1.5 bg-brand-orange text-white rounded-lg text-[12px] font-semibold hover:bg-opacity-90 shadow-sm transition-opacity ${isLocked ? 'opacity-90 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <Save className="w-3.5 h-3.5" /> Save
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
