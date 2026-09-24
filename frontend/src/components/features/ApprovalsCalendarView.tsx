import { useState, useMemo } from 'react';
import ApprovalsCalendarCell, { ApprovalRequest } from './leaves/ApprovalsCalendarCell';
import PendingCompOffTable from './leaves/PendingCompOffTable';

export type CalendarFilterTab = 'all' | 'leave' | 'wfh' | 'sick' | 'pending';

interface Props {
  requests: ApprovalRequest[];
  compOffRequests: any[];
  holidays?: any[];
  selectedYear: number;
  monthIdx?: number;
  year?: number;
  activeFilterTab?: CalendarFilterTab;
  onChangeFilterTab?: (tab: CalendarFilterTab) => void;
  onReview: (item: any, type: 'leave' | 'compoff') => void;
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const parseDateToYMD = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.trim().split('-');
  if (parts.length === 3) {
    if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return dateStr;
};

export default function ApprovalsCalendarView({
  requests,
  compOffRequests,
  holidays = [],
  selectedYear,
  monthIdx = 8,
  year,
  activeFilterTab: externalFilterTab,
  onChangeFilterTab,
  onReview,
}: Props) {
  const [internalTab, setInternalTab] = useState<CalendarFilterTab>('all');
  const activeTab = externalFilterTab || internalTab;

  const setFilterTab = (t: CalendarFilterTab) => {
    setInternalTab(t);
    if (onChangeFilterTab) onChangeFilterTab(t);
  };

  const currentMonthIdx = monthIdx;
  const currentYear = year || selectedYear || 2026;
  const currentMonthStr = `${currentYear}-${String(currentMonthIdx + 1).padStart(2, '0')}`;

  const filteredByTabRequests = useMemo(() => {
    return requests
      .filter((r) => r.status !== 'Cancelled')
      .filter((r) => {
        if (activeTab === 'leave') return r.leaveType !== 'Work From Home';
        if (activeTab === 'wfh') return r.leaveType === 'Work From Home';
        if (activeTab === 'sick') return r.leaveType === 'Sick Leave';
        if (activeTab === 'pending') return r.status?.startsWith('Pending');
        return true; // 'all'
      })
      .map((r) => ({
        ...r,
        startYMD: parseDateToYMD(r.startDate),
        endYMD: parseDateToYMD(r.endDate || r.startDate),
      }));
  }, [requests, activeTab]);

  const monthRequests = useMemo(() => {
    return filteredByTabRequests.filter(
      (r) => r.startYMD.startsWith(currentMonthStr) || r.endYMD.startsWith(currentMonthStr)
    );
  }, [filteredByTabRequests, currentMonthStr]);

  const pendingCountInMonth = requests.filter((r) => {
    const startYMD = parseDateToYMD(r.startDate);
    const endYMD = parseDateToYMD(r.endDate || r.startDate);
    const inMonth = startYMD.startsWith(currentMonthStr) || endYMD.startsWith(currentMonthStr);
    return inMonth && (r.status?.startsWith('Pending') || r.status === 'Pending_PM' || r.status === 'Pending_SA');
  }).length;

  const calendarDays = useMemo(() => {
    const firstDayOfWeek = new Date(currentYear, currentMonthIdx, 1).getDay();
    const daysInCurrentMonth = new Date(currentYear, currentMonthIdx + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonthIdx, 0).getDate();
    const days: any[] = [];

    // Prev month days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevM = currentMonthIdx === 0 ? 12 : currentMonthIdx;
      const prevY = currentMonthIdx === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const dayOfWeek = new Date(prevY, prevM - 1, dayNum).getDay();
      days.push({
        dayNumber: dayNum, isCurrentMonth: false, dateStr,
        items: filteredByTabRequests.filter((r) => r.startYMD <= dateStr && dateStr <= r.endYMD),
        holiday: holidays.find((h) => h.date === dateStr),
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6, isSunday: dayOfWeek === 0, isSaturday: dayOfWeek === 6,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayOfWeek = new Date(currentYear, currentMonthIdx, d).getDay();
      days.push({
        dayNumber: d, isCurrentMonth: true, dateStr,
        items: filteredByTabRequests.filter((r) => r.startYMD <= dateStr && dateStr <= r.endYMD),
        holiday: holidays.find((h) => h.date === dateStr),
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6, isSunday: dayOfWeek === 0, isSaturday: dayOfWeek === 6,
      });
    }

    // Next month days
    const totalSlots = days.length <= 35 ? 35 : 42;
    const remaining = totalSlots - days.length;
    for (let n = 1; n <= remaining; n++) {
      const nextM = currentMonthIdx === 11 ? 1 : currentMonthIdx + 2;
      const nextY = currentMonthIdx === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(n).padStart(2, '0')}`;
      const dayOfWeek = new Date(nextY, nextM - 1, n).getDay();
      days.push({
        dayNumber: n, isCurrentMonth: false, dateStr,
        items: filteredByTabRequests.filter((r) => r.startYMD <= dateStr && dateStr <= r.endYMD),
        holiday: holidays.find((h) => h.date === dateStr),
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6, isSunday: dayOfWeek === 0, isSaturday: dayOfWeek === 6,
      });
    }
    return days;
  }, [currentYear, currentMonthIdx, filteredByTabRequests, holidays]);

  return (
    <div className="space-y-4">
      <div className="border border-studio-border rounded-lg bg-white overflow-hidden shadow-xs">
        {/* Calendar Top Header with Filter Tabs directly beside the calendar */}
        <div className="bg-slate-50/90 border-b border-studio-border px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Approvals Calendar ({pendingCountInMonth} Pending)
            </span>
            <span className="text-[11px] font-mono text-slate-500 font-semibold">
              {monthRequests.length} records
            </span>
          </div>

          {/* Filter Tabs: [All] [Leave] [Work From Home] */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-200/70 border border-slate-300/60 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1 text-[11.5px] rounded-md transition-colors cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white text-brand-orange font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('leave')}
              className={`px-3 py-1 text-[11.5px] rounded-md transition-colors cursor-pointer ${
                activeTab === 'leave'
                  ? 'bg-white text-brand-orange font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              Leave
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('wfh')}
              className={`px-3 py-1 text-[11.5px] rounded-md transition-colors cursor-pointer ${
                activeTab === 'wfh'
                  ? 'bg-white text-brand-orange font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              Work From Home
            </button>
          </div>
        </div>

        {/* 7-Day Header with Saturday & Sunday in Red */}
        <div className="grid grid-cols-7 border-b border-studio-border bg-white text-center text-[11px] font-bold py-2.5">
          <div className="text-red-500 font-extrabold">Sun</div>
          <div className="text-slate-600">Mon</div>
          <div className="text-slate-600">Tue</div>
          <div className="text-slate-600">Wed</div>
          <div className="text-slate-600">Thu</div>
          <div className="text-slate-600">Fri</div>
          <div className="text-red-500 font-extrabold">Sat</div>
        </div>

        {/* Calendar Grid Cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-studio-border bg-slate-100/30">
          {calendarDays.map((day, idx) => (
            <ApprovalsCalendarCell
              key={`${day.dateStr}-${idx}`}
              day={day}
              currentYear={currentYear}
              currentMonthIdx={currentMonthIdx}
              onReview={onReview}
            />
          ))}
        </div>
      </div>

      <PendingCompOffTable compOffRequests={compOffRequests} onReview={onReview} />
    </div>
  );
}
