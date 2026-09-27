import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Download, Check, ChevronDown, FileSpreadsheet, FileText, Lock, RotateCcw, Send, AlertTriangle, Save } from 'lucide-react';
import BillingBadge from '../ui/BillingBadge';
import MonthYearPicker from '../ui/MonthYearPicker';
import { ProjectTimesheetItem } from './TimesheetsView';
import { DailyEntry } from './ProjectTimesheetGridRow';
import { exportTimesheetToExcel, exportTimesheetToPDF } from '../../utils/timesheetExport';
import { TimesheetActionType } from './SlideToActionDrawer';

interface HeaderProps {
  project: ProjectTimesheetItem; currentMonth: string; onMonthChange: (m: string) => void;
  status: string; myStatus: string; counts: { total: number; submitted: number };
  isHourly: boolean; totalHours: number; monthlyAllocatedBudget: number;
  isSA: boolean; isPM: boolean; isEmp: boolean; entries: DailyEntry[];
  isLocked: boolean; actionLoading: boolean; saveMsg?: string;
  onBack: () => void; onAction: (action: TimesheetActionType) => void; onSave: () => void;
}

export default function ProjectTimesheetHeader({
  project, currentMonth, onMonthChange, status, myStatus, counts, isHourly, totalHours,
  monthlyAllocatedBudget, isSA, isPM, isEmp, entries, isLocked, actionLoading, saveMsg,
  onBack, onAction, onSave,
}: HeaderProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const canExport = (isPM || isSA) && status !== 'Draft';

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => { if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false); };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const pct = monthlyAllocatedBudget > 0 ? Math.min(100, Math.round((totalHours / monthlyAllocatedBudget) * 100)) : 0;

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-studio-border pb-3 shrink-0">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} className="p-1.5 rounded-lg border border-studio-border bg-white hover:bg-studio-sidebar text-studio-text transition-colors cursor-pointer shadow-2xs" title="Back">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2.5">
          <h2 className="text-[18px] font-bold text-studio-text tracking-tight">{project.projectName}</h2>
          <BillingBadge type={project.billingType} />
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">
        {/* 1. STATUS BADGES */}
        {status === 'Draft' && (
          <span className="px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 shadow-2xs bg-amber-50 text-amber-800 border-amber-300">Draft</span>
        )}
        {status === 'Partially_Submitted' && (
          <span className="px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 shadow-2xs bg-amber-50 text-amber-800 border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" /> Partially Submitted ({counts.submitted}/{counts.total})
          </span>
        )}
        {status === 'Submitted' && (
          <span className="px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 shadow-2xs bg-blue-50 text-blue-700 border-blue-200">
            Submitted ({counts.submitted}/{counts.total})
          </span>
        )}
        {status === 'PM_Approved' && (
          <span className="px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 shadow-2xs bg-purple-50 text-purple-700 border-purple-200">PM Approved</span>
        )}
        {status === 'Approved' && (
          <span className="px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 bg-green-50 text-green-700 border-green-200 shadow-2xs">
            <Lock className="w-3 h-3 text-green-700" /> Locked
          </span>
        )}

        {/* 2. HOURS BURNED */}
        {isHourly && monthlyAllocatedBudget > 0 && (
          <div className="px-2.5 py-1 bg-white border border-studio-border rounded-lg shadow-2xs flex items-center gap-2 text-[11px] font-mono text-studio-muted">
            <span className="font-semibold text-studio-text">{totalHours}/{monthlyAllocatedBudget}h</span>
            <div className="w-16 h-1.5 bg-studio-sidebar rounded-full overflow-hidden border border-studio-border">
              <div className="h-full bg-brand-orange transition-all duration-300" style={{ width: `${pct}%` }} />
            </div>
            <span className="font-bold text-brand-orange">{pct}%</span>
          </div>
        )}

        {/* Month Selector */}
        <MonthYearPicker
          value={currentMonth} onChange={onMonthChange}
          minMonth={project.startDate ? project.startDate.slice(0, 7) : undefined}
          maxMonth={project.endDate ? project.endDate.slice(0, 7) : undefined}
        />

        {/* 3. EXPORT */}
        {(isSA || isPM) && (
          <div ref={exportRef} className="relative">
            <button type="button" disabled={!canExport} onClick={() => setExportOpen((v) => !v)} title={!canExport ? 'Export enabled once submitted' : 'Export Timesheet'} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border text-[12px] font-bold transition-all shadow-2xs ${canExport ? 'bg-white border-studio-border text-studio-text hover:bg-studio-sidebar cursor-pointer' : 'bg-studio-sidebar/50 border-studio-border text-studio-muted opacity-50 cursor-not-allowed'}`}>
              <Download className="w-3.5 h-3.5 text-brand-orange" /><span>Export</span><ChevronDown className="w-3 h-3 text-studio-muted" />
            </button>
            {exportOpen && canExport && (
              <div className="absolute right-0 top-full mt-1.5 bg-white border border-studio-border rounded-lg shadow-xl py-1 z-50 w-44 text-[12px] animate-in fade-in slide-in-from-top-1">
                <button type="button" onClick={() => { setExportOpen(false); exportTimesheetToExcel(project, currentMonth, entries, totalHours); }} className="w-full px-3 py-2 text-left flex items-center gap-2 text-studio-text hover:bg-studio-sidebar font-semibold cursor-pointer"><FileSpreadsheet className="w-4 h-4 text-green-600" /> Excel Spreadsheet</button>
                <button type="button" onClick={() => { setExportOpen(false); exportTimesheetToPDF(project, currentMonth, entries, totalHours); }} className="w-full px-3 py-2 text-left flex items-center gap-2 text-studio-text hover:bg-studio-sidebar font-semibold border-t border-studio-border/50 cursor-pointer"><FileText className="w-4 h-4 text-red-600" /> PDF Document</button>
              </div>
            )}
          </div>
        )}

        {/* 4. SAVE */}
        <div className="flex items-center gap-1.5">
          {saveMsg && <span className="text-green-600 font-bold text-[11px] animate-in fade-in hidden sm:inline">{saveMsg}</span>}
          <button
            type="button"
            onClick={onSave}
            disabled={isLocked || actionLoading}
            className={`flex items-center gap-1.5 px-4 py-2 bg-brand-orange text-white rounded-lg text-[12px] font-bold shadow-2xs hover:bg-opacity-95 transition-all ${
              isLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <Save className="w-3.5 h-3.5" /> Save
          </button>
        </div>

        {/* 5. ROLE-BASED ACTION */}
        {isEmp && myStatus === 'Draft' && (
          <button type="button" onClick={() => onAction('Submit')} className="flex items-center gap-1.5 px-4 py-2 bg-brand-orange text-white rounded-lg text-[12px] font-bold shadow-2xs hover:bg-opacity-95 cursor-pointer transition-all">
            <Send className="w-3.5 h-3.5" /> Submit
          </button>
        )}
        {isPM && status === 'Submitted' && (
          <button type="button" onClick={() => onAction('Approve')} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-[12px] font-bold shadow-2xs hover:bg-green-700 cursor-pointer transition-all">
            <Check className="w-3.5 h-3.5" /> Approve
          </button>
        )}
        {isSA && (status === 'Submitted' || status === 'PM_Approved') && (
          <button type="button" onClick={() => onAction('Lock')} className="flex items-center gap-1.5 px-4 py-2 bg-brand-orange text-white rounded-lg text-[12px] font-bold shadow-2xs hover:bg-opacity-95 cursor-pointer transition-all">
            <Lock className="w-3.5 h-3.5" /> Lock Timesheet
          </button>
        )}
        {isSA && status === 'Approved' && (
          <button type="button" onClick={() => onAction('ReOpen')} className="flex items-center gap-1.5 px-4 py-2 bg-brand-orange text-white rounded-lg text-[12px] font-bold shadow-2xs hover:bg-opacity-95 cursor-pointer transition-all">
            <Lock className="w-3.5 h-3.5" /> Unlock / Reopen
          </button>
        )}

        {/* 6. REOPEN ALL (Last action button) */}
        {(isPM || isSA) && (status === 'Partially_Submitted' || status === 'Submitted' || (isSA && status === 'PM_Approved')) && (
          <button type="button" onClick={() => onAction('ReOpen')} className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-studio-border bg-white text-studio-text text-[12px] font-bold shadow-2xs hover:bg-studio-sidebar cursor-pointer transition-colors">
            <RotateCcw className="w-3.5 h-3.5 text-studio-muted" /> Reopen All
          </button>
        )}
      </div>
    </div>
  );
}
