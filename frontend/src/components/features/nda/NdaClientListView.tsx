import { useState } from 'react';
import { Plus, ArrowLeft, CheckCircle2, Clock, Lock, Users, Pencil, Trash2 } from 'lucide-react';

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
  documentContent?: string;
}

interface NdaClientListViewProps {
  clientId: string;
  clientName: string;
  loading: boolean;
  ndas: ClientNDAItem[];
  searchQuery: string;
  isSuperAdmin?: boolean;
  onBack: () => void;
  onCreateNew: () => void;
  onEditNDA: (nda: ClientNDAItem) => void;
  onSelectNDA: (ndaId: string) => void;
  onRefresh: () => void;
}

export default function NdaClientListView({
  clientName,
  loading,
  ndas,
  searchQuery,
  isSuperAdmin = false,
  onBack,
  onCreateNew,
  onEditNDA,
  onSelectNDA,
  onRefresh,
}: NdaClientListViewProps) {
  const [filter, setFilter] = useState<'All' | 'Closed' | 'Draft'>('All');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const closedCount = ndas.filter((n) => n.rawStatus === 'Closed' || n.status.includes('Closed')).length;
  const draftCount = ndas.filter((n) => n.status.includes('Draft') || (n.signedCount === 0 && n.rawStatus !== 'Closed')).length;
  const allCount = ndas.length;

  const filtered = ndas.filter((n) => {
    const matchesSearch =
      !searchQuery ||
      n.ndaName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.ndaCode.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'Closed') {
      return n.rawStatus === 'Closed' || n.status.includes('Closed');
    }
    if (filter === 'Draft') {
      return n.status.includes('Draft') || (n.signedCount === 0 && n.rawStatus !== 'Closed');
    }
    return true;
  });

  const handleDeleteNDA = async (e: React.MouseEvent, ndaId: string, ndaCode: string) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to permanently delete NDA "${ndaCode}"?`)) {
      return;
    }

    setDeletingId(ndaId);
    try {
      const res = await fetch(`/api/ndas/${ndaId}`, { method: 'DELETE' });
      if (res.ok) {
        onRefresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete NDA');
      }
    } catch (err: any) {
      alert('Error deleting NDA: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

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
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <CheckCircle2 className="w-3 h-3 text-blue-600" />
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
      {/* Header bar: Border stroke under heading matching Teams page (border-b border-studio-border pb-3) & Teams filter compound */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-studio-border pb-3">
        {/* Left: Back button + Client Name */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
            title="Back to Clients"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h2 className="text-[20px] font-bold tracking-tight text-studio-text">{clientName}</h2>
        </div>

        {/* Right: Teams Filter Compound (Closed -> Draft -> ALL) & Action Button */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* 1. Closed */}
            <button
              type="button"
              onClick={() => setFilter('Closed')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11.5px] border transition-all cursor-pointer shadow-2xs ${
                filter === 'Closed'
                  ? 'bg-white text-studio-text border-slate-300 font-bold'
                  : 'bg-studio-sidebar/60 border-studio-border text-studio-muted hover:text-studio-text hover:bg-studio-sidebar font-medium'
              }`}
            >
              <span>Closed</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                {closedCount}
              </span>
            </button>

            {/* 2. Draft */}
            <button
              type="button"
              onClick={() => setFilter('Draft')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11.5px] border transition-all cursor-pointer shadow-2xs ${
                filter === 'Draft'
                  ? 'bg-white text-studio-text border-slate-300 font-bold'
                  : 'bg-studio-sidebar/60 border-studio-border text-studio-muted hover:text-studio-text hover:bg-studio-sidebar font-medium'
              }`}
            >
              <span>Draft</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                {draftCount}
              </span>
            </button>

            {/* 3. ALL */}
            <button
              type="button"
              onClick={() => setFilter('All')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11.5px] border transition-all cursor-pointer shadow-2xs ${
                filter === 'All'
                  ? 'bg-white text-studio-text border-slate-300 font-bold'
                  : 'bg-studio-sidebar/60 border-studio-border text-studio-muted hover:text-studio-text hover:bg-studio-sidebar font-medium'
              }`}
            >
              <span>ALL</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                {allCount}
              </span>
            </button>
          </div>

          {/* Action button on right */}
          {isSuperAdmin && (
            <button
              type="button"
              onClick={onCreateNew}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-orange text-white rounded-lg text-[12px] font-bold hover:bg-opacity-90 transition-colors shadow-sm cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" /> Create New NDA
            </button>
          )}
        </div>
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
              <p>{searchQuery ? `No NDAs matching "${searchQuery}"` : `No NDA documents found under filter "${filter}".`}</p>
              {!searchQuery && isSuperAdmin && (
                <button
                  type="button"
                  onClick={onCreateNew}
                  className="text-brand-orange hover:underline text-[12px] font-semibold cursor-pointer"
                >
                  + Click here to create a new NDA
                </button>
              )}
            </div>
          ) : (
            filtered.map((nda) => {
              const submittedDate = nda.submittedAt || nda.closedAt;
              return (
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
                  <div className="col-span-3 font-semibold text-slate-800 group-hover:text-brand-orange transition-colors truncate">
                    <span className="truncate">{nda.ndaName}</span>
                  </div>

                  {/* 3. Creation Date */}
                  <div className="col-span-2 text-slate-600 font-mono text-[11.5px]">
                    {formatDate(nda.createdAt)}
                  </div>

                  {/* 4. Submitted Date (Admin close date or completion date) */}
                  <div className="col-span-2 text-slate-600 font-mono text-[11.5px]">
                    {formatDate(submittedDate)}
                  </div>

                  {/* 5. Assigned Employees */}
                  <div className="col-span-1 text-center" title={nda.assignedEmployeeNames.join(', ')}>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      <Users className="w-2.5 h-2.5 text-blue-600" />
                      <span>{nda.totalCount}</span>
                    </span>
                  </div>

                  {/* 6. STATUS (Aligned under STATUS header, with hover Edit/Delete icons) */}
                  <div className="col-span-2 flex items-center justify-between min-w-0 pr-1">
                    <div>
                      {getStatusBadge(nda.status, nda.rawStatus)}
                    </div>

                    {/* Edit & Delete hover buttons (Super Admin) */}
                    {isSuperAdmin && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0 ml-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditNDA(nda);
                          }}
                          title="Edit NDA"
                          className="p-1 text-slate-400 hover:text-brand-orange hover:bg-orange-50 rounded transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteNDA(e, nda.id, nda.ndaCode)}
                          disabled={deletingId === nda.id}
                          title="Delete NDA from Database"
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
