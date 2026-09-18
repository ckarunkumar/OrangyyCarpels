import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface ApprovalRequest {
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

interface Props {
  requests: ApprovalRequest[];
  compOffRequests: any[];
  selectedYear: number;
  onReview: (item: any, type: 'leave' | 'compoff') => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const parseDateToYMD = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.trim().split('-');
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
    // DD-MM-YYYY
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return dateStr;
};

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

const formatDateDMY = (dateStr: string) => {
  if (!dateStr) return '';
  if (dateStr.includes('-') && dateStr.split('-')[0].length === 4) {
    const [y, m, d] = dateStr.split('-');
    return `${d}-${m}-${y}`;
  }
  return dateStr;
};

export default function ApprovalsCalendarView({
  requests,
  compOffRequests,
  selectedYear,
  onReview,
}: Props) {
  // Default to September of selected year (or current month if matches)
  const [currentMonthIdx, setCurrentMonthIdx] = useState(8); // 8 = September (0-indexed)
  const [currentYear, setCurrentYear] = useState(selectedYear || 2026);

  // Sync year when parent changes selectedYear
  useMemo(() => {
    if (selectedYear && selectedYear !== currentYear) {
      setCurrentYear(selectedYear);
    }
  }, [selectedYear]);

  const handlePrevMonth = () => {
    if (currentMonthIdx === 0) {
      setCurrentMonthIdx(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonthIdx((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIdx === 11) {
      setCurrentMonthIdx(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonthIdx((m) => m + 1);
    }
  };

  const currentMonthStr = `${currentYear}-${String(currentMonthIdx + 1).padStart(2, '0')}`;

  // Normalized requests mapped by dates
  const requestsWithDates = useMemo(() => {
    return requests.map((r) => {
      const startYMD = parseDateToYMD(r.startDate);
      const endYMD = parseDateToYMD(r.endDate || r.startDate);
      return {
        ...r,
        startYMD,
        endYMD,
      };
    });
  }, [requests]);

  // Filter requests that fall in current month for header counts
  const monthRequests = useMemo(() => {
    return requestsWithDates.filter((r) => {
      return (
        r.startYMD.startsWith(currentMonthStr) ||
        r.endYMD.startsWith(currentMonthStr)
      );
    });
  }, [requestsWithDates, currentMonthStr]);

  const pendingCountInMonth = monthRequests.filter((r) =>
    r.status?.startsWith('Pending') || r.status === 'Pending_PM' || r.status === 'Pending_SA'
  ).length;

  // Build the 7-column calendar grid for currentMonthIdx + currentYear
  const calendarDays = useMemo(() => {
    const firstDayOfWeek = new Date(currentYear, currentMonthIdx, 1).getDay(); // 0 = Sun, 1 = Mon ...
    const daysInCurrentMonth = new Date(currentYear, currentMonthIdx + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonthIdx, 0).getDate();

    const days: {
      dayNumber: number;
      dateStr: string;
      isCurrentMonth: boolean;
      items: (typeof requestsWithDates)[0][];
    }[] = [];

    // Trailing days from previous month
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevMonth = currentMonthIdx === 0 ? 12 : currentMonthIdx;
      const prevYear = currentMonthIdx === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        dayNumber: dayNum,
        dateStr,
        isCurrentMonth: false,
        items: [],
      });
    }

    // Days of current month
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const items = requestsWithDates.filter((r) => {
        return r.startYMD <= dateStr && dateStr <= r.endYMD;
      });
      days.push({
        dayNumber: day,
        dateStr,
        isCurrentMonth: true,
        items,
      });
    }

    // Leading days for next month to complete the week rows
    const remainingDays = (7 - (days.length % 7)) % 7;
    for (let day = 1; day <= remainingDays; day++) {
      const nextMonth = currentMonthIdx === 11 ? 1 : currentMonthIdx + 2;
      const nextYear = currentMonthIdx === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        dayNumber: day,
        dateStr,
        isCurrentMonth: false,
        items: [],
      });
    }

    return days;
  }, [currentYear, currentMonthIdx, requestsWithDates]);

  return (
    <div className="space-y-4">
      {/* Approvals Calendar Card */}
      <div className="border border-studio-border rounded-lg bg-white overflow-hidden shadow-xs">
        {/* Card Header matching Image 2 */}
        <div className="bg-slate-50/90 border-b border-studio-border px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Month Navigator Button */}
            <div className="flex items-center border border-studio-border rounded-lg bg-white px-2 py-1 shadow-2xs">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1.5 px-2 text-[12px] font-semibold text-slate-700 select-none">
                <CalendarIcon className="w-3.5 h-3.5 text-brand-orange" />
                <span>{MONTH_NAMES[currentMonthIdx]} {currentYear}</span>
              </div>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Section Title */}
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              PENDING LEAVE & WFH APPROVALS ({pendingCountInMonth})
            </span>
          </div>

          <div className="font-mono text-[11px] text-slate-500 font-bold uppercase">
            {monthRequests.length} RECORDS
          </div>
        </div>

        {/* 7-Day Header */}
        <div className="grid grid-cols-7 border-b border-studio-border bg-white text-center text-[11px] font-bold text-slate-600 py-2.5">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Calendar Grid Cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-studio-border bg-slate-100/30">
          {calendarDays.map((day, idx) => (
            <div
              key={`${day.dateStr}-${idx}`}
              className={`min-h-[110px] p-2.5 flex flex-col justify-between transition-colors bg-white ${
                !day.isCurrentMonth ? 'bg-slate-50/50' : ''
              }`}
            >
              {/* Date Number */}
              <div className="text-left">
                <span
                  className={`text-[12px] font-semibold ${
                    day.isCurrentMonth ? 'text-slate-700' : 'text-slate-300'
                  }`}
                >
                  {day.dayNumber}
                </span>
              </div>

              {/* Day's Leave / WFH Request Badges */}
              <div className="space-y-1.5 mt-1">
                {day.items.map((item) => {
                  const isApproved = item.status === 'Approved';
                  const isDeclined = item.status === 'Declined' || item.status === 'Rejected';

                  // Styles for each status matching Image 2
                  if (isApproved) {
                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-left bg-[#F0FDF4] border-[#DCFCE7] shadow-2xs"
                      >
                        <div className="w-5 h-5 rounded-full bg-[#DCFCE7] text-[#16A34A] text-[10px] font-bold flex items-center justify-center shrink-0">
                          {getInitial(item.employeeName)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] font-bold text-slate-800 leading-tight truncate">
                            {item.employeeName || 'Employee'}
                          </div>
                          <div className="text-[9.5px] font-medium text-[#16A34A] leading-tight truncate">
                            {getCategoryLabel(item)}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (isDeclined) {
                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-left bg-[#FEF2F2] border-[#FEE2E2] shadow-2xs"
                      >
                        <div className="w-5 h-5 rounded-full bg-[#FEE2E2] text-[#DC2626] text-[10px] font-bold flex items-center justify-center shrink-0">
                          {getInitial(item.employeeName)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] font-bold text-slate-800 leading-tight truncate">
                            {item.employeeName || 'Employee'}
                          </div>
                          <div className="text-[9.5px] font-medium text-[#DC2626] leading-tight truncate">
                            {getCategoryLabel(item)}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Default: Pending (Peach/Orange with red/orange badge)
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onReview(item, 'leave')}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-left bg-[#FFF5F2] border-[#FFDCD2] hover:bg-[#FFEAE3] hover:border-[#FFC8B8] transition-colors shadow-2xs cursor-pointer group"
                      title="Click to review leave application"
                    >
                      <div className="w-5 h-5 rounded-full bg-[#FFE4DE] text-[#F25624] text-[10px] font-bold flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        {getInitial(item.employeeName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-bold text-slate-800 leading-tight truncate">
                          {item.employeeName || 'Employee'}
                        </div>
                        <div className="text-[9.5px] font-semibold text-[#F25624] leading-tight truncate">
                          {getCategoryLabel(item)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Pending Comp-Off Overtime Claims (Kept exactly as today) */}
      <div className="border border-studio-border rounded-lg bg-white overflow-hidden shadow-xs">
        <div className="bg-slate-50/90 border-b border-studio-border px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
          <span>PENDING COMP-OFF OVERTIME CLAIMS</span>
          <span className="font-mono text-[11px] text-slate-500 font-bold uppercase">{compOffRequests.length} RECORDS</span>
        </div>
        {compOffRequests.length === 0 ? (
          <div className="p-8 text-center text-[12.5px] text-slate-500 font-medium">
            No pending comp-off claims requiring authorization
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-studio-border/60 bg-white text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-5 font-bold">EMPLOYEE</th>
                  <th className="py-2.5 px-5 font-bold">WORKED DATE</th>
                  <th className="py-2.5 px-5 font-bold">HOURS WORKED</th>
                  <th className="py-2.5 px-5 font-bold">DAYS CREDIT</th>
                  <th className="py-2.5 px-5 font-bold">REASON / NOTES</th>
                  <th className="py-2.5 px-5 font-bold text-left">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-studio-border/40 text-[12.5px] text-slate-700">
                {compOffRequests.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-5 font-medium text-slate-800">{c.employeeName}</td>
                    <td className="py-3.5 px-5 font-mono text-[12px] text-slate-700 font-medium">{formatDateDMY(c.workedDate)}</td>
                    <td className="py-3.5 px-5 text-slate-700 font-medium">{c.hoursWorked} hrs</td>
                    <td className="py-3.5 px-5 font-semibold text-brand-orange">+{c.daysCredit} Day</td>
                    <td className="py-3.5 px-5 text-slate-700 font-medium">{c.reason}</td>
                    <td className="py-3.5 px-5">
                      {c.status?.startsWith('Pending') ? (
                        <button
                          type="button"
                          onClick={() => onReview(c, 'compoff')}
                          className="px-4 py-1.5 bg-brand-orange text-white rounded text-[12px] font-semibold hover:bg-orange-600 transition-colors shadow-xs cursor-pointer"
                        >
                          Review
                        </button>
                      ) : c.status === 'Approved' ? (
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/80 text-[11px] font-medium">
                          Approved
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200/80 text-[11px] font-medium">
                          Declined
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
