import { Calendar } from 'lucide-react';

export interface ApprovalRequest {
  id: number | string;
  employeeName?: string;
  employeeId?: string;
  leaveType: string;
  leaveCategory?: string;
  startDate: string;
  endDate: string;
  isHalfDay?: boolean;
  halfDaySession?: string | null;
  daysCount?: number;
  reason?: string;
  status: string;
}

interface CalendarCellProps {
  day: {
    dayNumber: number;
    isCurrentMonth: boolean;
    dateStr: string;
    items: ApprovalRequest[];
    holiday?: any;
    isWeekend: boolean;
    isSunday: boolean;
    isSaturday: boolean;
  };
  currentYear: number;
  currentMonthIdx: number;
  onReview: (item: any, type: 'leave' | 'compoff') => void;
}

const getCategoryLabel = (req: ApprovalRequest) => {
  if (req.leaveCategory) return req.leaveCategory;
  if (req.leaveType === 'Work From Home') return 'WFH';
  if (req.leaveType === 'Casual Leave' || req.leaveType === 'casual Leave') return 'casual Leave';
  if (req.leaveType === 'Sick Leave') return 'Sick Leave';
  if (req.leaveType === 'Earned Leave') return 'Earned Leave';
  if (req.leaveType === 'Optional Holiday' || req.leaveType === 'optional Holiday') return 'Optional Holiday';
  return req.leaveType;
};

const getInitial = (name?: string) => {
  if (!name) return 'U';
  return name.trim().charAt(0).toUpperCase();
};

export default function ApprovalsCalendarCell({
  day,
  currentYear,
  currentMonthIdx,
  onReview,
}: CalendarCellProps) {
  const { isWeekend, holiday } = day;

  // Determine full-cell background styling
  let cellBgClass = 'bg-white';
  if (!day.isCurrentMonth) {
    cellBgClass = 'bg-slate-50/60 opacity-60';
  } else if (holiday) {
    // Government / Public holiday: FULL cell gets a Light Orange background
    cellBgClass = 'bg-[#FFF7ED] border-orange-200/70';
  } else if (isWeekend) {
    // Weekend (Saturday & Sunday): Distinct Red styling
    cellBgClass = 'bg-red-50/30';
  }

  return (
    <div className={`min-h-[110px] p-2 flex flex-col justify-between transition-colors ${cellBgClass}`}>
      {/* Date Header Indicator */}
      <div className="flex items-center justify-between">
        <span
          className={`text-[12px] font-bold ${
            !day.isCurrentMonth
              ? 'text-slate-300'
              : holiday
              ? 'text-orange-900 font-extrabold'
              : isWeekend
              ? 'text-red-500 font-extrabold'
              : 'text-slate-700'
          }`}
        >
          {day.dayNumber}
        </span>
      </div>

      {/* Holiday Badge (Public / Government Holiday in Light Orange) */}
      <div className="space-y-1 mt-1">
        {holiday && (
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-md border bg-orange-100/70 border-orange-300 text-orange-900 shadow-2xs text-[10.5px] font-bold leading-tight"
            title={`Government Holiday: ${holiday.name}`}
          >
            <Calendar className="w-3 h-3 text-orange-600 shrink-0" />
            <span className="truncate">{holiday.name}</span>
          </div>
        )}

        {/* Employee Leave & WFH Request Badges */}
        {day.items.map((item) => {
          const isApproved = item.status === 'Approved';
          const isDeclined = item.status === 'Declined' || item.status === 'Rejected';
          const isPastMonth = day.dateStr < `${currentYear}-${String(currentMonthIdx + 1).padStart(2, '0')}-01`;

          if (isPastMonth) {
            return (
              <div
                key={item.id}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg border text-left bg-[#F1F5F9] border-[#CBD5E1] shadow-2xs"
                title="Past-month leave application"
              >
                <div className="w-4.5 h-4.5 rounded-full bg-[#E2E8F0] text-[#64748B] text-[9.5px] font-bold flex items-center justify-center shrink-0">
                  {getInitial(item.employeeName)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10.5px] font-bold text-slate-700 leading-tight truncate">{item.employeeName || 'Employee'}</div>
                  <div className="text-[9px] font-medium text-[#64748B] leading-tight truncate">{getCategoryLabel(item)}</div>
                </div>
              </div>
            );
          }

          if (isApproved) {
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onReview(item, 'leave')}
                className="w-full flex items-center gap-1.5 px-2 py-1 rounded-lg border text-left bg-[#F0FDF4] border-[#DCFCE7] hover:bg-[#DCFCE7]/70 transition-colors shadow-2xs cursor-pointer group"
                title="Approved application. Click to review or decline."
              >
                <div className="w-4.5 h-4.5 rounded-full bg-[#DCFCE7] text-[#16A34A] text-[9.5px] font-bold flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  {getInitial(item.employeeName)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10.5px] font-bold text-slate-800 leading-tight truncate">{item.employeeName || 'Employee'}</div>
                  <div className="text-[9px] font-medium text-[#16A34A] leading-tight truncate">{getCategoryLabel(item)}</div>
                </div>
              </button>
            );
          }

          if (isDeclined) {
            return (
              <div
                key={item.id}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg border text-left bg-[#FEE2E2] border-[#FCA5A5] shadow-2xs"
                title="Declined leave application"
              >
                <div className="w-4.5 h-4.5 rounded-full bg-[#FECACA] text-[#B91C1C] text-[9.5px] font-bold flex items-center justify-center shrink-0">
                  {getInitial(item.employeeName)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10.5px] font-bold text-slate-900 leading-tight truncate">{item.employeeName || 'Employee'}</div>
                  <div className="text-[9px] font-bold text-[#B91C1C] leading-tight truncate">{getCategoryLabel(item)}</div>
                </div>
              </div>
            );
          }

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onReview(item, 'leave')}
              className="w-full flex items-center gap-1.5 px-2 py-1 rounded-lg border text-left bg-[#FFF5F2] border-[#FFDCD2] hover:bg-[#FFEAE3] hover:border-[#FFC8B8] transition-colors shadow-2xs cursor-pointer group"
              title="Click to review leave application"
            >
              <div className="w-4.5 h-4.5 rounded-full bg-[#FFE4DE] text-[#F25624] text-[9.5px] font-bold flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                {getInitial(item.employeeName)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10.5px] font-bold text-slate-800 leading-tight truncate">{item.employeeName || 'Employee'}</div>
                <div className="text-[9px] font-semibold text-[#F25624] leading-tight truncate">{getCategoryLabel(item)}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
