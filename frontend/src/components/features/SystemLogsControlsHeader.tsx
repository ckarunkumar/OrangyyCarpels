import { RefreshCw, Users, Activity } from 'lucide-react';

interface SystemLogsControlsHeaderProps {
  activeTab: 'employees' | 'audit';
  onTabChange: (tab: 'employees' | 'audit') => void;
  empFilter: 'all' | 'Active' | 'Inactive';
  onEmpFilterChange: (filter: 'all' | 'Active' | 'Inactive') => void;
  counts: { total: number; active: number; inactive: number };
  totalAuditLogs: number;
  loading: boolean;
  onRefreshAudit: () => void;
}

export default function SystemLogsControlsHeader({
  activeTab,
  onTabChange,
  empFilter,
  onEmpFilterChange,
  counts,
  totalAuditLogs,
  loading,
  onRefreshAudit,
}: SystemLogsControlsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
      <div className="flex items-center gap-2">
        <div className="flex p-0.5 rounded-lg bg-studio-sidebar border border-studio-border">
          <button
            type="button"
            onClick={() => onTabChange('employees')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-md transition-colors cursor-pointer ${
              activeTab === 'employees' ? 'bg-white text-brand-orange shadow-2xs font-bold' : 'text-studio-muted hover:text-studio-text font-medium'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Employee Logins</span>
          </button>
          <button
            type="button"
            onClick={() => onTabChange('audit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-md transition-colors cursor-pointer ${
              activeTab === 'audit' ? 'bg-white text-brand-orange shadow-2xs font-bold' : 'text-studio-muted hover:text-studio-text font-medium'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Audit Trail</span>
          </button>
        </div>
      </div>

      {activeTab === 'employees' ? (
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => onEmpFilterChange(empFilter === 'Active' ? 'all' : 'Active')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11.5px] border transition-all cursor-pointer shadow-2xs ${
              empFilter === 'Active' ? 'bg-white text-studio-text border-slate-300 font-bold' : 'bg-studio-sidebar/60 border-studio-border text-studio-muted hover:text-studio-text hover:bg-studio-sidebar font-medium'
            }`}
          >
            <span>Active</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700">{counts.active}</span>
          </button>
          <button
            type="button"
            onClick={() => onEmpFilterChange(empFilter === 'Inactive' ? 'all' : 'Inactive')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11.5px] border transition-all cursor-pointer shadow-2xs ${
              empFilter === 'Inactive' ? 'bg-white text-studio-text border-slate-300 font-bold' : 'bg-studio-sidebar/60 border-studio-border text-studio-muted hover:text-studio-text hover:bg-studio-sidebar font-medium'
            }`}
          >
            <span>Inactive</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700">{counts.inactive}</span>
          </button>
          <button
            type="button"
            onClick={() => onEmpFilterChange('all')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11.5px] border transition-all cursor-pointer shadow-2xs ${
              empFilter === 'all' ? 'bg-white text-studio-text border-slate-300 font-bold' : 'bg-studio-sidebar/60 border-studio-border text-studio-muted hover:text-studio-text hover:bg-studio-sidebar font-medium'
            }`}
          >
            <span>All</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700">{counts.total}</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefreshAudit}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-studio-text hover:bg-studio-hover border border-studio-border rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-studio-muted ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <span className="text-[11.5px] text-studio-muted px-2.5 py-1 bg-studio-bg rounded-lg border border-studio-border">
            Total: <strong className="text-studio-text font-bold">{totalAuditLogs}</strong> records
          </span>
        </div>
      )}
    </div>
  );
}
