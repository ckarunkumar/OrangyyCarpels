import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Save, Ban, Trash2, RotateCcw } from 'lucide-react';
import { ApplyMode } from './ApplyTypeSelector';
import LeaveEditFormFields from './LeaveEditFormFields';

interface Props {
  open: boolean;
  item: any;
  onClose: () => void;
  onSaved: () => void;
  onDeleted?: () => void;
  balanceData?: any;
  selectedYear?: number;
  publishedHolidays?: Array<{ date: string; name: string; type: string }>;
}

const parseToIso = (dateStr?: string) => {
  if (!dateStr) return new Date().toISOString().slice(0, 10);
  if (dateStr.includes('-') && dateStr.split('-')[0].length === 4) return dateStr;
  if (dateStr.includes('-')) {
    const [d, m, y] = dateStr.split('-');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return dateStr;
};

export default function LeaveEditDrawer({
  open, item, onClose, onSaved, onDeleted, balanceData, selectedYear = 2026, publishedHolidays = [],
}: Props) {
  const [applyMode, setApplyMode] = useState<ApplyMode>('leave');
  const [leaveConfigs, setLeaveConfigs] = useState<any[]>([]);
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDaySession, setHalfDaySession] = useState<'First Half' | 'Second Half'>('First Half');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && item) {
      const type = item.leaveType || '';
      if (type === 'Work From Home' || type === 'WFH') setApplyMode('wfh');
      else if (type === 'Optional Holiday' || type === 'optional Holiday') setApplyMode('oh');
      else { setApplyMode('leave'); setLeaveType(type || 'Casual Leave'); }
      setStartDate(parseToIso(item.startDate));
      setEndDate(parseToIso(item.endDate || item.startDate));
      setIsHalfDay(!!item.isHalfDay);
      setHalfDaySession(item.halfDaySession?.includes('Second') ? 'Second Half' : 'First Half');
      setReason(item.reason || '');
      setError(null);
    }
  }, [open, item]);

  useEffect(() => {
    if (open) {
      fetch(`/api/leaves/settings?year=${selectedYear}`)
        .then((r) => r.json())
        .then((d) => { if (Array.isArray(d)) setLeaveConfigs(d); })
        .catch(() => {});
    }
  }, [open, selectedYear]);

  if (!open || !item) return null;

  const isDeclined = item.status === 'Declined' || item.status === 'Rejected';
  const isCancelled = item.status === 'Cancelled';
  const optionalHolidaysList = publishedHolidays.filter((h) => h.type === 'Optional');
  const availableLeaveTypes = leaveConfigs.filter((c) => c.code !== 'WFH' && c.code !== 'OH');
  const activeLeaveConfig = leaveConfigs.find((c) => c.name === leaveType);
  const canHalfDay = activeLeaveConfig ? (activeLeaveConfig.allowHalfDay ?? true) : true;

  const getQuotaDisplay = () => {
    if (!balanceData) return '';
    const map: Record<string, any> = {
      'Casual Leave': `${balanceData.casualRemaining ?? 12}d left`,
      'Sick Leave': `${balanceData.sickRemaining ?? 12}d left`,
      'Earned Leave': `${balanceData.earnedRemaining ?? 15}d left`,
      'Comp-off': `${balanceData.compOffBalance ?? 0}d left`,
    };
    if (applyMode === 'wfh') return `${balanceData.wfhRemainingThisMonth ?? 2} days left this month`;
    if (applyMode === 'oh') return `${balanceData.optionalHolidaysRemaining ?? 2} optional holidays available`;
    return map[leaveType] || (activeLeaveConfig ? `${activeLeaveConfig.annualQuota || 12} days / yr` : '');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) { setError('Please provide a reason or notes.'); return; }
    setSaving(true); setError(null);
    try {
      const targetType = applyMode === 'wfh' ? 'Work From Home' : applyMode === 'oh' ? 'Optional Holiday' : leaveType;
      const res = await fetch(`/api/leaves/requests/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaveType: targetType, startDate,
          endDate: (isHalfDay && canHalfDay) || applyMode === 'oh' ? startDate : endDate,
          isHalfDay: isHalfDay && canHalfDay,
          halfDaySession: isHalfDay && canHalfDay ? halfDaySession : null,
          reason: reason.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update leave application.');
      onSaved(); onClose();
    } catch (err: any) { setError(err.message); } finally { setSaving(false); }
  };

  const handleCancelApplication = async () => {
    if (!window.confirm('Are you sure you want to cancel this leave application?')) return;
    setCancelling(true); setError(null);
    try {
      const res = await fetch(`/api/leaves/requests/${item.id}/cancel`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel application.');
      onSaved(); onClose();
    } catch (err: any) { setError(err.message); } finally { setCancelling(false); }
  };

  const handleDeleteApplication = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this leave application record?')) return;
    setDeleting(true); setError(null);
    try {
      const res = await fetch(`/api/leaves/requests/${item.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete application.');
      if (onDeleted) onDeleted(); else onSaved();
      onClose();
    } catch (err: any) { setError(err.message); } finally { setDeleting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-studio-border flex flex-col justify-between animate-in slide-in-from-right duration-200">
          <div className="p-5 border-b border-studio-border flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-bold text-studio-text">
                {isDeclined ? 'Re-apply / Edit Declined Leave' : 'Edit Leave Application'}
              </h3>
              <p className="text-[11.5px] text-studio-muted">Status: <span className="font-semibold text-studio-text">{item.status}</span></p>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg text-studio-muted hover:text-studio-text cursor-pointer"><X className="w-5 h-5" /></button>
          </div>

          <form id="leave-edit-form" onSubmit={handleSave} className="p-5 overflow-y-auto space-y-3.5 flex-1">
            {error && (<div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded flex items-center gap-2 text-[11px]"><AlertCircle className="w-4 h-4 shrink-0 text-red-500" /><span>{error}</span></div>)}
            {isDeclined && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-[11.5px] space-y-1">
                <p className="font-bold flex items-center gap-1.5"><RotateCcw className="w-3.5 h-3.5 text-amber-700" /> This application was previously declined.</p>
                {item.rejectionReason && <p className="text-amber-800 text-[11px]">Approver Remarks: "{item.rejectionReason}"</p>}
                <p className="text-[10.5px] text-amber-700">You can update the details and click <b>Resubmit</b> to submit for approval again.</p>
              </div>
            )}
            <LeaveEditFormFields
              applyMode={applyMode} setApplyMode={setApplyMode} leaveType={leaveType} setLeaveType={setLeaveType}
              availableLeaveTypes={availableLeaveTypes} getQuotaDisplay={getQuotaDisplay} optionalHolidaysList={optionalHolidaysList}
              startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate}
              isHalfDay={isHalfDay} setIsHalfDay={setIsHalfDay} halfDaySession={halfDaySession} setHalfDaySession={setHalfDaySession}
              canHalfDay={canHalfDay} reason={reason} setReason={setReason} selectedYear={selectedYear}
            />
          </form>

          <div className="p-4 px-5 border-t border-studio-border bg-studio-sidebar/40">
            <div className="grid grid-cols-3 gap-2.5 w-full items-center">
              <button type="button" onClick={handleCancelApplication} disabled={cancelling || saving || deleting || isCancelled} className={`w-full py-2.5 px-2 border border-amber-300 bg-amber-50/80 text-amber-800 rounded-lg text-[11.5px] font-semibold hover:bg-amber-100 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs ${isCancelled ? 'opacity-40 cursor-not-allowed' : ''}`} title={isCancelled ? 'Application is already cancelled' : 'Cancel this leave application'}>
                <Ban className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{cancelling ? 'Cancelling...' : 'Cancel Application'}</span>
              </button>

              <button type="button" onClick={handleDeleteApplication} disabled={deleting || saving || cancelling} className="w-full py-2.5 px-2 border border-red-200 bg-red-50/80 text-red-600 rounded-lg text-[11.5px] font-semibold hover:bg-red-100 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs" title="Delete leave application permanently">
                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{deleting ? 'Deleting...' : 'Delete'}</span>
              </button>

              <button type="submit" form="leave-edit-form" onClick={handleSave} disabled={saving || cancelling || deleting} className="w-full py-2.5 px-2 bg-brand-orange text-white rounded-lg text-[11.5px] font-bold hover:bg-opacity-90 shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors" title={isDeclined ? 'Resubmit leave application' : 'Save changes to leave application'}>
                {isDeclined ? <RotateCcw className="w-3.5 h-3.5 shrink-0" /> : <Save className="w-3.5 h-3.5 shrink-0" />}
                <span className="truncate">{saving ? 'Saving...' : isDeclined ? 'Resubmit' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
