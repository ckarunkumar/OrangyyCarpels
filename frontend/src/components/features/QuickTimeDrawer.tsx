import React, { useState, useEffect } from 'react';
import { X, Clock, FolderKanban } from 'lucide-react';
import { ProjectTimesheetItem } from './TimesheetsView';

const PRESET_TASKS = ['Ideation', 'Design', 'AI Design', 'Validation', 'Analysis', 'Approval', 'Wireframing', 'Development'];

interface QuickTimeDrawerProps {
  open: boolean;
  project: ProjectTimesheetItem | null;
  weekStart?: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function QuickTimeDrawer({ open, project, onClose, onSaved }: QuickTimeDrawerProps) {
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [task, setTask] = useState('Ideation');
  const [hours, setHours] = useState('03');
  const [isBillable, setIsBillable] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [servicesList, setServicesList] = useState<string[]>([]);

  useEffect(() => {
    if (open && project) {
      setDate(new Date().toISOString().split('T')[0]);
      setDescription('');
      setHours('03');
      setIsBillable(true);
      setError(null);
      fetch(`/api/timesheets/daily-entries?projectId=${project.id}&month=${new Date().toISOString().slice(0, 7)}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.services) {
            const svcs = d.services.split(',').map((s: string) => s.trim()).filter(Boolean);
            setServicesList(svcs);
            if (svcs.length > 0) setTask(svcs[0]);
            else setTask('Ideation');
          } else {
            setServicesList([]);
            setTask('Ideation');
          }
        })
        .catch(() => { setServicesList([]); setTask('Ideation'); });
    }
  }, [open, project]);

  if (!project) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const h = Number(hours.replace(/[^0-9.]/g, ''));
    if (isNaN(h) || h <= 0 || h > 24) {
      setError('Please enter a valid time between 0.5 and 24 hours.');
      return;
    }
    if (!description.trim()) {
      setError('Please provide a brief description of the work.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const month = date.slice(0, 7);
      const getRes = await fetch(`/api/timesheets/daily-entries?projectId=${project.id}&month=${month}`);
      const data = await getRes.json();
      const entries = data.entries || [];

      let match = entries.find((e: any) => e.date === date);
      let updatedEntries: any[];
      if (match) {
        updatedEntries = entries.map((e: any) => e.date === date ? { ...e, description: description.trim(), task, hours: h, isBillable } : e);
      } else {
        const dObj = new Date(date);
        const dayLabel = `${dObj.toLocaleDateString('en-US', { month: 'short' })} ${String(dObj.getDate()).padStart(2, '0')}, ${dObj.toLocaleDateString('en-US', { weekday: 'short' })}`;
        updatedEntries = [...entries, { sno: String(entries.length + 1).padStart(2, '0'), date, dayLabel, description: description.trim(), task, hours: h, isBillable }];
      }

      const saveRes = await fetch('/api/timesheets/daily-entries/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, month, entries: updatedEntries }),
      });

      if (!saveRes.ok) {
        const resData = await saveRes.json();
        throw new Error(resData.error || 'Failed to log time entry.');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error saving time entry.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div onClick={onClose} className={`fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />
      <div className={`fixed top-0 right-0 z-50 h-full w-full max-w-[420px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-studio-border shrink-0">
          <div>
            <h3 className="text-[16px] font-bold text-studio-text flex items-center gap-2"><Clock className="w-4 h-4 text-brand-orange" /> Time</h3>
            <p className="text-[11px] text-studio-muted flex items-center gap-1 mt-0.5"><FolderKanban className="w-3 h-3 text-studio-muted" /><span className="font-semibold text-studio-text">{project.projectName}</span><span className="font-mono text-brand-orange">({project.id})</span></p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded flex items-center justify-center text-studio-muted hover:bg-studio-bg transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <form id="quick-time-form" onSubmit={handleSave} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {error && <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded text-[11px] font-medium">{error}</div>}

          <div>
            <label className="block text-[11px] font-bold text-studio-muted uppercase tracking-wider mb-1">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 border border-studio-border rounded text-[12.5px] text-studio-text bg-white focus:outline-none focus:border-brand-orange" />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-studio-muted uppercase tracking-wider mb-1">Description</label>
            <textarea rows={4} placeholder="Type here..." value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border border-studio-border rounded text-[12.5px] text-studio-text bg-white focus:outline-none focus:border-brand-orange resize-none placeholder:text-studio-muted/60" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-studio-muted uppercase tracking-wider mb-1">
                Services
              </label>
              <select value={task} onChange={(e) => setTask(e.target.value)} className="w-full px-3 py-2 border border-studio-border rounded text-[12.5px] text-studio-text bg-white focus:outline-none focus:border-brand-orange">
                {(servicesList.length > 0 ? servicesList : PRESET_TASKS).map((t) => (<option key={t} value={t}>{t}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-studio-muted uppercase tracking-wider mb-1">Time</label>
              <input type="text" placeholder="Type here... (e.g. 03hr)" value={hours} onChange={(e) => setHours(e.target.value)} className="w-full px-3 py-2 border border-studio-border rounded text-[12.5px] text-studio-text bg-white focus:outline-none focus:border-brand-orange placeholder:text-studio-muted/60 font-mono" />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input type="checkbox" id="billable-check" checked={isBillable} onChange={(e) => setIsBillable(e.target.checked)} className="rounded text-brand-orange focus:ring-0" />
            <label htmlFor="billable-check" className="text-[12px] font-medium text-studio-text cursor-pointer">Billable to Client</label>
          </div>
        </form>

        <div className="shrink-0 px-6 py-3.5 border-t border-studio-border flex items-center justify-end gap-2.5 bg-studio-sidebar/50">
          <button type="button" onClick={onClose} className="flex items-center gap-1.5 px-4 py-2 border border-studio-border bg-white text-studio-text rounded-lg text-[12px] font-semibold hover:bg-studio-sidebar shadow-2xs transition-colors cursor-pointer">Cancel</button>
          <button type="submit" form="quick-time-form" disabled={saving} className="flex items-center gap-1.5 px-5 py-2 bg-brand-orange text-white rounded-lg text-[12px] font-bold hover:bg-opacity-90 shadow-sm transition-all disabled:opacity-50 cursor-pointer">{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </>
  );
}
