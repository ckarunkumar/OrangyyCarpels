import { ChevronDown } from 'lucide-react';
import { formatMonthShort } from '../../../utils/dateUtils';

interface DashboardFilterHeaderProps {
  title: string;
  subtitle?: string;
  isDrilldown?: boolean;
  onBackToStudio?: () => void;
  periodType: 'monthly' | 'yearly';
  onChangePeriodType: (period: 'monthly' | 'yearly') => void;
  selectedFY: string;
  onChangeFY: (fy: string) => void;
  selectedMonth: string;
  onChangeMonth: (month: string) => void;
  availableFYs: string[];
}

export default function DashboardFilterHeader({
  title,
  subtitle = 'Live billing, multi-currency conversion, and resource metrics',
  periodType,
  onChangePeriodType,
  selectedFY,
  onChangeFY,
  selectedMonth,
  onChangeMonth,
  availableFYs,
}: DashboardFilterHeaderProps) {
  // Generate 12 months for the selected Indian Fiscal Year (April -> March) in short form (e.g., Sep 2026)
  const fyStartYear = parseInt((selectedFY.match(/\d{4}/) || ['2026'])[0], 10);
  const monthOptions = [
    { label: `Apr ${fyStartYear}`, value: `Apr ${fyStartYear}` },
    { label: `May ${fyStartYear}`, value: `May ${fyStartYear}` },
    { label: `Jun ${fyStartYear}`, value: `Jun ${fyStartYear}` },
    { label: `Jul ${fyStartYear}`, value: `Jul ${fyStartYear}` },
    { label: `Aug ${fyStartYear}`, value: `Aug ${fyStartYear}` },
    { label: `Sep ${fyStartYear}`, value: `Sep ${fyStartYear}` },
    { label: `Oct ${fyStartYear}`, value: `Oct ${fyStartYear}` },
    { label: `Nov ${fyStartYear}`, value: `Nov ${fyStartYear}` },
    { label: `Dec ${fyStartYear}`, value: `Dec ${fyStartYear}` },
    { label: `Jan ${fyStartYear + 1}`, value: `Jan ${fyStartYear + 1}` },
    { label: `Feb ${fyStartYear + 1}`, value: `Feb ${fyStartYear + 1}` },
    { label: `Mar ${fyStartYear + 1}`, value: `Mar ${fyStartYear + 1}` },
  ];

  const normalizedSelectedMonth = formatMonthShort(selectedMonth);

  return (
    <div className="space-y-3">
      {/* Main Header Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-slate-900">
            {title}
          </h1>
          <p className="text-[12.5px] text-slate-500 mt-0.5">
            {subtitle}
          </p>
        </div>

        {/* Filter Dropdowns: Year first (left), Month second (right) */}
        <div className="flex items-center gap-2.5 self-end sm:self-center">
          {/* 1. Year Filter (Left side) */}
          <div className="relative">
            <select
              value={selectedFY}
              onChange={(e) => onChangeFY(e.target.value)}
              className="appearance-none bg-white border border-slate-200 rounded-lg px-3.5 py-1.5 pr-8 text-[12.5px] text-slate-700 font-normal shadow-xs hover:border-slate-300 focus:outline-none cursor-pointer"
            >
              {availableFYs.map((fy) => (
                <option key={fy} value={fy}>
                  {fy}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* 2. Month Filter (Right side) */}
          <div className="relative">
            <select
              value={periodType === 'yearly' ? 'ALL' : normalizedSelectedMonth}
              onChange={(e) => {
                if (e.target.value === 'ALL') {
                  onChangePeriodType('yearly');
                } else {
                  onChangePeriodType('monthly');
                  onChangeMonth(e.target.value);
                }
              }}
              className="appearance-none bg-white border border-slate-200 rounded-lg px-3.5 py-1.5 pr-8 text-[12.5px] text-slate-700 font-normal shadow-xs hover:border-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Months (FY)</option>
              {monthOptions.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
