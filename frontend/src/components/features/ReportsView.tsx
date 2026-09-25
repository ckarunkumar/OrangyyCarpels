import { useState, useEffect } from 'react';
import { BarChart3, Download, FileSpreadsheet, FileText, ArrowUpRight, Clock, Users, Building2, Layers } from 'lucide-react';
import { UserRole } from '../ui/Layout';
import MonthYearPicker from '../ui/MonthYearPicker';
import { getCurrentMonthIso } from '../../utils/dateUtils';

interface ReportsViewProps {
  activeRole?: UserRole;
}

export default function ReportsView({ activeRole }: ReportsViewProps) {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthIso());
  const [activeTab, setActiveTab] = useState<'utilization' | 'timesheets' | 'financial' | 'projects'>('utilization');
  const [summaryData, setSummaryData] = useState<{ totalHours: number; activeProjects: number; totalRevenue: number } | null>(null);

  useEffect(() => {
    fetch('/api/billing/summary')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setSummaryData({ totalHours: d.totalHoursLogged || 0, activeProjects: d.activeProjectsCount || 0, totalRevenue: d.totalRevenueINR || 0 });
      })
      .catch(() => {});
  }, [selectedMonth]);

  const reportTabs = [
    { id: 'utilization', label: 'Resource Utilization', icon: Users },
    { id: 'timesheets', label: 'Timesheet Summary', icon: Clock },
    { id: 'financial', label: 'Billing & Financials', icon: Building2 },
    { id: 'projects', label: 'Project Health', icon: Layers },
  ];

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-200">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-studio-border pb-4">
        <div>
          <h2 className="text-[20px] font-bold tracking-tight text-studio-text flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-orange" />
            Reports & Analytics
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <MonthYearPicker value={selectedMonth} onChange={setSelectedMonth} />
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 border border-studio-border rounded bg-white hover:bg-studio-sidebar text-[12px] font-medium text-studio-text transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-studio-muted" />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Highlights (Dynamic from DB) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-studio-border rounded-lg p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-studio-muted uppercase tracking-wider">Total Studio Logged</span>
          <div className="text-[22px] font-bold text-studio-text mt-1 font-mono">{summaryData?.totalHours || 0} hrs</div>
          <span className="text-[11px] text-studio-muted font-medium flex items-center gap-0.5 mt-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" /> Recorded in {selectedMonth}
          </span>
        </div>

        <div className="bg-white border border-studio-border rounded-lg p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-studio-muted uppercase tracking-wider">Total Billed Valuation</span>
          <div className="text-[22px] font-bold text-brand-orange mt-1 font-mono">₹{summaryData?.totalRevenue ? summaryData.totalRevenue.toLocaleString() : '0'}</div>
          <span className="text-[11px] text-studio-muted mt-1 block">Live INR valuation</span>
        </div>

        <div className="bg-white border border-studio-border rounded-lg p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-studio-muted uppercase tracking-wider">Active Projects</span>
          <div className="text-[22px] font-bold text-studio-text mt-1 font-mono">{summaryData?.activeProjects || 0}</div>
          <span className="text-[11px] text-studio-muted font-medium mt-1 block">Currently registered</span>
        </div>

        <div className="bg-white border border-studio-border rounded-lg p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-studio-muted uppercase tracking-wider">Studio Capacity</span>
          <div className="text-[22px] font-bold text-emerald-600 mt-1 font-mono">40 hrs/wk</div>
          <span className="text-[11px] text-studio-muted mt-1 block">Standard operational baseline</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-studio-border flex gap-6 text-[13px] font-medium">
        {reportTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-2.5 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
                isActive
                  ? 'border-brand-orange text-brand-orange font-semibold'
                  : 'border-transparent text-studio-muted hover:text-studio-text'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Report Placeholder Content Card */}
      <div className="bg-white border border-studio-border rounded-lg p-8 shadow-sm text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-orange-50 text-brand-orange flex items-center justify-center mx-auto border border-orange-200">
          <BarChart3 className="w-6 h-6" />
        </div>
        <h3 className="text-[15px] font-bold text-studio-text">
          {reportTabs.find((t) => t.id === activeTab)?.label} Engine
        </h3>
        <p className="text-[12px] text-studio-muted max-w-md mx-auto leading-relaxed">
          The reporting aggregation framework is enabled for {activeRole === 'Super Admin' ? 'Super Admins' : 'Project Managers'}. Detailed business rules and custom chart exports will be generated based on monthly project timesheets and resource allocations.
        </p>
        <div className="pt-2 flex justify-center gap-2.5">
          <button
            type="button"
            className="px-4 py-1.5 border border-studio-border rounded text-[12px] font-medium text-studio-text hover:bg-studio-sidebar transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Download Excel Matrix
          </button>
          <button
            type="button"
            className="px-4 py-1.5 border border-studio-border rounded text-[12px] font-medium text-studio-text hover:bg-studio-sidebar transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            Generate PDF Summary
          </button>
        </div>
      </div>
    </div>
  );
}
