import { useState, useEffect } from 'react';
import { X, Calendar, Clock } from 'lucide-react';
import { Project } from '../../types/registry';

interface ClientProjectTimesheetDrawerProps {
  open: boolean;
  project: Project | null;
  onClose: () => void;
}

export default function ClientProjectTimesheetDrawer({ open, project, onClose }: ClientProjectTimesheetDrawerProps) {
  const [selectedMonth, setSelectedMonth] = useState('2026-09');
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && project) {
      setLoading(true);
      fetch(`/api/timesheets/daily-entries?projectId=${project.id}&month=${selectedMonth}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && Array.isArray(data.entries)) {
            setEntries(data.entries.filter((e: any) => (e.hours || 0) > 0));
          } else {
            setEntries([]);
          }
        })
        .catch(() => setEntries([]))
        .finally(() => setLoading(false));
    }
  }, [open, project, selectedMonth]);

  if (!open || !project) return null;

  const totalLoggedHours = entries.reduce((acc, curr) => acc + (curr.hours || 0), 0);

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-end z-50 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-studio-border flex justify-between items-center bg-studio-sidebar/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-studio-sidebar border border-studio-border text-studio-text">{project.id}</span>
              <h3 className="text-[16px] font-bold text-studio-text">{project.name}</h3>
            </div>
            <p className="text-[12px] text-studio-muted mt-0.5">Timesheet activity and task deliverables for this project</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-studio-muted hover:bg-studio-hover cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        {/* Month Selector & Summary Stats */}
        <div className="p-5 border-b border-studio-border bg-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-orange" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 border border-studio-border rounded-lg text-[12px] text-studio-text focus:outline-none focus:border-brand-orange bg-white font-medium"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-200 text-brand-orange text-[12px] font-bold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{totalLoggedHours} Hours Logged</span>
            </div>
            {project.budgetHours ? (
              <div className="px-3 py-1.5 rounded-lg bg-studio-sidebar border border-studio-border text-studio-text text-[12px] font-bold">
                Budget: {project.budgetHours}h
              </div>
            ) : null}
          </div>
        </div>

        {/* Entries Table */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-[12px] text-studio-muted animate-pulse">Loading project timesheet logs...</div>
          ) : entries.length === 0 ? (
            <div className="py-12 text-center text-studio-muted text-[12.5px] border border-dashed border-studio-border rounded-xl">
              No timesheet hours logged for this project in {selectedMonth}.
            </div>
          ) : (
            <div className="border border-studio-border rounded-xl bg-white overflow-hidden shadow-2xs divide-y divide-studio-border">
              <div className="bg-studio-sidebar px-4 py-2.5 text-[10px] font-bold text-studio-muted uppercase tracking-wider grid grid-cols-12 gap-2">
                <div className="col-span-3">Date</div>
                <div className="col-span-3">Task Deliverable</div>
                <div className="col-span-4">Work Description</div>
                <div className="col-span-2 text-right">Hours</div>
              </div>

              {entries.map((entry, idx) => (
                <div key={idx} className="px-4 py-3 grid grid-cols-12 gap-2 text-[12px] items-start hover:bg-studio-hover/30 transition-colors">
                  <div className="col-span-3 font-semibold text-studio-text">
                    <div>{entry.date}</div>
                    <span className="text-[10px] text-studio-muted">{entry.dayLabel}</span>
                  </div>
                  <div className="col-span-3 font-medium text-studio-text">
                    <span className="px-2 py-0.5 rounded bg-studio-sidebar border border-studio-border text-[11px] block w-fit truncate">
                      {entry.task || 'General Work'}
                    </span>
                  </div>
                  <div className="col-span-4 text-studio-muted text-[11.5px] line-clamp-2">
                    {entry.description || '—'}
                  </div>
                  <div className="col-span-2 text-right font-mono font-bold text-studio-text text-[13px]">
                    {entry.hours}h
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-studio-border bg-studio-sidebar/30 flex justify-end">
          <button type="button" onClick={onClose} className="px-5 py-2 bg-studio-sidebar border border-studio-border rounded-lg text-[12px] font-semibold text-studio-text hover:bg-studio-hover cursor-pointer">Close</button>
        </div>
      </div>
    </div>
  );
}
