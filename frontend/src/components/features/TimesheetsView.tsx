import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { UserRole } from '../ui/Layout';
import { Timer, Eye, Clock, CheckCircle2 } from 'lucide-react';
import { SkeletonRow } from '../ui/Skeleton';
import QuickTimeDrawer from './QuickTimeDrawer';
import ProjectTimesheetView from './ProjectTimesheetView';
import BillingBadge from '../ui/BillingBadge';
import Breadcrumbs from '../ui/Breadcrumbs';
import MonthYearPicker from '../ui/MonthYearPicker';

export interface ProjectTimesheetItem {
  id: string; client: string; projectName: string; billingType: string;
  timeLogged: number; budgetHours: number; percentage: number; status: string;
  myStatus?: string; submittedCount?: number; totalAssigned?: number;
}

export default function TimesheetsView({ activeRole }: { activeRole: UserRole }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const targetProjectId = searchParams.get('projectId');
  const [projects, setProjects] = useState<ProjectTimesheetItem[]>([]);
  const [selectedProjectForDetail, setSelectedProjectForDetail] = useState<ProjectTimesheetItem | null>(null);
  const [quickLogProject, setQuickLogProject] = useState<ProjectTimesheetItem | null>(null);
  const [selectedMonth, setSelectedMonth] = useState('2026-08');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fetchProjects = () => {
    setLoading(true);
    fetch(`/api/timesheets/projects-summary?month=${selectedMonth}`)
      .then((res) => res.json())
      .then((data: ProjectTimesheetItem[]) => {
        setProjects(data || []);
        setError(null);
        if (targetProjectId && data) {
          const match = data.find((p) => p.id === targetProjectId);
          if (match) setSelectedProjectForDetail(match);
        }
      })
      .catch((err) => { setError(err.message); setProjects([]); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProjects(); }, [selectedMonth, targetProjectId]);

  const handleBackFromDetail = (successMsg?: string) => {
    setSelectedProjectForDetail(null);
    if (targetProjectId) setSearchParams({});
    if (successMsg) {
      setSuccessToast(successMsg);
      setTimeout(() => setSuccessToast(null), 5000);
      fetchProjects();
    }
  };

  if (selectedProjectForDetail) {
    return (
      <ProjectTimesheetView
        project={selectedProjectForDetail}
        month={selectedMonth}
        activeRole={activeRole}
        onBack={handleBackFromDetail}
        onRefresh={fetchProjects}
      />
    );
  }

  const isEmp = activeRole === 'Employee';
  const totalLoggedAll = projects.reduce((sum, p) => sum + p.timeLogged, 0);
  const unloggedHours = Math.max(0, 176 - totalLoggedAll);

  return (
    <>
      <QuickTimeDrawer open={!!quickLogProject} project={quickLogProject} onClose={() => setQuickLogProject(null)} onSaved={fetchProjects} />

      <div className="w-full space-y-4">
        {successToast && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-center justify-between text-[12.5px] font-semibold animate-in fade-in slide-in-from-top-1 shadow-2xs">
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" /><span>{successToast}</span></div>
            <button onClick={() => setSuccessToast(null)} className="text-green-600 hover:text-green-800 text-[11px] font-bold cursor-pointer">Dismiss</button>
          </div>
        )}

        <Breadcrumbs items={[{ label: 'Time Sheet' }]} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-studio-border pb-3">
          <div>
            <h2 className="text-[20px] font-bold tracking-tight text-studio-text">Time Sheet</h2>
            <p className="text-[12px] text-studio-muted">Log and submit hours worked against projects</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-studio-border bg-studio-sidebar/40 text-[11.5px]">
              <Clock className="w-3.5 h-3.5 text-brand-orange" />
              <span className="text-studio-muted">Logged: <strong className="text-studio-text font-mono">{totalLoggedAll}h</strong></span>
              <span className="text-studio-border font-bold">|</span>
              <span className="text-studio-muted">Unlogged: <strong className="text-brand-orange font-mono">{unloggedHours}h</strong></span>
            </div>
            <MonthYearPicker value={selectedMonth} onChange={setSelectedMonth} />
          </div>
        </div>

        {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-[12px] font-semibold">{error}</div>}

        <div className="border border-studio-border rounded-lg bg-white overflow-hidden shadow-sm">
          <div className="bg-studio-sidebar border-b border-studio-border px-5 py-2.5 text-[10px] font-bold text-studio-muted uppercase tracking-wider grid grid-cols-12 gap-3 items-center">
            <div className="col-span-4">PROJECT & CLIENT</div>
            <div className="col-span-2">BILLING TYPE</div>
            <div className="col-span-1 text-center">LOGGED</div>
            <div className="col-span-2">BUDGET</div>
            <div className="col-span-2 text-center">STATUS</div>
            <div className="col-span-1 text-right">ACTION</div>
          </div>

          <div className="divide-y divide-studio-border bg-white">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
            ) : projects.length === 0 ? (
              <div className="p-8 text-center text-[12px] text-studio-muted">No projects found for {selectedMonth}.</div>
            ) : (
              projects.map((proj) => {
                const isHourly = proj.billingType === 'T&M' || proj.billingType === 'Hourly Rate (T&M)';
                const isLockedForEmp = isEmp && (proj.myStatus ? proj.myStatus !== 'Draft' : (proj.status === 'Submitted' || proj.status === 'PM_Approved' || proj.status === 'Approved'));
                const isPartial = proj.status === 'Partially_Submitted';
                const badgeText = proj.status === 'Approved' ? 'Approved' :
                                  proj.status === 'PM_Approved' ? 'PM Approved' :
                                  isPartial ? `Partially Submitted (${proj.submittedCount || 0}/${proj.totalAssigned || 1})` :
                                  proj.status === 'Submitted' ? ((proj.totalAssigned || 1) > 1 ? `Submitted (${proj.submittedCount || proj.totalAssigned}/${proj.totalAssigned})` : 'Submitted') :
                                  'Draft';
                const badgeColor = proj.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' :
                                   proj.status === 'PM_Approved' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                   isPartial ? 'bg-amber-50 text-amber-800 border-amber-300' :
                                   proj.status === 'Submitted' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                   'bg-slate-50 text-slate-700 border-slate-200';

                return (
                  <div key={proj.id} onClick={() => setSelectedProjectForDetail(proj)} className="group px-5 py-3 grid grid-cols-12 gap-3 text-[12.5px] items-center hover:bg-studio-hover/40 transition-colors cursor-pointer">
                    <div className="col-span-4 min-w-0 pr-2">
                      <p className="font-semibold text-studio-text truncate group-hover:text-brand-orange transition-colors">{proj.projectName}</p>
                      <p className="text-[11px] text-studio-muted truncate mt-0.5">{proj.client} • <span className="font-mono">{proj.id}</span></p>
                    </div>
                    <div className="col-span-2 flex items-center"><BillingBadge type={proj.billingType} /></div>
                    <div className="col-span-1 text-center font-mono text-studio-muted text-[12px]">{proj.timeLogged}h</div>
                    <div className="col-span-2 min-w-0">
                      {isHourly ? (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-mono text-studio-muted"><span>{proj.timeLogged}/{proj.budgetHours}h</span><span className="font-bold text-brand-orange">{proj.percentage}%</span></div>
                          <div className="w-full h-1.5 bg-studio-sidebar rounded-full overflow-hidden border border-studio-border"><div className="h-full bg-brand-orange transition-all duration-300" style={{ width: `${proj.percentage}%` }} /></div>
                        </div>
                      ) : (<span className="text-[11px] font-mono text-studio-muted">{proj.timeLogged}h</span>)}
                    </div>
                    <div className="col-span-2 text-center">
                      <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border inline-block max-w-full truncate ${badgeColor}`}>
                        {badgeText}
                      </span>
                    </div>
                    <div className="col-span-1 text-right flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <button type="button" disabled={isLockedForEmp} onClick={() => { if (!isLockedForEmp) setQuickLogProject(proj); }} title={isLockedForEmp ? 'Timesheet is locked' : 'Quick Log Time'} className={`p-1 rounded transition-colors cursor-pointer ${isLockedForEmp ? 'text-studio-muted/40 cursor-not-allowed' : 'text-studio-muted hover:text-brand-orange hover:bg-orange-50'}`}><Timer className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => setSelectedProjectForDetail(proj)} title="View Detailed Daily Grid" className="p-1 text-studio-muted hover:text-brand-orange hover:bg-orange-50 rounded transition-colors cursor-pointer"><Eye className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}
