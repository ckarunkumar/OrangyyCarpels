import React, { useState, useEffect } from 'react';
import { X, Plus, Calendar, Lock, Unlock, Clock } from 'lucide-react';
import MonthYearPicker from '../ui/MonthYearPicker';

export interface MonthlyBudget {
  id: number; projectId: string; monthYear: string; budgetHours: number;
  isLocked: boolean; updatedAt: string;
}

interface MonthlyBudgetDrawerProps {
  open: boolean; projectId: string; projectName: string; isAdmin: boolean;
  onClose: () => void; onSaved: () => void;
}

export default function MonthlyBudgetDrawer({
  open, projectId, projectName, isAdmin, onClose, onSaved,
}: MonthlyBudgetDrawerProps) {
  const [budgets, setBudgets] = useState<MonthlyBudget[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [monthYear, setMonthYear] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [budgetHours, setBudgetHours] = useState('100');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBudgets = () => {
    if (!projectId) return;
    setLoading(true);
    fetch(`/api/billing/projects/${projectId}/monthly-budgets`)
      .then((res) => res.json())
      .then((data) => setBudgets(Array.isArray(data) ? data : []))
      .catch(() => setBudgets([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (open && projectId) {
      setShowAdd(false); setError(null); fetchBudgets();
    }
  }, [open, projectId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const hours = parseFloat(budgetHours);
    if (isNaN(hours) || hours < 0) { setError('Enter valid budget hours.'); return; }
    setSaving(true); setError(null);
    try {
      const res = await fetch(`/api/billing/projects/${projectId}/monthly-budgets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthYear, budgetHours: hours }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save monthly budget');
      setShowAdd(false); fetchBudgets(); onSaved();
    } catch (err: any) { setError(err.message); } finally { setSaving(false); }
  };

  const currentMonthYear = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  return (
    <>
      <div onClick={onClose} className={`fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />
      <div className={`fixed top-0 right-0 z-50 h-full w-full max-w-[440px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-studio-border shrink-0">
          <div>
            <h3 className="text-[15px] font-bold text-studio-text flex items-center gap-1.5"><Clock className="w-4 h-4 text-brand-orange" /> Monthly Budget Hours</h3>
            <p className="text-[11px] text-studio-muted mt-0.5">{projectName} ({projectId})</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded flex items-center justify-center text-studio-muted hover:bg-studio-bg transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="p-3 bg-studio-sidebar border border-studio-border rounded-lg text-[11px] text-studio-muted leading-relaxed">
            <span className="font-bold text-studio-text block mb-0.5">Monthly Budget Policy</span>
            Budget hours are configured per calendar month. When a month closes at month-end, budget hours are locked alongside the monthly timesheet.
          </div>

          {isAdmin && !showAdd && (
            <button onClick={() => setShowAdd(true)} className="w-full px-4 py-2 bg-orange-50 border border-brand-orange/40 text-brand-orange rounded-lg text-[12px] font-bold flex items-center justify-center gap-1.5 hover:bg-orange-100 transition-colors shadow-2xs cursor-pointer">
              <Plus className="w-3.5 h-3.5" /> Update / Set Month Budget Hours
            </button>
          )}

          {showAdd && (
            <form onSubmit={handleSave} className="p-4 border border-brand-orange/30 rounded-lg bg-orange-50/30 space-y-3">
              <div className="flex justify-between items-center"><span className="text-[12px] font-bold text-studio-text">Set Monthly Budget</span><button type="button" onClick={() => setShowAdd(false)} className="text-[12px] font-bold text-studio-muted hover:text-studio-text cursor-pointer">Cancel</button></div>
              {error && <div className="text-[11px] text-red-600 bg-red-50 p-2 rounded">{error}</div>}
              <div>
                <label className="text-[10px] font-bold text-studio-muted uppercase block mb-1">Month / Year</label>
                <MonthYearPicker value={monthYear} onChange={setMonthYear} className="w-full" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-studio-muted uppercase block mb-1">Budget Hours</label>
                <input type="number" placeholder="120" value={budgetHours} onChange={(e) => setBudgetHours(e.target.value)} className="w-full px-2.5 py-1.5 text-[12px] border border-studio-border rounded bg-white" />
              </div>
              <button type="submit" disabled={saving} className="w-full px-4 py-2 bg-brand-orange text-white rounded-lg text-[12px] font-bold hover:bg-opacity-95 shadow-2xs transition-all disabled:opacity-50 cursor-pointer">{saving ? 'Saving...' : 'Save Month Budget'}</button>
            </form>
          )}

          <div className="space-y-3">
            <h4 className="text-[11px] font-bold text-studio-muted uppercase tracking-wider">Monthly Breakdown History</h4>
            {loading ? (
              <div className="text-[12px] text-studio-muted text-center py-6">Loading budgets...</div>
            ) : budgets.length === 0 ? (
              <div className="text-[12px] text-studio-muted text-center py-6 border border-dashed border-studio-border rounded-lg bg-studio-sidebar/40">No monthly budgets recorded yet. Default project budget applies.</div>
            ) : (
              <div className="space-y-2">
                {budgets.map((b) => {
                  const isCurrent = b.monthYear === currentMonthYear;
                  return (
                    <div key={b.id} className="p-3 border border-studio-border rounded-lg bg-white shadow-sm flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-[13px] text-studio-text">
                          <Calendar className="w-3.5 h-3.5 text-studio-muted" />
                          <span>{b.monthYear}</span>
                          {isCurrent && <span className="text-[9px] font-bold px-1.5 py-0.2 bg-green-50 text-green-700 border border-green-200 rounded">Current Month</span>}
                        </div>
                        <span className="text-[11px] text-studio-muted mt-0.5 block">{b.budgetHours} Budget Hours Allocated</span>
                      </div>
                      <div className="text-right">
                        {b.isLocked ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 bg-gray-100 text-gray-600 border border-gray-200 rounded flex items-center gap-1"><Lock className="w-2.5 h-2.5 text-gray-500" /> Locked</span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded flex items-center gap-1"><Unlock className="w-2.5 h-2.5 text-blue-600" /> Open</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
