import { useState, useEffect } from 'react';
import { UserRole } from '../ui/Layout';
import { Plus, FolderKanban, Pencil, Search, UserCheck, Users, CheckCircle2 } from 'lucide-react';
import { SkeletonRow } from '../ui/Skeleton';
import { Project, Client, Employee } from '../../types/registry';
import ProjectDetailDrawer from './ProjectDetailDrawer';
import MonthlyBudgetDrawer from './MonthlyBudgetDrawer';
import ProjectFormView from './ProjectFormView';
import Breadcrumbs from '../ui/Breadcrumbs';
import BillingBadge from '../ui/BillingBadge';

export default function ProjectsView({ activeRole }: { activeRole: UserRole }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [budgetProject, setBudgetProject] = useState<Project | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [targetProject, setTargetProject] = useState<Project | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/projects').then((r) => r.json()),
      fetch('/api/clients').then((r) => r.json()),
      fetch('/api/employees').then((r) => r.json()).catch(() => []),
    ])
      .then(([projs, cls, emps]) => {
        setProjects(projs || []); setClients(cls || []); setEmployees(Array.isArray(emps) ? emps : []);
        setError(null);
      })
      .catch((err) => { setError(err.message); setProjects([]); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const isAdmin = activeRole === 'Super Admin' || activeRole === 'Project Manager';

  const handleOpenEdit = (proj: Project) => { setSelectedProject(null); setDetailOpen(false); setTargetProject(proj); setFormMode('edit'); setViewMode('form'); };
  const handleOpenAdd = () => { setTargetProject(null); setFormMode('add'); setViewMode('form'); };
  const handleSaved = (msg?: string) => { setViewMode('list'); if (msg) { setSuccessToast(msg); setTimeout(() => setSuccessToast(null), 5000); } fetchData(); };

  const filteredProjects = projects.filter((proj) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      proj.id.toLowerCase().includes(q) ||
      proj.name.toLowerCase().includes(q) ||
      (proj.clientName && proj.clientName.toLowerCase().includes(q)) ||
      (proj.businessLine && proj.businessLine.toLowerCase().includes(q)) ||
      (proj.service && proj.service.toLowerCase().includes(q))
    );
  });

  if (viewMode === 'form') {
    return (
      <ProjectFormView
        mode={formMode}
        project={formMode === 'edit' ? targetProject : null}
        clients={clients}
        employees={employees}
        activeRole={activeRole}
        onBack={() => setViewMode('list')}
        onSaved={handleSaved}
      />
    );
  }

  return (
    <>
      <ProjectDetailDrawer open={detailOpen} project={selectedProject} isAdmin={isAdmin} onClose={() => setDetailOpen(false)} onEdit={handleOpenEdit} />
      <MonthlyBudgetDrawer open={!!budgetProject} projectId={budgetProject?.id || ''} projectName={budgetProject?.name || ''} isAdmin={isAdmin} onClose={() => setBudgetProject(null)} onSaved={fetchData} />

      <div className="w-full space-y-5 animate-in fade-in duration-200">
        {successToast && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-center justify-between text-[12.5px] font-semibold animate-in fade-in slide-in-from-top-1 shadow-2xs">
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" /><span>{successToast}</span></div>
            <button onClick={() => setSuccessToast(null)} className="text-green-600 hover:text-green-800 text-[11px] font-bold cursor-pointer">Dismiss</button>
          </div>
        )}

        <Breadcrumbs items={[{ label: 'Project Registry' }]} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-studio-border pb-3">
          <div><h2 className="text-[20px] font-bold tracking-tight text-studio-text">Project Registry</h2><p className="text-[12px] text-studio-muted">Manage client project budgets, monthly hours, and timelines</p></div>
          <div className="flex items-center gap-2.5">
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-studio-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Search by project or client..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-8 pr-3 py-1.5 border border-studio-border rounded text-[12px] text-studio-text bg-white focus:outline-none focus:border-brand-orange transition-colors" />
            </div>
            {isAdmin && (
              <button type="button" onClick={handleOpenAdd} className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-orange text-white rounded text-[12px] font-semibold hover:bg-opacity-90 shadow-sm transition-all shrink-0 cursor-pointer">
                <Plus className="w-3.5 h-3.5" /> Add Project
              </button>
            )}
          </div>
        </div>

        {error && <div className="p-3 bg-red-50 text-red-700 rounded text-[12px] font-medium border border-red-200">{error}</div>}

        <div className="border border-studio-border rounded-lg bg-white overflow-hidden shadow-sm">
          <div className="bg-studio-sidebar border-b border-studio-border px-5 py-2.5 text-[10px] font-bold text-studio-muted uppercase tracking-wider grid grid-cols-12 gap-3 items-center">
            <div className="col-span-2">Project Name</div>
            <div className="col-span-1">Project Code</div>
            <div className="col-span-2">Client Name</div>
            <div className="col-span-2">Project Manager</div>
            <div className="col-span-1 text-center">Team</div>
            <div className="col-span-1">Billing Type</div>
            <div className="col-span-2">Budget / Hours</div>
            <div className="col-span-1 text-right">Status</div>
          </div>

          <div className="divide-y divide-studio-border bg-white">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-10 space-y-1.5 text-studio-muted">
                <p className="text-[13px] font-semibold text-studio-text">{searchQuery ? `No projects matching "${searchQuery}"` : 'No projects registered'}</p>
                {searchQuery && (<button onClick={() => setSearchQuery('')} className="text-[11px] text-brand-orange hover:underline cursor-pointer">Clear search filter</button>)}
              </div>
            ) : (
              filteredProjects.map((proj) => {
                const isHourly = proj.billingType === 'T&M' || proj.billingType === 'Hourly Rate (T&M)';
                const consumption = isHourly ? Math.round(((proj.loggedHours || 0) / (proj.budgetHours || 1)) * 100) : 0;
                const assignedCount = proj.assignedEmployees?.length || 0;
                const assignedNames = proj.assignedEmployees && proj.assignedEmployees.length > 0
                  ? proj.assignedEmployees.map((id) => {
                      const found = employees.find((e) => (e.employeeId || String(e.id)) === id);
                      return found ? found.fullName : id;
                    }).join(', ')
                  : 'No team members assigned';

                return (
                  <div key={proj.id} onClick={() => { setSelectedProject(proj); setDetailOpen(true); }} className="group px-5 py-3 grid grid-cols-12 gap-3 text-[12.5px] items-center hover:bg-studio-hover/40 transition-colors cursor-pointer">
                    {/* 1. Project Name */}
                    <div className="col-span-2 min-w-0 pr-2 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded bg-studio-sidebar flex items-center justify-center text-studio-muted border border-studio-border shrink-0">
                        <FolderKanban className="w-3.5 h-3.5 text-studio-muted group-hover:text-brand-orange transition-colors" />
                      </div>
                      <p className="font-semibold text-studio-text truncate group-hover:text-brand-orange transition-colors text-[12.5px]">{proj.name}</p>
                    </div>

                    {/* 2. Project Code */}
                    <div className="col-span-1 min-w-0">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-studio-sidebar border border-studio-border text-studio-text inline-block">
                        {proj.id}
                      </span>
                    </div>

                    {/* 3. Client Name */}
                    <div className="col-span-2 min-w-0 pr-2">
                      <p className="font-medium text-studio-text truncate text-[12px]">
                        {proj.clientName || proj.clientId}
                      </p>
                    </div>

                    {/* 4. Project Manager */}
                    <div className="col-span-2 min-w-0 pr-2">
                      <p className="text-[12px] font-medium text-studio-text truncate flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-brand-orange shrink-0" />
                        <span className="truncate">{proj.managerName || proj.managerId || 'Unassigned'}</span>
                      </p>
                    </div>

                    {/* 5. Team */}
                    <div className="col-span-1 text-center" title={assignedNames}>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 cursor-help">
                        <Users className="w-3 h-3 text-blue-600 shrink-0" />
                        <span>{assignedCount}</span>
                      </span>
                    </div>

                    {/* 6. Billing Type */}
                    <div className="col-span-1 flex items-center">
                      <BillingBadge type={proj.billingType} />
                    </div>

                    {/* 7. Budget / Hours */}
                    <div className="col-span-2 pr-2">
                      {isHourly ? (
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[10.5px] font-mono text-studio-muted">
                            <span>{proj.loggedHours || 0}/{proj.budgetHours || 0}h</span>
                            <span className="font-bold text-brand-orange">{consumption}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-studio-sidebar rounded-full overflow-hidden border border-studio-border/60">
                            <div className="h-full bg-brand-orange transition-all duration-300" style={{ width: `${Math.min(100, consumption)}%` }} />
                          </div>
                        </div>
                      ) : (
                        <span className="text-[11.5px] font-mono text-studio-muted">{proj.loggedHours || 0}h tracked</span>
                      )}
                    </div>

                    {/* 8. Status */}
                    <div className="col-span-1 text-right flex items-center justify-end gap-1.5">
                      {isAdmin && <button type="button" onClick={(e) => { e.stopPropagation(); handleOpenEdit(proj); }} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-studio-sidebar rounded text-studio-muted hover:text-brand-orange cursor-pointer transition-opacity"><Pencil className="w-3.5 h-3.5" /></button>}
                      <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${proj.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>{proj.status}</span>
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
