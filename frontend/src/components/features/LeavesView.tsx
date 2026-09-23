import { useState, useEffect } from 'react';
import { Plus, Calendar, CheckCircle2, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { UserRole } from '../ui/Layout';
import Breadcrumbs from '../ui/Breadcrumbs';
import LeaveApplyDrawer from './LeaveApplyDrawer';
import LeaveApprovalDrawer from './LeaveApprovalDrawer';
import LeaveEditDrawer from './LeaveEditDrawer';
import TeamAvailabilityView from './TeamAvailabilityView';
import ApprovalsCalendarView, { MONTH_NAMES } from './ApprovalsCalendarView';
import MyLeavesKPICards from './MyLeavesKPICards';
import MyLeavesTable from './MyLeavesTable';

const LEAVE_YEARS = [2024, 2025, 2026, 2027, 2028, 2029];

export default function LeavesView({ activeRole }: { activeRole: UserRole }) {
  const [selectedYear, setSelectedYear] = useState(2026);
  const [approvalMonthIdx, setApprovalMonthIdx] = useState(8);
  const [approvalYear, setApprovalYear] = useState(2026);
  const [activeTab, setActiveTab] = useState<'approvals' | 'dashboard' | 'calendar'>(
    activeRole === 'Employee' ? 'dashboard' : 'approvals'
  );
  const [balance, setBalance] = useState<any>(null);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [approvalRequests, setApprovalRequests] = useState<any[]>([]);
  const [approvalCompOffs, setApprovalCompOffs] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [openApply, setOpenApply] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [reviewItem, setReviewItem] = useState<{ item: any; type: 'leave' | 'compoff' } | null>(null);

  useEffect(() => { setApprovalYear(selectedYear); }, [selectedYear]);

  const handlePrevApprovalMonth = () => {
    if (approvalMonthIdx === 0) { setApprovalMonthIdx(11); setApprovalYear((y) => y - 1); }
    else setApprovalMonthIdx((m) => m - 1);
  };

  const handleNextApprovalMonth = () => {
    if (approvalMonthIdx === 11) { setApprovalMonthIdx(0); setApprovalYear((y) => y + 1); }
    else setApprovalMonthIdx((m) => m + 1);
  };

  const loadData = (year: number) => {
    fetch(`/api/leaves/balances?year=${year}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setBalance(d || null)).catch(() => {});

    fetch(`/api/leaves/my-requests?year=${year}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setMyRequests(Array.isArray(d) ? d : [])).catch(() => setMyRequests([]));

    fetch(`/api/leaves/approval-requests?year=${year}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setApprovalRequests(Array.isArray(d) ? d : [])).catch(() => setApprovalRequests([]));

    fetch(`/api/leaves/approval-compoffs?year=${year}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setApprovalCompOffs(Array.isArray(d) ? d : [])).catch(() => setApprovalCompOffs([]));

    fetch(`/api/leaves/holidays?year=${year}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setHolidays(Array.isArray(d) ? d : [])).catch(() => setHolidays([]));
  };

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
    } catch (err) { console.error('Delete application error:', err); }
  };

  useEffect(() => { loadData(selectedYear); }, [selectedYear]);

  const totalPendingCount = approvalRequests.filter((r) => r.status?.startsWith('Pending')).length;

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-200">
      <LeaveApplyDrawer
        open={openApply} selectedYear={selectedYear} balanceData={balance} publishedHolidays={holidays}
        onClose={() => setOpenApply(false)} onApplied={() => loadData(selectedYear)}
      />
      <LeaveEditDrawer
        open={!!editingItem} item={editingItem} selectedYear={selectedYear} balanceData={balance} publishedHolidays={holidays}
        onClose={() => setEditingItem(null)} onSaved={() => loadData(selectedYear)} onDeleted={() => loadData(selectedYear)}
      />
      <LeaveApprovalDrawer
        open={!!reviewItem} item={reviewItem?.item} type={reviewItem?.type || 'leave'}
        onClose={() => setReviewItem(null)} onProcessed={() => loadData(selectedYear)}
      />

      <Breadcrumbs items={[{ label: 'Leaves & Calendar' }]} />

      <div className="flex justify-between items-center border-b border-studio-border pb-3">
        <div>
          <h2 className="text-[20px] font-bold tracking-tight text-studio-text">Leaves & Calendar</h2>
          <p className="text-[12px] text-studio-muted">Manage time-off requests, WFH quotas, and published studio calendar</p>
        </div>
        <div className="flex items-center gap-2">
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
              {totalPendingCount > 0 && (<span className="w-4 h-4 rounded-full bg-brand-orange text-white text-[10px] font-bold flex items-center justify-center shrink-0">{totalPendingCount}</span>)}
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
              <button type="button" onClick={handlePrevApprovalMonth} className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
              <div className="flex items-center gap-1.5 px-2 text-[12px] font-semibold text-slate-700 select-none">
                <Calendar className="w-3.5 h-3.5 text-brand-orange" />
                <span>{MONTH_NAMES[approvalMonthIdx]} {approvalYear}</span>
              </div>
              <button type="button" onClick={handleNextApprovalMonth} className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {activeTab === 'approvals' && activeRole !== 'Employee' && (
        <ApprovalsCalendarView
          requests={approvalRequests} compOffRequests={approvalCompOffs} selectedYear={selectedYear}
          monthIdx={approvalMonthIdx} year={approvalYear} onReview={(item, type) => setReviewItem({ item, type })}
        />
      )}

      {activeTab === 'dashboard' && (
        <div className="space-y-4">
          <MyLeavesKPICards balance={balance} />
          <MyLeavesTable
            myRequests={myRequests} onSelect={(r) => setEditingItem(r)} onEdit={(r) => setEditingItem(r)}
            onCancel={handleCancelApplication} onDelete={handleDeleteApplication}
          />
        </div>
      )}

      {activeTab === 'calendar' && (<TeamAvailabilityView holidays={holidays} />)}
    </div>
  );
}
