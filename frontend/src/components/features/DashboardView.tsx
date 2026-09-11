import { useState, useEffect } from 'react';
import { UserRole } from '../ui/Layout';
import { DollarSign, Clock, Layers, FolderKanban, History, TrendingUp } from 'lucide-react';
import { SkeletonRow } from '../ui/Skeleton';
import RateHistoryDrawer from './RateHistoryDrawer';
import BillingBadge from '../ui/BillingBadge';
import Breadcrumbs from '../ui/Breadcrumbs';

interface ProjectBilling {
  projectId: string; projectName: string; clientId: string; clientName: string;
  billingType: string; currency: string; rateAmount: number; rateFormatted: string; budgetHours: number;
  loggedHours: number; nativeAmountBilled: number; exchangeRateToINR: number;
  inrAmountBilled: number; status: string; effectiveStartDate: string;
}

interface BillingOverview {
  totalRevenueINR: number; tmRevenueINR: number; monthlyFixedRevenueINR: number;
  projectFixedRevenueINR: number; totalHoursLogged: number; activeProjectsCount: number;
  exchangeRates: Array<{ currency: string; rateToINR: number; source: string; isLocked: boolean }>;
  projects: ProjectBilling[]; activeMonthYear: string;
}

const FISCAL_YEARS = ['FY 2026-27', 'FY 2025-26', 'FY 2024-25'];

