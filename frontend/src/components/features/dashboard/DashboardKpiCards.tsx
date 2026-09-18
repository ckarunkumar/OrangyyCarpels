import { Clock, Layers, FolderKanban, DollarSign, TrendingUp } from 'lucide-react';

interface DashboardKpiCardsProps {
  hourlyRevenueINR: number;
  billableHours: number;
  monthlyRetainersINR: number;
  fixedProjectsINR: number;
  activeProjectsCount: number;
  totalRevenueINR: number;
  isClientView?: boolean;
}

export default function DashboardKpiCards({
  hourlyRevenueINR,
  billableHours,
  monthlyRetainersINR,
  fixedProjectsINR,
  activeProjectsCount,
  totalRevenueINR,
  isClientView = false,
}: DashboardKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Hourly T&M */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] font-semibold text-slate-500 tracking-wider uppercase">
              Hourly T&amp;M (INR)
            </span>
            <Clock className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-[28px] font-bold text-slate-900 tracking-tight leading-tight">
            ₹{hourlyRevenueINR.toLocaleString()}
          </p>
        </div>
        <p className="text-[11.5px] text-slate-400 mt-2 font-normal">
          {billableHours} billable hours logged
        </p>
      </div>

      {/* Card 2: Monthly Retainers */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] font-semibold text-slate-500 tracking-wider uppercase">
              Monthly Retainers (INR)
            </span>
            <Layers className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-[28px] font-bold text-slate-900 tracking-tight leading-tight">
            ₹{monthlyRetainersINR.toLocaleString()}
          </p>
        </div>
        <p className="text-[11.5px] text-slate-400 mt-2 font-normal">
          Fixed monthly recurring billing
        </p>
      </div>

      {/* Card 3: Fixed Projects */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] font-semibold text-slate-500 tracking-wider uppercase">
              Fixed Projects (INR)
            </span>
            <FolderKanban className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-[28px] font-bold text-slate-900 tracking-tight leading-tight">
            ₹{fixedProjectsINR.toLocaleString()}
          </p>
        </div>
        <p className="text-[11.5px] text-slate-400 mt-2 font-normal">
          {activeProjectsCount} active project accounts
        </p>
      </div>

      {/* Card 4: Total Revenue */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] font-semibold text-slate-500 tracking-wider uppercase">
              Total Revenue (INR)
            </span>
            <DollarSign className="w-4 h-4 text-[#ff5c35]" />
          </div>
          <p className="text-[28px] font-bold text-slate-900 tracking-tight leading-tight">
            ₹{totalRevenueINR.toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-1 text-[11.5px] font-medium text-emerald-600 mt-2">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{isClientView ? 'Live client revenue' : 'Live multi-currency rate applied'}</span>
        </div>
      </div>
    </div>
  );
}
