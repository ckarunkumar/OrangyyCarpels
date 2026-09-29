import { Building2, FileText, Users, ChevronRight } from 'lucide-react';

export interface ClientNDASummary {
  clientId: string;
  clientCode: string;
  clientName: string;
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
        <div className="col-span-2">CLIENT CODE</div>
        <div className="col-span-4">CLIENT NAME</div>
        <div className="col-span-3 text-center">NO. OF EMPLOYEES ASSIGNED</div>
        <div className="col-span-2 text-center">NO. OF NDAS</div>
        <div className="col-span-1 text-right">ACTION</div>
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
          filtered.map((c) => (
            <div
              key={c.clientId}
              onClick={() => onSelectClient(c.clientId, c.clientName)}
              className="group grid grid-cols-12 gap-3 px-5 py-3.5 items-center hover:bg-studio-hover/40 transition-colors cursor-pointer text-[12.5px]"
            >
              {/* 1. Client Code */}
              <div className="col-span-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-blue-200 bg-blue-50 text-blue-700 inline-block">
                  {c.clientCode}
                </span>
              </div>

              {/* 2. Client Name */}
              <div className="col-span-4 font-semibold text-slate-800 flex items-center gap-2 group-hover:text-brand-orange transition-colors">
                <Building2 className="w-4 h-4 text-studio-muted shrink-0" />
                <span className="truncate">{c.clientName}</span>
              </div>

              {/* 3. No. of Employees Assigned */}
              <div className="col-span-3 text-center">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  <Users className="w-3 h-3 text-slate-500" />
                  <span>{c.assignedEmployeesCount} Employees</span>
                </span>
              </div>

              {/* 4. No. of NDAs */}
              <div className="col-span-2 text-center">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${c.ndasCount > 0 ? 'bg-orange-50 border-orange-200 text-brand-orange' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                  <FileText className="w-3 h-3" />
                  <span>{c.ndasCount} {c.ndasCount === 1 ? 'NDA' : 'NDAs'}</span>
                </span>
              </div>

              {/* 5. Action */}
              <div className="col-span-1 text-right flex justify-end">
                <div className="p-1 rounded-full text-slate-400 group-hover:text-brand-orange group-hover:bg-orange-50 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
