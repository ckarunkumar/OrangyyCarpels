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
import { getCurrentMonthIso } from '../../utils/dateUtils';

export interface ProjectTimesheetItem {
  id: string; client: string; projectName: string; billingType: string;
  timeLogged: number; budgetHours: number; percentage: number; status: string;
  myStatus?: string; submittedCount?: number; totalAssigned?: number;
  startDate?: string; endDate?: string; budgetType?: string; clientName?: string;
}

export interface ClientTimesheetSummary {
  clientName: string;
  billingType: string;
  totalProjects: number;
  draftProjects: number;
  submittedProjects: number;
  timeLogged: number;
  budgetHours: number;
  percentage: number;
  status: string;
  projects: ProjectTimesheetItem[];
}

export default function TimesheetsView({ activeRole }: { activeRole: UserRole }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const targetProjectId = searchParams.get('projectId');
  const [projects, setProjects] = useState<ProjectTimesheetItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedProjectForDetail, setSelectedProjectForDetail] = useState<ProjectTimesheetItem | null>(null);
  const [quickLogProject, setQuickLogProject] = useState<ProjectTimesheetItem | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthIso());
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
          if (match) {
            setSelectedClient(match.client);
            setSelectedProjectForDetail(match);
          }
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

  // LEVEL 3: Detailed Timesheet Grid
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

  const totalLoggedAll = projects.reduce((sum, p) => sum + p.timeLogged, 0);
  const unloggedHours = Math.max(0, 176 - totalLoggedAll);

  // Group Projects by Client for Level 1
  const clientSummaryMap = new Map<string, ClientTimesheetSummary>();
  projects.forEach((proj) => {
    const cName = proj.client || 'Other Clients';
    if (!clientSummaryMap.has(cName)) {
      clientSummaryMap.set(cName, {
        clientName: cName,
        billingType: proj.billingType,
        totalProjects: 0,
        draftProjects: 0,
        submittedProjects: 0,
        timeLogged: 0,
        budgetHours: 0,
        percentage: 0,
        status: 'Draft',
        projects: [],
      });
    }
    const item = clientSummaryMap.get(cName)!;
    item.totalProjects += 1;
    if (proj.status === 'Draft') item.draftProjects += 1;
    else item.submittedProjects += 1;
    item.timeLogged += proj.timeLogged;
    item.budgetHours += proj.budgetHours || 100;
    item.projects.push(proj);
  });

  const clientSummaries = Array.from(clientSummaryMap.values()).map((item) => {
    const isHourly = item.billingType === 'T&M' || item.billingType === 'Hourly Rate (T&M)';
    const percentage = isHourly ? Math.min(100, Math.round((item.timeLogged / (item.budgetHours || 100)) * 100)) : 0;
    const allDraft = item.projects.every((p) => p.status === 'Draft');
    const anyApproved = item.projects.some((p) => p.status === 'Approved');
    const anyPMApproved = item.projects.some((p) => p.status === 'PM_Approved');
    const anyPartial = item.projects.some((p) => p.status === 'Partially_Submitted');

    const status = anyApproved ? 'Approved' : anyPMApproved ? 'PM_Approved' : anyPartial ? 'Partially_Submitted' : allDraft ? 'Draft' : 'Submitted';
    return { ...item, percentage, status };
  });

  // Filter Projects for Level 2 (when client selected)
  const level2Projects = selectedClient ? projects.filter((p) => p.client === selectedClient) : [];

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

        {/* Breadcrumbs */}
        {selectedClient ? (
          <Breadcrumbs items={[
            { label: 'Time Sheet', onClick: () => setSelectedClient(null) },
            { label: selectedClient }
          ]} />
        ) : (
          <Breadcrumbs items={[{ label: 'Time Sheet' }]} />
        )}

        {/* Header Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-studio-border pb-3">
          <div>
            <h2 className="text-[20px] font-bold tracking-tight text-studio-text">
              {selectedClient ? selectedClient : 'Time Sheet'}
            </h2>
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

        {/* TABLE CONTENT */}
        <div className="border border-studio-border rounded-lg bg-white overflow-hidden shadow-sm">
          {!selectedClient ? (
            /* LEVEL 1: CLIENT LIST (Image 1) */
            <>
              <div className="bg-studio-sidebar border-b border-studio-border px-5 py-2.5 text-[10px] font-bold text-studio-muted uppercase tracking-wider grid grid-cols-12 gap-3 items-center">
                <div className="col-span-3">CLIENT NAME</div>
                <div className="col-span-1">BILLING TYPE</div>
                <div className="col-span-1 text-center">TOTAL PROJECTS</div>
                <div className="col-span-1 text-center">DRAFT PROJECTS</div>
                <div className="col-span-1 text-center">SUBMITTED PROJECTS</div>
                <div className="col-span-1 text-center">LOGGED</div>
                <div className="col-span-2">HOURS BURNED</div>
                <div className="col-span-1 text-center">STATUS</div>
                <div className="col-span-1 text-right">ACTION</div>
              </div>

              <div className="divide-y divide-studio-border bg-white">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
                ) : clientSummaries.length === 0 ? (
                  <div className="p-8 text-center text-[12px] text-studio-muted">No clients found for {selectedMonth}.</div>
                ) : (
                  clientSummaries.map((clientItem) => {
                    const isHourly = clientItem.billingType === 'T&M' || clientItem.billingType === 'Hourly Rate (T&M)';
                    return (
                      <div
                        key={clientItem.clientName}
                        onClick={() => setSelectedClient(clientItem.clientName)}
                        className="group px-5 py-3.5 grid grid-cols-12 gap-3 text-[12.5px] items-center hover:bg-studio-hover/40 transition-colors cursor-pointer"
                      >
                        {/* CLIENT NAME */}
                        <div className="col-span-3 min-w-0 pr-2">
                          <p className="font-semibold text-studio-text truncate group-hover:text-brand-orange transition-colors">
                            {clientItem.clientName}
                          </p>
                        </div>

                        {/* BILLING TYPE */}
                        <div className="col-span-1 flex items-center">
                          <BillingBadge type={clientItem.billingType} />
                        </div>

                        {/* TOTAL PROJECTS */}
                        <div className="col-span-1 text-center font-sans font-medium text-studio-text">
                          {clientItem.totalProjects}
                        </div>

                        {/* DRAFT PROJECTS */}
                        <div className="col-span-1 text-center font-sans font-medium text-studio-text">
                          {clientItem.draftProjects}
                        </div>

                        {/* SUBMITTED PROJECTS */}
                        <div className="col-span-1 text-center font-sans font-medium text-studio-text">
                          {clientItem.submittedProjects}
                        </div>

                        {/* LOGGED */}
                        <div className="col-span-1 text-center font-sans text-studio-muted text-[12px]">
                          {clientItem.timeLogged}h
                        </div>

                        {/* HOURS BURNED */}
                        <div className="col-span-2 min-w-0">
                          {isHourly ? (
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] font-mono text-studio-muted">
                                <span>{clientItem.timeLogged}/{clientItem.budgetHours}h</span>
                                <span className="font-bold text-[#F25624]">{clientItem.percentage}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-studio-sidebar rounded-full overflow-hidden border border-studio-border">
                                <div className="h-full bg-[#F25624] transition-all duration-300" style={{ width: `${clientItem.percentage}%` }} />
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] font-sans text-studio-muted">{clientItem.timeLogged}h tracked</span>
                          )}
                        </div>

                        {/* STATUS */}
                        <div className="col-span-1 text-center">
                          <span className="text-[11px] font-semibold px-3 py-1 rounded-full border border-amber-300 bg-amber-50 text-amber-800 inline-block">
                            Draft
                          </span>
                        </div>

                        {/* ACTION */}
                        <div className="col-span-1 text-right flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => {
                              if (clientItem.projects.length > 0) setQuickLogProject(clientItem.projects[0]);
                            }}
                            title="Quick Log Time"
                            className="p-1.5 text-studio-muted hover:text-brand-orange hover:bg-orange-50 rounded transition-colors cursor-pointer"
                          >
                            <Timer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedClient(clientItem.clientName)}
                            title="View Client Projects"
                            className="p-1.5 text-studio-muted hover:text-brand-orange hover:bg-orange-50 rounded transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            /* LEVEL 2: PROJECT LIST UNDER CLIENT (Image 2, 4, 6, 8, 10) */
            <>
              <div className="bg-studio-sidebar border-b border-studio-border px-5 py-2.5 text-[10px] font-bold text-studio-muted uppercase tracking-wider grid grid-cols-12 gap-3 items-center">
                <div className="col-span-2">PROJECT CODE</div>
                <div className="col-span-3">PROJECT NAME</div>
                <div className="col-span-2">BILLING TYPE</div>
                <div className="col-span-1 text-center">LOGGED</div>
                <div className="col-span-2">HOURS BURNED</div>
                <div className="col-span-1 text-center">STATUS</div>
                <div className="col-span-1 text-right">ACTION</div>
              </div>

              <div className="divide-y divide-studio-border bg-white">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
                ) : level2Projects.length === 0 ? (
                  <div className="p-8 text-center text-[12px] text-studio-muted">No projects found for client {selectedClient}.</div>
                ) : (
                  level2Projects.map((proj, idx) => {
                    const isHourly = proj.billingType === 'T&M' || proj.billingType === 'Hourly Rate (T&M)';
                    const isPartial = proj.status === 'Partially_Submitted';
                    const projectCode = `PC000${idx + 1}`;

                    // Status Pills across Stages
                    const badgeText = proj.status === 'Approved' ? 'Approved' :
                                      proj.status === 'PM_Approved' ? 'PM Approved' :
                                      isPartial ? `Partially Submitted (${proj.submittedCount || 1}/${proj.totalAssigned || 2})` :
                                      proj.status === 'Submitted' ? `Submitted (${proj.submittedCount || 2}/${proj.totalAssigned || 2})` :
                                      'Draft';

                    const badgeColor = proj.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' :
                                       proj.status === 'PM_Approved' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                       isPartial ? 'bg-amber-50 text-amber-800 border-amber-300' :
                                       proj.status === 'Submitted' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                       'bg-amber-50 text-amber-800 border-amber-300';

                    return (
                      <div
                        key={proj.id}
                        onClick={() => setSelectedProjectForDetail(proj)}
                        className="group px-5 py-3.5 grid grid-cols-12 gap-3 text-[12.5px] items-center hover:bg-studio-hover/40 transition-colors cursor-pointer"
                      >
                        {/* PROJECT CODE */}
                        <div className="col-span-2 font-mono text-[12px] text-studio-muted">
                          {projectCode}
                        </div>

                        {/* PROJECT NAME */}
                        <div className="col-span-3 min-w-0 pr-2">
                          <p className="font-semibold text-studio-text truncate group-hover:text-brand-orange transition-colors">
                            {proj.projectName}
                          </p>
                        </div>

                        {/* BILLING TYPE */}
                        <div className="col-span-2 flex items-center">
                          <BillingBadge type={proj.billingType} />
                        </div>

                        {/* LOGGED */}
                        <div className="col-span-1 text-center font-sans text-studio-muted text-[12px]">
                          {proj.timeLogged}h
                        </div>

                        {/* HOURS BURNED */}
                        <div className="col-span-2 min-w-0">
                          {isHourly ? (
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] font-mono text-studio-muted">
                                <span>{proj.timeLogged}/{proj.budgetHours}h</span>
                                <span className="font-bold text-[#F25624]">{proj.percentage}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-studio-sidebar rounded-full overflow-hidden border border-studio-border">
                                <div className="h-full bg-[#F25624] transition-all duration-300" style={{ width: `${proj.percentage}%` }} />
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] font-sans text-studio-muted">{proj.timeLogged}h tracked</span>
                          )}
                        </div>

                        {/* STATUS */}
                        <div className="col-span-1 text-center">
                          <span className={`text-[11px] font-semibold px-3 py-1 rounded-full border inline-block max-w-full truncate ${badgeColor}`}>
                            {badgeText}
                          </span>
                        </div>

                        {/* ACTION */}
                        <div className="col-span-1 text-right flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setQuickLogProject(proj)}
                            title="Quick Log Time"
                            className="p-1.5 text-studio-muted hover:text-brand-orange hover:bg-orange-50 rounded transition-colors cursor-pointer"
                          >
                            <Timer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedProjectForDetail(proj)}
                            title="View Detailed Daily Grid"
                            className="p-1.5 text-studio-muted hover:text-brand-orange hover:bg-orange-50 rounded transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