export default function DashboardView({ activeRole }: { activeRole: UserRole }) {
  const [data, setData] = useState<BillingOverview | null>(null);
  const [selectedFY, setSelectedFY] = useState(FISCAL_YEARS[0]);
  const [loading, setLoading] = useState(true);
  const [historyProj, setHistoryProj] = useState<ProjectBilling | null>(null);

  const fetchDashboard = (fy: string = selectedFY) => {
    setLoading(true);
    fetch(`/api/billing/summary?fy=${encodeURIComponent(fy)}`)
      .then((res) => res.ok ? res.json() : null)
      .then((resData) => { if (resData) setData(resData); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDashboard(selectedFY); }, [activeRole, selectedFY]);

  const renderSuperAdmin = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 border border-studio-border rounded-lg shadow-sm">
          <div className="flex justify-between items-start mb-1"><span className="text-[11px] text-studio-muted font-medium uppercase tracking-wider">Total Revenue (INR)</span><DollarSign className="w-4 h-4 text-brand-orange" /></div>
          <p className="text-[22px] font-bold text-studio-text">₹{data?.totalRevenueINR ? data.totalRevenueINR.toLocaleString() : '0'}</p>
          <span className="text-[10px] text-green-600 font-semibold flex items-center gap-0.5 mt-0.5"><TrendingUp className="w-3 h-3" /> Live multi-currency rate applied</span>
        </div>
        <div className="bg-white p-4 border border-studio-border rounded-lg shadow-sm">
          <div className="flex justify-between items-start mb-1"><span className="text-[11px] text-studio-muted font-medium uppercase tracking-wider">Hourly T&M (INR)</span><Clock className="w-4 h-4 text-brand-blue" /></div>
          <p className="text-[22px] font-bold text-studio-text">₹{data?.tmRevenueINR ? data.tmRevenueINR.toLocaleString() : '0'}</p>
          <span className="text-[10px] text-studio-muted mt-0.5 block">{data?.totalHoursLogged || 0} billable hours logged</span>
        </div>
        <div className="bg-white p-4 border border-studio-border rounded-lg shadow-sm">
          <div className="flex justify-between items-start mb-1"><span className="text-[11px] text-studio-muted font-medium uppercase tracking-wider">Monthly Retainers (INR)</span><Layers className="w-4 h-4 text-purple-600" /></div>
          <p className="text-[22px] font-bold text-studio-text">₹{data?.monthlyFixedRevenueINR ? data.monthlyFixedRevenueINR.toLocaleString() : '0'}</p>
          <span className="text-[10px] text-studio-muted mt-0.5 block">Fixed monthly recurring billing</span>
        </div>
        <div className="bg-white p-4 border border-studio-border rounded-lg shadow-sm">
          <div className="flex justify-between items-start mb-1"><span className="text-[11px] text-studio-muted font-medium uppercase tracking-wider">Fixed Projects (INR)</span><FolderKanban className="w-4 h-4 text-green-600" /></div>
          <p className="text-[22px] font-bold text-studio-text">₹{data?.projectFixedRevenueINR ? data.projectFixedRevenueINR.toLocaleString() : '0'}</p>
          <span className="text-[10px] text-studio-muted mt-0.5 block">{data?.activeProjectsCount || 0} active project accounts</span>
        </div>
      </div>

      <div className="border border-studio-border rounded-lg bg-white overflow-hidden shadow-sm">
        <div className="bg-studio-sidebar border-b border-studio-border px-4 py-2.5 text-[10px] font-bold text-studio-muted uppercase tracking-wider grid grid-cols-12 gap-2 items-center">
          <div className="col-span-3">Project & Client</div>
          <div className="col-span-2">Billing Model</div>
          <div className="col-span-2">Contract Rate</div>
          <div className="col-span-1 text-center">Hours</div>
          <div className="col-span-2 text-right">Native Amount</div>
          <div className="col-span-2 text-right">Total (INR ₹)</div>
        </div>

        <div className="divide-y divide-studio-border bg-white">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
          ) : !data?.projects || data.projects.length === 0 ? (
            <div className="text-center py-10 text-studio-muted text-[12.5px]">No project billing data recorded yet.</div>
          ) : data.projects.map((p) => (
            <div key={p.projectId} className="px-4 py-2.5 grid grid-cols-12 gap-2 text-[12px] items-center hover:bg-studio-hover/40 transition-colors">
              <div className="col-span-3 min-w-0 pr-2">
                <p className="font-semibold text-studio-text truncate">{p.projectName}</p>
                <p className="text-[10px] text-studio-muted truncate">{p.clientName} • <span className="font-mono">{p.projectId}</span></p>
              </div>
              <div className="col-span-2 flex items-center"><BillingBadge type={p.billingType} /></div>
              <div className="col-span-2 font-mono font-medium text-studio-text flex items-center gap-1.5">
                <span>{p.rateFormatted}</span>
                <button type="button" onClick={() => setHistoryProj(p)} title="View Rate History" className="text-brand-orange hover:opacity-75"><History className="w-3 h-3" /></button>
              </div>
              <div className="col-span-1 text-center font-mono text-studio-muted">{p.loggedHours}h</div>
              <div className="col-span-2 text-right font-mono text-studio-muted">{p.currency.replace(/\s*\(.*\)/, '')} {p.nativeAmountBilled.toLocaleString()}</div>
              <div className="col-span-2 text-right font-mono font-bold text-studio-text">₹{p.inrAmountBilled.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPM = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white p-4 border border-studio-border rounded-lg shadow-sm">
        <span className="text-[11px] text-studio-muted font-medium uppercase tracking-wider block mb-1">Tracked Team Hours</span>
        <p className="text-[20px] font-bold text-studio-text">{data?.totalHoursLogged || 0} hrs</p>
        <span className="text-[10px] text-studio-muted mt-1 block">Live monthly logs</span>
      </div>
      <div className="bg-white p-4 border border-studio-border rounded-lg shadow-sm">
        <span className="text-[11px] text-studio-muted font-medium uppercase tracking-wider block mb-1">Active Projects</span>
        <p className="text-[20px] font-bold text-studio-text">{data?.activeProjectsCount || 0}</p>
        <span className="text-[10px] text-studio-muted mt-1 block">Under management</span>
      </div>
      <div className="bg-white p-4 border border-studio-border rounded-lg shadow-sm">
        <span className="text-[11px] text-studio-muted font-medium uppercase tracking-wider block mb-1">Total Managed Billing</span>
        <p className="text-[20px] font-bold text-brand-orange">₹{data?.totalRevenueINR ? data.totalRevenueINR.toLocaleString() : '0'}</p>
        <span className="text-[10px] text-studio-muted mt-1 block">Active month valuation</span>
      </div>
    </div>
  );

  const renderEmployee = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white p-4 border border-studio-border rounded-lg shadow-sm">
        <span className="text-[11px] text-studio-muted font-medium uppercase tracking-wider block mb-1">Logged Hours This Month</span>
        <p className="text-[20px] font-bold text-studio-text">{data?.totalHoursLogged || 0} hrs</p>
        <span className="text-[10px] text-studio-muted mt-1 block">Recorded across tasks</span>
      </div>
      <div className="bg-white p-4 border border-studio-border rounded-lg shadow-sm">
        <span className="text-[11px] text-studio-muted font-medium uppercase tracking-wider block mb-1">Assigned Projects</span>
        <p className="text-[20px] font-bold text-studio-text">{data?.activeProjectsCount || 0}</p>
        <span className="text-[10px] text-studio-muted mt-1 block">Active assignments</span>
      </div>
      <div className="bg-white p-4 border border-studio-border rounded-lg shadow-sm">
        <span className="text-[11px] text-studio-muted font-medium uppercase tracking-wider block mb-1">Studio Work Capacity</span>
        <p className="text-[20px] font-bold text-emerald-600">40 hrs/wk</p>
        <span className="text-[10px] text-studio-muted mt-1 block">Standard target</span>
      </div>
    </div>
  );

  return (
    <>
      <RateHistoryDrawer open={!!historyProj} projectId={historyProj?.projectId || ''} projectName={historyProj?.projectName || ''} clientCurrency={historyProj?.currency || 'USD ($)'} currentBillingType={historyProj?.billingType || 'Hourly Rate (T&M)'} isAdmin={activeRole === 'Super Admin'} onClose={() => setHistoryProj(null)} onSaved={fetchDashboard} />
      <div className="w-full space-y-6">
        <Breadcrumbs items={[{ label: 'Dashboard' }]} />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-studio-border pb-3">
          <div>
            <h2 className="text-[20px] font-bold tracking-tight text-studio-text">Studio Dashboard</h2>
            <p className="text-[12px] text-studio-muted">Live billing, multi-currency conversion, and resource metrics</p>
          </div>
          {activeRole === 'Super Admin' && (
            <div className="flex items-center gap-2">
              <select value={selectedFY} onChange={(e) => setSelectedFY(e.target.value)} className="px-2.5 py-1.5 border border-studio-border rounded bg-white text-[12px] font-medium text-studio-text cursor-pointer hover:border-brand-orange focus:outline-none focus:border-brand-orange">
                {FISCAL_YEARS.map((fy) => (<option key={fy} value={fy}>{fy}</option>))}
              </select>
            </div>
          )}
        </div>

        {activeRole === 'Super Admin' && renderSuperAdmin()}
        {activeRole === 'Project Manager' && renderPM()}
        {activeRole === 'Employee' && renderEmployee()}
      </div>
    </>
  );
}
