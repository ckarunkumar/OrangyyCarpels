import { Clock, Layers, FolderKanban, DollarSign, TrendingUp } from 'lucide-react';

interface PmDashboardKpiCardsProps {
  tmHours: number;
  retainerHours: number;
  fixedHours: number;
  totalHours: number;
}

export default function PmDashboardKpiCards({
  tmHours,
  retainerHours,
  fixedHours,
  totalHours,
}: PmDashboardKpiCardsProps) {
  const formatHours = (hrs: number) => {
    if (hrs === 0) return '00hrs';
    return `${hrs}hrs`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Hourly T&M (HRS) */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] font-semibold text-slate-500 tracking-wider uppercase">
              Hourly T&amp;M (HRS)
            </span>
            <Clock className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-[28px] font-bold text-slate-900 tracking-tight leading-tight">
            {formatHours(tmHours)}
          </p>
        </div>
        <p className="text-[11.5px] text-slate-400 mt-2 font-normal">
          Live yearly logs
        </p>
      </div>

      {/* Card 2: Monthly Retainers (HRS) */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] font-semibold text-slate-500 tracking-wider uppercase">
              Monthly Retainers (HRS)
            </span>
            <Layers className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-[28px] font-bold text-slate-900 tracking-tight leading-tight">
            {formatHours(retainerHours)}
          </p>
        </div>
        <p className="text-[11.5px] text-slate-400 mt-2 font-normal">
          Live yearly logs
        </p>
      </div>

      {/* Card 3: Fixed Projects (HRS) */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] font-semibold text-slate-500 tracking-wider uppercase">
              Fixed Projects (HRS)
            </span>
            <FolderKanban className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-[28px] font-bold text-slate-900 tracking-tight leading-tight">
            {formatHours(fixedHours)}
          </p>
        </div>
        <p className="text-[11.5px] text-slate-400 mt-2 font-normal">
          Live yearly logs
        </p>
      </div>

      {/* Card 4: Total Logged Hours */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] font-semibold text-slate-500 tracking-wider uppercase">
              Total Logged Hours
            </span>
            <DollarSign className="w-4 h-4 text-[#ff5c35]" />
          </div>
          <p className="text-[28px] font-bold text-slate-900 tracking-tight leading-tight">
            {formatHours(totalHours)}
          </p>
        </div>
        <div className="flex items-center gap-1 text-[11.5px] font-medium text-emerald-600 mt-2">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Live yearly logs</span>
        </div>
      </div>
    </div>
  );
}
