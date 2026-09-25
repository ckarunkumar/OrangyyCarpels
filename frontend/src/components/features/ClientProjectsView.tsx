import { useState, useEffect, useMemo } from 'react';
import { UserRole } from '../ui/Layout';
import { Plus, CheckCircle2, ArrowLeft } from 'lucide-react';
import { SkeletonRow } from '../ui/Skeleton';
import { Project, Client, Employee } from '../../types/registry';
import ProjectDetailDrawer from './ProjectDetailDrawer';
import MonthlyBudgetDrawer from './MonthlyBudgetDrawer';
import ProjectFormView from './ProjectFormView';
import ClientProjectsRow from './ClientProjectsRow';
import ClientUsersListView from './ClientUsersListView';
import Breadcrumbs from '../ui/Breadcrumbs';
import { useSearch } from '../../context/SearchContext';

interface ClientProjectsViewProps {
  client: Client;
  activeRole: UserRole;
  allClients: Client[];
  onBack: () => void;
}

export default function ClientProjectsView({ client, activeRole, allClients, onBack }: ClientProjectsViewProps) {
  const { searchQuery, setSearchPlaceholder } = useSearch();
  const [tab, setTab] = useState<'projects' | 'client-users'>('projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projectStatusFilter, setProjectStatusFilter] = useState<'all' | 'Active' | 'Inactive'>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [budgetProject, setBudgetProject] = useState<Project | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [targetProject, setTargetProject] = useState<Project | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [openAddUserModal, setOpenAddUserModal] = useState(false);

  const clientName = client.displayName || client.name;

  useEffect(() => {
    setSearchPlaceholder(tab === 'projects' ? `Search ${clientName} projects (code, name, manager, service)...` : `Search ${clientName} client users (name, email, ID)...`);
  }, [tab, clientName, setSearchPlaceholder]);

  const fetchClientProjects = () => {
    setLoading(true);
    Promise.all([fetch(`/api/projects?clientId=${client.id}`).then((r) => r.json()), fetch('/api/employees').then((r) => r.json()).catch(() => [])])
      .then(([projs, emps]) => { setProjects(Array.isArray(projs) ? projs : []); setEmployees(Array.isArray(emps) ? emps : []); setError(null); })
      .catch((err) => { setError(err.message); setProjects([]); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchClientProjects(); }, [client.id]);

  const projectCounts = useMemo(() => ({
    total: projects.length,
    active: projects.filter((p) => p.status === 'Active').length,
    inactive: projects.filter((p) => p.status === 'Inactive').length,
  }), [projects]);

  const isAdmin = activeRole === 'Super Admin' || activeRole === 'Project Manager';

  const handleOpenEdit = (proj: Project) => {
    setSelectedProject(null); setDetailOpen(false);
    setTargetProject(proj); setFormMode('edit'); setViewMode('form');
  };

  const handleSaved = (msg?: string) => {
    setViewMode('list');
    if (msg) { setSuccessToast(msg); setTimeout(() => setSuccessToast(null), 5000); }
    fetchClientProjects();
  };

  const filteredProjects = projects.filter((proj) => {
    if (projectStatusFilter === 'Active' && proj.status !== 'Active') return false;
    if (projectStatusFilter === 'Inactive' && proj.status !== 'Inactive') return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return proj.id.toLowerCase().includes(q) || proj.name.toLowerCase().includes(q) || (proj.businessLine && proj.businessLine.toLowerCase().includes(q)) || (proj.service && proj.service.toLowerCase().includes(q)) || (proj.managerName && proj.managerName.toLowerCase().includes(q));
  });

  if (viewMode === 'form') {
    return <ProjectFormView mode={formMode} project={formMode === 'edit' ? targetProject : null} clients={allClients.length > 0 ? allClients : [client]} employees={employees} activeRole={activeRole} defaultClientId={client.id} clientContextName={clientName} onBack={() => setViewMode('list')} onSaved={handleSaved} />;
  }

  return (
    <>
      <ProjectDetailDrawer open={detailOpen} project={selectedProject} isAdmin={isAdmin} onClose={() => setDetailOpen(false)} onEdit={handleOpenEdit} />
      <MonthlyBudgetDrawer open={!!budgetProject} projectId={budgetProject?.id || ''} projectName={budgetProject?.name || ''} isAdmin={isAdmin} onClose={() => setBudgetProject(null)} onSaved={fetchClientProjects} />

      <div className="w-full space-y-5 animate-in fade-in duration-200">
        {successToast && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-center justify-between text-[12.5px] font-semibold animate-in fade-in shadow-2xs">
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" /><span>{successToast}</span></div>
            <button onClick={() => setSuccessToast(null)} className="text-green-600 hover:text-green-800 text-[11px] font-bold cursor-pointer">Dismiss</button>
          </div>
        )}

        <Breadcrumbs items={[{ label: 'Client Management', onClick: onBack }, { label: clientName }, { label: tab === 'projects' ? 'Projects' : 'Client Users' }]} />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-studio-border pb-3">
          <div className="flex items-center gap-3">
            <button type="button" onClick={onBack} className="p-1.5 rounded-lg border border-studio-border bg-white hover:bg-studio-sidebar text-studio-text transition-colors cursor-pointer" title="Back to Client Management">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="text-[20px] font-bold tracking-tight text-studio-text">{clientName}</h2>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* 1. Filters: All / Active / Inactive */}
            {tab === 'projects' && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <button type="button" onClick={() => setProjectStatusFilter('all')} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11.5px] border transition-all cursor-pointer shadow-2xs ${projectStatusFilter === 'all' ? 'bg-white text-studio-text border-slate-300 font-bold' : 'bg-studio-sidebar/60 border-studio-border text-studio-muted hover:text-studio-text hover:bg-studio-sidebar font-medium'}`}>
                  <span>All</span><span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700">{projectCounts.total}</span>
                </button>
                <button type="button" onClick={() => setProjectStatusFilter(projectStatusFilter === 'Active' ? 'all' : 'Active')} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11.5px] border transition-all cursor-pointer shadow-2xs ${projectStatusFilter === 'Active' ? 'bg-white text-studio-text border-slate-300 font-bold' : 'bg-studio-sidebar/60 border-studio-border text-studio-muted hover:text-studio-text hover:bg-studio-sidebar font-medium'}`}>
                  <span>Active</span><span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700">{projectCounts.active}</span>
                </button>
                <button type="button" onClick={() => setProjectStatusFilter(projectStatusFilter === 'Inactive' ? 'all' : 'Inactive')} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11.5px] border transition-all cursor-pointer shadow-2xs ${projectStatusFilter === 'Inactive' ? 'bg-white text-studio-text border-slate-300 font-bold' : 'bg-studio-sidebar/60 border-studio-border text-studio-muted hover:text-studio-text hover:bg-studio-sidebar font-medium'}`}>
                  <span>Inactive</span><span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700">{projectCounts.inactive}</span>
                </button>
              </div>
            )}

            {/* 2. Tabs: Projects / Client Users */}
            <div className="flex p-0.5 rounded-lg bg-studio-sidebar border border-studio-border">
              <button type="button" onClick={() => setTab('projects')} className={`px-3 py-1.5 text-[12px] rounded-md transition-colors cursor-pointer ${tab === 'projects' ? 'bg-white text-brand-orange shadow-2xs font-bold' : 'text-studio-muted hover:text-studio-text font-medium'}`}>
                Projects ({projects.length})
              </button>
              <button type="button" onClick={() => setTab('client-users')} className={`px-3 py-1.5 text-[12px] rounded-md transition-colors cursor-pointer ${tab === 'client-users' ? 'bg-white text-brand-orange shadow-2xs font-bold' : 'text-studio-muted hover:text-studio-text font-medium'}`}>
                Client Users
              </button>
            </div>

            {/* 3. Action button: Add Project / Add Client User */}
            {isAdmin && (
              tab === 'projects' ? (
                <button type="button" onClick={() => { setTargetProject(null); setFormMode('add'); setViewMode('form'); }} className="flex items-center gap-1.5 px-4 py-2 bg-brand-orange text-white rounded-lg text-[12px] font-bold hover:bg-opacity-90 shadow-sm transition-all shrink-0 cursor-pointer">
                  <Plus className="w-4 h-4" /> Add Project
                </button>
              ) : (
                <button type="button" onClick={() => setOpenAddUserModal(true)} className="flex items-center gap-1.5 px-4 py-2 bg-brand-orange text-white rounded-lg text-[12px] font-bold hover:bg-opacity-90 shadow-sm transition-all shrink-0 cursor-pointer">
                  <Plus className="w-4 h-4" /> Add Client User
                </button>
              )
            )}
          </div>
        </div>

        {error && <div className="p-3 bg-red-50 text-red-700 rounded text-[12px] font-medium border border-red-200">{error}</div>}

        {tab === 'client-users' ? (
          <ClientUsersListView clients={allClients.length > 0 ? allClients : [client]} isAdmin={isAdmin} selectedClientId={client.id} openAddModal={openAddUserModal} onCloseAddModal={() => setOpenAddUserModal(false)} />
        ) : (
          <div className="border border-studio-border rounded-lg bg-white overflow-hidden shadow-sm">
            <div className="bg-studio-sidebar border-b border-studio-border px-5 py-2.5 text-[10px] font-bold text-studio-muted uppercase tracking-wider grid grid-cols-12 gap-3 items-center">
              <div className="col-span-1">PROJECT CODE</div>
              <div className="col-span-3">PROJECT NAME</div>
              <div className="col-span-2">PROJECT MANAGER</div>
              <div className="col-span-1 text-center">TEAM</div>
              <div className="col-span-1">BILLING TYPE</div>
              <div className="col-span-2">BUDGET / HOURS</div>
              <div className="col-span-1">STATUS</div>
              <div className="col-span-1 text-right">ACTION</div>
            </div>

            <div className="divide-y divide-studio-border bg-white">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filteredProjects.length === 0 ? (
                <div className="text-center py-10 space-y-1.5 text-studio-muted">
                  <p className="text-[13px] font-semibold text-studio-text">{searchQuery ? `No projects matching "${searchQuery}"` : `No projects registered for ${clientName}`}</p>
                </div>
              ) : (
                filteredProjects.map((proj) => (
                  <ClientProjectsRow
                    key={proj.id}
                    proj={proj}
                    employees={employees}
                    isAdmin={isAdmin}
                    onSelect={(p) => { setSelectedProject(p); setDetailOpen(true); }}
                    onEdit={handleOpenEdit}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
