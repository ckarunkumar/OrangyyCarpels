import { useState, useEffect } from 'react';
import { ArrowLeft, FileText, CheckCircle2, Clock, Lock, ShieldCheck, Download } from 'lucide-react';

export interface NDAAssignmentDetail {
  id: string;
  employeeId: string;
  employeeName: string;
  personalEmail: string;
  maskedEmail: string;
  otpSentAt?: string | null;
  otpVerifiedAt?: string | null;
  signedAt?: string | null;
  status: string;
  ipAddress?: string | null;
}

export interface NDADetailData {
  id: string;
  ndaCode: string;
  ndaName: string;
  clientId: string;
  clientName: string;
  documentContent?: string | null;
  createdAt: string;
  submittedAt?: string | null;
  closedAt?: string | null;
  status: string;
  rawStatus: string;
  isClosed: boolean;
  totalCount: number;
  signedCount: number;
  assignments: NDAAssignmentDetail[];
}

interface NdaDetailViewProps {
  ndaId: string;
  onBack: () => void;
}

export default function NdaDetailView({ ndaId, onBack }: NdaDetailViewProps) {
  const [data, setData] = useState<NDADetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const fetchDetail = () => {
    setLoading(true);
    fetch(`/api/ndas/${ndaId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDetail();
  }, [ndaId]);

  const handleCloseNDA = async () => {
    if (!data) return;
    if (!window.confirm(`Are you sure you want to CLOSE NDA "${data.ndaCode}"? Once closed, this document will be PERMANENTLY LOCKED and immutable.`)) {
      return;
    }

    setClosing(true);
    try {
      const res = await fetch(`/api/ndas/${ndaId}/close`, { method: 'POST' });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to close NDA');
      setActionMsg(`NDA "${data.ndaCode}" is now officially Closed and permanently locked.`);
      fetchDetail();
    } catch (err: any) {
      alert(err.message || 'Error closing NDA');
    } finally {
      setClosing(false);
    }
  };

  const handleExport = (format: 'word' | 'pdf') => {
    window.open(`/api/ndas/${ndaId}/export/${format}`, '_blank');
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '—';
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-studio-muted animate-pulse text-[13px]">
        Loading NDA audit records...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 border border-red-200 bg-red-50 text-red-700 rounded-lg text-[13px] font-semibold space-y-3">
        <p>{error || 'NDA not found'}</p>
        <button onClick={onBack} className="text-brand-orange hover:underline text-[12px]">Back to list</button>
      </div>
    );
  }

  const isAllSigned = data.signedCount === data.totalCount && data.totalCount > 0;
  const canClose = !data.isClosed && isAllSigned;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="bg-white border border-studio-border rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
              title="Back to NDA List"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-orange-200 bg-orange-50 text-brand-orange">
                  {data.ndaCode}
                </span>
                <h2 className="text-[18px] font-bold text-slate-900">{data.ndaName}</h2>
              </div>
              <p className="text-[12px] text-slate-500 font-medium mt-0.5">
                Client: <span className="font-semibold text-slate-800">{data.clientName}</span> ({data.clientId})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Export buttons */}
            <button
              type="button"
              onClick={() => handleExport('word')}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-[12px] font-semibold transition-colors cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" /> Export Word
            </button>
            <button
              type="button"
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-[12px] font-semibold transition-colors cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-red-600" /> Export PDF
            </button>

            {/* Close NDA button */}
            {data.isClosed ? (
              <span className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-[12px] font-bold">
                <Lock className="w-3.5 h-3.5 text-slate-600" /> Closed & Locked
              </span>
            ) : (
              <button
                type="button"
                onClick={handleCloseNDA}
                disabled={!canClose || closing}
                title={canClose ? 'Close NDA & Lock Permanently' : 'All assigned employees must sign before closing'}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-bold transition-all shadow-sm cursor-pointer ${
                  canClose
                    ? 'bg-slate-900 text-white hover:bg-slate-800'
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                {closing ? 'Closing NDA...' : 'Close NDA'}
              </button>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[12px]">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="block text-[10px] font-bold uppercase text-slate-500">Status</span>
            <span className="font-bold text-slate-900 text-[13px]">{data.status}</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="block text-[10px] font-bold uppercase text-slate-500">Creation Date</span>
            <span className="font-semibold text-slate-800">{formatDate(data.createdAt)}</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="block text-[10px] font-bold uppercase text-slate-500">Full Completion Date</span>
            <span className="font-semibold text-slate-800">{formatDate(data.submittedAt)}</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="block text-[10px] font-bold uppercase text-slate-500">Signed Progress</span>
            <span className="font-bold text-brand-orange text-[13px]">
              {data.signedCount} of {data.totalCount} Signed
            </span>
          </div>
        </div>

        {actionMsg && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-[12px] font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <span>{actionMsg}</span>
          </div>
        )}
      </div>

      {/* Assigned Employees Signature Audit Table */}
      <div className="border border-studio-border rounded-xl bg-white overflow-hidden shadow-sm space-y-0">
        <div className="px-5 py-3 bg-slate-50 border-b border-studio-border flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-orange" />
            <h4 className="text-[13px] font-bold text-slate-900">E-Signature Audit Trail & OTP Delivery Transparency</h4>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Super Admin Audit View (Personal Emails Masked)
          </span>
        </div>

        <div className="divide-y divide-studio-border bg-white">
          <div className="bg-studio-sidebar border-b border-studio-border px-5 py-2.5 text-[10px] font-bold text-studio-muted uppercase tracking-wider grid grid-cols-12 gap-3 items-center shrink-0">
            <div className="col-span-3">EMPLOYEE NAME</div>
            <div className="col-span-3">OTP PERSONAL EMAIL (MASKED)</div>
            <div className="col-span-2">OTP SENT AT</div>
            <div className="col-span-2">OTP VERIFIED / SIGNED AT</div>
            <div className="col-span-2 text-right">SIGNATURE STATUS</div>
          </div>

          {data.assignments.map((a) => (
            <div
              key={a.id}
              className="grid grid-cols-12 gap-3 px-5 py-3.5 items-center hover:bg-studio-hover/40 transition-colors text-[12.5px]"
            >
              {/* 1. Employee Name */}
              <div className="col-span-3 font-semibold text-slate-900 truncate">
                {a.employeeName} <span className="text-[10px] font-mono text-slate-500">({a.employeeId})</span>
              </div>

              {/* 2. Masked Email */}
              <div className="col-span-3 font-mono text-[11.5px] text-slate-700 truncate" title={`OTP delivered to: ${a.maskedEmail}`}>
                {a.maskedEmail}
              </div>

              {/* 3. OTP Sent At */}
              <div className="col-span-2 text-slate-600 font-mono text-[11.5px]">
                {formatDate(a.otpSentAt)}
              </div>

              {/* 4. OTP Verified / Signed At */}
              <div className="col-span-2 text-slate-600 font-mono text-[11.5px]">
                {formatDate(a.signedAt || a.otpVerifiedAt)}
              </div>

              {/* 5. Status */}
              <div className="col-span-2 text-right">
                {a.status === 'Signed' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-green-50 text-green-700 border border-green-200">
                    <CheckCircle2 className="w-3 h-3 text-green-600" />
                    <span>Signed</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span>Pending OTP</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* NDA Document Preview Box */}
      <div className="border border-studio-border rounded-xl bg-white p-5 shadow-sm space-y-3">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <h4 className="text-[13px] font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-studio-muted" /> Agreement Terms Document
          </h4>
          <span className="text-[11px] text-slate-500 font-mono">Immutable Content</span>
        </div>
        <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-lg font-mono text-[11.5px] text-slate-700 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
          {data.documentContent}
        </div>
      </div>
    </div>
  );
}
