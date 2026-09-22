import { useState, useEffect } from 'react';
import { UserRole } from '../ui/Layout';
import { Plus, Search, CheckCircle2, ArrowLeft } from 'lucide-react';
import { SkeletonRow } from '../ui/Skeleton';
import { Project, Client, Employee } from '../../types/registry';
import ProjectDetailDrawer from './ProjectDetailDrawer';
import MonthlyBudgetDrawer from './MonthlyBudgetDrawer';
import ProjectFormView from './ProjectFormView';
import ClientProjectsRow from './ClientProjectsRow';
import Breadcrumbs from '../ui/Breadcrumbs';

interface ClientProjectsViewProps {
  client: Client;
  activeRole: UserRole;
  allClients: Client[];
  onBack: () => void;
}

export default function ClientProjectsView({ client, activeRole, allClients, onBack }: ClientProjectsViewProps) {
  const [projects, setProjects] = useState<Project[]>([]);
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

  const fetchClientProjects = () => {
    setLoading(true);
    Promise.all([
      fetch(`/api/projects?clientId=${client.id}`).then((r) => r.json()),
      fetch('/api/employees').then((r) => r.json()).catch(() => []),
    ])
      .then(([projs, emps]) => {
        setProjects(Array.isArray(projs) ? projs : []);
        setEmployees(Array.isArray(emps) ? emps : []);
        setError(null);
      })
      .catch((err) => { setError(err.message); setProjects([]); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchClientProjects(); }, [client.id]);

  const isAdmin = activeRole === 'Super Admin' || activeRole === 'Project Manager';
  const clientName = client.displayName || client.name;

  const handleOpenEdit = (proj: Project) => {
    setSelectedProject(null); setDetailOpen(false);
    setTargetProject(proj); setFormMode('edit'); setViewMode('form');
  };

  const handleOpenAdd = () => {
    setTargetProject(null); setFormMode('add'); setViewMode('form');
  };

  const handleSaved = (msg?: string) => {
    setViewMode('list');
    if (msg) { setSuccessToast(msg); setTimeout(() => setSuccessToast(null), 5000); }
    fetchClientProjects();
  };

  const filteredProjects = projects.filter((proj) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      proj.id.toLowerCase().includes(q) ||
      proj.name.toLowerCase().includes(q) ||
      (proj.businessLine && proj.businessLine.toLowerCase().includes(q)) ||
      (proj.service && proj.service.toLowerCase().includes(q)) ||
      (proj.managerName && proj.managerName.toLowerCase().includes(q))
    );
  });

  if (viewMode === 'form') {
    return (
      <ProjectFormView
        mode={formMode}
        project={formMode === 'edit' ? targetProject : null}
        clients={allClients.length > 0 ? allClients : [client]}
        employees={employees}
        activeRole={activeRole}
        defaultClientId={client.id}
        clientContextName={clientName}
        onBack={() => setViewMode('list')}
        onSaved={handleSaved}
      />
    );
  }

  return (
    <>
      <ProjectDetailDrawer open={detailOpen} project={selectedProject} isAdmin={isAdmin} onClose={() => setDetailOpen(false)} onEdit={handleOpenEdit} />
      <MonthlyBudgetDrawer open={!!budgetProject} projectId={budgetProject?.id || ''} projectName={budgetProject?.name || ''} isAdmin={isAdmin} onClose={() => setBudgetProject(null)} onSaved={fetchClientProjects} />

      <div className="w-full space-y-5 animate-in fade-in duration-200">
        {successToast && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-center justify-between text-[12.5px] font-semibold animate-in fade-in slide-in-from-top-1 shadow-2xs">
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" /><span>{successToast}</span></div>
            <button onClick={() => setSuccessToast(null)} className="text-green-600 hover:text-green-800 text-[11px] font-bold cursor-pointer">Dismiss</button>
          </div>
        )}

        <Breadcrumbs items={[{ label: 'Clientele', onClick: onBack }, { label: clientName }, { label: 'Projects' }]} />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-studio-border pb-3">
          <div className="flex items-center gap-3">
            <button type="button" onClick={onBack} className="p-1.5 rounded-lg border border-studio-border bg-white hover:bg-studio-sidebar text-studio-text transition-colors cursor-pointer" title="Back to Clientele">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-[20px] font-bold tracking-tight text-studio-text">{clientName}</h2>
              <p className="text-[12px] text-studio-muted">Manage {clientName} projects, monthly hours, and timelines</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-studio-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder={`Search ${clientName} projects...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-8 pr-3 py-1.5 border border-studio-border rounded text-[12px] text-studio-text bg-white focus:outline-none focus:border-brand-orange transition-colors" />
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
            <div className="col-span-2">Project Code</div>
            <div className="col-span-3">Project Name</div>
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
                <p className="text-[13px] font-semibold text-studio-text">{searchQuery ? `No projects matching "${searchQuery}"` : `No projects registered for ${clientName}`}</p>
                {searchQuery && (<button onClick={() => setSearchQuery('')} className="text-[11px] text-brand-orange hover:underline cursor-pointer">Clear search filter</button>)}
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
      </div>
    </>
  );
}
