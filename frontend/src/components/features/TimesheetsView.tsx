import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { UserRole } from '../ui/Layout';
import { Clock, CheckCircle2 } from 'lucide-react';
import QuickTimeDrawer from './QuickTimeDrawer';
import ProjectTimesheetView from './ProjectTimesheetView';
import Breadcrumbs from '../ui/Breadcrumbs';
import MonthYearPicker from '../ui/MonthYearPicker';
import { getCurrentMonthIso } from '../../utils/dateUtils';
import { useSearch } from '../../context/SearchContext';
import TimesheetClientTable from './timesheet/TimesheetClientTable';
import TimesheetProjectTable from './timesheet/TimesheetProjectTable';

export interface ProjectTimesheetItem {
  id: string; client: string; projectName: string; billingType: string;
  timeLogged: number; budgetHours: number; percentage: number; status: string;
  myStatus?: string; submittedCount?: number; totalAssigned?: number;
  startDate?: string; endDate?: string; budgetType?: string; clientName?: string;
}

export interface ClientTimesheetSummary {
  clientName: string; billingType: string; totalProjects: number;
  draftProjects: number; submittedProjects: number; timeLogged: number;
  budgetHours: number; percentage: number; status: string;
  projects: ProjectTimesheetItem[];
}

export default function TimesheetsView({ activeRole }: { activeRole: UserRole }) {
  const { searchQuery, setSearchPlaceholder } = useSearch();
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

  useEffect(() => {
    setSearchPlaceholder(selectedClient ? `Search ${selectedClient} projects...` : 'Search timesheet projects & clients...');
  }, [selectedClient, setSearchPlaceholder]);

  const fetchProjects = () => {
    setLoading(true);
    fetch(`/api/timesheets/projects-summary?month=${selectedMonth}`)
      .then((res) => res.json())
      .then((data: ProjectTimesheetItem[]) => {
        setProjects(data || []);
        setError(null);
        if (targetProjectId && data) {
          const match = data.find((p) => p.id === targetProjectId);
          if (match) { setSelectedClient(match.client); setSelectedProjectForDetail(match); }
        }
      })
      .catch((err) => { setError(err.message); setProjects([]); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProjects(); }, [selectedMonth, targetProjectId]);

  const handleBackFromDetail = (successMsg?: string) => {
    setSelectedProjectForDetail(null);
    if (targetProjectId) setSearchParams({});
    if (successMsg) { setSuccessToast(successMsg); setTimeout(() => setSuccessToast(null), 5000); fetchProjects(); }
  };

  if (selectedProjectForDetail) {
    return <ProjectTimesheetView project={selectedProjectForDetail} month={selectedMonth} activeRole={activeRole} onBack={handleBackFromDetail} onRefresh={fetchProjects} />;
  }

  const totalLoggedAll = projects.reduce((sum, p) => sum + p.timeLogged, 0);
  const unloggedHours = Math.max(0, 176 - totalLoggedAll);

  const clientSummaryMap = new Map<string, ClientTimesheetSummary>();
  projects.forEach((proj) => {
    const cName = proj.client || 'Other Clients';
    if (!clientSummaryMap.has(cName)) {
      clientSummaryMap.set(cName, {
        clientName: cName, billingType: proj.billingType, totalProjects: 0,
        draftProjects: 0, submittedProjects: 0, timeLogged: 0, budgetHours: 0, percentage: 0, status: 'Draft', projects: [],
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

  const q = searchQuery.toLowerCase().trim();

  const clientSummaries = Array.from(clientSummaryMap.values()).map((item) => {
    const isHourly = item.billingType === 'T&M' || item.billingType === 'Hourly Rate (T&M)';
    const percentage = isHourly ? Math.min(100, Math.round((item.timeLogged / (item.budgetHours || 100)) * 100)) : 0;
    const allDraft = item.projects.every((p) => p.status === 'Draft');
    const anyApproved = item.projects.some((p) => p.status === 'Approved');
    const anyPMApproved = item.projects.some((p) => p.status === 'PM_Approved');
    const anyPartial = item.projects.some((p) => p.status === 'Partially_Submitted');
    const status = anyApproved ? 'Approved' : anyPMApproved ? 'PM_Approved' : anyPartial ? 'Partially_Submitted' : allDraft ? 'Draft' : 'Submitted';
    return { ...item, percentage, status };
  }).filter((item) => !q || item.clientName.toLowerCase().includes(q) || item.projects.some((p) => p.projectName.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)));

  const level2Projects = selectedClient ? projects.filter((p) => p.client === selectedClient && (!q || p.projectName.toLowerCase().includes(q) || p.id.toLowerCase().includes(q))) : [];

  return (
    <>
      <QuickTimeDrawer open={!!quickLogProject} project={quickLogProject} onClose={() => setQuickLogProject(null)} onSaved={fetchProjects} />

      <div className="w-full space-y-4 animate-in fade-in duration-200">
        {successToast && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-center justify-between text-[12.5px] font-semibold animate-in fade-in shadow-2xs shrink-0">
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" /><span>{successToast}</span></div>
            <button onClick={() => setSuccessToast(null)} className="text-green-600 hover:text-green-800 text-[11px] font-bold cursor-pointer">Dismiss</button>
          </div>
        )}

        <div className="shrink-0 space-y-3">
          <Breadcrumbs items={selectedClient ? [{ label: 'Time Sheet', onClick: () => setSelectedClient(null) }, { label: selectedClient }] : [{ label: 'Time Sheet' }]} />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-studio-border pb-3">
            <div>
              <h2 className="text-[20px] font-bold tracking-tight text-studio-text">{selectedClient || 'Time Sheet'}</h2>
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
        </div>

        {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-[12px] font-semibold shrink-0">{error}</div>}

        {!selectedClient ? (
          <TimesheetClientTable
            loading={loading} clientSummaries={clientSummaries} selectedMonth={selectedMonth}
            onSelectClient={(c) => setSelectedClient(c)} onQuickLog={(p) => setQuickLogProject(p)}
          />
        ) : (
          <TimesheetProjectTable
            loading={loading} projects={level2Projects} selectedClient={selectedClient}
            onSelectProject={(p) => setSelectedProjectForDetail(p)} onQuickLog={(p) => setQuickLogProject(p)}
          />
        )}
      </div>
    </>
  );
}
