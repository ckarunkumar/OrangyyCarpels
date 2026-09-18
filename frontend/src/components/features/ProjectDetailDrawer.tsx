import { X, FolderKanban, Building2, Pencil, Clock } from 'lucide-react';
import { Project } from '../../types/registry';
import BillingBadge from '../ui/BillingBadge';

interface ProjectDetailDrawerProps {
  open: boolean;
  project: Project | null;
  isAdmin: boolean;
  onClose: () => void;
  onEdit: (project: Project) => void;
}

export default function ProjectDetailDrawer({ open, project, isAdmin, onClose, onEdit }: ProjectDetailDrawerProps) {
  if (!project) return null;

  const isHourly = project.billingType === 'T&M' || project.billingType === 'Hourly Rate (T&M)';
  const consumption = isHourly ? Math.round(((project.loggedHours || 0) / (project.budgetHours || 1)) * 100) : 0;
  const isExceeded = consumption >= 70;

  return (
    <>
      <div onClick={onClose} className={`fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />
      <div className={`fixed top-0 right-0 z-50 h-full w-full max-w-[440px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-studio-border shrink-0">
          <div>
            <h3 className="text-[14px] font-bold text-studio-text">Project Details</h3>
            <p className="text-[11px] text-studio-muted font-mono">{project.id}</p>
          </div>
          <div className="flex items-center gap-1.5">
            {isAdmin && (
              <button type="button" onClick={() => { onClose(); onEdit(project); }} className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-brand-orange bg-orange-50 border border-brand-orange/30 rounded hover:bg-orange-100 transition-colors">
                <Pencil className="w-3 h-3" /> Edit
              </button>
            )}
            <button type="button" onClick={onClose} className="w-7 h-7 rounded flex items-center justify-center text-studio-muted hover:bg-studio-bg transition-colors"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-studio-border">
            <div className="w-12 h-12 rounded-lg bg-studio-sidebar flex items-center justify-center text-studio-muted border border-studio-border shrink-0">
              <FolderKanban className="w-6 h-6 text-studio-muted" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-[15px] font-bold text-studio-text truncate">{project.name}</h3>
              <p className="text-[11px] text-studio-muted flex items-center gap-1 mt-0.5">
                <Building2 className="w-3.5 h-3.5" /> {project.clientName || project.clientId}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-studio-sidebar border border-studio-border text-studio-text">{project.id}</span>
                <span className={`text-[9px] font-semibold px-2 py-0.2 rounded-full border ${project.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>{project.status}</span>
              </div>
            </div>
          </div>

          {isHourly ? (
            <div className="bg-white border border-studio-border rounded-lg p-4 space-y-2.5">
              <div className="flex justify-between items-center text-[12px]">
                <span className="text-studio-muted font-medium">Budget Hours Usage</span>
                <span className="font-bold text-studio-text">{project.loggedHours} / {project.budgetHours} hrs ({consumption}%)</span>
              </div>
              <div className="w-full h-2 bg-studio-bg rounded-full overflow-hidden border border-studio-border">
                <div className={`h-full transition-all ${isExceeded ? 'bg-amber-500' : 'bg-brand-blue'}`} style={{ width: `${Math.min(100, consumption)}%` }} />
              </div>
            </div>
          ) : (
            <div className="bg-white border border-studio-border rounded-lg p-4 flex justify-between items-center text-[12px]">
              <span className="text-studio-muted font-medium flex items-center gap-1.5"><Clock className="w-4 h-4 text-brand-blue" /> Total Tracked Hours</span>
              <span className="font-bold font-mono text-studio-text">{project.loggedHours} hrs logged</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 bg-studio-sidebar border border-studio-border rounded p-3 text-[12px]">
            <div>
              <span className="text-studio-muted block text-[10px] uppercase font-bold tracking-wider">Billing Type</span>
              <BillingBadge type={project.billingType} className="mt-1" />
            </div>
            <div>
              <span className="text-studio-muted block text-[10px] uppercase font-bold tracking-wider">Contract Rate</span>
              {project.rate === 'RESTRICTED' ? (
                <span className="text-red-500 font-semibold text-[11px] mt-0.5 block">RESTRICTED</span>
              ) : (
                <span className="font-bold text-studio-text text-brand-orange mt-0.5 block">{project.rate}</span>
              )}
            </div>
            <div>
              <span className="text-studio-muted block text-[10px] uppercase font-bold tracking-wider">Business Line (BL)</span>
              <span className="font-semibold text-studio-text mt-0.5 block">{project.businessLine || '—'}</span>
            </div>
            <div>
              <span className="text-studio-muted block text-[10px] uppercase font-bold tracking-wider">Service</span>
              <span className="font-semibold text-studio-text mt-0.5 block">{project.service || '—'}</span>
            </div>
            <div>
              <span className="text-studio-muted block text-[10px] uppercase font-bold tracking-wider">Project Start Date</span>
              <span className="font-medium text-studio-text mt-0.5 block">{project.startDate || '—'}</span>
            </div>
            <div>
              <span className="text-studio-muted block text-[10px] uppercase font-bold tracking-wider">Project End Date</span>
              <span className="font-medium text-studio-text mt-0.5 block">{project.endDate || 'Ongoing / Open'}</span>
            </div>
            <div>
              <span className="text-studio-muted block text-[10px] uppercase font-bold tracking-wider">Project Manager (PM)</span>
              <span className="font-semibold text-studio-text mt-0.5 block">{project.managerName || project.managerId || 'Unassigned'}</span>
            </div>
            <div>
              <span className="text-studio-muted block text-[10px] uppercase font-bold tracking-wider">Assigned Team</span>
              <span className="font-medium text-studio-text mt-0.5 block">{project.assignedEmployees && project.assignedEmployees.length > 0 ? `${project.assignedEmployees.length} members assigned` : 'All team eligible'}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
