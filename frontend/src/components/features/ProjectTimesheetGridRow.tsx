import { User as UserIcon, ChevronDown } from 'lucide-react';
import { User as AuthUser } from '../../context/AuthContext';

export interface DailyEntry {
  id?: number; sno: string; date: string; dayLabel: string; description: string; task: string;
  hours: number; isBillable?: boolean; isWeekend?: boolean; resourceName?: string;
  employeeId?: string; isOwner?: boolean; isReadOnly?: boolean; status?: string;
}

export interface DateGroupItem {
  date: string; sno: string; dayLabel: string; isWeekend: boolean;
  items: { entry: DailyEntry; idx: number }[];
}

interface Props {
  group: DateGroupItem;
  isLocked: boolean;
  isSA?: boolean;
  isPM?: boolean;
  isEmp?: boolean;
  user: AuthUser | null;
  availableServices?: string[];
  onEntryChange: (idx: number, field: keyof DailyEntry, val: any) => void;
}

const LOGGED_TIME_OPTIONS = [0, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8];

export default function ProjectTimesheetGridRow({
  group, isLocked, isEmp, user, availableServices = [], onEntryChange,
}: Props) {
  // Extract Date string (e.g. "01 Aug") and Day string (e.g. "Saturday") from group.dayLabel
  // format: "01 Aug (Sat)" or "01 Aug Saturday"
  const dateParts = group.dayLabel.split(' ');
  const dateStr = dateParts.length >= 2 ? `${dateParts[0]} ${dateParts[1]}` : group.date;
  const dayStr = dateParts.length >= 3 ? dateParts.slice(2).join(' ').replace(/[()]/g, '') : '';

  return (
    <div className={`px-5 py-2.5 grid grid-cols-12 gap-3 text-[12px] items-start transition-colors border-b border-studio-border/60 ${group.isWeekend ? 'bg-red-50/15' : 'hover:bg-studio-hover/20'}`}>
      {/* SNO */}
      <div className={`col-span-1 pt-1.5 font-mono font-medium ${group.isWeekend ? 'text-red-500 font-bold' : 'text-studio-muted'}`}>
        {group.sno}
      </div>

      {/* DATE */}
      <div className={`col-span-1 pt-1.5 font-medium ${group.isWeekend ? 'text-red-500 font-bold' : 'text-studio-text'}`}>
        {dateStr}
      </div>

      {/* DAY & Logs count badge */}
      <div className={`col-span-1 pt-1.5 font-medium ${group.isWeekend ? 'text-red-500 font-bold' : 'text-studio-text'}`}>
        <div>{dayStr || group.dayLabel}</div>
        {group.items.length > 1 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-[#FFF5F2] text-[#F25624] border border-[#FFDCD2] mt-1">
            {group.items.length} Logs
          </span>
        )}
      </div>

      {/* Stacked Entries Right Section */}
      <div className="col-span-9 divide-y divide-studio-border/40">
        {group.items.map(({ entry, idx }, itemIdx) => {
          // Determine if logged-in user owns this row
          const loggedInName = (user?.fullName || '').toLowerCase().trim();
          const loggedInCode = (user?.employeeId || '').toLowerCase().trim();
          const entryResName = (entry.resourceName || '').toLowerCase().trim();
          const entryEmpCode = (entry.employeeId || '').toLowerCase().trim();

          const matchesOwner = entry.isOwner !== false && (
            (loggedInName && entryResName.includes(loggedInName)) ||
            (loggedInCode && entryEmpCode === loggedInCode) ||
            (!entryResName && !entryEmpCode)
          );

          // Row editability: Stage 5 or Approval Lock (isLocked) locks rows. For Employees, non-owner rows are read-only. For PM and SA, all rows are editable when !isLocked.
          const isRowReadOnly = isLocked || (isEmp && !matchesOwner);
          const displayResourceName = entry.resourceName || (matchesOwner ? user?.fullName : '') || 'Assigned Member';

          return (
            <div key={entry.id || `${group.date}-${itemIdx}`} className={`grid grid-cols-9 gap-3 items-start ${itemIdx > 0 ? 'pt-2.5 mt-2' : ''}`}>
              {/* DESCRIPTION */}
              <div className="col-span-4">
                <textarea
                  rows={2}
                  disabled={isRowReadOnly}
                  placeholder={isRowReadOnly ? (matchesOwner ? 'No description' : 'test description') : 'Type here line by line...'}
                  value={entry.description}
                  onChange={(e) => onEntryChange(idx, 'description', e.target.value)}
                  className={`w-full px-3 py-1.5 border border-studio-border rounded-lg text-[12px] leading-relaxed transition-all focus:outline-none focus:border-brand-orange disabled:bg-studio-sidebar/40 disabled:text-studio-muted resize-y ${!matchesOwner ? 'text-studio-muted' : 'bg-white'}`}
                />
              </div>

              {/* SERVICES */}
              <div className="col-span-2 pt-0.5">
                {availableServices.length > 0 ? (
                  <div className="relative">
                    <select
                      disabled={isRowReadOnly}
                      value={entry.task}
                      onChange={(e) => onEntryChange(idx, 'task', e.target.value)}
                      className={`w-full px-2.5 py-1.5 border border-studio-border rounded-lg text-[12px] bg-white transition-all focus:outline-none focus:border-brand-orange disabled:bg-studio-sidebar/40 disabled:text-studio-muted cursor-pointer appearance-none pr-7 ${!matchesOwner ? 'text-studio-muted' : ''}`}
                    >
                      <option value="">Select Services</option>
                      {availableServices.map((svc) => (
                        <option key={svc} value={svc}>{svc}</option>
                      ))}
                      {entry.task && !availableServices.includes(entry.task) && (
                        <option value={entry.task}>{entry.task}</option>
                      )}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-studio-muted pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
                  </div>
                ) : (
                  <input
                    type="text"
                    disabled={isRowReadOnly}
                    placeholder={isRowReadOnly ? '-' : 'Select Services'}
                    value={entry.task}
                    onChange={(e) => onEntryChange(idx, 'task', e.target.value)}
                    className={`w-full px-2.5 py-1.5 border border-studio-border rounded-lg text-[12px] bg-white transition-all focus:outline-none focus:border-brand-orange disabled:bg-studio-sidebar/40 disabled:text-studio-muted ${!matchesOwner ? 'text-studio-muted' : ''}`}
                  />
                )}
              </div>

              {/* RESOURCE BADGE (RED if logged-in user in active stage, BLUE if other team member or locked stage) */}
              <div className="col-span-2 pt-0.5 flex items-center">
                {matchesOwner && !isLocked ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#FFF5F2] text-[#F25624] border border-[#FFDCD2] shadow-2xs">
                    <UserIcon className="w-3.5 h-3.5 text-[#F25624]" />
                    <span className="truncate">{displayResourceName}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] shadow-2xs">
                    <UserIcon className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span className="truncate">{displayResourceName}</span>
                  </span>
                )}
              </div>

              {/* TIME LOGGED - STEPPER SELECT CONTROL */}
              <div className="col-span-1 text-right pt-0.5">
                {isRowReadOnly ? (
                  <div className={`w-full text-center px-1.5 py-1.5 border border-studio-border/70 rounded-lg text-[12px] font-semibold bg-studio-sidebar/40 ${!matchesOwner ? 'text-studio-muted' : 'text-studio-text'}`}>
                    {entry.hours === 0 ? '00hr' : Number.isInteger(entry.hours) ? `${entry.hours}.0hr` : `${entry.hours}hr`}
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={entry.hours || 0}
                      onChange={(e) => onEntryChange(idx, 'hours', parseFloat(e.target.value) || 0)}
                      className="w-full px-1 py-1.5 border border-studio-border rounded-lg font-sans text-[12px] font-semibold text-studio-text bg-white transition-all focus:outline-none focus:border-brand-orange cursor-pointer appearance-none pr-4 text-center"
                    >
                      {LOGGED_TIME_OPTIONS.map((h) => (
                        <option key={h} value={h}>
                          {h === 0 ? '00hr' : Number.isInteger(h) ? `${h}.0hr` : `${h}hr`}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3 h-3 text-studio-muted pointer-events-none absolute right-1 top-1/2 -translate-y-1/2" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


