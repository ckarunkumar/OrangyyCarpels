import { Users, FileText } from 'lucide-react';

export interface ClientNDASummary {
  clientId: string;
  clientCode: string;
  clientName: string;
  status?: string;
  assignedEmployeesCount: number;
  ndasCount: number;
}

interface NdaClientsGridProps {
  loading: boolean;
  clients: ClientNDASummary[];
  searchQuery: string;
  onSelectClient: (clientId: string, clientName: string) => void;
}

export default function NdaClientsGrid({
  loading,
  clients,
  searchQuery,
  onSelectClient,
}: NdaClientsGridProps) {
  const filtered = clients.filter(
    (c) =>
      !searchQuery ||
      c.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.clientCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="border border-studio-border rounded-lg bg-white overflow-hidden shadow-sm">
      <div className="bg-studio-sidebar border-b border-studio-border px-5 py-2.5 text-[10px] font-bold text-studio-muted uppercase tracking-wider grid grid-cols-12 gap-3 items-center shrink-0">
        <div className="col-span-3">CLIENT CODE</div>
        <div className="col-span-4">CLIENT NAME</div>
        <div className="col-span-3 text-center">NO. OF EMPLOYEES ASSIGNED</div>
        <div className="col-span-2 text-center">NO. OF NDAS</div>
      </div>

      <div className="divide-y divide-studio-border bg-white">
        {loading ? (
          <div className="py-12 text-center text-[12px] text-studio-muted animate-pulse">
            Loading client NDA directory...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-studio-muted text-[12.5px]">
            {searchQuery ? `No clients matching "${searchQuery}"` : 'No clients found in registry.'}
          </div>
        ) : (
          filtered.map((c) => {
            const isActive = !c.status || c.status === 'Active';
            return (
              <div
                key={c.clientId}
                onClick={() => onSelectClient(c.clientId, c.clientName)}
                className="group grid grid-cols-12 gap-3 px-5 py-3.5 items-center hover:bg-studio-hover/40 transition-colors cursor-pointer text-[12.5px]"
              >
                {/* 1. Client Code (Green for Active, Red for Inactive) */}
                <div className="col-span-3">
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border inline-block ${
                      isActive
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-red-50 text-red-600 border-red-200'
                    }`}
                  >
                    {c.clientCode}
                  </span>
                </div>

                {/* 2. Client Name */}
                <div className="col-span-4 font-semibold text-slate-800 group-hover:text-brand-orange transition-colors truncate">
                  {c.clientName}
                </div>

                {/* 3. No. of Employees Assigned (Exact Teams Projects column UI pattern) */}
                <div className="col-span-3 text-center flex justify-center">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border whitespace-nowrap ${
                      c.assignedEmployeesCount > 0
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    <Users
                      className={`w-2.5 h-2.5 ${
                        c.assignedEmployeesCount > 0 ? 'text-blue-600' : 'text-slate-400'
                      }`}
                    />
                    <span>{c.assignedEmployeesCount}</span>
                  </span>
                </div>

                {/* 4. No. of NDAs (Exact Teams Projects column UI pattern) */}
                <div className="col-span-2 text-center flex justify-center">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border whitespace-nowrap ${
                      c.ndasCount > 0
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    <FileText
                      className={`w-2.5 h-2.5 ${
                        c.ndasCount > 0 ? 'text-blue-600' : 'text-slate-400'
                      }`}
                    />
                    <span>{c.ndasCount}</span>
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
