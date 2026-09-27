import { useMemo } from 'react';
import { X, ChevronDown, CheckCircle2, AlertCircle } from 'lucide-react';

interface ProjectMonthlyBudgetAllocatorProps {
  startDate: string;
  totalBudgetHours: number;
  allocatedHoursList: number[];
  onChange: (list: number[]) => void;
}

const PRESET_VALUES = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

export function computeMonthlyBreakdown(startDate: string, hoursList: number[]) {
  const parts = (startDate || '').split('-').map(Number);
  const startYear = parts[0] || new Date().getFullYear();
  const startMonth = parts[1] || (new Date().getMonth() + 1);

  return hoursList.map((hours, idx) => {
    const d = new Date(startYear, startMonth - 1 + idx, 1);
    const monthYear = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    return { monthYear, monthLabel, hours };
  });
}

export default function ProjectMonthlyBudgetAllocator({
  startDate,
  totalBudgetHours,
  allocatedHoursList,
  onChange,
}: ProjectMonthlyBudgetAllocatorProps) {
  const totalAllocated = useMemo(() => allocatedHoursList.reduce((acc, h) => acc + (Number(h) || 0), 0), [allocatedHoursList]);
  const remaining = Math.max(0, totalBudgetHours - totalAllocated);

  const availableOptions = useMemo(() => {
    if (remaining <= 0) return [];
    const valid = PRESET_VALUES.filter((v) => v <= remaining);
    if (remaining > 0 && remaining < 100 && !valid.includes(remaining)) {
      valid.push(remaining);
      valid.sort((a, b) => a - b);
    }
    return valid;
  }, [remaining]);

  const monthMappings = useMemo(() => computeMonthlyBreakdown(startDate, allocatedHoursList), [startDate, allocatedHoursList]);

  const handleSelect = (valStr: string) => {
    const val = Number(valStr);
    if (!val || val <= 0 || val > remaining) return;
    onChange([...allocatedHoursList, val]);
  };

  const handleRemove = (indexToRemove: number) => {
    onChange(allocatedHoursList.filter((_, idx) => idx !== indexToRemove));
  };

  const inputCls = "w-full px-3 py-2 border border-studio-border hover:border-studio-muted/60 rounded-md text-[12.5px] text-studio-text bg-white focus:outline-none focus:border-brand-orange transition-colors";
  const labelCls = "block text-[11px] font-medium text-studio-muted mb-1";

  return (
    <div className="col-span-1 md:col-span-3 mt-1 p-4 bg-studio-sidebar/40 border border-studio-border rounded-lg space-y-3.5 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-studio-border/70 pb-2">
        <div className="flex items-center gap-2">
          <label className="text-[12px] font-bold text-studio-text uppercase tracking-wider">
            Monthly Budget Hours Allocation
          </label>
          <span className="text-[11px] text-studio-muted">
            (Sequential from {startDate ? new Date(startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Start Date'})
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11.5px]">
          <span className="text-studio-muted">
            Total: <strong className="font-mono text-studio-text">{totalBudgetHours}h</strong>
          </span>
          <span className="text-studio-border">|</span>
          <span className="text-studio-muted">
            Allocated: <strong className="font-mono text-brand-orange">{totalAllocated}h</strong>
          </span>
          <span className="text-studio-border">|</span>
          <span className={remaining === 0 ? 'text-green-700 font-semibold flex items-center gap-1' : 'text-amber-700 font-semibold'}>
            {remaining === 0 ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-600" />}
            Remaining: <span className="font-mono">{remaining}h</span>
          </span>
        </div>
      </div>

      {/* Selector & Chips Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <div>
          <label className={labelCls}>
            {remaining > 0 ? `+ Select Monthly Hours Allocation (${remaining}h remaining)` : 'Allocation Complete (100% Assigned)'}
          </label>
          <div className="relative">
            <select
              value=""
              disabled={remaining <= 0}
              onChange={(e) => handleSelect(e.target.value)}
              className={`${inputCls} appearance-none pr-8 ${remaining <= 0 ? 'bg-studio-sidebar/70 opacity-75 cursor-not-allowed' : ''}`}
            >
              <option value="">
                {remaining <= 0 ? '✔ All total project budget hours allocated' : '+ Add monthly allocation...'}
              </option>
              {availableOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} hours {opt === remaining ? '(Remaining Budget)' : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-studio-muted pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>

          {/* Selected Chips */}
          {allocatedHoursList.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {allocatedHoursList.map((hours, idx) => (
                <span
                  key={`${idx}-${hours}`}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-medium bg-orange-50 text-brand-orange border border-orange-200 shadow-2xs"
                >
                  <span className="font-mono font-semibold">{hours}h</span>
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="hover:text-red-600 cursor-pointer ml-0.5"
                    title={`Remove Month ${idx + 1} allocation`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Resulting Month Mapping Table / Preview */}
        <div>
          <label className={labelCls}>Sequential Monthly Budget Mapping</label>
          {monthMappings.length > 0 ? (
            <div className="border border-studio-border rounded-md bg-white overflow-hidden shadow-2xs divide-y divide-studio-border/60">
              {monthMappings.map((m, idx) => (
                <div key={m.monthYear} className="flex justify-between items-center px-3 py-1.5 text-[11.5px]">
                  <span className="font-medium text-studio-text flex items-center gap-1.5">
                    <span className="text-[10px] text-studio-muted font-mono w-4">#{idx + 1}</span>
                    <span>{m.monthLabel}</span>
                  </span>
                  <span className="font-mono font-bold text-brand-orange bg-orange-50/80 px-2 py-0.5 rounded border border-orange-200/70 text-[11px]">
                    {m.hours}h
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 border border-studio-border/70 border-dashed rounded-md bg-white/50 text-[11.5px] text-studio-muted italic text-center">
              Select hour allocations above to generate sequential monthly budgets.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
