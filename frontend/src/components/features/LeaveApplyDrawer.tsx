import React, { useState, useEffect } from 'react';
import { X, Clock, AlertCircle, Send } from 'lucide-react';
import ApplyTypeSelector, { ApplyMode } from './ApplyTypeSelector';

interface Props {
  open: boolean;
  onClose: () => void;
  onApplied: () => void;
  balanceData: any;
  selectedYear?: number;
  publishedHolidays?: Array<{ date: string; name: string; type: string }>;
}

export default function LeaveApplyDrawer({ open, onClose, onApplied, balanceData, selectedYear = 2026, publishedHolidays = [] }: Props) {
  const [applyMode, setApplyMode] = useState<ApplyMode>('leave');
  const [leaveConfigs, setLeaveConfigs] = useState<any[]>([]);
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDaySession, setHalfDaySession] = useState<'First Half' | 'Second Half'>('First Half');
  const [hoursWorked, setHoursWorked] = useState('8');
  const [daysCredit, setDaysCredit] = useState<'1.0' | '0.5'>('1.0');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetch(`/api/leaves/settings?year=${selectedYear}`).then((r) => r.json()).then((d) => {
        if (Array.isArray(d)) {
          setLeaveConfigs(d);
          const first = d.find((c) => c.code !== 'WFH' && c.code !== 'OH');
          if (first) setLeaveType(first.name);
        }
      }).catch(() => {});
    }
  }, [open, selectedYear]);

  if (!open) return null;

  const optionalHolidaysList = publishedHolidays.filter((h) => h.type === 'Optional');
  const availableLeaveTypes = leaveConfigs.filter((c) => c.code !== 'WFH' && c.code !== 'OH');
  const activeLeaveConfig = leaveConfigs.find((c) => c.name === leaveType);
  const canHalfDay = activeLeaveConfig ? (activeLeaveConfig.allowHalfDay ?? true) : true;

  const getQuotaDisplay = () => {
    if (!balanceData) return '';
    const map: Record<string, any> = { 'Casual Leave': `${balanceData.casualRemaining ?? 12}d left`, 'Sick Leave': `${balanceData.sickRemaining ?? 12}d left`, 'Earned Leave': `${balanceData.earnedRemaining ?? 15}d left`, 'Comp-off': `${balanceData.compOffBalance ?? 0}d left` };
    if (applyMode === 'wfh') return `${balanceData.wfhRemainingThisMonth ?? 2} days left this month`;
    if (applyMode === 'oh') return `${balanceData.optionalHolidaysRemaining ?? 2} optional holidays available`;
    if (applyMode === 'compoff') return `Current balance: ${balanceData.compOffBalance ?? 0} days`;
    return map[leaveType] || (activeLeaveConfig ? `${activeLeaveConfig.annualQuota || 12} days / yr` : 'Active quota applied');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) { setError('Please provide a reason or deliverable notes.'); return; }
    setSubmitting(true);
    setError(null);
    try {
      if (applyMode === 'compoff') {
        const res = await fetch('/api/leaves/compoff/apply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workedDate: startDate, hoursWorked: Number(hoursWorked) || 8, daysCredit: Number(daysCredit), reason: reason.trim() }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to submit comp-off claim.');
      } else {
        const targetType = applyMode === 'wfh' ? 'Work From Home' : applyMode === 'oh' ? 'Optional Holiday' : leaveType;
        const res = await fetch('/api/leaves/apply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leaveType: targetType, startDate, endDate: (isHalfDay && canHalfDay) || applyMode === 'oh' ? startDate : endDate, isHalfDay: isHalfDay && canHalfDay, halfDaySession: isHalfDay && canHalfDay ? halfDaySession : null, reason: reason.trim() }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to submit application.');
      }
      onApplied();
      onClose();
    } catch (err: any) { setError(err.message); } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-studio-border flex flex-col justify-between">
          <div className="p-5 border-b border-studio-border flex items-center justify-between">
            <div><h3 className="text-[15px] font-bold text-studio-text">Apply Time-Off & Remote</h3><p className="text-[11.5px] text-studio-muted">Submit leave, WFH, optional holiday, or claim comp-off</p></div>
            <button onClick={onClose} className="p-1 rounded-lg text-studio-muted hover:text-studio-text cursor-pointer"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-3.5 flex-1 text-[12px]">
            {error && (<div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded flex items-center gap-2 text-[11px]"><AlertCircle className="w-4 h-4 shrink-0 text-red-500" /><span>{error}</span></div>)}
            <ApplyTypeSelector applyMode={applyMode} setApplyMode={setApplyMode} />
            <div className="p-2 bg-studio-sidebar border border-studio-border rounded flex items-center justify-between text-[11px]">
              <span className="font-semibold text-studio-muted">Quota:</span><span className="font-bold text-studio-text font-mono">{getQuotaDisplay()}</span>
            </div>
            {applyMode === 'leave' && (
              <div>
                <label className="block text-[10px] font-bold text-studio-muted uppercase mb-1">Leave Category</label>
                <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)} className="w-full px-2.5 py-1.5 border border-studio-border rounded bg-white text-studio-text focus:outline-none focus:border-brand-orange">
                  {availableLeaveTypes.map((c) => (<option key={c.id || c.code} value={c.name}>{c.name} ({c.code})</option>))}
                  <option value="Comp-off">Use Comp-Off Credit</option>
                </select>
              </div>
            )}
            {applyMode === 'oh' && (
              <div>
                <label className="block text-[10px] font-bold text-studio-muted uppercase mb-1">Select Published Optional Holiday</label>
                {optionalHolidaysList.length > 0 ? (
                  <select value={startDate} onChange={(e) => { setStartDate(e.target.value); setEndDate(e.target.value); }} className="w-full px-2.5 py-1.5 border border-studio-border rounded bg-white text-studio-text focus:outline-none focus:border-brand-orange">{optionalHolidaysList.map((oh) => (<option key={oh.date} value={oh.date}>{oh.name} ({oh.date})</option>))}</select>
                ) : (<p className="text-studio-muted text-[11px]">No optional holidays published for {selectedYear}.</p>)}
              </div>
            )}
            {applyMode !== 'oh' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-studio-muted uppercase mb-1">{applyMode === 'compoff' ? 'Worked Date' : 'Start Date'}</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-2.5 py-1.5 border border-studio-border rounded bg-white text-studio-text focus:outline-none focus:border-brand-orange" required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-studio-muted uppercase mb-1">{applyMode === 'compoff' ? 'Hours Worked' : 'End Date'}</label>
                  {applyMode === 'compoff' ? (<input type="number" min={1} max={24} value={hoursWorked} onChange={(e) => setHoursWorked(e.target.value)} className="w-full px-2.5 py-1.5 border border-studio-border rounded text-studio-text font-mono focus:outline-none focus:border-brand-orange" required />) : (<input type="date" value={endDate} disabled={isHalfDay} onChange={(e) => setEndDate(e.target.value)} className="w-full px-2.5 py-1.5 border border-studio-border rounded text-studio-text focus:outline-none focus:border-brand-orange disabled:bg-slate-50 disabled:text-studio-muted" required />)}
                </div>
              </div>
            )}
            {applyMode === 'leave' && canHalfDay && (
              <div className="p-2.5 bg-studio-sidebar border border-studio-border rounded space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-studio-text flex items-center gap-1.5"><Clock className="w-3 h-3 text-brand-orange" /> Half-Day (0.5 Days)</span>
                  <input type="checkbox" checked={isHalfDay} onChange={(e) => setIsHalfDay(e.target.checked)} className="rounded text-brand-orange focus:ring-brand-orange cursor-pointer" />
                </div>
                {isHalfDay && (<div className="flex gap-2 pt-0.5">{(['First Half', 'Second Half'] as const).map((s) => (<button key={s} type="button" onClick={() => setHalfDaySession(s)} className={`flex-1 py-1 px-2 rounded text-[10.5px] font-semibold border transition-all cursor-pointer ${halfDaySession === s ? 'bg-orange-50 border-brand-orange text-brand-orange' : 'bg-white border-studio-border text-studio-muted'}`}>{s}</button>))}</div>)}
              </div>
            )}
            {applyMode === 'compoff' && (
              <div>
                <label className="block text-[10px] font-bold text-studio-muted uppercase mb-1">Credit Claim</label>
                <select value={daysCredit} onChange={(e) => setDaysCredit(e.target.value as any)} className="w-full px-2.5 py-1.5 border border-studio-border rounded bg-white text-studio-text focus:outline-none focus:border-brand-orange"><option value="1.0">1.0 Day (Full Day Credit)</option><option value="0.5">0.5 Day (Half Day Credit)</option></select>
              </div>
            )}
            <div>
              <label className="block text-[10px] font-bold text-studio-muted uppercase mb-1">{applyMode === 'compoff' ? 'Deliverables & Overtime Notes' : 'Reason / Notes'}</label>
              <textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Provide reason or context for this request..." className="w-full px-2.5 py-1.5 border border-studio-border rounded text-studio-text focus:outline-none focus:border-brand-orange resize-none" required />
            </div>
          </form>
          <div className="p-4 px-5 border-t border-studio-border flex justify-end gap-2.5 bg-studio-sidebar/40">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-studio-border rounded-lg text-[12px] font-semibold text-studio-text hover:bg-white shadow-2xs transition-colors cursor-pointer">Cancel</button>
            <button type="submit" onClick={handleSubmit} disabled={submitting} className="px-5 py-2 bg-brand-orange text-white rounded-lg text-[12px] font-bold hover:bg-opacity-90 shadow-sm flex items-center gap-1.5 disabled:opacity-50 transition-all cursor-pointer"><Send className="w-3.5 h-3.5" /> {submitting ? 'Submitting...' : applyMode === 'compoff' ? 'Submit Claim' : 'Submit Application'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
