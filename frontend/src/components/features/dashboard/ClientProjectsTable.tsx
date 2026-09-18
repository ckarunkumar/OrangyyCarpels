import { History } from 'lucide-react';
import { SkeletonRow } from '../../ui/Skeleton';

export interface ProjectRowData {
  projectId: string;
  projectCode: string;
  projectName: string;
  clientId: string;
  clientName: string;
  startDate: string;
  endDate: string;
  billingType: string;
  billingModel: 'T&M' | 'Fixed RC' | 'Fixed PC';
  currency: string;
  rateAmount: number;
  rateFormatted: string;
  budgetHours: number;
  loggedHours: number;
  hoursBurnedPercent: number;
  nativeAmountBilled: number;
  exchangeRateToINR: number;
  inrAmountBilled: number;
  status: string;
  effectiveStartDate: string;
}

interface ClientProjectsTableProps {
  projects: ProjectRowData[];
  loading?: boolean;
  onOpenRateHistory?: (project: ProjectRowData) => void;
}

export default function ClientProjectsTable({
  projects,
  loading = false,
  onOpenRateHistory,
}: ClientProjectsTableProps) {
  const getBillingPill = (model: string) => {
    if (model === 'T&M') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#f0f9ff] text-[#0284c7] border border-[#bae6fd]">
          T &amp; M
        </span>
      );
    }
    if (model === 'Fixed PC' || model === 'Project Cost (Fix)') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#faf5ff] text-[#9333ea] border border-[#e9d5ff]">
          Project Cost (Fix)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#ecfdf5] text-[#10b981] border border-[#a7f3d0]">
        Resources Cost (Fix)
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
      <div className="grid grid-cols-12 gap-3 px-6 py-3.5 bg-[#fafbfc] border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-wider items-center">
        <div className="col-span-2 sm:col-span-1">Project Code</div>
        <div className="col-span-2">Project Name</div>
        <div className="col-span-1">Start Date</div>
        <div className="col-span-1">End Date</div>
        <div className="col-span-1">Billing Currency</div>
        <div className="col-span-1">Billing Model</div>
        <div className="col-span-2">Hours Burned</div>
        <div className="col-span-1 text-center">Status</div>
        <div className="col-span-2 text-right">Total Revenue (INR)</div>
      </div>

      <div className="divide-y divide-slate-100/80">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
        ) : projects.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-[13px]">
            No projects recorded for this client in the selected period.
          </div>
        ) : (
          projects.map((p) => {
            const hasBudget = p.budgetHours > 0;
            const pct = Math.min(100, p.hoursBurnedPercent || 0);

            return (
              <div
                key={p.projectId}
                className="grid grid-cols-12 gap-3 px-6 py-4 items-center hover:bg-slate-50/70 transition-colors text-[12.5px]"
              >
                {/* Project Code */}
                <div className="col-span-2 sm:col-span-1 font-mono text-[12px] text-slate-700">
                  {p.projectCode || p.projectId}
                </div>

                {/* Project Name */}
                <div className="col-span-2 font-medium text-slate-800 truncate">
                  {p.projectName}
                </div>

                {/* Start Date */}
                <div className="col-span-1 text-slate-600 text-[12px]">
                  {p.startDate || '—'}
                </div>

                {/* End Date */}
                <div className="col-span-1 text-slate-600 text-[12px]">
                  {p.endDate || '—'}
                </div>

                {/* Billing Currency */}
                <div className="col-span-1 flex items-center gap-1 text-slate-700 font-medium">
                  <span>{p.currency.replace(/\s*\(.*\)/, '') || 'USD'}</span>
                  <button
                    type="button"
                    onClick={() => onOpenRateHistory?.(p)}
                    title="View Rate History"
                    className="text-orange-500 hover:text-orange-600 p-0.5 rounded transition-transform hover:scale-110"
                  >
                    <History className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Billing Model */}
                <div className="col-span-1">
                  {getBillingPill(p.billingModel)}
                </div>

                {/* Hours Burned */}
                <div className="col-span-2">
                  {hasBudget ? (
                    <div className="w-full max-w-[130px]">
                      <div className="flex justify-between items-center text-[11px] mb-1">
                        <span className="font-mono text-slate-700">{p.loggedHours}/{p.budgetHours}h</span>
                        <span className="font-bold text-orange-600">{pct}%</span>
                      </div>
                      <div className="w-full h-1 bg-slate-100 rounded-full relative">
                        <div
                          className="h-1 bg-orange-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                        <div
                          className="w-2 h-2 rounded-full bg-orange-500 absolute -top-0.5 border border-white shadow-xs"
                          style={{ left: `calc(${pct}% - 4px)` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="font-mono text-[12px] text-slate-600">
                      {p.loggedHours}h tracked
                    </span>
                  )}
                </div>

                {/* Status */}
                <div className="col-span-1 text-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#ecfdf5] text-[#10b981] border border-[#a7f3d0]">
                    {p.status || 'Active'}
                  </span>
                </div>

                {/* Total Revenue */}
                <div className="col-span-2 text-right font-medium text-[13px] text-slate-900">
                  ₹{p.inrAmountBilled.toLocaleString()}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
