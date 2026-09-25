import { useState, useEffect, useMemo } from 'react';
import { Plus, Calendar, CheckCircle2, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { UserRole } from '../ui/Layout';
import Breadcrumbs from '../ui/Breadcrumbs';
import LeaveApplyDrawer from './LeaveApplyDrawer';
import LeaveApprovalDrawer from './LeaveApprovalDrawer';
import LeaveEditDrawer from './LeaveEditDrawer';
import TeamAvailabilityView from './TeamAvailabilityView';
import ApprovalsCalendarView, { MONTH_NAMES, CalendarFilterTab } from './ApprovalsCalendarView';
import MyLeavesKPICards from './MyLeavesKPICards';
import MyLeavesTable from './MyLeavesTable';
import { useSearch } from '../../context/SearchContext';

const LEAVE_YEARS = [2024, 2025, 2026, 2027, 2028, 2029];

export default function LeavesView({ activeRole }: { activeRole: UserRole }) {
  const { searchQuery, setSearchPlaceholder } = useSearch();
  const [selectedYear, setSelectedYear] = useState(2026);
  const [approvalMonthIdx, setApprovalMonthIdx] = useState(8);
  const [approvalYear, setApprovalYear] = useState(2026);
  const [activeTab, setActiveTab] = useState<'approvals' | 'dashboard' | 'calendar'>(
    activeRole === 'Employee' ? 'dashboard' : 'approvals'
  );
  const [calendarFilter, setCalendarFilter] = useState<CalendarFilterTab>('all');
  const [balance, setBalance] = useState<any>(null);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [approvalRequests, setApprovalRequests] = useState<any[]>([]);
  const [approvalCompOffs, setApprovalCompOffs] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [openApply, setOpenApply] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [reviewItem, setReviewItem] = useState<{ item: any; type: 'leave' | 'compoff' } | null>(null);

  useEffect(() => {
    setSearchPlaceholder('Search employees by Employee ID or name...');
  }, [setSearchPlaceholder]);

  useEffect(() => { setApprovalYear(selectedYear); }, [selectedYear]);

  const loadData = (year: number) => {
    fetch(`/api/leaves/balances?year=${year}`).then((r) => (r.ok ? r.json() : null)).then((d) => setBalance(d || null)).catch(() => {});
    fetch(`/api/leaves/my-requests?year=${year}`).then((r) => (r.ok ? r.json() : [])).then((d) => setMyRequests(Array.isArray(d) ? d : [])).catch(() => setMyRequests([]));
    fetch(`/api/leaves/approval-requests?year=${year}`).then((r) => (r.ok ? r.json() : [])).then((d) => setApprovalRequests(Array.isArray(d) ? d : [])).catch(() => setApprovalRequests([]));
    fetch(`/api/leaves/approval-compoffs?year=${year}`).then((r) => (r.ok ? r.json() : [])).then((d) => setApprovalCompOffs(Array.isArray(d) ? d : [])).catch(() => setApprovalCompOffs([]));
    fetch(`/api/leaves/holidays?year=${year}`).then((r) => (r.ok ? r.json() : [])).then((d) => setHolidays(Array.isArray(d) ? d : [])).catch(() => setHolidays([]));
  };

  useEffect(() => { loadData(selectedYear); }, [selectedYear]);

  const handleCancelApplication = async (id: number | string) => {
    if (!window.confirm('Are you sure you want to cancel this leave application?')) return;
    try {
      const res = await fetch(`/api/leaves/requests/${id}/cancel`, { method: 'POST' });
      if (res.ok) loadData(selectedYear);
    } catch (err) { console.error('Cancel error:', err); }
  };

  const handleDeleteApplication = async (id: number | string) => {
    if (!window.confirm('Are you sure you want to permanently delete this leave application record?')) return;
    try {
      const res = await fetch(`/api/leaves/requests/${id}`, { method: 'DELETE' });
      if (res.ok) loadData(selectedYear);
    } catch (err) { console.error('Delete error:', err); }
  };

  const currentMonthStr = `${approvalYear}-${String(approvalMonthIdx + 1).padStart(2, '0')}`;

  const kpiData = useMemo(() => {
    const pending = approvalRequests.filter((r) => r.status?.startsWith('Pending') || r.status === 'Pending_PM' || r.status === 'Pending_SA').length;
    const wfhEmps = new Set(approvalRequests.filter((r) => r.leaveType === 'Work From Home' && (r.startDate?.startsWith(currentMonthStr) || r.endDate?.startsWith(currentMonthStr))).map((r) => r.employeeId || r.employeeName)).size;
    const sickEmps = new Set(approvalRequests.filter((r) => r.leaveType === 'Sick Leave' && (r.startDate?.startsWith(currentMonthStr) || r.endDate?.startsWith(currentMonthStr))).map((r) => r.employeeId || r.employeeName)).size;
    const otCount = approvalCompOffs.length;
    return { pending, wfhEmps, sickEmps, otCount };
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
  const filteredMyRequests = myRequests.filter((r) => !q || (r.leaveType && r.leaveType.toLowerCase().includes(q)) || (r.reason && r.reason.toLowerCase().includes(q)) || (r.startDate && r.startDate.includes(q)));

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-200">
      <LeaveApplyDrawer open={openApply} selectedYear={selectedYear} balanceData={balance} publishedHolidays={holidays} onClose={() => setOpenApply(false)} onApplied={() => loadData(selectedYear)} />
      <LeaveEditDrawer open={!!editingItem} item={editingItem} selectedYear={selectedYear} balanceData={balance} publishedHolidays={holidays} onClose={() => setEditingItem(null)} onSaved={() => loadData(selectedYear)} onDeleted={() => loadData(selectedYear)} />
      <LeaveApprovalDrawer open={!!reviewItem} item={reviewItem?.item} type={reviewItem?.type || 'leave'} onClose={() => setReviewItem(null)} onProcessed={() => loadData(selectedYear)} />

      <Breadcrumbs items={[{ label: 'Leaves & Calendar' }]} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-studio-border pb-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-[20px] font-bold tracking-tight text-studio-text">Leaves &amp; Calendar</h2>

          {/* Compact Management Summary Filters (SA & PM only, on Approvals) */}
          {activeRole !== 'Employee' && activeTab === 'approvals' && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => handleSelectKpi('pending')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11.5px] border transition-all cursor-pointer shadow-2xs ${
                  calendarFilter === 'pending'
                    ? 'bg-amber-500 text-white border-amber-600 font-bold'
                    : 'bg-white border-studio-border text-studio-text hover:bg-studio-sidebar font-medium'
                }`}
              >
                <span>Pending Approvals</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10.5px] font-mono font-bold ${
                  calendarFilter === 'pending' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>{kpiData.pending}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectKpi('wfh')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11.5px] border transition-all cursor-pointer shadow-2xs ${
                  calendarFilter === 'wfh'
                    ? 'bg-sky-500 text-white border-sky-600 font-bold'
                    : 'bg-white border-studio-border text-studio-text hover:bg-studio-sidebar font-medium'
                }`}
              >
                <span>Work From Home</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10.5px] font-mono font-bold ${
                  calendarFilter === 'wfh' ? 'bg-sky-600 text-white' : 'bg-sky-50 text-sky-700 border border-sky-200'
                }`}>{kpiData.wfhEmps}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectKpi('sick')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11.5px] border transition-all cursor-pointer shadow-2xs ${
                  calendarFilter === 'sick'
                    ? 'bg-purple-500 text-white border-purple-600 font-bold'
                    : 'bg-white border-studio-border text-studio-text hover:bg-studio-sidebar font-medium'
                }`}
              >
                <span>Sick Leave</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10.5px] font-mono font-bold ${
                  calendarFilter === 'sick' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700 border border-purple-200'
                }`}>{kpiData.sickEmps}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectKpi('overtime')}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11.5px] border bg-white border-studio-border text-studio-text hover:bg-studio-sidebar font-medium transition-all cursor-pointer shadow-2xs"
              >
                <span>Comp Off</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10.5px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">{kpiData.otCount}</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="px-2.5 py-1.5 border border-studio-border rounded bg-white text-[12px] font-semibold text-studio-text focus:outline-none focus:border-brand-orange shadow-2xs">
            {LEAVE_YEARS.map((y) => (<option key={y} value={y}>{y}</option>))}
          </select>
          <button type="button" onClick={() => setOpenApply(true)} className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-orange text-white rounded text-[12px] font-semibold hover:bg-opacity-90 transition-colors shadow-sm cursor-pointer">
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
          <MyLeavesKPICards balance={balance} />
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
