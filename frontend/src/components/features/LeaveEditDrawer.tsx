import React, { useState, useEffect } from 'react';
import { X, Clock, AlertCircle, Save, Trash2 } from 'lucide-react';
import ApplyTypeSelector, { ApplyMode } from './ApplyTypeSelector';

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
  open,
  item,
  onClose,
  onSaved,
  onDeleted,
  balanceData,
  selectedYear = 2026,
  publishedHolidays = [],
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && item) {
      const type = item.leaveType || '';
      if (type === 'Work From Home' || type === 'WFH') {
        setApplyMode('wfh');
      } else if (type === 'Optional Holiday' || type === 'optional Holiday') {
        setApplyMode('oh');
      } else {
        setApplyMode('leave');
        setLeaveType(type || 'Casual Leave');
      }

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
        .then((d) => {
          if (Array.isArray(d)) setLeaveConfigs(d);
        })
        .catch(() => {});
    }
  }, [open, selectedYear]);

  if (!open || !item) return null;

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
    if (!reason.trim()) {
      setError('Please provide a reason or notes.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const targetType =
        applyMode === 'wfh'
          ? 'Work From Home'
          : applyMode === 'oh'
          ? 'Optional Holiday'
          : leaveType;

      const res = await fetch(`/api/leaves/requests/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaveType: targetType,
          startDate,
          endDate: (isHalfDay && canHalfDay) || applyMode === 'oh' ? startDate : endDate,
          isHalfDay: isHalfDay && canHalfDay,
          halfDaySession: isHalfDay && canHalfDay ? halfDaySession : null,
          reason: reason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update leave application.');

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelApplication = async () => {
    if (!window.confirm('Are you sure you want to cancel and delete this leave application?')) {
      return;
    }
    setCancelling(true);
    setError(null);
    try {
      const res = await fetch(`/api/leaves/requests/${item.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel application.');

      if (onDeleted) onDeleted();
      else onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-studio-border flex flex-col justify-between animate-in slide-in-from-right duration-200">
          <div className="p-5 border-b border-studio-border flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-bold text-studio-text">Edit Leave Application</h3>
              <p className="text-[11.5px] text-studio-muted">Update details or cancel this application</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-studio-muted hover:text-studio-text cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-3.5 flex-1 text-[12px]">
            {error && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded flex items-center gap-2 text-[11px]">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            <ApplyTypeSelector applyMode={applyMode} setApplyMode={setApplyMode} />

            {applyMode === 'leave' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-bold text-studio-muted uppercase">
                    Leave Category
                  </label>
                  {getQuotaDisplay() && (
                    <span className="text-[10.5px] font-semibold text-brand-orange bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                      {getQuotaDisplay()}
                    </span>
                  )}
                </div>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-studio-border rounded bg-white text-studio-text focus:outline-none focus:border-brand-orange"
                >
                  {availableLeaveTypes.map((c) => (
                    <option key={c.id || c.code} value={c.name}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                  <option value="Comp-off">Use Comp-Off Credit</option>
                </select>
              </div>
            )}

            {applyMode === 'oh' && (
              <div>
                <label className="block text-[10px] font-bold text-studio-muted uppercase mb-1">
                  Select Published Optional Holiday
                </label>
                {optionalHolidaysList.length > 0 ? (
                  <select
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setEndDate(e.target.value);
                    }}
                    className="w-full px-2.5 py-1.5 border border-studio-border rounded bg-white text-studio-text focus:outline-none focus:border-brand-orange"
                  >
                    {optionalHolidaysList.map((oh) => (
                      <option key={oh.date} value={oh.date}>
                        {oh.name} ({oh.date})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-studio-muted text-[11px]">
                    No optional holidays published for {selectedYear}.
                  </p>
                )}
              </div>
            )}

            {applyMode !== 'oh' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-studio-muted uppercase mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-studio-border rounded bg-white text-studio-text focus:outline-none focus:border-brand-orange"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-studio-muted uppercase mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    disabled={isHalfDay}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-studio-border rounded text-studio-text focus:outline-none focus:border-brand-orange disabled:bg-slate-50 disabled:text-studio-muted"
                    required
                  />
                </div>
              </div>
            )}

            {applyMode === 'leave' && canHalfDay && (
              <div className="p-2.5 bg-studio-sidebar border border-studio-border rounded space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-studio-text flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-brand-orange" /> Half-Day (0.5 Days)
                  </span>
                  <input
                    type="checkbox"
                    checked={isHalfDay}
                    onChange={(e) => setIsHalfDay(e.target.checked)}
                    className="rounded text-brand-orange focus:ring-brand-orange cursor-pointer"
                  />
                </div>
                {isHalfDay && (
                  <div className="flex gap-2 pt-0.5">
                    {(['First Half', 'Second Half'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setHalfDaySession(s)}
                        className={`flex-1 py-1 px-2 rounded text-[10.5px] font-semibold border transition-all cursor-pointer ${
                          halfDaySession === s
                            ? 'bg-orange-50 border-brand-orange text-brand-orange'
                            : 'bg-white border-studio-border text-studio-muted'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-studio-muted uppercase mb-1">
                Reason / Notes
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Provide reason or context for this request..."
                className="w-full px-2.5 py-1.5 border border-studio-border rounded text-studio-text focus:outline-none focus:border-brand-orange resize-none"
                required
              />
            </div>
          </form>

          {/* Action Buttons: Cancel Application on left, Save on right */}
          <div className="p-3.5 border-t border-studio-border flex justify-between items-center gap-2 bg-studio-sidebar/40">
            <button
              type="button"
              onClick={handleCancelApplication}
              disabled={cancelling || saving}
              className="px-3.5 py-1.5 border border-red-200 bg-red-50 text-red-600 rounded text-[11.5px] font-semibold hover:bg-red-100 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors shadow-2xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {cancelling ? 'Cancelling...' : 'Cancel Application'}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 border border-studio-border rounded text-[11.5px] font-medium text-studio-muted hover:bg-white cursor-pointer"
              >
                Close
              </button>
              <button
                type="submit"
                onClick={handleSave}
                disabled={saving || cancelling}
                className="px-4 py-1.5 bg-brand-orange text-white rounded text-[11.5px] font-semibold hover:bg-opacity-90 shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
