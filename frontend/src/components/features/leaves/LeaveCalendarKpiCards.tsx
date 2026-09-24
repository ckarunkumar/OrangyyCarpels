import { Clock, Home, HeartPulse, Award } from 'lucide-react';

interface LeaveCalendarKpiCardsProps {
  pendingCount: number;
  wfhEmployeesCount: number;
  sickLeaveEmployeesCount: number;
  overtimeClaimsCount: number;
  activeFilter?: string;
  onSelectKpi: (kpiKey: 'pending' | 'wfh' | 'sick' | 'overtime') => void;
}

export default function LeaveCalendarKpiCards({
  pendingCount,
  wfhEmployeesCount,
  sickLeaveEmployeesCount,
  overtimeClaimsCount,
  activeFilter,
  onSelectKpi,
}: LeaveCalendarKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Pending Approvals */}
      <button
        type="button"
        onClick={() => onSelectKpi('pending')}
        className={`bg-white rounded-xl border p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col justify-between text-left transition-all cursor-pointer ${
          activeFilter === 'pending'
            ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
            : 'border-slate-200/80 hover:border-amber-400 hover:shadow-xs'
        }`}
      >
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] font-semibold text-slate-500 tracking-wider uppercase">
              Pending Approvals
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-[28px] font-bold text-slate-900 tracking-tight leading-tight font-mono">
            {pendingCount}
          </p>
        </div>
        <p className="text-[11.5px] text-amber-600 mt-2 font-medium">
          Awaiting manager review
        </p>
      </button>

      {/* 2. Work From Home */}
      <button
        type="button"
        onClick={() => onSelectKpi('wfh')}
        className={`bg-white rounded-xl border p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col justify-between text-left transition-all cursor-pointer ${
          activeFilter === 'wfh'
            ? 'border-sky-500 ring-2 ring-sky-500/20 shadow-xs'
            : 'border-slate-200/80 hover:border-sky-400 hover:shadow-xs'
        }`}
      >
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] font-semibold text-slate-500 tracking-wider uppercase">
              Work From Home
            </span>
            <Home className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-[28px] font-bold text-slate-900 tracking-tight leading-tight font-mono">
            {wfhEmployeesCount}
          </p>
        </div>
        <p className="text-[11.5px] text-sky-600 mt-2 font-medium">
          Remote work this month
        </p>
      </button>

      {/* 3. Sick Leave */}
      <button
        type="button"
        onClick={() => onSelectKpi('sick')}
        className={`bg-white rounded-xl border p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col justify-between text-left transition-all cursor-pointer ${
          activeFilter === 'sick'
            ? 'border-purple-500 ring-2 ring-purple-500/20 shadow-xs'
            : 'border-slate-200/80 hover:border-purple-400 hover:shadow-xs'
        }`}
      >
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] font-semibold text-slate-500 tracking-wider uppercase">
              Sick Leave
            </span>
            <HeartPulse className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-[28px] font-bold text-slate-900 tracking-tight leading-tight font-mono">
            {sickLeaveEmployeesCount}
          </p>
        </div>
        <p className="text-[11.5px] text-purple-600 mt-2 font-medium">
          Medical leave this month
        </p>
      </button>

      {/* 4. Overtime Claims */}
      <button
        type="button"
        onClick={() => onSelectKpi('overtime')}
        className={`bg-white rounded-xl border p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col justify-between text-left transition-all cursor-pointer ${
          activeFilter === 'overtime'
            ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
            : 'border-slate-200/80 hover:border-emerald-400 hover:shadow-xs'
        }`}
      >
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] font-semibold text-slate-500 tracking-wider uppercase">
              Overtime Claims
            </span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-[28px] font-bold text-slate-900 tracking-tight leading-tight font-mono">
            {overtimeClaimsCount}
          </p>
        </div>
        <p className="text-[11.5px] text-emerald-600 mt-2 font-medium">
          Comp-off claims submitted
        </p>
      </button>
    </div>
  );
}
