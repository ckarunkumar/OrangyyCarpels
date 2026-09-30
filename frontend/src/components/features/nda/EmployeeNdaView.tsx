import { useState, useEffect } from 'react';
import { FileText, CheckCircle2, Clock, Download, ShieldCheck } from 'lucide-react';
import NdaSigningModal from './NdaSigningModal';
import Breadcrumbs from '../../ui/Breadcrumbs';

export interface EmployeeNDAItem {
  assignmentId: string;
  ndaId: string;
  ndaCode: string;
  ndaName: string;
  clientName: string;
  assignedDate: string;
  signedAt?: string | null;
  status: 'Pending Signature' | 'Signed';
  personalEmail: string;
  isNdaClosed: boolean;
}

interface EmployeeNdaViewProps {
  searchQuery: string;
}

export default function EmployeeNdaView({ searchQuery }: EmployeeNdaViewProps) {
  const [ndas, setNdas] = useState<EmployeeNDAItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [signingItem, setSigningItem] = useState<EmployeeNDAItem | null>(null);
  const [documentContent, setDocumentContent] = useState<string>('');
  const [toast, setToast] = useState<string | null>(null);

  const fetchMyNdas = () => {
    setLoading(true);
    fetch('/api/ndas/my-ndas')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setNdas(data || []))
      .catch(() => setNdas([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMyNdas();
  }, []);

  const handleOpenSigning = async (item: EmployeeNDAItem) => {
    try {
      const res = await fetch(`/api/ndas/${item.ndaId}`);
      if (res.ok) {
        const detail = await res.json();
        setDocumentContent(detail.documentContent || '');
      }
    } catch {}
    setSigningItem(item);
  };

  const handleSignedSuccess = (msg: string) => {
    setToast(msg);
    fetchMyNdas();
    setTimeout(() => setToast(null), 5000);
  };

  const handleDownloadSigned = (ndaId: string, assignmentId?: string) => {
    const query = assignmentId ? `?assignmentId=${assignmentId}` : '';
    window.open(`/api/ndas/${ndaId}/export/pdf${query}`, '_blank');
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

  const filtered = ndas.filter(
    (n) =>
      !searchQuery ||
      n.ndaName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.ndaCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingNdas = ndas.filter((n) => n.status === 'Pending Signature');
  const firstPendingNda = pendingNdas[0];

  if (signingItem) {
    return (
      <div className="w-full space-y-4 animate-in fade-in duration-200">
        <Breadcrumbs
          items={[
            { label: 'Non Disclosure Agreement', onClick: () => setSigningItem(null) },
            { label: 'Sign NDA' },
          ]}
        />
        <NdaSigningModal
          open={Boolean(signingItem)}
          assignmentId={signingItem.assignmentId}
          ndaCode={signingItem.ndaCode}
          ndaName={signingItem.ndaName}
          clientName={signingItem.clientName}
          personalEmail={signingItem.personalEmail}
          documentContent={documentContent}
          onClose={() => setSigningItem(null)}
          onSigned={handleSignedSuccess}
        />
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-200">
      <Breadcrumbs items={[{ label: 'NDA E-Signing History' }]} />
      <div className="border-b border-studio-border pb-3">
        <h2 className="text-[20px] font-bold tracking-tight text-studio-text">Non Disclosure Agreement</h2>
      </div>

      <div className="space-y-4">
        {pendingNdas.length > 0 && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl flex items-center justify-between text-[12.5px] font-medium animate-in fade-in shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-amber-950">Action Required:</span> You have {pendingNdas.length} Non-Disclosure Agreement document(s) pending your OTP e-signature.
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleOpenSigning(firstPendingNda)}
              className="px-3.5 py-1.5 bg-brand-orange hover:bg-opacity-90 text-white rounded-lg font-bold text-[11.5px] transition-colors cursor-pointer shadow-2xs shrink-0"
            >
              Sign NDA
            </button>
          </div>
        )}

        {toast && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-center justify-between text-[12.5px] font-semibold animate-in fade-in shadow-2xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              <span>{toast}</span>
            </div>
            <button onClick={() => setToast(null)} className="text-green-600 hover:text-green-800 text-[11px] font-bold cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        <div className="border border-studio-border rounded-lg bg-white overflow-hidden shadow-sm">
          <div className="bg-studio-sidebar border-b border-studio-border px-5 py-2.5 text-[10px] font-bold text-studio-muted uppercase tracking-wider grid grid-cols-12 gap-3 items-center shrink-0">
            <div className="col-span-2">NDA CODE</div>
            <div className="col-span-3">NDA NAME</div>
            <div className="col-span-2">CLIENT NAME</div>
            <div className="col-span-2">ASSIGNED DATE</div>
            <div className="col-span-1 text-center">STATUS</div>
            <div className="col-span-2 text-right">ACTION</div>
          </div>

          <div className="divide-y divide-studio-border bg-white">
            {loading ? (
              <div className="py-12 text-center text-[12px] text-studio-muted animate-pulse">
                Loading assigned Non-Disclosure Agreements...
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-studio-muted text-[12.5px]">
                {searchQuery ? `No NDAs matching "${searchQuery}"` : 'No NDA documents assigned to you yet.'}
              </div>
            ) : (
              filtered.map((nda) => (
                <div
                  key={nda.assignmentId}
                  className="group grid grid-cols-12 gap-3 px-5 py-3.5 items-center hover:bg-studio-hover/40 transition-colors text-[12.5px]"
                >
                  {/* 1. NDA Code */}
                  <div className="col-span-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-orange-200 bg-orange-50 text-brand-orange inline-block">
                      {nda.ndaCode}
                    </span>
                  </div>

                  {/* 2. NDA Name */}
                  <div className="col-span-3 font-semibold text-slate-800 flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-studio-muted shrink-0" />
                    <span className="truncate">{nda.ndaName}</span>
                  </div>

                  {/* 3. Client Name */}
                  <div className="col-span-2 font-medium text-slate-700 truncate">
                    {nda.clientName}
                  </div>

                  {/* 4. Assigned Date */}
                  <div className="col-span-2 text-slate-600 font-mono text-[11.5px]">
                    {formatDate(nda.assignedDate)}
                  </div>

                  {/* 5. Status */}
                  <div className="col-span-1 text-center">
                    {nda.status === 'Signed' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-green-50 text-green-700 border border-green-200">
                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                        <span>Signed</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-800 border border-amber-300 animate-pulse">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>Pending</span>
                      </span>
                    )}
                  </div>

                  {/* 6. Action */}
                  <div className="col-span-2 text-right flex items-center justify-end gap-2">
                    {nda.status === 'Signed' ? (
                      <button
                        type="button"
                        onClick={() => handleDownloadSigned(nda.ndaId, nda.assignmentId)}
                        className="flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200 rounded text-[11.5px] font-bold transition-colors cursor-pointer"
                        title="Download Signed NDA Document"
                      >
                        <Download className="w-3.5 h-3.5 text-blue-600" /> Download
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenSigning(nda)}
                        className="flex items-center gap-1 px-3.5 py-1 bg-brand-orange text-white rounded text-[11.5px] font-bold hover:bg-opacity-90 transition-colors shadow-2xs cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" /> Sign NDA
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
