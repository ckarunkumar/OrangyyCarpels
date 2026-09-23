import { Clock } from 'lucide-react';
import ApplyTypeSelector, { ApplyMode } from './ApplyTypeSelector';

interface LeaveEditFormFieldsProps {
  applyMode: ApplyMode;
  setApplyMode: (mode: ApplyMode) => void;
  leaveType: string;
  setLeaveType: (t: string) => void;
  availableLeaveTypes: any[];
  getQuotaDisplay: () => string;
  optionalHolidaysList: Array<{ date: string; name: string; type: string }>;
  startDate: string;
  setStartDate: (d: string) => void;
  endDate: string;
  setEndDate: (d: string) => void;
  isHalfDay: boolean;
  setIsHalfDay: (h: boolean) => void;
  halfDaySession: 'First Half' | 'Second Half';
  setHalfDaySession: (s: 'First Half' | 'Second Half') => void;
  canHalfDay: boolean;
  reason: string;
  setReason: (r: string) => void;
  selectedYear: number;
}

export default function LeaveEditFormFields({
  applyMode, setApplyMode, leaveType, setLeaveType, availableLeaveTypes,
  getQuotaDisplay, optionalHolidaysList, startDate, setStartDate, endDate, setEndDate,
  isHalfDay, setIsHalfDay, halfDaySession, setHalfDaySession, canHalfDay,
  reason, setReason, selectedYear,
}: LeaveEditFormFieldsProps) {
  return (
    <div className="space-y-3.5 text-[12px]">
      <ApplyTypeSelector applyMode={applyMode} setApplyMode={setApplyMode} />

      {applyMode === 'leave' && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[10px] font-bold text-studio-muted uppercase">Leave Category</label>
            {getQuotaDisplay() && (<span className="text-[10.5px] font-semibold text-brand-orange bg-orange-50 px-2 py-0.5 rounded border border-orange-100">{getQuotaDisplay()}</span>)}
          </div>
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
            <select value={startDate} onChange={(e) => { setStartDate(e.target.value); setEndDate(e.target.value); }} className="w-full px-2.5 py-1.5 border border-studio-border rounded bg-white text-studio-text focus:outline-none focus:border-brand-orange">
              {optionalHolidaysList.map((oh) => (<option key={oh.date} value={oh.date}>{oh.name} ({oh.date})</option>))}
            </select>
          ) : (<p className="text-studio-muted text-[11px]">No optional holidays published for {selectedYear}.</p>)}
        </div>
      )}

      {applyMode !== 'oh' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-studio-muted uppercase mb-1">Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-2.5 py-1.5 border border-studio-border rounded bg-white text-studio-text focus:outline-none focus:border-brand-orange" required />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-studio-muted uppercase mb-1">End Date</label>
            <input type="date" value={endDate} disabled={isHalfDay} onChange={(e) => setEndDate(e.target.value)} className="w-full px-2.5 py-1.5 border border-studio-border rounded text-studio-text focus:outline-none focus:border-brand-orange disabled:bg-slate-50 disabled:text-studio-muted" required />
          </div>
        </div>
      )}

      {applyMode === 'leave' && canHalfDay && (
        <div className="p-2.5 bg-studio-sidebar border border-studio-border rounded space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-studio-text flex items-center gap-1.5"><Clock className="w-3 h-3 text-brand-orange" /> Half-Day (0.5 Days)</span>
            <input type="checkbox" checked={isHalfDay} onChange={(e) => setIsHalfDay(e.target.checked)} className="rounded text-brand-orange focus:ring-brand-orange cursor-pointer" />
          </div>
          {isHalfDay && (
            <div className="flex gap-2 pt-0.5">
              {(['First Half', 'Second Half'] as const).map((s) => (
                <button key={s} type="button" onClick={() => setHalfDaySession(s)} className={`flex-1 py-1 px-2 rounded text-[10.5px] font-semibold border transition-all cursor-pointer ${halfDaySession === s ? 'bg-orange-50 border-brand-orange text-brand-orange' : 'bg-white border-studio-border text-studio-muted'}`}>{s}</button>
              ))}
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-[10px] font-bold text-studio-muted uppercase mb-1">Reason / Notes</label>
        <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Provide reason or context for this request..." className="w-full px-2.5 py-1.5 border border-studio-border rounded text-studio-text focus:outline-none focus:border-brand-orange resize-none" required />
      </div>
    </div>
  );
}
