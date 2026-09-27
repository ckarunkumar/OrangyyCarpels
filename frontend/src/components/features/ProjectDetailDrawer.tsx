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
      <div className={`fixed top-0 right-0 z-50 h-full w-full max-w-[640px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-studio-border shrink-0 bg-white">
          <div>
            <h3 className="text-[16px] font-bold text-studio-text">Project Details</h3>
            <p className="text-[11.5px] text-studio-muted font-mono">{project.id} • {project.name}</p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button type="button" onClick={() => { onClose(); onEdit(project); }} className="flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] font-semibold text-brand-orange bg-orange-50 border border-brand-orange/30 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer">
                <Pencil className="w-3 h-3" /> Edit Project
              </button>
            )}
            <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-studio-muted hover:bg-studio-sidebar transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Spacious Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Project Overview Card */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50/70 border border-studio-border shadow-2xs">
            <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center text-studio-muted border border-studio-border shrink-0 shadow-2xs">
              <FolderKanban className="w-7 h-7 text-brand-orange" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-[16px] font-bold text-studio-text truncate">{project.name}</h3>
              <p className="text-[12px] text-studio-muted flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-3.5 h-3.5" /> {project.clientName || project.clientId}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white border border-studio-border text-studio-text">{project.id}</span>
                <span className={`text-[9.5px] font-semibold px-2.5 py-0.5 rounded-full border ${project.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>{project.status}</span>
              </div>
            </div>
          </div>

          {/* Budget Consumption Card */}
          {isHourly ? (
            <div className="bg-slate-50/70 border border-studio-border rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center text-[12.5px]">
                <span className="text-studio-muted font-medium">Budget Hours Usage</span>
                <span className="font-bold text-studio-text">{project.loggedHours} / {project.budgetHours} hrs ({consumption}%)</span>
              </div>
              <div className="w-full h-2.5 bg-white rounded-full overflow-hidden border border-studio-border">
                <div className={`h-full transition-all ${isExceeded ? 'bg-amber-500' : 'bg-brand-blue'}`} style={{ width: `${Math.min(100, consumption)}%` }} />
              </div>
            </div>
          ) : (
            <div className="bg-slate-50/70 border border-studio-border rounded-xl p-4 flex justify-between items-center text-[12.5px]">
              <span className="text-studio-muted font-medium flex items-center gap-2"><Clock className="w-4 h-4 text-brand-blue" /> Total Tracked Hours</span>
              <span className="font-bold font-mono text-studio-text text-[13px]">{project.loggedHours} hrs logged</span>
            </div>
          )}

          {/* Commercial & Contract Terms */}
          <div className="space-y-2.5">
            <h4 className="text-[12px] font-bold text-studio-text uppercase tracking-wider pb-1.5 border-b border-studio-border/70">1. Commercial & Contract Terms</h4>
            <div className="grid grid-cols-2 gap-3.5 bg-slate-50/70 border border-studio-border rounded-xl p-4 text-[12.5px]">
              <div>
                <span className="text-studio-muted block text-[10.5px] uppercase font-bold tracking-wider">Billing Type</span>
                <BillingBadge type={project.billingType} className="mt-1" />
              </div>
              <div>
                <span className="text-studio-muted block text-[10.5px] uppercase font-bold tracking-wider">Contract Rate</span>
                {project.rate === 'RESTRICTED' ? (
                  <span className="text-red-500 font-semibold text-[11.5px] mt-1 block">RESTRICTED</span>
                ) : (
                  <span className="font-bold text-studio-text text-brand-orange mt-1 block text-[13px]">{project.rate}</span>
                )}
              </div>
              <div>
                <span className="text-studio-muted block text-[10.5px] uppercase font-bold tracking-wider">Business Line (BL)</span>
                <span className="font-semibold text-studio-text mt-0.5 block">{project.businessLine || '—'}</span>
              </div>
              <div>
                <span className="text-studio-muted block text-[10.5px] uppercase font-bold tracking-wider">Service</span>
                <span className="font-semibold text-studio-text mt-0.5 block">{project.service || '—'}</span>
              </div>
              <div>
                <span className="text-studio-muted block text-[10.5px] uppercase font-bold tracking-wider">Project Start Date</span>
                <span className="font-medium text-studio-text mt-0.5 block">{project.startDate || '—'}</span>
              </div>
              <div>
                <span className="text-studio-muted block text-[10.5px] uppercase font-bold tracking-wider">Project End Date</span>
                <span className="font-medium text-studio-text mt-0.5 block">{project.endDate || 'Ongoing / Open'}</span>
              </div>
            </div>
          </div>

          {/* Team & Management */}
          <div className="space-y-2.5">
            <h4 className="text-[12px] font-bold text-studio-text uppercase tracking-wider pb-1.5 border-b border-studio-border/70">2. Team & Stakeholders</h4>
            <div className="grid grid-cols-2 gap-3.5 bg-slate-50/70 border border-studio-border rounded-xl p-4 text-[12.5px]">
              <div>
                <span className="text-studio-muted block text-[10.5px] uppercase font-bold tracking-wider">Project Manager (PM)</span>
                <span className="font-semibold text-studio-text mt-0.5 block">{project.managerName || project.managerId || 'Unassigned'}</span>
              </div>
              <div>
                <span className="text-studio-muted block text-[10.5px] uppercase font-bold tracking-wider">Client Contact Person</span>
                <span className="font-semibold text-studio-text mt-0.5 block">{project.clientContactPersonName || 'Unassigned'}</span>
              </div>
              <div className="col-span-2 pt-2 border-t border-studio-border/60">
                <span className="text-studio-muted block text-[10.5px] uppercase font-bold tracking-wider">Assigned Team</span>
                <span className="font-medium text-studio-text mt-0.5 block">{project.assignedEmployees && project.assignedEmployees.length > 0 ? `${project.assignedEmployees.length} members assigned (${project.assignedEmployees.join(', ')})` : 'All team eligible'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
