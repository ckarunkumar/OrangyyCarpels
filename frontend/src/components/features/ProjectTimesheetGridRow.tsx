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
  group: DateGroupItem; isLocked: boolean; isSA?: boolean; isPM?: boolean; isEmp?: boolean;
  user: AuthUser | null; availableServices?: string[]; isWeekendEnabled?: boolean;
  onEnableWeekend?: (date: string) => void;
  onEntryChange: (idx: number, field: keyof DailyEntry, val: any) => void;
}

const LOGGED_TIME_OPTIONS = [0, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8];

export default function ProjectTimesheetGridRow({
  group, isLocked, isEmp, user, availableServices = [], isWeekendEnabled = false,
  onEnableWeekend, onEntryChange,
}: Props) {
  const dateParts = group.dayLabel.split(' ');
  const dateStr = dateParts.length >= 2 ? `${dateParts[0]} ${dateParts[1]}` : group.date;
  const dayStr = dateParts.length >= 3 ? dateParts.slice(2).join(' ').replace(/[()]/g, '') : '';

  const hasLoggedHours = group.items.some((i) => (Number(i.entry.hours) || 0) > 0);
  const hasDescription = group.items.some((i) => i.entry.description && i.entry.description.trim() !== '');
  const hasEntries = hasLoggedHours || hasDescription;
  const isWeekendActive = !group.isWeekend || isWeekendEnabled || hasEntries;

  const handleWeekendClick = () => {
    if (group.isWeekend && !isWeekendActive && onEnableWeekend && !isLocked) {
      onEnableWeekend(group.date);
    }
  };

  return (
    <div
      onClick={handleWeekendClick}
      className={`px-5 py-2.5 grid grid-cols-12 gap-3 text-[12px] items-start transition-all border-b ${
        group.isWeekend && !isWeekendActive
          ? 'bg-slate-50/50 border-slate-200/50 text-slate-400 cursor-pointer hover:bg-orange-50/20'
          : hasEntries
          ? 'bg-white border-studio-border/70 hover:bg-studio-hover/20'
          : 'bg-white/70 border-studio-border/40 hover:bg-studio-hover/10'
      }`}
    >
      {/* SNO */}
      <div className={`col-span-1 pt-1.5 font-mono ${
        group.isWeekend && !isWeekendActive ? 'text-slate-400 font-normal' : hasEntries ? 'text-studio-text font-bold' : 'text-studio-muted/70 font-normal'
      }`}>
        {group.sno}
      </div>

      {/* DATE */}
      <div className={`col-span-1 pt-1.5 ${
        group.isWeekend && !isWeekendActive ? 'text-slate-400' : hasEntries ? 'text-studio-text font-bold' : 'text-studio-muted font-medium'
      }`}>
        {dateStr}
      </div>

      {/* DAY & LOGS COUNT */}
      <div className={`col-span-1 pt-1.5 ${
        group.isWeekend && !isWeekendActive ? 'text-slate-400' : group.isWeekend ? 'text-red-500 font-bold' : hasEntries ? 'text-studio-text font-bold' : 'text-studio-muted font-medium'
      }`}>
        <div className="flex items-center gap-1">
          <span>{dayStr || group.dayLabel}</span>
          {group.isWeekend && !isWeekendActive && <span className="text-[9px] font-mono px-1 rounded bg-slate-100 text-slate-500">Off</span>}
        </div>
        {group.items.length > 1 && (
          <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#FFF5F2] text-[#F25624] border border-[#FFDCD2] mt-0.5">
            {group.items.length} Logs
          </span>
        )}
      </div>

      {/* Stacked Entries Right Section */}
      <div className="col-span-9 divide-y divide-studio-border/40">
        {group.items.map(({ entry, idx }, itemIdx) => {
          const loggedInName = (user?.fullName || '').toLowerCase().trim();
          const loggedInCode = (user?.employeeId || '').toLowerCase().trim();
          const entryResName = (entry.resourceName || '').toLowerCase().trim();
          const entryEmpCode = (entry.employeeId || '').toLowerCase().trim();

          const matchesOwner = entry.isOwner !== false && (
            (loggedInName && entryResName.includes(loggedInName)) ||
            (loggedInCode && entryEmpCode === loggedInCode) ||
            (!entryResName && !entryEmpCode)
          );

          const isRowReadOnly = isLocked || (isEmp && !matchesOwner) || (group.isWeekend && !isWeekendActive);
          const displayResourceName = entry.resourceName || (matchesOwner ? user?.fullName : '') || 'Assigned Member';

          return (
            <div key={entry.id || `${group.date}-${itemIdx}`} className={`grid grid-cols-9 gap-3 items-start ${itemIdx > 0 ? 'pt-2 mt-1.5' : ''}`}>
              {/* DESCRIPTION */}
              <div className="col-span-4" onClick={handleWeekendClick}>
                <textarea
                  rows={2}
                  disabled={isRowReadOnly}
                  placeholder={
                    group.isWeekend && !isWeekendActive
                      ? 'Weekend — click to enable entry'
                      : isRowReadOnly
                      ? (matchesOwner ? 'No description' : 'No description')
                      : 'Type here line by line...'
                  }
                  value={entry.description}
                  onChange={(e) => onEntryChange(idx, 'description', e.target.value)}
                  className={`w-full px-3 py-1.5 border rounded-lg text-[12px] leading-relaxed transition-all focus:outline-none focus:border-brand-orange disabled:bg-studio-sidebar/30 disabled:text-studio-muted resize-y ${
                    group.isWeekend && !isWeekendActive ? 'border-dashed border-slate-300 text-slate-400 cursor-pointer bg-slate-50/50' : 'border-studio-border bg-white'
                  }`}
                />
              </div>

              {/* SERVICES */}
              <div className="col-span-2 pt-0.5" onClick={handleWeekendClick}>
                {availableServices.length > 0 ? (
                  <div className="relative">
                    <select
                      disabled={isRowReadOnly}
                      value={entry.task}
                      onChange={(e) => onEntryChange(idx, 'task', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-studio-border rounded-lg text-[12px] bg-white transition-all focus:outline-none focus:border-brand-orange disabled:bg-studio-sidebar/30 disabled:text-studio-muted cursor-pointer appearance-none pr-7"
                    >
                      <option value="">Select Services</option>
                      {availableServices.map((svc) => (<option key={svc} value={svc}>{svc}</option>))}
                      {entry.task && !availableServices.includes(entry.task) && (<option value={entry.task}>{entry.task}</option>)}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-studio-muted pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
                  </div>
                ) : (
                  <input
                    type="text" disabled={isRowReadOnly} placeholder={isRowReadOnly ? '-' : 'Select Services'}
                    value={entry.task} onChange={(e) => onEntryChange(idx, 'task', e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-studio-border rounded-lg text-[12px] bg-white transition-all focus:outline-none focus:border-brand-orange disabled:bg-studio-sidebar/30 disabled:text-studio-muted"
                  />
                )}
              </div>

              {/* RESOURCE BADGE */}
              <div className="col-span-2 pt-0.5 flex items-center">
                {matchesOwner && !isLocked && isWeekendActive ? (
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

              {/* TIME LOGGED */}
              <div className="col-span-1 text-right pt-0.5" onClick={handleWeekendClick}>
                {isRowReadOnly ? (
                  <div className="w-full text-center px-1.5 py-1.5 border border-studio-border/70 rounded-lg text-[12px] font-semibold bg-studio-sidebar/30 text-studio-muted">
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
                        <option key={h} value={h}>{h === 0 ? '00hr' : Number.isInteger(h) ? `${h}.0hr` : `${h}hr`}</option>
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
