import { Lock } from 'lucide-react';

interface FooterProps {
  isLocked: boolean; isMonthUnallocated: boolean; isBudgetExhausted: boolean;
  isEmp: boolean; isPM: boolean; status: string; myStatus: string;
  myTotalHours: number; totalHours: number;
}

export default function ProjectTimesheetFooter({
  isLocked, isMonthUnallocated, isBudgetExhausted, isEmp, isPM, status, myStatus,
  myTotalHours, totalHours,
}: FooterProps) {
  const getLockReason = () => {
    if (isMonthUnallocated) return 'No Budget Allocated';
    if (isBudgetExhausted) return 'Monthly Budget Exhausted';
    if (isEmp) return status === 'Approved' ? 'Locked' : (myStatus === 'PM_Approved' || status === 'PM_Approved') ? 'PM Approved' : 'Submitted';
    if (isPM) return status === 'Approved' ? 'Locked' : 'PM Approved';
    return 'Locked';
  };

  return (
    <div className="shrink-0 pt-1">
      {/* Grid Summary Footer Bar */}
      <div className="bg-studio-sidebar border border-studio-border rounded-lg px-5 py-2.5 flex justify-between items-center text-[12px] shadow-xs">
        <div className="flex items-center gap-2">
          {isLocked ? (
            <span className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1.5 text-[11.5px] border ${isMonthUnallocated ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-green-50 border-green-200 text-green-800'}`}>
              <Lock className={`w-3.5 h-3.5 ${isMonthUnallocated ? 'text-slate-600' : 'text-green-700'}`} />
              Locked for edits ({getLockReason()}).
            </span>
          ) : isEmp ? (
            <span className="text-studio-text font-semibold text-[12px]">
              My Logged : <strong className="font-sans text-studio-text font-bold">{myTotalHours}hrs</strong>
            </span>
          ) : null}
        </div>
        <div className="font-bold text-studio-text text-[12.5px]">
          Monthly Total : <span className="font-sans text-[#F25624] text-[14px] font-extrabold">{totalHours}hrs</span>
        </div>
      </div>
    </div>
  );
}
