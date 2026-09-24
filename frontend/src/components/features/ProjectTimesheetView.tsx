import { useState, useEffect, useMemo, useRef } from 'react';
import { UserRole } from '../ui/Layout';
import { useAuth } from '../../context/AuthContext';
import { ProjectTimesheetItem } from './TimesheetsView';
import Breadcrumbs from '../ui/Breadcrumbs';
import SlideToActionDrawer, { TimesheetActionType } from './SlideToActionDrawer';
import ProjectTimesheetGridRow, { DailyEntry, DateGroupItem } from './ProjectTimesheetGridRow';
import ProjectTimesheetHeader from './ProjectTimesheetHeader';
import ProjectTimesheetBanners from './ProjectTimesheetBanners';
import ProjectTimesheetFooter from './ProjectTimesheetFooter';
import { getCurrentMonthIso } from '../../utils/dateUtils';
import { AlertTriangle } from 'lucide-react';

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
  const [monthlyAllocatedBudget, setMonthlyAllocatedBudget] = useState<number>(project.budgetHours || 0);
  const [isMonthUnallocated, setIsMonthUnallocated] = useState<boolean>(false);
  const [isBackendBudgetExhausted, setIsBackendBudgetExhausted] = useState<boolean>(false);
  const [enabledWeekends, setEnabledWeekends] = useState<Record<string, boolean>>({});

  const totalHours = entries.reduce((s, e) => s + (Number(e.hours) || 0), 0);
  const myTotalHours = entries.filter((e) => e.isOwner !== false).reduce((s, e) => s + (Number(e.hours) || 0), 0);
  const isHourly = project.billingType === 'T&M' || project.billingType === 'Hourly Rate (T&M)';
  const isBudgetExhausted = isBackendBudgetExhausted || (isHourly && monthlyAllocatedBudget > 0 && totalHours >= monthlyAllocatedBudget);
  const baseIsLocked = isEmp ? (myStatus === 'Approved' || myStatus === 'PM_Approved' || myStatus === 'Submitted') : isPM ? (status === 'Approved' || status === 'PM_Approved') : (status === 'Approved');
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
        if (data.monthlyAllocatedHours !== undefined) setMonthlyAllocatedBudget(Number(data.monthlyAllocatedHours) || 0);
        setIsMonthUnallocated(!!data.isMonthUnallocated);
        setIsBackendBudgetExhausted(!!data.isBudgetExhausted);
        setFetchError(null);
      })
      .catch((err) => { setFetchError(err.message); setEntries([]); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEntries(); setEnabledWeekends({}); }, [project.id, currentMonth]);

  const autoSaveTimerRef = useRef<any>(null);
  const triggerAutoSave = (currentEntries: DailyEntry[], delay: number = 0) => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(async () => {
      if (isLocked) return;
      try {
        setSaveMsg('Saving...');
        const userEntries = isEmp ? currentEntries.filter((e) => e.isOwner !== false) : currentEntries;
        const res = await fetch('/api/timesheets/daily-entries/save', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId: project.id, month: currentMonth, entries: userEntries }),
        });
        if (res.ok) { setSaveMsg('Auto-saved'); setTimeout(() => setSaveMsg(''), 2500); onRefresh(); }
      } catch (err) { console.error('Auto-save error:', err); }
    }, delay);
  };

  const handleEntryChange = (idx: number, field: keyof DailyEntry, val: any) => {
    if (isLocked || (isEmp && entries[idx]?.isReadOnly)) return;
    const updated = [...entries];
    updated[idx] = { ...updated[idx], [field]: val };
    setEntries(updated);
    triggerAutoSave(updated, field === 'hours' ? 0 : 500);
  };

  const handleSave = async () => {
    if (isLocked) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    setActionLoading(true);
    try {
      const userEntries = isEmp ? entries.filter((e) => e.isOwner !== false) : entries;
      const res = await fetch('/api/timesheets/daily-entries/save', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, month: currentMonth, entries: userEntries }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Failed to save'); return; }
      setSaveMsg('Saved successfully!'); setTimeout(() => setSaveMsg(''), 2500); onRefresh();
    } finally { setActionLoading(false); }
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
      setPendingAction(null); onRefresh(); fetchEntries();
    } finally { setActionLoading(false); }
  };

  const dateGroups: DateGroupItem[] = useMemo(() => {
    const map = new Map<string, DateGroupItem>();
    entries.forEach((entry, idx) => {
      const isWeekend = !!(entry.isWeekend || entry.dayLabel?.includes('Sat') || entry.dayLabel?.includes('Sun'));
      if (!map.has(entry.date)) map.set(entry.date, { date: entry.date, sno: entry.sno, dayLabel: entry.dayLabel, isWeekend, items: [] });
      map.get(entry.date)!.items.push({ entry, idx });
    });
    return Array.from(map.values());
  }, [entries]);

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

  return (
    <>
      {pendingAction && (
        <SlideToActionDrawer open={!!pendingAction} actionType={pendingAction} project={project} month={currentMonth} totalHours={totalHours} billableHours={totalHours} isPM={isPM} submitting={actionLoading} onClose={() => setPendingAction(null)} onConfirm={handleConfirmAction} />
      )}
      <div className="w-full h-[calc(100vh-6.5rem)] flex flex-col justify-between space-y-3 pb-0">
        <Breadcrumbs items={[{ label: 'Time Sheet', onClick: () => onBack() }, { label: project.client || project.clientName || 'Client', onClick: () => onBack() }, { label: project.projectName }]} />

        <ProjectTimesheetHeader
          project={project} currentMonth={currentMonth} onMonthChange={setCurrentMonth} status={status} myStatus={myStatus}
          counts={counts} isHourly={isHourly} totalHours={totalHours} monthlyAllocatedBudget={monthlyAllocatedBudget}
          isSA={isSA} isPM={isPM} isEmp={isEmp} entries={entries} isLocked={isLocked} actionLoading={actionLoading}
          saveMsg={saveMsg} onBack={onBack} onAction={setPendingAction} onSave={handleSave}
        />

        <ProjectTimesheetBanners
          isPartial={status === 'Partially_Submitted'} pendingResources={pendingResources} isMonthUnallocated={isMonthUnallocated}
          currentMonth={currentMonth} isBudgetExhausted={isBudgetExhausted} totalHours={totalHours} monthlyAllocatedBudget={monthlyAllocatedBudget}
        />

        {/* Stable Main Grid View */}
        <div className="bg-white border border-studio-border rounded-lg overflow-hidden shadow-xs flex flex-col flex-1 min-h-0">
          <div className="bg-studio-sidebar border-b border-studio-border px-5 py-2.5 text-[10px] font-bold text-studio-muted uppercase tracking-wider grid grid-cols-12 gap-3 items-center sticky top-0 z-10 shadow-2xs shrink-0">
            <div className="col-span-1">SNO</div><div className="col-span-1">DATE</div><div className="col-span-1">DAY</div>
            <div className="col-span-4">DESCRIPTION</div><div className="col-span-2">SERVICES</div><div className="col-span-2">RESOURCE</div><div className="col-span-1 text-right">TIME LOGGED</div>
          </div>
          <div className="divide-y divide-studio-border bg-white flex-1 overflow-y-auto min-h-0">
            {loading ? <div className="p-8 text-center text-[12px] text-studio-muted">Loading full month records...</div> : dateGroups.map((group) => (
              <ProjectTimesheetGridRow
                key={group.date} group={group} isLocked={isLocked} isSA={isSA} isPM={isPM} isEmp={isEmp} user={user}
                availableServices={projectServices} isWeekendEnabled={!!enabledWeekends[group.date]}
                onEnableWeekend={(d) => setEnabledWeekends((prev) => ({ ...prev, [d]: true }))}
                onEntryChange={handleEntryChange}
              />
            ))}
          </div>
        </div>

        <ProjectTimesheetFooter
          isLocked={isLocked} isMonthUnallocated={isMonthUnallocated} isBudgetExhausted={isBudgetExhausted}
          isEmp={isEmp} isPM={isPM} status={status} myStatus={myStatus} myTotalHours={myTotalHours}
          totalHours={totalHours}
        />
      </div>
    </>
  );
}
