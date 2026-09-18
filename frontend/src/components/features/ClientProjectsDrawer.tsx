import { useState, useEffect } from 'react';
import { X, FolderKanban, Building2, Clock } from 'lucide-react';
import { Client } from '../../types/registry';
import BillingBadge from '../ui/BillingBadge';

interface ClientProjectsDrawerProps {
  open: boolean;
  client: Client | null;
  initialFilter?: 'all' | 'Active' | 'Inactive';
  onClose: () => void;
}

export default function ClientProjectsDrawer({ open, client, initialFilter = 'all', onClose }: ClientProjectsDrawerProps) {
  const [filter, setFilter] = useState<'all' | 'Active' | 'Inactive'>('all');

  useEffect(() => {
    if (open) {
      setFilter(initialFilter);
    }
  }, [open, initialFilter]);

  if (!client) return null;
  const allProjects = client.projects || [];
  const activeCount = allProjects.filter((p) => p.status === 'Active').length;
  const inactiveCount = allProjects.filter((p) => p.status === 'Inactive').length;

  const filteredProjects = allProjects.filter((p) => {
    if (filter === 'Active') return p.status === 'Active';
    if (filter === 'Inactive') return p.status === 'Inactive';
    return true;
  });

  return (
    <>
      <div onClick={onClose} className={`fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />
      <div className={`fixed top-0 right-0 z-50 h-full w-full max-w-[460px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-studio-border shrink-0">
          <div>
            <h3 className="text-[15px] font-bold text-studio-text flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-brand-orange" />
              Client Projects
            </h3>
            <p className="text-[11px] text-studio-muted flex items-center gap-1 mt-0.5">
              <Building2 className="w-3 h-3" /> {client.name} <span className="font-mono text-brand-orange">({client.id})</span>
            </p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded flex items-center justify-center text-studio-muted hover:bg-studio-bg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="px-6 pt-3 pb-2 border-b border-studio-border/70 flex items-center gap-2 bg-studio-sidebar/40">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
              filter === 'all' ? 'bg-white border border-studio-border text-studio-text shadow-xs' : 'text-studio-muted hover:text-studio-text'
            }`}
          >
            All ({allProjects.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('Active')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
              filter === 'Active' ? 'bg-green-50 border border-green-200 text-green-700 shadow-xs' : 'text-studio-muted hover:text-green-700'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            Active ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('Inactive')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
              filter === 'Inactive' ? 'bg-red-50 border border-red-200 text-red-700 shadow-xs' : 'text-studio-muted hover:text-red-700'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
            Inactive ({inactiveCount})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {filteredProjects.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-studio-border rounded-lg bg-studio-sidebar/40 space-y-2">
              <FolderKanban className="w-8 h-8 text-studio-muted/50 mx-auto" />
              <p className="text-[13px] font-medium text-studio-text">
                {filter === 'all' ? 'No projects linked yet' : `No ${filter.toLowerCase()} projects found`}
              </p>
              <p className="text-[11px] text-studio-muted">
                {filter === 'all' ? 'Create a project under this client in Project Registry.' : `No projects with ${filter} status.`}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredProjects.map((proj) => {
                const isHourly = proj.billingType === 'T&M' || proj.billingType === 'Hourly Rate (T&M)';
                const isActive = proj.status === 'Active';
                return (
                  <div key={proj.id} className="p-3.5 border border-studio-border rounded-lg bg-white shadow-xs hover:border-brand-orange/40 transition-colors space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 bg-studio-sidebar border border-studio-border rounded text-studio-text">
                            {proj.id}
                          </span>
                          <h4 className="text-[13px] font-bold text-studio-text truncate">{proj.name}</h4>
                        </div>
                        <div className="mt-1">
                          <BillingBadge type={proj.billingType} />
                        </div>
                      </div>
                      <span className={`text-[9px] font-semibold px-2 py-0.2 rounded-full border shrink-0 ${
                        isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {proj.status}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-studio-border/60 flex items-center justify-between text-[11px] text-studio-muted">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-studio-muted" />
                        {isHourly ? `${proj.loggedHours} / ${proj.budgetHours} hrs` : `${proj.loggedHours} hrs logged`}
                      </span>
                      {proj.rate && proj.rate !== 'RESTRICTED' && (
                        <span className="font-semibold text-brand-orange font-mono">{proj.rate}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
