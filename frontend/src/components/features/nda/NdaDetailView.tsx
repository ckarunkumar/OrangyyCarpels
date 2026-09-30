import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, Clock, Lock, Download } from 'lucide-react';
import { DEFAULT_OFFICIAL_NDA_HTML } from './CreateNdaFormView';

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
  isSuperAdmin?: boolean;
  onBack: () => void;
}



export default function NdaDetailView({ ndaId, isSuperAdmin = false, onBack }: NdaDetailViewProps) {
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

  const getHeaderTitle = (ndaName: string, clientName: string) => {
    if (!clientName) return ndaName;
    const baseTitle = ndaName.replace(new RegExp(`\\s*-\\s*${clientName}`, 'i'), '').trim();
    if (baseTitle.toLowerCase().startsWith(clientName.toLowerCase())) {
      return baseTitle;
    }
    return `${clientName} - ${baseTitle}`;
  };

  const renderTimesheetStatusBadge = (statusStr: string, isClosed: boolean, signedCount: number, totalCount: number) => {
    if (isClosed || statusStr.includes('Closed')) {
      return (
        <span className="text-[11px] font-semibold px-3 py-1 rounded-full border inline-block max-w-full truncate bg-slate-100 text-slate-700 border-slate-300">
          Closed
        </span>
      );
    }
    if (statusStr.includes('Submitted') && !statusStr.includes('Partially')) {
      return (
        <span className="text-[11px] font-semibold px-3 py-1 rounded-full border inline-block max-w-full truncate bg-blue-50 text-blue-700 border-blue-200">
          Submitted ({signedCount}/{totalCount})
        </span>
      );
    }
    if (statusStr.includes('Partially')) {
      return (
        <span className="text-[11px] font-semibold px-3 py-1 rounded-full border inline-block max-w-full truncate bg-amber-50 text-amber-800 border-amber-300">
          Partially Submitted ({signedCount}/{totalCount})
        </span>
      );
    }
    return (
      <span className="text-[11px] font-semibold px-3 py-1 rounded-full border inline-block max-w-full truncate bg-amber-50 text-amber-800 border-amber-300">
        Draft
      </span>
    );
  };

  const isAllSigned = data.signedCount === data.totalCount && data.totalCount > 0;
  const canClose = !data.isClosed && isAllSigned;
  const headerTitle = getHeaderTitle(data.ndaName, data.clientName);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. Page Header (Matches standard header layout without card container) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-studio-border pb-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 rounded-lg border border-studio-border bg-white hover:bg-studio-sidebar text-studio-text transition-colors cursor-pointer"
            title="Back to NDA List"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-[20px] font-bold tracking-tight text-studio-text">
              {headerTitle}
            </h2>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-orange-200 bg-orange-50 text-brand-orange shrink-0">
              {data.ndaCode}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Timesheet Status Badge (Positioned before Export PDF) */}
          {renderTimesheetStatusBadge(data.status, data.isClosed, data.signedCount, data.totalCount)}

          {/* Export PDF */}
          <button
            type="button"
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 border border-studio-border bg-white hover:bg-studio-sidebar text-studio-text rounded-lg text-[12px] font-semibold transition-colors cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-red-600" /> Export PDF
          </button>

          {/* Close NDA */}
          {data.isClosed ? (
            <span className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-[12px] font-bold">
              <Lock className="w-3.5 h-3.5 text-slate-600" /> Closed & Locked
            </span>
          ) : isSuperAdmin ? (
            <button
              type="button"
              onClick={handleCloseNDA}
              disabled={!canClose || closing}
              title={canClose ? 'Close NDA & Lock Permanently' : 'All assigned employees must sign before closing'}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[12px] font-bold transition-all shadow-sm cursor-pointer ${
                canClose
                  ? 'bg-slate-900 text-white hover:bg-slate-800'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              {closing ? 'Closing NDA...' : 'Close NDA'}
            </button>
          ) : null}
        </div>
      </div>

      {actionMsg && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-[12px] font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Main Single Card Container */}
      <div className="bg-white border border-studio-border rounded-xl p-5 shadow-2xs space-y-6">
        {/* SECTION 1: E-SIGNATURE AUDIT TRAIL */}
        <div className="space-y-4">
          {/* Section Heading (Matching Official Agreement Document Format Heading Style) */}
          <div className="flex justify-between items-center border-b border-studio-border pb-2.5">
            <h4 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider">
              E-SIGNATURE AUDIT TRAIL & OTP DELIVERY TRANSPARENCY
            </h4>
            <span className="text-[11px] text-slate-500 font-medium">
              Super Admin Audit View (Personal Emails Masked)
            </span>
          </div>

          {/* Timesheet-Style Table Grid Container (Aligned with Document Width) */}
          <div className="border border-studio-border rounded-lg bg-white overflow-hidden shadow-2xs">
            <div className="bg-studio-sidebar border-b border-studio-border px-5 py-2.5 text-[10px] font-bold text-studio-muted uppercase tracking-wider grid grid-cols-12 gap-3 items-center shrink-0">
              <div className="col-span-3">EMPLOYEE NAME</div>
              <div className="col-span-3">OTP PERSONAL EMAIL (MASKED)</div>
              <div className="col-span-2">OTP SENT AT</div>
              <div className="col-span-2">OTP VERIFIED / SIGNED AT</div>
              <div className="col-span-2 text-right">SIGNATURE STATUS</div>
            </div>

            <div className="divide-y divide-studio-border bg-white">
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
        </div>

        {/* SECTION 2: OFFICIAL AGREEMENT DOCUMENT FORMAT */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-studio-border pb-2.5">
            <h4 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider">
              OFFICIAL AGREEMENT DOCUMENT FORMAT
            </h4>
            <span className="text-[12px] font-mono text-slate-600 font-medium">
              {formatDate(data.createdAt)}
            </span>
          </div>

          {/* Read-Only Document Container */}
          <div
            className="w-full bg-white border border-studio-border rounded-lg p-7 sm:p-10 text-slate-900 font-sans leading-[1.7] text-[13px] focus:outline-none overflow-y-auto max-h-[460px] min-h-[460px] select-text shadow-2xs"
            dangerouslySetInnerHTML={{ __html: data.documentContent || DEFAULT_OFFICIAL_NDA_HTML }}
          />
        </div>
      </div>
    </div>
  );
}
