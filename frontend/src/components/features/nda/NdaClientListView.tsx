import { Plus, ArrowLeft, FileText, CheckCircle2, Clock, Lock, Users, Eye } from 'lucide-react';

export interface ClientNDAItem {
  id: string;
  ndaCode: string;
  ndaName: string;
  clientId: string;
  clientName: string;
  createdAt: string;
  submittedAt?: string | null;
  closedAt?: string | null;
  status: string;
  rawStatus: string;
  totalCount: number;
  signedCount: number;
  assignedEmployeeNames: string[];
}

interface NdaClientListViewProps {
  clientId: string;
  clientName: string;
  loading: boolean;
  ndas: ClientNDAItem[];
  searchQuery: string;
  onBack: () => void;
  onCreateNew: () => void;
  onSelectNDA: (ndaId: string) => void;
}

export default function NdaClientListView({
  clientName,
  loading,
  ndas,
  searchQuery,
  onBack,
  onCreateNew,
  onSelectNDA,
}: NdaClientListViewProps) {
  const filtered = ndas.filter(
    (n) =>
      !searchQuery ||
      n.ndaName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.ndaCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string, rawStatus: string) => {
    if (rawStatus === 'Closed' || status.includes('Closed')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
          <Lock className="w-3 h-3 text-slate-600" />
          <span>Closed</span>
        </span>
      );
    }
    if (status.includes('Submitted') && !status.includes('Partially')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-green-50 text-green-700 border border-green-200">
          <CheckCircle2 className="w-3 h-3 text-green-600" />
          <span>{status}</span>
        </span>
      );
    }
    if (status.includes('Partially')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
          <Clock className="w-3 h-3 text-amber-600" />
          <span>{status}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-50 text-slate-600 border border-slate-200">
        <span>Draft</span>
      </span>
    );
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return '—';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header bar with Back button and Create New NDA button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 border border-studio-border rounded-lg shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
            title="Back to Clients"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h3 className="text-[16px] font-bold text-slate-900">{clientName}</h3>
            <p className="text-[11.5px] text-slate-500 font-medium">Client Non-Disclosure Agreements ({ndas.length})</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCreateNew}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-orange text-white rounded-lg text-[12px] font-bold hover:bg-opacity-90 transition-colors shadow-sm cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" /> Create New NDA
        </button>
      </div>

      {/* NDA Grid */}
      <div className="border border-studio-border rounded-lg bg-white overflow-hidden shadow-sm">
        <div className="bg-studio-sidebar border-b border-studio-border px-5 py-2.5 text-[10px] font-bold text-studio-muted uppercase tracking-wider grid grid-cols-12 gap-3 items-center shrink-0">
          <div className="col-span-2">NDA CODE</div>
          <div className="col-span-3">NDA NAME</div>
          <div className="col-span-2">CREATION DATE</div>
          <div className="col-span-2">SUBMITTED DATE</div>
          <div className="col-span-1 text-center">ASSIGNED</div>
          <div className="col-span-2">STATUS</div>
        </div>

        <div className="divide-y divide-studio-border bg-white">
          {loading ? (
            <div className="py-12 text-center text-[12px] text-studio-muted animate-pulse">
              Loading NDAs for {clientName}...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-studio-muted text-[12.5px] space-y-2">
              <p>{searchQuery ? `No NDAs matching "${searchQuery}"` : `No NDA documents created yet for ${clientName}.`}</p>
              {!searchQuery && (
                <button
                  type="button"
                  onClick={onCreateNew}
                  className="text-brand-orange hover:underline text-[12px] font-semibold cursor-pointer"
                >
                  + Click here to create the first NDA
                </button>
              )}
            </div>
          ) : (
            filtered.map((nda) => (
              <div
                key={nda.id}
                onClick={() => onSelectNDA(nda.id)}
                className="group grid grid-cols-12 gap-3 px-5 py-3.5 items-center hover:bg-studio-hover/40 transition-colors cursor-pointer text-[12.5px]"
              >
                {/* 1. NDA Code */}
                <div className="col-span-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-orange-200 bg-orange-50 text-brand-orange inline-block">
                    {nda.ndaCode}
                  </span>
                </div>

                {/* 2. NDA Name */}
                <div className="col-span-3 font-semibold text-slate-800 flex items-center gap-2 group-hover:text-brand-orange transition-colors truncate">
                  <FileText className="w-4 h-4 text-studio-muted shrink-0" />
                  <span className="truncate">{nda.ndaName}</span>
                </div>

                {/* 3. Creation Date */}
                <div className="col-span-2 text-slate-600 font-mono text-[11.5px]">
                  {formatDate(nda.createdAt)}
                </div>

                {/* 4. Submitted Date */}
                <div className="col-span-2 text-slate-600 font-mono text-[11.5px]">
                  {formatDate(nda.submittedAt)}
                </div>

                {/* 5. Assigned Employees */}
                <div className="col-span-1 text-center" title={nda.assignedEmployeeNames.join(', ')}>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    <Users className="w-2.5 h-2.5 text-blue-600" />
                    <span>{nda.totalCount}</span>
                  </span>
                </div>

                {/* 6. Status */}
                <div className="col-span-2 flex items-center justify-between min-w-0">
                  {getStatusBadge(nda.status, nda.rawStatus)}
                  <div className="p-1 text-slate-400 group-hover:text-brand-orange rounded hover:bg-orange-50 transition-colors shrink-0">
                    <Eye className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
