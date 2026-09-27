import { Timer, Eye } from 'lucide-react';
import BillingBadge from '../../ui/BillingBadge';
import { SkeletonRow } from '../../ui/Skeleton';
import { ProjectTimesheetItem } from '../TimesheetsView';

interface ProjectTableProps {
  loading: boolean;
  projects: ProjectTimesheetItem[];
  selectedClient: string;
  onSelectProject: (proj: ProjectTimesheetItem) => void;
  onQuickLog: (proj: ProjectTimesheetItem) => void;
}

export default function TimesheetProjectTable({
  loading,
  projects,
  selectedClient,
  onSelectProject,
  onQuickLog,
}: ProjectTableProps) {
  return (
    <div className="border border-studio-border rounded-lg bg-white overflow-hidden shadow-sm">
      <div className="bg-studio-sidebar border-b border-studio-border px-5 py-2.5 text-[10px] font-bold text-studio-muted uppercase tracking-wider grid grid-cols-12 gap-3 items-center shrink-0">
        <div className="col-span-2">PROJECT CODE</div>
        <div className="col-span-3">PROJECT NAME</div>
        <div className="col-span-2">BILLING TYPE</div>
        <div className="col-span-1 text-center">LOGGED</div>
        <div className="col-span-2">HOURS BURNED</div>
        <div className="col-span-1 text-center">STATUS</div>
        <div className="col-span-1 text-right">ACTION</div>
      </div>

      <div className="divide-y divide-studio-border bg-white">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
        ) : projects.length === 0 ? (
          <div className="p-8 text-center text-[12px] text-studio-muted">No projects found for client {selectedClient}.</div>
        ) : (
          projects.map((proj, idx) => {
            const isHourly = proj.billingType === 'T&M' || proj.billingType === 'Hourly Rate (T&M)';
            const isPartial = proj.status === 'Partially_Submitted';
            const projectCode = `PC000${idx + 1}`;

            const badgeText = proj.status === 'Approved' ? 'Approved' :
                              proj.status === 'PM_Approved' ? 'PM Approved' :
                              isPartial ? `Partially Submitted (${proj.submittedCount || 1}/${proj.totalAssigned || 2})` :
                              proj.status === 'Submitted' ? `Submitted (${proj.submittedCount || 2}/${proj.totalAssigned || 2})` :
                              'Draft';

            const badgeColor = proj.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' :
                               proj.status === 'PM_Approved' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                               isPartial ? 'bg-amber-50 text-amber-800 border-amber-300' :
                               proj.status === 'Submitted' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                               'bg-amber-50 text-amber-800 border-amber-300';

            return (
              <div
                key={proj.id}
                onClick={() => onSelectProject(proj)}
                className="group px-5 py-3.5 grid grid-cols-12 gap-3 text-[12.5px] items-center hover:bg-studio-hover/40 transition-colors cursor-pointer"
              >
                <div className="col-span-2 font-mono text-[12px] text-studio-muted">
                  {projectCode}
                </div>

                <div className="col-span-3 min-w-0 pr-2">
                  <p className="font-semibold text-studio-text truncate group-hover:text-brand-orange transition-colors">
                    {proj.projectName}
                  </p>
                </div>

                <div className="col-span-2 flex items-center">
                  <BillingBadge type={proj.billingType} />
                </div>

                <div className="col-span-1 text-center font-sans text-studio-muted text-[12px]">
                  {proj.timeLogged}h
                </div>

                <div className="col-span-2 min-w-0">
                  {isHourly ? (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-studio-muted">
                        <span>{proj.timeLogged}/{proj.budgetHours}h</span>
                        <span className="font-bold text-[#F25624]">{proj.percentage}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-studio-sidebar rounded-full overflow-hidden border border-studio-border">
                        <div className="h-full bg-[#F25624] transition-all duration-300" style={{ width: `${proj.percentage}%` }} />
                      </div>
                    </div>
                  ) : (
                    <span className="text-[11px] font-sans text-studio-muted">{proj.timeLogged}h tracked</span>
                  )}
                </div>

                <div className="col-span-1 text-center">
                  <span className={`text-[11px] font-semibold px-3 py-1 rounded-full border inline-block max-w-full truncate ${badgeColor}`}>
                    {badgeText}
                  </span>
                </div>

                <div className="col-span-1 text-right flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => onQuickLog(proj)}
                    title="Quick Log Time"
                    className="p-1.5 text-studio-muted hover:text-brand-orange hover:bg-orange-50 rounded transition-colors cursor-pointer"
                  >
                    <Timer className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectProject(proj)}
                    title="View Detailed Daily Grid"
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
