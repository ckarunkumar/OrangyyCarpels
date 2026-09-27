import { Timer, Eye } from 'lucide-react';
import BillingBadge from '../../ui/BillingBadge';
import { SkeletonRow } from '../../ui/Skeleton';
import { ClientTimesheetSummary, ProjectTimesheetItem } from '../TimesheetsView';

interface ClientTableProps {
  loading: boolean;
  clientSummaries: ClientTimesheetSummary[];
  selectedMonth: string;
  onSelectClient: (name: string) => void;
  onQuickLog: (proj: ProjectTimesheetItem) => void;
}

export default function TimesheetClientTable({
  loading,
  clientSummaries,
  selectedMonth,
  onSelectClient,
  onQuickLog,
}: ClientTableProps) {
  return (
    <div className="border border-studio-border rounded-lg bg-white overflow-hidden shadow-sm">
      <div className="bg-studio-sidebar border-b border-studio-border px-5 py-2.5 text-[10px] font-bold text-studio-muted uppercase tracking-wider grid grid-cols-12 gap-3 items-center shrink-0">
        <div className="col-span-3">CLIENT NAME</div>
        <div className="col-span-1">BILLING TYPE</div>
        <div className="col-span-1 text-center">TOTAL</div>
        <div className="col-span-1 text-center">DRAFT</div>
        <div className="col-span-1 text-center">SUBMITTED</div>
        <div className="col-span-1 text-center">LOGGED</div>
        <div className="col-span-2">HOURS BURNED</div>
        <div className="col-span-1 text-center">STATUS</div>
        <div className="col-span-1 text-right">ACTION</div>
      </div>

      <div className="divide-y divide-studio-border bg-white">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
        ) : clientSummaries.length === 0 ? (
          <div className="p-8 text-center text-[12px] text-studio-muted">No clients found for {selectedMonth}.</div>
        ) : (
          clientSummaries.map((clientItem) => {
            const isHourly = clientItem.billingType === 'T&M' || clientItem.billingType === 'Hourly Rate (T&M)';
            return (
              <div
                key={clientItem.clientName}
                onClick={() => onSelectClient(clientItem.clientName)}
                className="group px-5 py-3.5 grid grid-cols-12 gap-3 text-[12.5px] items-center hover:bg-studio-hover/40 transition-colors cursor-pointer"
              >
                <div className="col-span-3 min-w-0 pr-2">
                  <p className="font-semibold text-studio-text truncate group-hover:text-brand-orange transition-colors">
                    {clientItem.clientName}
                  </p>
                </div>

                <div className="col-span-1 flex items-center">
                  <BillingBadge type={clientItem.billingType} />
                </div>

                <div className="col-span-1 text-center font-sans font-medium text-studio-text">
                  {clientItem.totalProjects}
                </div>

                <div className="col-span-1 text-center font-sans font-medium text-studio-text">
                  {clientItem.draftProjects}
                </div>

                <div className="col-span-1 text-center font-sans font-medium text-studio-text">
                  {clientItem.submittedProjects}
                </div>

                <div className="col-span-1 text-center font-sans text-studio-muted text-[12px]">
                  {clientItem.timeLogged}h
                </div>

                <div className="col-span-2 min-w-0">
                  {isHourly ? (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-studio-muted">
                        <span>{clientItem.timeLogged}/{clientItem.budgetHours}h</span>
                        <span className="font-bold text-[#F25624]">{clientItem.percentage}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-studio-sidebar rounded-full overflow-hidden border border-studio-border">
                        <div className="h-full bg-[#F25624] transition-all duration-300" style={{ width: `${clientItem.percentage}%` }} />
                      </div>
                    </div>
                  ) : (
                    <span className="text-[11px] font-sans text-studio-muted">{clientItem.timeLogged}h tracked</span>
                  )}
                </div>

                <div className="col-span-1 text-center">
                  <span className="text-[11px] font-semibold px-3 py-1 rounded-full border border-amber-300 bg-amber-50 text-amber-800 inline-block">
                    Draft
                  </span>
                </div>

                <div className="col-span-1 text-right flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => { if (clientItem.projects.length > 0) onQuickLog(clientItem.projects[0]); }}
                    title="Quick Log Time"
                    className="p-1.5 text-studio-muted hover:text-brand-orange hover:bg-orange-50 rounded transition-colors cursor-pointer"
                  >
                    <Timer className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectClient(clientItem.clientName)}
                    title="View Client Projects"
                    className="p-1.5 text-studio-muted hover:text-brand-orange hover:bg-orange-50 rounded transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
