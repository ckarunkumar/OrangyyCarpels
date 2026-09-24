import { AlertTriangle, Lock } from 'lucide-react';

interface BannersProps {
  isPartial: boolean; pendingResources: string[]; isMonthUnallocated: boolean;
  currentMonth: string; isBudgetExhausted: boolean; totalHours: number;
  monthlyAllocatedBudget: number;
}

export default function ProjectTimesheetBanners({
  isPartial, pendingResources, isMonthUnallocated, currentMonth, isBudgetExhausted,
  totalHours, monthlyAllocatedBudget,
}: BannersProps) {
  return (
    <div className="space-y-2 shrink-0">
      {isPartial && pendingResources.length > 0 && (
        <div className="bg-[#FFF8F0] border border-[#FFE4C4] rounded-lg px-4 py-2 text-[12px] text-[#8C4A00] flex items-center gap-2 shadow-2xs">
          <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0" />
          <span>Waiting for <strong>{pendingResources.join(', ')}</strong> to submit timesheet before approval & lock can be completed.</span>
        </div>
      )}

      {isMonthUnallocated && (
        <div className="px-3.5 py-2 bg-slate-100 border border-slate-300 rounded-lg flex items-center justify-between text-[11.5px] text-slate-800 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-600 shrink-0" />
            <span><strong>No Budget Allocated for {currentMonth}:</strong> Timesheet logging and editing are disabled for this month because no budget hours have been allocated in Project Registry.</span>
          </div>
        </div>
      )}

      {isBudgetExhausted && !isMonthUnallocated && (
        <div className="px-3.5 py-2 bg-amber-50 border border-amber-300 rounded-lg flex items-center justify-between text-[11.5px] text-amber-900 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-700 shrink-0" />
            <span><strong>Monthly Budget Exhausted ({totalHours}/{monthlyAllocatedBudget}h — 100% burned):</strong> This month's timesheet is locked to prevent further logging. To unlock, extend the project's budget hours in Project Registry.</span>
          </div>
        </div>
      )}
    </div>
  );
}
