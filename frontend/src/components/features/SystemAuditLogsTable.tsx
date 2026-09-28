import { RefreshCw, AlertCircle } from 'lucide-react';
import SystemLogsRow, { LoginLogItem } from './SystemLogsRow';

interface SystemAuditLogsTableProps {
  logs: LoginLogItem[];
  loading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onOpenMap: (log: LoginLogItem) => void;
}

export default function SystemAuditLogsTable({
  logs,
  loading,
  page,
  totalPages,
  onPageChange,
  onOpenMap,
}: SystemAuditLogsTableProps) {
  return (
    <div className="border border-studio-border rounded-lg bg-white overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-studio-sidebar border-b border-studio-border text-[10px] font-bold text-studio-muted uppercase tracking-wider">
              <th className="py-2.5 px-5 font-bold">User</th>
              <th className="py-2.5 px-5 font-bold">Email</th>
              <th className="py-2.5 px-5 font-bold">Login Time</th>
              <th className="py-2.5 px-5 font-bold">IP & Network</th>
              <th className="py-2.5 px-5 font-bold">Approx. Location</th>
              <th className="py-2.5 px-5 font-bold">System</th>
              <th className="py-2.5 px-5 font-bold">Device</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-studio-border bg-white text-[12.5px]">
            {loading && logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-orange" />
                  Loading system activity logs...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <AlertCircle className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                  No login activity records found.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <SystemLogsRow key={log.id} log={log} onOpenMap={onOpenMap} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/50 border-t border-slate-100 text-[11.5px] text-slate-500">
          <span>Page <strong className="text-slate-800">{page}</strong> of <strong className="text-slate-800">{totalPages}</strong></span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page <= 1 || loading}
              className="px-2.5 py-1 border border-slate-200 rounded-md bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages || loading}
              className="px-2.5 py-1 border border-slate-200 rounded-md bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
