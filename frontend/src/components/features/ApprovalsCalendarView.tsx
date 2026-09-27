import { useMemo } from 'react';
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
  const clean = String(dateStr).trim().split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) {
    if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return clean;
};

export default function ApprovalsCalendarView({
  requests,
  compOffRequests,
  holidays = [],
  selectedYear,
  monthIdx = 8,
  year,
  activeFilterTab = 'all',
  onReview,
}: Props) {
  const currentMonthIdx = monthIdx;
  const currentYear = year || selectedYear || 2026;
  const currentMonthStr = `${currentYear}-${String(currentMonthIdx + 1).padStart(2, '0')}`;

  const filteredByTabRequests = useMemo(() => {
    return requests
      .filter((r) => r.status !== 'Cancelled')
      .filter((r) => {
        if (activeFilterTab === 'leave') return r.leaveType !== 'Work From Home';
        if (activeFilterTab === 'wfh') return r.leaveType === 'Work From Home';
        if (activeFilterTab === 'sick') return r.leaveType === 'Sick Leave';
        if (activeFilterTab === 'pending') return r.status?.startsWith('Pending');
        return true;
      })
      .map((r) => ({
        ...r,
        startYMD: parseDateToYMD(r.startDate),
        endYMD: parseDateToYMD(r.endDate || r.startDate),
      }));
  }, [requests, activeFilterTab]);

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
    const startOffset = (firstDayOfWeek + 6) % 7; // Monday = 0, Sunday = 6
    const daysInCurrentMonth = new Date(currentYear, currentMonthIdx + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonthIdx, 0).getDate();
    const days: any[] = [];

    // Prev month days
    for (let i = startOffset - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevM = currentMonthIdx === 0 ? 12 : currentMonthIdx;
      const prevY = currentMonthIdx === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const dayOfWeek = new Date(prevY, prevM - 1, dayNum).getDay();
      days.push({
        dayNumber: dayNum, isCurrentMonth: false, dateStr,
        items: filteredByTabRequests.filter((r) => r.startYMD <= dateStr && dateStr <= r.endYMD),
        holiday: holidays.find((h) => parseDateToYMD(h.date) === dateStr),
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
        holiday: holidays.find((h) => parseDateToYMD(h.date) === dateStr),
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
        holiday: holidays.find((h) => parseDateToYMD(h.date) === dateStr),
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6, isSunday: dayOfWeek === 0, isSaturday: dayOfWeek === 6,
      });
    }
    return days;
  }, [currentYear, currentMonthIdx, filteredByTabRequests, holidays]);

  return (
    <div className="space-y-4">
      <div className="border border-studio-border rounded-lg bg-white overflow-hidden shadow-xs">
        {/* Calendar Top Header: Left heading, Right records */}
        <div className="bg-slate-50/90 border-b border-studio-border px-4 py-2.5 flex items-center justify-between gap-3">
          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
            Approvals Calendar ({pendingCountInMonth} Pending)
          </span>
          <span className="text-[11px] font-mono text-slate-500 font-semibold">
            {monthRequests.length} records
          </span>
        </div>

        {/* 7-Day Header: Mon -> Sun with Saturday & Sunday in Red */}
        <div className="grid grid-cols-7 border-b border-studio-border bg-white text-center text-[11px] font-bold py-2.5">
          <div className="text-slate-600">Mon</div>
          <div className="text-slate-600">Tue</div>
          <div className="text-slate-600">Wed</div>
          <div className="text-slate-600">Thu</div>
          <div className="text-slate-600">Fri</div>
          <div className="text-red-500 font-extrabold">Sat</div>
          <div className="text-red-500 font-extrabold">Sun</div>
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
