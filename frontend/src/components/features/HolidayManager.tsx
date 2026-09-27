import React, { useState, useEffect } from 'react';
import { Trash2, CheckCircle2 } from 'lucide-react';

interface Props {
  selectedYear: number;
  showAdd: boolean;
  setShowAdd: (show: boolean) => void;
  publishTrigger?: number;
}

const getDayName = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { weekday: 'long' });
};

const groupByMonth = (list: any[]) => {
  const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
  const groups: { month: string; items: any[] }[] = [];
  for (const h of sorted) {
    const d = new Date(h.date + 'T00:00:00');
    const month = isNaN(d.getTime()) ? 'Other' : d.toLocaleDateString('en-US', { month: 'long' });
    const existing = groups.find((g) => g.month === month);
    if (existing) existing.items.push(h);
    else groups.push({ month, items: [h] });
  }
  return groups;
};

export default function HolidayManager({ selectedYear, showAdd, setShowAdd, publishTrigger }: Props) {
  const [holidays, setHolidays] = useState<Array<{ id: number; date: string; name: string; type: 'Mandatory' | 'Optional'; isPublished: boolean }>>([]);
  const [loading, setLoading] = useState(true);
  const [newDate, setNewDate] = useState(`${selectedYear}-01-26`);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'Mandatory' | 'Optional'>('Mandatory');
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchHolidays = (year: number) => {
    setLoading(true);
    fetch(`/api/leaves/holidays?year=${year}`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setHolidays(d); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHolidays(selectedYear);
    setNewDate(`${selectedYear}-01-26`);
  }, [selectedYear]);

  useEffect(() => {
    if (publishTrigger && publishTrigger > 0) handlePublish();
  }, [publishTrigger]);

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const res = await fetch('/api/leaves/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: newDate, name: newName.trim(), type: newType, year: Number(newDate.slice(0, 4)) || selectedYear }),
      });
      if (res.ok) {
        setNewName(''); setShowAdd(false);
        setFeedback(`Holiday added to ${selectedYear} calendar.`);
        fetchHolidays(selectedYear);
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch {}
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to remove this holiday?')) return;
    await fetch(`/api/leaves/holidays/${id}`, { method: 'DELETE' });
    fetchHolidays(selectedYear);
  };

  const handlePublish = async () => {
    await fetch('/api/leaves/holidays/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year: selectedYear }),
    });
    setFeedback(`Yearly Holiday Calendar (${selectedYear}) published officially for all studio members.`);
    fetchHolidays(selectedYear);
    setTimeout(() => setFeedback(null), 3500);
  };

  const grouped = groupByMonth(holidays);

  return (
    <div className="space-y-4">
      {feedback && (<div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-center gap-2 text-[12px] font-semibold"><CheckCircle2 className="w-4 h-4 text-green-600" /><span>{feedback}</span></div>)}

      {showAdd && (
        <form onSubmit={handleAddHoliday} className="bg-white p-4 rounded-lg border border-studio-border shadow-sm space-y-3 animate-in fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[12px]">
            <div>
              <label className="block text-[10px] font-bold text-studio-muted uppercase mb-1">Holiday Date</label>
              <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-full px-2.5 py-1.5 border border-studio-border rounded bg-white text-studio-text focus:outline-none focus:border-brand-orange" required />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-studio-muted uppercase mb-1">Holiday Name</label>
              <input type="text" placeholder="e.g. Independence Day" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full px-2.5 py-1.5 border border-studio-border rounded bg-white text-studio-text focus:outline-none focus:border-brand-orange" required />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-studio-muted uppercase mb-1">Type</label>
              <select value={newType} onChange={(e) => setNewType(e.target.value as any)} className="w-full px-2.5 py-1.5 border border-studio-border rounded bg-white text-studio-text focus:outline-none focus:border-brand-orange">
                <option value="Mandatory">Mandatory (Studio Closed)</option>
                <option value="Optional">Optional Holiday (OH)</option>
              </select>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={() => setShowAdd(false)} className="h-8 px-3.5 border border-studio-border rounded-lg text-[12px] font-bold text-studio-text hover:bg-studio-sidebar shadow-2xs transition-colors cursor-pointer">Cancel</button>
            <button type="submit" className="h-8 px-4 bg-brand-orange text-white rounded-lg text-[12px] font-bold hover:bg-opacity-95 cursor-pointer shadow-2xs transition-all">Save Holiday</button>
          </div>
        </form>
      )}

      <div className="border border-studio-border rounded-lg bg-white overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-[12px] text-studio-muted">Loading holiday calendar for {selectedYear}...</div>
        ) : holidays.length === 0 ? (
          <div className="p-8 text-center text-[12px] text-studio-muted">No holidays listed for {selectedYear}. Click "Add Holiday" to configure studio holidays.</div>
        ) : (
          <div className="divide-y divide-studio-border">
            {grouped.map(({ month, items }) => (
              <div key={month} className="bg-white">
                <div className="bg-slate-50/70 px-5 py-1.5 border-b border-studio-border/60 text-[11px] font-bold text-studio-muted uppercase tracking-wider flex justify-between items-center">
                  <span>{month}</span>
                  <span className="font-mono text-[10px] text-studio-muted/80">{items.length} {items.length === 1 ? 'holiday' : 'holidays'}</span>
                </div>
                <div className="divide-y divide-studio-border/40">
                  {items.map((h) => (
                    <div key={h.id} className="px-5 py-2.5 flex items-center justify-between hover:bg-studio-hover/40 transition-colors text-[12.5px]">
                      <div className="flex items-center gap-3">
                        <span className="text-[10.5px] font-mono font-bold px-2 py-0.5 rounded bg-studio-sidebar border border-studio-border text-studio-text">{h.date}</span>
                        <span className="text-[11px] font-semibold text-studio-muted px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200/60 min-w-16 text-center">{getDayName(h.date)}</span>
                        <span className="font-semibold text-studio-text">{h.name}</span>
                        <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${h.type === 'Mandatory' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>{h.type === 'Mandatory' ? 'Mandatory' : 'Optional (OH)'}</span>
                      </div>
                      <button type="button" onClick={() => handleDelete(h.id)} title="Delete Holiday" className="p-1 text-studio-muted hover:text-red-600 rounded hover:bg-red-50 transition-colors cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
