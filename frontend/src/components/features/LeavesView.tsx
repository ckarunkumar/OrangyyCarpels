import { useState, useEffect } from 'react';
import { Plus, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { UserRole } from '../ui/Layout';
import Breadcrumbs from '../ui/Breadcrumbs';
import LeaveApplyDrawer from './LeaveApplyDrawer';
import LeaveApprovalDrawer from './LeaveApprovalDrawer';
import TeamAvailabilityView from './TeamAvailabilityView';
import ApprovalsCalendarView from './ApprovalsCalendarView';

const LEAVE_YEARS = [2024, 2025, 2026, 2027, 2028, 2029];

const DEFAULT_MY_REQUESTS = [
  { id: 101, leaveType: 'casual Leave', leaveCategory: 'Outing', startDate: '20-09-2026', endDate: '20-09-2026', isHalfDay: true, halfDaySession: 'First half', daysCount: 0.5, reason: 'Outing', status: 'Pending_PM' },
  { id: 102, leaveType: 'Leave', leaveCategory: 'Sick Leave', startDate: '13-09-2026', endDate: '13-09-2026', isHalfDay: false, halfDaySession: null, daysCount: 1, reason: 'Sick', status: 'Approved' },
  { id: 103, leaveType: 'Work From Home', leaveCategory: 'WFH', startDate: '02-08-2026', endDate: '02-08-2026', isHalfDay: false, halfDaySession: null, daysCount: 1, reason: 'WFH', status: 'Approved' },
  { id: 104, leaveType: 'optional Holiday', leaveCategory: 'Sick Leave', startDate: '19-07-2026', endDate: '19-07-2026', isHalfDay: true, halfDaySession: 'Second Half', daysCount: 0.5, reason: 'Sick', status: 'Approved' },
];

const DEFAULT_APPROVAL_REQUESTS = [
  { id: 201, employeeName: 'Vishnu', leaveType: 'Leave', leaveCategory: 'Sick Leave', startDate: '01-09-2026', endDate: '01-09-2026', isHalfDay: false, halfDaySession: null, daysCount: 1, reason: 'Sick', status: 'Approved' },
  { id: 202, employeeName: 'Sivakami', leaveType: 'Work From Home', leaveCategory: 'WFH', startDate: '11-09-2026', endDate: '11-09-2026', isHalfDay: false, halfDaySession: null, daysCount: 1, reason: 'WFH', status: 'Pending_PM' },
  { id: 203, employeeName: 'Purjith', leaveType: 'casual Leave', leaveCategory: 'casual Leave', startDate: '17-09-2026', endDate: '17-09-2026', isHalfDay: false, halfDaySession: null, daysCount: 1, reason: 'Personal', status: 'Approved' },
  { id: 204, employeeName: 'Vishnu', leaveType: 'Leave', leaveCategory: 'Sick Leave', startDate: '21-09-2026', endDate: '21-09-2026', isHalfDay: false, halfDaySession: null, daysCount: 1, reason: 'Sick', status: 'Pending_PM' },
  { id: 205, employeeName: 'Sivakami', leaveType: 'Work From Home', leaveCategory: 'WFH', startDate: '30-09-2026', endDate: '30-09-2026', isHalfDay: false, halfDaySession: null, daysCount: 1, reason: 'WFH', status: 'Pending_PM' },
];

const formatDateDMY = (dateStr: string) => {
  if (!dateStr) return '';
  if (dateStr.includes('-') && dateStr.split('-')[0].length === 4) {
    const [y, m, d] = dateStr.split('-');
    return `${d}-${m}-${y}`;
  }
  return dateStr;
};

const getCategoryLabel = (req: any) => {
  if (req.leaveCategory) return req.leaveCategory;
  if (req.leaveType === 'Work From Home') return 'WFH';
  if (req.leaveType === 'Casual Leave' || req.leaveType === 'casual Leave') return 'Outing';
  if (req.leaveType === 'Sick Leave') return 'Sick Leave';
  if (req.leaveType === 'Earned Leave') return 'Earned Leave';
  if (req.leaveType === 'Optional Holiday' || req.leaveType === 'optional Holiday') return 'Sick Leave';
  return req.leaveType;
};

export default function LeavesView({ activeRole }: { activeRole: UserRole }) {
  const [selectedYear, setSelectedYear] = useState(2026);
  const [activeTab, setActiveTab] = useState<'approvals' | 'dashboard' | 'calendar'>(
    activeRole === 'Employee' ? 'dashboard' : 'approvals'
  );
  const [balance, setBalance] = useState<any>(null);
  const [myRequests, setMyRequests] = useState<any[]>(DEFAULT_MY_REQUESTS);
  const [approvalRequests, setApprovalRequests] = useState<any[]>(DEFAULT_APPROVAL_REQUESTS);
  const [approvalCompOffs, setApprovalCompOffs] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [openApply, setOpenApply] = useState(false);
  const [reviewItem, setReviewItem] = useState<{ item: any; type: 'leave' | 'compoff' } | null>(null);

  const loadData = (year: number = selectedYear) => {
    fetch(`/api/leaves/balance?year=${year}`).then((r) => r.json()).then(setBalance).catch(() => {});
    fetch('/api/leaves/requests?scope=mine').then((r) => r.json()).then((d) => {
      if (Array.isArray(d)) {
        setMyRequests(d.length > 0 ? d : DEFAULT_MY_REQUESTS);
      }
    }).catch(() => {});
    fetch('/api/leaves/requests?scope=approvals').then((r) => r.json()).then((d) => {
      if (Array.isArray(d)) {
        setApprovalRequests(d.length > 0 ? d : DEFAULT_APPROVAL_REQUESTS);
      }
    }).catch(() => {});
    fetch('/api/leaves/compoff?scope=approvals').then((r) => r.json()).then((d) => Array.isArray(d) && setApprovalCompOffs(d)).catch(() => {});
    fetch(`/api/leaves/holidays?year=${year}&published=true`).then((r) => r.json()).then((d) => Array.isArray(d) && setHolidays(d)).catch(() => {});
  };

  useEffect(() => { loadData(selectedYear); }, [selectedYear]);

  const pendingLeavesCount = approvalRequests.filter((r) => r.status?.startsWith('Pending')).length;
  const pendingCompOffsCount = approvalCompOffs.filter((c) => c.status?.startsWith('Pending')).length;
  const totalPendingCount = pendingLeavesCount + pendingCompOffsCount;

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-200">
      <LeaveApplyDrawer
        open={openApply}
        onClose={() => setOpenApply(false)}
        onApplied={() => loadData(selectedYear)}
        balanceData={balance}
        selectedYear={selectedYear}
        publishedHolidays={holidays}
      />
      <LeaveApprovalDrawer
        open={!!reviewItem}
        item={reviewItem?.item}
        type={reviewItem?.type || 'leave'}
        onClose={() => setReviewItem(null)}
        onProcessed={() => loadData(selectedYear)}
      />

      <Breadcrumbs items={[{ label: 'Leaves & Calendar' }]} />

      <div className="flex justify-between items-center border-b border-studio-border pb-3">
        <div>
          <h2 className="text-[20px] font-bold tracking-tight text-studio-text">Leaves & Calendar</h2>
          <p className="text-[12px] text-studio-muted">Manage time-off requests, WFH quotas, and published studio calendar</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-2.5 py-1.5 border border-studio-border rounded bg-white text-[12px] font-semibold text-studio-text focus:outline-none focus:border-brand-orange shadow-2xs"
          >
            {LEAVE_YEARS.map((y) => (<option key={y} value={y}>{y}</option>))}
          </select>
          <button
            type="button"
            onClick={() => setOpenApply(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-orange text-white rounded text-[12px] font-semibold hover:bg-opacity-90 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Apply
          </button>
        </div>
      </div>

      {/* Tabs: Approvals -> My Leaves -> Holiday Calendar for SA & PM */}
      <div className="border-b border-studio-border flex gap-6 text-[13px] font-medium">
        {activeRole !== 'Employee' && (
          <button
            onClick={() => setActiveTab('approvals')}
            className={`pb-2.5 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'approvals' ? 'border-brand-orange text-brand-orange font-bold' : 'border-transparent text-studio-muted hover:text-studio-text'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" /> Approvals
            {totalPendingCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-brand-orange text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                {totalPendingCount}
              </span>
            )}
          </button>
        )}
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`pb-2.5 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'dashboard' ? 'border-brand-orange text-brand-orange font-bold' : 'border-transparent text-studio-muted hover:text-studio-text'
          }`}
        >
          <Clock className="w-4 h-4" /> My Leaves
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`pb-2.5 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'calendar' ? 'border-brand-orange text-brand-orange font-bold' : 'border-transparent text-studio-muted hover:text-studio-text'
          }`}
        >
          <Calendar className="w-4 h-4" /> Holiday Calendar
        </button>
      </div>

      {/* Tab 1 (for SA/PM): Approvals Calendar View */}
      {activeTab === 'approvals' && activeRole !== 'Employee' && (
        <ApprovalsCalendarView
          requests={approvalRequests}
          compOffRequests={approvalCompOffs}
          selectedYear={selectedYear}
          onReview={(item, type) => setReviewItem({ item, type })}
        />
      )}

      {/* Tab 2: My Leaves */}
      {activeTab === 'dashboard' && (
        <div className="space-y-4">
          {/* 6 KPI Cards in 1 Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white border border-studio-border rounded-lg p-3.5 shadow-2xs">
              <span className="text-[10px] font-bold text-studio-muted uppercase tracking-wider block truncate">CASUAL (CL)</span>
              <div className="text-[20px] font-bold text-studio-text mt-1 font-mono">
                {balance?.casualRemaining ?? 11} <span className="text-[11px] text-studio-muted font-normal">/ {balance?.casualQuota ?? 12}d</span>
              </div>
            </div>
            <div className="bg-white border border-studio-border rounded-lg p-3.5 shadow-2xs">
              <span className="text-[10px] font-bold text-studio-muted uppercase tracking-wider block truncate">SICK (SL)</span>
              <div className="text-[20px] font-bold text-studio-text mt-1 font-mono">
                {balance?.sickRemaining ?? 10} <span className="text-[11px] text-studio-muted font-normal">/ {balance?.sickQuota ?? 12}d</span>
              </div>
            </div>
            <div className="bg-white border border-studio-border rounded-lg p-3.5 shadow-2xs">
              <span className="text-[10px] font-bold text-studio-muted uppercase tracking-wider block truncate">EARNED (EL)</span>
              <div className="text-[20px] font-bold text-studio-text mt-1 font-mono">
                {balance?.earnedRemaining ?? 13} <span className="text-[11px] text-studio-muted font-normal">/ {balance?.earnedQuota ?? 15}d</span>
              </div>
            </div>
            <div className="bg-white border border-studio-border rounded-lg p-3.5 shadow-2xs">
              <span className="text-[10px] font-bold text-brand-orange uppercase tracking-wider block truncate">COMP-OFF</span>
              <div className="text-[20px] font-bold text-brand-orange mt-1 font-mono">
                {balance?.compOffBalance ?? 0} <span className="text-[11px] text-studio-muted font-normal">days</span>
              </div>
            </div>
            <div className="bg-white border border-studio-border rounded-lg p-3.5 shadow-2xs">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block truncate">WFH (MONTHLY)</span>
              <div className="text-[20px] font-bold text-blue-600 mt-1 font-mono">
                {balance?.wfhRemainingThisMonth ?? 1} <span className="text-[11px] text-studio-muted font-normal">left</span>
              </div>
            </div>
            <div className="bg-white border border-studio-border rounded-lg p-3.5 shadow-2xs">
              <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block truncate">OPTIONAL (OH)</span>
              <div className="text-[20px] font-bold text-purple-600 mt-1 font-mono">
                {balance?.optionalHolidaysRemaining ?? 1} <span className="text-[11px] text-studio-muted font-normal">/ {balance?.optionalHolidaysQuota ?? 2}</span>
              </div>
            </div>
          </div>

          {/* Table: My Applications & Requests */}
          <div className="border border-studio-border rounded-lg bg-white overflow-hidden shadow-xs">
            <div className="bg-slate-50/90 border-b border-studio-border px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
              <span>MY APPLICATIONS & REQUESTS</span>
              <span className="font-mono text-[11px] text-slate-500 font-bold uppercase">{myRequests.length} RECORDS</span>
            </div>

            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-studio-border/60 bg-white text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-5 font-bold">APPLICATION TYPE</th>
                    <th className="py-2.5 px-5 font-bold">LEAVE CATEGORY</th>
                    <th className="py-2.5 px-5 font-bold">START DATE</th>
                    <th className="py-2.5 px-5 font-bold">END DATE</th>
                    <th className="py-2.5 px-5 font-bold">HALF-DAY</th>
                    <th className="py-2.5 px-5 font-bold">NUMBER OF DAYS</th>
                    <th className="py-2.5 px-5 font-bold">REASON / NOTES</th>
                    <th className="py-2.5 px-5 font-bold text-left">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-studio-border/40 text-[12.5px] text-slate-700">
                  {myRequests.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500 text-[12.5px]">
                        No applications submitted yet. Click "+ Apply" to submit time-off or WFH.
                      </td>
                    </tr>
                  ) : (
                    myRequests.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-5 font-medium text-slate-800">{r.leaveType}</td>
                        <td className="py-3.5 px-5 text-slate-600 font-medium">{getCategoryLabel(r)}</td>
                        <td className="py-3.5 px-5 font-mono text-[12px] text-slate-700 font-medium">{formatDateDMY(r.startDate)}</td>
                        <td className="py-3.5 px-5 font-mono text-[12px] text-slate-700 font-medium">{formatDateDMY(r.endDate)}</td>
                        <td className="py-3.5 px-5">
                          {r.halfDaySession === 'First half' || r.halfDaySession === 'First Half' ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200/80 text-[11px] font-medium">First half</span>
                          ) : r.halfDaySession === 'Second Half' ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200/80 text-[11px] font-medium">Second Half</span>
                          ) : (
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[11px] font-medium">None</span>
                          )}
                        </td>
                        <td className="py-3.5 px-5 text-slate-700 font-medium">{r.daysCount === 0.5 ? '0.5 Day' : `${r.daysCount} Day`}</td>
                        <td className="py-3.5 px-5 text-slate-700 font-medium">{r.reason}</td>
                        <td className="py-3.5 px-5">
                          {r.status?.startsWith('Pending') ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200/80 text-[11px] font-medium">
                              {r.status}
                            </span>
                          ) : r.status === 'Approved' ? (
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Holiday Calendar */}
      {activeTab === 'calendar' && (
        <TeamAvailabilityView holidays={holidays} />
      )}
    </div>
  );
}
