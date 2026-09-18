import { useState } from 'react';
import { X, CheckCircle2, XCircle, AlertCircle, User } from 'lucide-react';

interface Props {
  open: boolean;
  item: any;
  type: 'leave' | 'compoff';
  onClose: () => void;
  onProcessed: () => void;
}

export default function LeaveApprovalDrawer({ open, item, type, onClose, onProcessed }: Props) {
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open || !item) return null;

  const handleAction = async (action: 'approve' | 'reject') => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = type === 'leave' ? `/api/leaves/requests/${item.id}/action` : `/api/leaves/compoff/${item.id}/action`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, remarks: remarks.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process request.');
      onProcessed();
      onClose();
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-studio-border flex flex-col justify-between">
          <div className="p-6 border-b border-studio-border flex items-center justify-between">
            <div>
              <h3 className="text-[16px] font-bold text-studio-text">Review {type === 'leave' ? 'Leave Request' : 'Comp-Off Claim'}</h3>
              <p className="text-[12px] text-studio-muted">Authorize time-off or endorse comp-off credit</p>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg text-studio-muted hover:text-studio-text hover:bg-studio-hover"><X className="w-5 h-5" /></button>
          </div>

          <div className="p-6 overflow-y-auto space-y-4 flex-1 text-[12px]">
            {error && (<div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-2 text-[11px]"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" /><span>{error}</span></div>)}

            <div className="p-4 bg-studio-sidebar border border-studio-border rounded-lg space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[13px] text-studio-text flex items-center gap-1.5"><User className="w-4 h-4 text-brand-orange" /> {item.employeeName}</span>
                <span className="text-[11px] font-mono text-studio-muted">{item.employeeId}</span>
              </div>

              {type === 'leave' ? (
                <div className="grid grid-cols-2 gap-2 text-[11.5px] pt-1 border-t border-studio-border/60">
                  <div><span className="text-studio-muted block text-[10px] uppercase font-bold">Category</span><span className="font-semibold text-studio-text">{item.leaveType}</span></div>
                  <div><span className="text-studio-muted block text-[10px] uppercase font-bold">Duration</span><span className="font-semibold text-studio-text">{item.daysCount} Day {item.isHalfDay ? `(${item.halfDaySession})` : ''}</span></div>
                  <div className="col-span-2"><span className="text-studio-muted block text-[10px] uppercase font-bold">Date Range</span><span className="font-semibold text-studio-text">{item.startDate} {item.startDate !== item.endDate ? `→ ${item.endDate}` : ''}</span></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 text-[11.5px] pt-1 border-t border-studio-border/60">
                  <div><span className="text-studio-muted block text-[10px] uppercase font-bold">Worked Date</span><span className="font-semibold text-studio-text">{item.workedDate}</span></div>
                  <div><span className="text-studio-muted block text-[10px] uppercase font-bold">Credit Claimed</span><span className="font-semibold text-brand-orange">+{item.daysCredit} Day ({item.hoursWorked} hrs)</span></div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-studio-muted uppercase mb-1">Employee Reason / Deliverables</label>
              <div className="p-3 bg-slate-50 border border-studio-border rounded-lg text-studio-text leading-relaxed text-[11.5px]">
                {item.reason}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-studio-muted uppercase mb-1">Review Remarks / Feedback</label>
              <textarea rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Add optional approver remarks or reason if declining..." className="w-full px-3 py-2 border border-studio-border rounded-lg text-studio-text focus:outline-none focus:border-brand-orange resize-none" />
            </div>
          </div>

          <div className="p-4 border-t border-studio-border flex justify-between items-center bg-studio-sidebar/40">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 border border-studio-border rounded-lg text-[12px] font-medium text-studio-muted hover:bg-white transition-colors cursor-pointer"
            >
              Close
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleAction('reject')}
                disabled={loading}
                className="px-4 py-2 border border-red-200 bg-red-50 text-red-700 rounded-lg text-[12px] font-bold hover:bg-red-100 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                <XCircle className="w-4 h-4 text-red-600" /> Decline
              </button>
              {item.status !== 'Approved' && (
                <button
                  type="button"
                  onClick={() => handleAction('approve')}
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-[12px] font-bold hover:bg-emerald-700 transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" /> {type === 'compoff' && item.status === 'Pending_PM' ? 'Endorse Claim' : 'Approve'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
