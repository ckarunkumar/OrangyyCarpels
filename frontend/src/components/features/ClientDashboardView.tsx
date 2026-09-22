import { useState, useEffect } from 'react';
import { Building2, FolderGit2, Eye, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Project } from '../../types/registry';
import ClientProjectTimesheetDrawer from './ClientProjectTimesheetDrawer';

export default function ClientDashboardView() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/projects')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setProjects(data || []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  const totalLogged = projects.reduce((acc, p) => acc + (p.loggedHours || 0), 0);

  return (
    <>
      <ClientProjectTimesheetDrawer open={!!selectedProject} project={selectedProject} onClose={() => setSelectedProject(null)} />

      <div className="w-full space-y-6 animate-in fade-in duration-200">
        {/* Client Portal Header */}
        <div className="bg-white border border-studio-border rounded-xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-brand-orange" />
              <h2 className="text-[20px] font-bold text-studio-text tracking-tight">
                {user?.department || 'Client'} Portal
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10.5px] font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> External Client User
              </span>
            </div>
            <p className="text-[12.5px] text-studio-muted mt-1">
              Logged in as <span className="font-semibold text-studio-text">{user?.fullName}</span> ({user?.email}) • Authorized project reporting
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-lg bg-studio-sidebar border border-studio-border text-center">
              <div className="text-[10.5px] font-bold uppercase text-studio-muted">Assigned Projects</div>
              <div className="text-[18px] font-bold text-studio-text font-mono">{projects.length}</div>
            </div>
            <div className="px-4 py-2 rounded-lg bg-orange-50 border border-orange-200 text-center">
              <div className="text-[10.5px] font-bold uppercase text-brand-orange">Total Hours Logged</div>
              <div className="text-[18px] font-bold text-brand-orange font-mono">{totalLogged}h</div>
            </div>
          </div>
        </div>

        {/* Assigned Projects Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-brand-orange" />
              <h3 className="text-[15px] font-bold text-studio-text">My Authorized Projects</h3>
            </div>
            <span className="text-[11.5px] text-studio-muted">Showing only projects explicitly assigned to your account</span>
          </div>

          <div className="border border-studio-border rounded-xl bg-white overflow-hidden shadow-sm">
            <div className="bg-studio-sidebar border-b border-studio-border px-5 py-2.5 text-[10px] font-bold text-studio-muted uppercase tracking-wider grid grid-cols-12 gap-3 items-center">
              <div className="col-span-2">Project Code</div>
              <div className="col-span-4">Project Name</div>
              <div className="col-span-2">Project Manager</div>
              <div className="col-span-2">Timeline / Dates</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-1 text-right">Reporting</div>
            </div>

            <div className="divide-y divide-studio-border bg-white">
              {loading ? (
                <div className="py-10 text-center text-[12px] text-studio-muted animate-pulse">Loading assigned projects...</div>
              ) : projects.length === 0 ? (
                <div className="py-12 text-center text-[12.5px] text-studio-muted">
                  No projects are currently assigned to your client account. Please contact your Project Manager.
                </div>
              ) : (
                projects.map((proj) => (
                  <div key={proj.id} className="group px-5 py-3.5 grid grid-cols-12 gap-3 text-[12.5px] items-center hover:bg-studio-hover/40 transition-colors">
                    <div className="col-span-2">
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-studio-sidebar border border-studio-border text-studio-text">
                        {proj.id}
                      </span>
                    </div>

                    <div className="col-span-4 font-semibold text-studio-text truncate">
                      {proj.name}
                    </div>

                    <div className="col-span-2 text-studio-muted truncate text-[12px]">
                      {proj.managerName || '—'}
                    </div>

                    <div className="col-span-2 text-studio-muted text-[11.5px] truncate">
                      {proj.startDate || '—'} {proj.endDate ? `→ ${proj.endDate}` : ''}
                    </div>

                    <div className="col-span-1">
                      <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${proj.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                        {proj.status}
                      </span>
                    </div>

                    <div className="col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedProject(proj)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-orange-50 border border-orange-200 text-brand-orange text-[11.5px] font-bold hover:bg-brand-orange hover:text-white transition-all cursor-pointer shadow-2xs ml-auto"
                        title="View Timesheet Logs"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
