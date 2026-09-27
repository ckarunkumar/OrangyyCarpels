import { useState, useEffect, useMemo } from 'react';
import { Plus, Calendar, CheckCircle2, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { UserRole } from '../ui/Layout';
import Breadcrumbs from '../ui/Breadcrumbs';
import LeaveApplyDrawer from './LeaveApplyDrawer';
import LeaveApprovalDrawer from './LeaveApprovalDrawer';
import LeaveEditDrawer from './LeaveEditDrawer';
import TeamAvailabilityView from './TeamAvailabilityView';
import ApprovalsCalendarView, { MONTH_NAMES, CalendarFilterTab } from './ApprovalsCalendarView';
import MyLeavesTable from './MyLeavesTable';
import { useSearch } from '../../context/SearchContext';

const LEAVE_YEARS = [2024, 2025, 2026, 2027, 2028, 2029];

export default function LeavesView({ activeRole }: { activeRole: UserRole }) {
  const { searchQuery, setSearchPlaceholder } = useSearch();
  const [selectedYear, setSelectedYear] = useState(2026);
  const [approvalMonthIdx, setApprovalMonthIdx] = useState(8);
  const [approvalYear, setApprovalYear] = useState(2026);
  const [activeTab, setActiveTab] = useState<'approvals' | 'dashboard' | 'calendar'>(activeRole === 'Employee' ? 'dashboard' : 'approvals');
  const [calendarFilter, setCalendarFilter] = useState<CalendarFilterTab>('all');
  const [myLeaveFilter, setMyLeaveFilter] = useState<string>('all');
  const [balance, setBalance] = useState<any>(null);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [approvalRequests, setApprovalRequests] = useState<any[]>([]);
  const [approvalCompOffs, setApprovalCompOffs] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [openApply, setOpenApply] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [reviewItem, setReviewItem] = useState<{ item: any; type: 'leave' | 'compoff' } | null>(null);

  useEffect(() => { setSearchPlaceholder('Search employees by Employee ID or name...'); }, [setSearchPlaceholder]);
  useEffect(() => { setApprovalYear(selectedYear); }, [selectedYear]);

  const loadData = (year: number) => {
    Promise.all([fetch(`/api/leaves/balances?year=${year}`).then((r) => (r.ok ? r.json() : null)), fetch(`/api/leaves/my-requests?year=${year}`).then((r) => (r.ok ? r.json() : [])), fetch(`/api/leaves/approval-requests?year=${year}`).then((r) => (r.ok ? r.json() : [])), fetch(`/api/leaves/approval-compoffs?year=${year}`).then((r) => (r.ok ? r.json() : [])), fetch(`/api/leaves/holidays?year=${year}`).then((r) => (r.ok ? r.json() : []))])
      .then(([bal, myReqs, appReqs, compOffs, hols]) => {
        setBalance(bal || null); setMyRequests(Array.isArray(myReqs) ? myReqs : []);
        setApprovalRequests(Array.isArray(appReqs) ? appReqs : []); setApprovalCompOffs(Array.isArray(compOffs) ? compOffs : []); setHolidays(Array.isArray(hols) ? hols : []);
      }).catch(() => {});
  };

  useEffect(() => { loadData(selectedYear); }, [selectedYear]);

  const handleCancelApplication = async (id: number | string) => {
    if (!window.confirm('Are you sure you want to cancel this leave application?')) return;
    try { const res = await fetch(`/api/leaves/requests/${id}/cancel`, { method: 'POST' }); if (res.ok) loadData(selectedYear); } catch (err) { console.error('Cancel error:', err); }
  };

  const handleDeleteApplication = async (id: number | string) => {
    if (!window.confirm('Are you sure you want to permanently delete this leave application record?')) return;
    try { const res = await fetch(`/api/leaves/requests/${id}`, { method: 'DELETE' }); if (res.ok) loadData(selectedYear); } catch (err) { console.error('Delete error:', err); }
  };

  const currentMonthStr = `${approvalYear}-${String(approvalMonthIdx + 1).padStart(2, '0')}`;

  const kpiData = useMemo(() => {
    const pending = approvalRequests.filter((r) => r.status?.startsWith('Pending') || r.status === 'Pending_PM' || r.status === 'Pending_SA').length;
    const wfhEmps = new Set(approvalRequests.filter((r) => r.leaveType === 'Work From Home' && (r.startDate?.startsWith(currentMonthStr) || r.endDate?.startsWith(currentMonthStr))).map((r) => r.employeeId || r.employeeName)).size;
    const sickEmps = new Set(approvalRequests.filter((r) => r.leaveType === 'Sick Leave' && (r.startDate?.startsWith(currentMonthStr) || r.endDate?.startsWith(currentMonthStr))).map((r) => r.employeeId || r.employeeName)).size;
    return { pending, wfhEmps, sickEmps, otCount: approvalCompOffs.length };
  }, [approvalRequests, approvalCompOffs, currentMonthStr]);

  const handleSelectKpi = (kpiKey: 'pending' | 'wfh' | 'sick' | 'overtime') => {
    setActiveTab('approvals');
    if (kpiKey === 'pending') setCalendarFilter(calendarFilter === 'pending' ? 'all' : 'pending');
    else if (kpiKey === 'wfh') setCalendarFilter(calendarFilter === 'wfh' ? 'all' : 'wfh');
    else if (kpiKey === 'sick') setCalendarFilter(calendarFilter === 'sick' ? 'all' : 'sick');
    else if (kpiKey === 'overtime') setCalendarFilter('all');
  };

  const q = searchQuery.toLowerCase().trim();
  const filteredApprovalRequests = approvalRequests.filter((r) => !q || (r.employeeName && r.employeeName.toLowerCase().includes(q)) || (r.employeeId && r.employeeId.toLowerCase().includes(q)) || (r.leaveType && r.leaveType.toLowerCase().includes(q)));
  const filteredMyRequests = myRequests.filter((r) => {
    if (myLeaveFilter !== 'all' && r.leaveType !== myLeaveFilter) return false;
    return !q || (r.leaveType && r.leaveType.toLowerCase().includes(q)) || (r.reason && r.reason.toLowerCase().includes(q)) || (r.startDate && r.startDate.includes(q));
  });

  const filterBtnCls = (isActive: boolean) => `flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11.5px] border transition-all cursor-pointer shadow-2xs ${isActive ? 'bg-white text-studio-text border-slate-300 font-bold' : 'bg-studio-sidebar/60 border-studio-border text-studio-muted hover:text-studio-text hover:bg-studio-sidebar font-medium'}`;

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-200">
      <LeaveApplyDrawer open={openApply} selectedYear={selectedYear} balanceData={balance} publishedHolidays={holidays} onClose={() => setOpenApply(false)} onApplied={() => loadData(selectedYear)} />
      <LeaveEditDrawer open={!!editingItem} item={editingItem} selectedYear={selectedYear} balanceData={balance} publishedHolidays={holidays} onClose={() => setEditingItem(null)} onSaved={() => loadData(selectedYear)} onDeleted={() => loadData(selectedYear)} />
      <LeaveApprovalDrawer open={!!reviewItem} item={reviewItem?.item} type={reviewItem?.type || 'leave'} onClose={() => setReviewItem(null)} onProcessed={() => loadData(selectedYear)} />

      <Breadcrumbs items={[{ label: 'Leaves & Calendar' }]} />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-studio-border pb-3">
        <div className="flex items-center gap-3">
          <h2 className="text-[20px] font-bold tracking-tight text-studio-text">Leaves &amp; Calendar</h2>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {activeRole !== 'Employee' && activeTab === 'approvals' && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <button type="button" onClick={() => handleSelectKpi('pending')} className={filterBtnCls(calendarFilter === 'pending')}>
                <span>Pending Approvals</span><span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700">{kpiData.pending}</span>
              </button>
              <button type="button" onClick={() => handleSelectKpi('wfh')} className={filterBtnCls(calendarFilter === 'wfh')}>
                <span>Work From Home</span><span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700">{kpiData.wfhEmps}</span>
              </button>
              <button type="button" onClick={() => handleSelectKpi('sick')} className={filterBtnCls(calendarFilter === 'sick')}>
                <span>Sick Leave</span><span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700">{kpiData.sickEmps}</span>
              </button>
              <button type="button" onClick={() => handleSelectKpi('overtime')} className={filterBtnCls(false)}>
                <span>Comp Off</span><span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700">{kpiData.otCount}</span>
              </button>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <button type="button" onClick={() => setMyLeaveFilter(myLeaveFilter === 'Casual Leave' ? 'all' : 'Casual Leave')} className={filterBtnCls(myLeaveFilter === 'Casual Leave')}>
                <span>Casual</span><span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700">{balance?.casualRemaining ?? 12}/{balance?.casualQuota ?? 12}d</span>
              </button>
              <button type="button" onClick={() => setMyLeaveFilter(myLeaveFilter === 'Sick Leave' ? 'all' : 'Sick Leave')} className={filterBtnCls(myLeaveFilter === 'Sick Leave')}>
                <span>Sick</span><span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700">{balance?.sickRemaining ?? 12}/{balance?.sickQuota ?? 12}d</span>
              </button>
              <button type="button" onClick={() => setMyLeaveFilter(myLeaveFilter === 'Earned Leave' ? 'all' : 'Earned Leave')} className={filterBtnCls(myLeaveFilter === 'Earned Leave')}>
                <span>Earned</span><span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700">{balance?.earnedRemaining ?? 15}/{balance?.earnedQuota ?? 15}d</span>
              </button>
              <button type="button" onClick={() => setMyLeaveFilter(myLeaveFilter === 'Comp-off' ? 'all' : 'Comp-off')} className={filterBtnCls(myLeaveFilter === 'Comp-off')}>
                <span>Comp-Off</span><span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700">{balance?.compOffBalance ?? 0}d</span>
              </button>
              <button type="button" onClick={() => setMyLeaveFilter(myLeaveFilter === 'Work From Home' ? 'all' : 'Work From Home')} className={filterBtnCls(myLeaveFilter === 'Work From Home')}>
                <span>WFH</span><span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700">{balance?.wfhRemainingThisMonth ?? 2} left</span>
              </button>
              <button type="button" onClick={() => setMyLeaveFilter(myLeaveFilter === 'Optional Holiday' ? 'all' : 'Optional Holiday')} className={filterBtnCls(myLeaveFilter === 'Optional Holiday')}>
                <span>Optional</span><span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700">{balance?.optionalHolidaysRemaining ?? 2}/{balance?.optionalHolidaysQuota ?? 2}</span>
              </button>
            </div>
          )}

          <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="px-3 py-2 border border-studio-border rounded-lg bg-white text-[12px] font-semibold text-studio-text focus:outline-none focus:border-brand-orange shadow-2xs">
            {LEAVE_YEARS.map((y) => (<option key={y} value={y}>{y}</option>))}
          </select>
          <button type="button" onClick={() => setOpenApply(true)} className="flex items-center gap-1.5 px-4 py-2 bg-brand-orange text-white rounded-lg text-[12px] font-bold hover:bg-opacity-90 transition-colors shadow-sm cursor-pointer">
            <Plus className="w-4 h-4" /> Apply
          </button>
        </div>
      </div>

      <div className="border-b border-studio-border flex justify-between items-center text-[13px] font-medium">
        <div className="flex gap-6">
          {activeRole !== 'Employee' && (
            <button onClick={() => setActiveTab('approvals')} className={`pb-2.5 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${activeTab === 'approvals' ? 'border-brand-orange text-brand-orange font-bold' : 'border-transparent text-studio-muted hover:text-studio-text'}`}>
              <CheckCircle2 className="w-4 h-4" /> Approvals
              {kpiData.pending > 0 && (<span className="w-4 h-4 rounded-full bg-brand-orange text-white text-[10px] font-bold flex items-center justify-center shrink-0">{kpiData.pending}</span>)}
            </button>
          )}
          <button onClick={() => setActiveTab('dashboard')} className={`pb-2.5 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${activeTab === 'dashboard' ? 'border-brand-orange text-brand-orange font-bold' : 'border-transparent text-studio-muted hover:text-studio-text'}`}>
            <Clock className="w-4 h-4" /> My Leaves
          </button>
          <button onClick={() => setActiveTab('calendar')} className={`pb-2.5 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${activeTab === 'calendar' ? 'border-brand-orange text-brand-orange font-bold' : 'border-transparent text-studio-muted hover:text-studio-text'}`}>
            <Calendar className="w-4 h-4" /> Holiday Calendar
          </button>
        </div>

        {activeTab === 'approvals' && activeRole !== 'Employee' && (
          <div className="pb-2">
            <div className="flex items-center border border-studio-border rounded-lg bg-white px-2 py-1 shadow-2xs">
              <button type="button" onClick={() => { if (approvalMonthIdx === 0) { setApprovalMonthIdx(11); setApprovalYear((y) => y - 1); } else setApprovalMonthIdx((m) => m - 1); }} className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
              <div className="flex items-center gap-1.5 px-2 text-[12px] font-semibold text-slate-700 select-none">
                <Calendar className="w-3.5 h-3.5 text-brand-orange" />
                <span>{MONTH_NAMES[approvalMonthIdx]} {approvalYear}</span>
              </div>
              <button type="button" onClick={() => { if (approvalMonthIdx === 11) { setApprovalMonthIdx(0); setApprovalYear((y) => y + 1); } else setApprovalMonthIdx((m) => m + 1); }} className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {activeTab === 'approvals' && activeRole !== 'Employee' && (
        <ApprovalsCalendarView
          requests={filteredApprovalRequests} compOffRequests={approvalCompOffs} holidays={holidays}
          selectedYear={selectedYear} monthIdx={approvalMonthIdx} year={approvalYear}
          activeFilterTab={calendarFilter} onChangeFilterTab={(t) => setCalendarFilter(t)}
          onReview={(item, type) => setReviewItem({ item, type })}
        />
      )}

      {activeTab === 'dashboard' && (
        <div className="space-y-4">
          <MyLeavesTable
            myRequests={filteredMyRequests} onSelect={(r) => setEditingItem(r)} onEdit={(r) => setEditingItem(r)}
            onCancel={handleCancelApplication} onDelete={handleDeleteApplication}
          />
        </div>
      )}

      {activeTab === 'calendar' && (<TeamAvailabilityView holidays={holidays} />)}
    </div>
  );
}
