import { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft, Save, Send, CheckCircle, RotateCcw, Lock, ChevronDown, Download, FileSpreadsheet, FileText, Unlock, AlertTriangle } from 'lucide-react';
import { UserRole } from '../ui/Layout';
import { useAuth } from '../../context/AuthContext';
import { ProjectTimesheetItem } from './TimesheetsView';
import SlideToActionDrawer, { TimesheetActionType } from './SlideToActionDrawer';
import BillingBadge from '../ui/BillingBadge';
import Breadcrumbs from '../ui/Breadcrumbs';
import MonthYearPicker from '../ui/MonthYearPicker';
import ProjectTimesheetGridRow, { DailyEntry, DateGroupItem } from './ProjectTimesheetGridRow';
import { exportTimesheetToExcel, exportTimesheetToPDF } from '../../utils/timesheetExport';

export default function ProjectTimesheetView({
  project, month = '2026-08', activeRole, onBack, onRefresh,
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
  const exportRef = useRef<HTMLDivElement>(null);

  const isLocked = isEmp
    ? (myStatus === 'Approved' || myStatus === 'PM_Approved' || myStatus === 'Submitted')
    : (status === 'Approved' || (status === 'PM_Approved' && !isSA));

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
        setStatus(data.status || 'Draft');
        setMyStatus(data.myStatus || 'Draft');
        setPendingResources(data.pendingResources || []);
        setCounts({ total: data.totalAssigned || 1, submitted: data.submittedCount || 0 });
        if (data.services) setProjectServices(data.services.split(',').map((s: string) => s.trim()).filter(Boolean));
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

  const handleEntryChange = (idx: number, field: keyof DailyEntry, val: any) => {
    if (isLocked || entries[idx]?.isReadOnly) return;
    const updated = [...entries]; updated[idx] = { ...updated[idx], [field]: val }; setEntries(updated);
  };

  const handleSave = async () => {
    if (isLocked) return;
    setActionLoading(true);
    try {
      const userEntries = isEmp ? entries.filter((e) => e.isOwner !== false) : entries;
      const res = await fetch('/api/timesheets/daily-entries/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId: project.id, month: currentMonth, entries: userEntries }) });
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
      const msg = pendingAction === 'Submit' ? 'Timesheet submitted successfully for PM Approval' :
                  pendingAction === 'Lock' ? 'Timesheet locked successfully by Super Admin' :
                  pendingAction === 'Approve' ? (isPM ? 'Timesheet approved by PM & forwarded to Super Admin' : 'Timesheet approved & locked') :
                  'Timesheet reopened successfully across all assigned resources';
      setPendingAction(null); onRefresh(); onBack(msg);
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

  const totalHours = entries.reduce((s, e) => s + (Number(e.hours) || 0), 0);
  const myTotalHours = entries.filter((e) => e.isOwner !== false).reduce((s, e) => s + (Number(e.hours) || 0), 0);
  const isHourly = project.billingType === 'T&M' || project.billingType === 'Hourly Rate (T&M)';
  const canExport = (isPM || isSA) && status !== 'Draft';
  const isPartial = status === 'Partially_Submitted';
  const statusLabel = status === 'Approved' ? 'Locked' : status === 'PM_Approved' ? 'PM Approved' : isPartial ? `Partially Submitted (${counts.submitted}/${counts.total})` : status === 'Submitted' ? (counts.total > 1 ? `Submitted (${counts.submitted}/${counts.total})` : 'Submitted') : status;
  const statusColor = status === 'Approved' ? 'bg-green-50 text-green-800 border-green-300' : status === 'PM_Approved' ? 'bg-purple-50 text-purple-800 border-purple-300' : isPartial ? 'bg-amber-50 text-amber-800 border-amber-300' : status === 'Submitted' ? 'bg-blue-50 text-blue-800 border-blue-300' : 'bg-slate-50 text-slate-700 border-slate-300';

  const dateGroups: DateGroupItem[] = useMemo(() => {
    const map = new Map<string, DateGroupItem>();
    entries.forEach((entry, idx) => {
      const isWeekend = !!(entry.isWeekend || entry.dayLabel?.includes('Sat') || entry.dayLabel?.includes('Sun'));
      if (!map.has(entry.date)) map.set(entry.date, { date: entry.date, sno: entry.sno, dayLabel: entry.dayLabel, isWeekend, items: [] });
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
        <Breadcrumbs items={[{ label: 'Time Sheet', onClick: () => onBack() }, { label: project.projectName }]} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-studio-border pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => onBack()} className="p-1 rounded hover:bg-studio-sidebar text-studio-muted hover:text-studio-text transition-colors cursor-pointer"><ArrowLeft className="w-4 h-4" /></button>
            <div className="flex items-center gap-2.5"><h2 className="text-[18px] font-bold text-studio-text">{project.projectName}</h2><BillingBadge type={project.billingType} /></div>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            {isHourly && (
              <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono text-studio-muted">
                <span>{totalHours}/{project.budgetHours}h</span>
                <div className="w-16 h-1.5 bg-studio-sidebar rounded-full overflow-hidden border border-studio-border"><div className="h-full bg-brand-orange" style={{ width: `${Math.min(100, Math.round((totalHours / (project.budgetHours || 1)) * 100))}%` }} /></div>
                <span className="font-bold text-brand-orange">{Math.min(100, Math.round((totalHours / (project.budgetHours || 1)) * 100))}%</span>
              </div>
            )}
            <MonthYearPicker value={currentMonth} onChange={setCurrentMonth} />
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
            <span className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1 shadow-2xs ${statusColor}`}>
              {status === 'Approved' && <Lock className="w-3 h-3" />}{isPartial && <AlertTriangle className="w-3 h-3 text-amber-600" />}{statusLabel}
            </span>
            {isEmp && myStatus === 'Draft' && (
              <button type="button" onClick={() => setPendingAction('Submit')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-orange text-white text-[11.5px] font-bold shadow-2xs hover:bg-opacity-90 cursor-pointer"><Send className="w-3.5 h-3.5" /> Submit</button>
            )}
            {isPM && status === 'Submitted' && (<>
              <button type="button" onClick={() => setPendingAction('Approve')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-[11.5px] font-bold shadow-2xs hover:bg-purple-700 cursor-pointer"><CheckCircle className="w-3.5 h-3.5" /> Approve</button>
              <button type="button" onClick={() => setPendingAction('ReOpen')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-[11.5px] font-bold shadow-2xs hover:bg-amber-100 cursor-pointer"><RotateCcw className="w-3.5 h-3.5 text-amber-600" /> Reopen</button>
            </>)}
            {isPM && isPartial && (
              <button type="button" onClick={() => setPendingAction('ReOpen')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-[11.5px] font-bold shadow-2xs hover:bg-amber-100 cursor-pointer"><RotateCcw className="w-3.5 h-3.5 text-amber-600" /> Reopen All</button>
            )}
            {isSA && (status === 'Submitted' || status === 'PM_Approved') && (<>
              <button type="button" onClick={() => setPendingAction('Lock')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-[11.5px] font-bold shadow-2xs hover:bg-green-700 cursor-pointer"><Lock className="w-3.5 h-3.5" /> Lock Timesheet</button>
              <button type="button" onClick={() => setPendingAction('ReOpen')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-[11.5px] font-bold shadow-2xs hover:bg-amber-100 cursor-pointer"><RotateCcw className="w-3.5 h-3.5 text-amber-600" /> Reopen</button>
            </>)}
            {isSA && isPartial && (
              <button type="button" onClick={() => setPendingAction('ReOpen')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-[11.5px] font-bold shadow-2xs hover:bg-amber-100 cursor-pointer"><RotateCcw className="w-3.5 h-3.5 text-amber-600" /> Reopen All</button>
            )}
            {isSA && status === 'Approved' && (
              <button type="button" onClick={() => setPendingAction('ReOpen')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-[11.5px] font-bold shadow-2xs hover:bg-amber-100 cursor-pointer"><Unlock className="w-3.5 h-3.5 text-amber-600" /> Unlock / Reopen</button>
            )}
          </div>
        </div>
        {isPartial && (isPM || isSA) && (
          <div className="bg-amber-50/70 border border-amber-200 rounded-lg px-4 py-2 text-[12px] text-amber-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Waiting for <strong>{pendingResources.join(', ')}</strong> to submit timesheet before approval & lock can be completed.</span>
          </div>
        )}
        <div className="bg-white border border-studio-border rounded-lg overflow-hidden shadow-sm flex flex-col flex-1 min-h-0">
          <div className="bg-studio-sidebar border-b border-studio-border px-5 py-2 text-[10px] font-bold text-studio-muted uppercase tracking-wider grid grid-cols-12 gap-3 items-center sticky top-0 z-10 shadow-2xs shrink-0">
            <div className="col-span-1">SNO</div><div className="col-span-2">DATE</div><div className="col-span-4">DESCRIPTION</div><div className="col-span-2">SERVICES</div><div className="col-span-2">RESOURCE</div><div className="col-span-1 text-right">TIME</div>
          </div>
          <div className="divide-y divide-studio-border bg-white flex-1 overflow-y-auto min-h-0">
            {loading ? <div className="p-8 text-center text-[12px] text-studio-muted">Loading full month records...</div> : dateGroups.map((group) => (
              <ProjectTimesheetGridRow key={group.date} group={group} isLocked={isLocked} isSA={isSA} isPM={isPM} isEmp={isEmp} user={user} availableServices={projectServices} onEntryChange={handleEntryChange} />
            ))}
          </div>
          <div className="bg-studio-sidebar border-t border-studio-border px-5 py-2 flex justify-between items-center text-[12px] shadow-xs shrink-0">
            <div className="flex items-center gap-2">
              {isLocked && (<span className="text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded font-semibold flex items-center gap-1.5 text-[11px]"><Lock className="w-3 h-3" /> Locked for edits ({isEmp ? myStatus : statusLabel}).</span>)}
              {isEmp && !isLocked && (<span className="text-studio-muted text-[11px]">My Logged: <strong className="text-studio-text font-mono">{myTotalHours}h</strong></span>)}
            </div>
            <div className="font-bold text-studio-text">Monthly Total: <span className="font-mono text-brand-orange text-[15px]">{totalHours} hrs</span></div>
          </div>
        </div>
        <div className="flex justify-between items-center gap-3 pt-1 shrink-0">
          <div className="text-[11.5px] text-studio-muted">{saveMsg && <span className="text-green-600 font-semibold">{saveMsg}</span>}</div>
          <div>{!isLocked && (<button onClick={handleSave} disabled={actionLoading} className="flex items-center gap-1.5 px-4 py-1.5 bg-brand-orange text-white rounded text-[12px] font-semibold hover:bg-opacity-90 shadow-sm cursor-pointer"><Save className="w-3.5 h-3.5" /> Save</button>)}</div>
        </div>
      </div>
    </>
  );
}
