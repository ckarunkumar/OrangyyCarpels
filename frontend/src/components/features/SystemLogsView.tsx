import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import SystemLogsMapModal from './SystemLogsMapModal';
import SystemLogsRow, { LoginLogItem } from './SystemLogsRow';
import { useSearch } from '../../context/SearchContext';

export default function SystemLogsView() {
  const { searchQuery, setSearchPlaceholder } = useSearch();
  const [logs, setLogs] = useState<LoginLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedMapLog, setSelectedMapLog] = useState<LoginLogItem | null>(null);

  useEffect(() => {
    setSearchPlaceholder('Search system logs (user, email, IP, city, OS, device)...');
  }, [setSearchPlaceholder]);

  const fetchLogs = useCallback(async (targetPage = 1, query = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: targetPage.toString(),
        limit: '25',
        ...(query ? { search: query } : {}),
      });
      const res = await fetch(`/api/logs/logins?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch logs');
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setPage(data.page || 1);
      setTotalPages(data.totalPages || 1);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs(page, searchQuery);
  }, [page, searchQuery, fetchLogs]);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <SystemLogsMapModal
        isOpen={Boolean(selectedMapLog)}
        onClose={() => setSelectedMapLog(null)}
        locationInfo={
          selectedMapLog
            ? {
                city: selectedMapLog.city,
                region: selectedMapLog.region,
                country: selectedMapLog.country,
                latitude: selectedMapLog.latitude,
                longitude: selectedMapLog.longitude,
                ipAddress: selectedMapLog.ipAddress,
                userName: selectedMapLog.fullName,
              }
            : null
        }
      />

      {/* Top Controls */}
      <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-studio-border shadow-xs">
        <div>
          <h3 className="text-[14px] font-bold text-studio-text">System Activity Logs</h3>
          <p className="text-[11.5px] text-studio-muted">Live audit trail of user logins and sessions</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchLogs(page, searchQuery)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-studio-text hover:bg-studio-hover border border-studio-border rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-studio-muted ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <span className="text-[11.5px] text-studio-muted px-2.5 py-1 bg-studio-bg rounded-lg border border-studio-border">
            Total: <strong className="text-studio-text font-bold">{total}</strong> records
          </span>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-studio-border rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-studio-border bg-studio-bg/60 text-[11px] font-semibold text-studio-muted uppercase tracking-wider">
                <th className="py-2.5 px-4">User</th>
                <th className="py-2.5 px-4">Email</th>
                <th className="py-2.5 px-4">Login Time</th>
                <th className="py-2.5 px-4">IP & Network</th>
                <th className="py-2.5 px-4">Approx. Location</th>
                <th className="py-2.5 px-4">System</th>
                <th className="py-2.5 px-4">Device</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-studio-border text-[12px]">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-studio-muted">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-orange" />
                    Loading system activity logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-studio-muted">
                    <AlertCircle className="w-6 h-6 mx-auto mb-2 text-studio-muted/60" />
                    No login activity records found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <SystemLogsRow key={log.id} log={log} onOpenMap={setSelectedMapLog} />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-2.5 bg-studio-bg/40 border-t border-studio-border text-[11.5px] text-studio-muted">
            <span>Page <strong className="text-studio-text">{page}</strong> of <strong className="text-studio-text">{totalPages}</strong></span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="px-2.5 py-1 border border-studio-border rounded-md bg-white hover:bg-studio-hover text-studio-text disabled:opacity-40 transition-colors cursor-pointer"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="px-2.5 py-1 border border-studio-border rounded-md bg-white hover:bg-studio-hover text-studio-text disabled:opacity-40 transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
