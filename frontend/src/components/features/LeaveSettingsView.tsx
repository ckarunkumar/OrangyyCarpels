import React, { useState, useEffect } from 'react';
import { Save, Calendar, CheckCircle2, Sliders, Plus, Trash2, ShieldCheck } from 'lucide-react';
import HolidayManager from './HolidayManager';
import AddLeaveTypeModal from './AddLeaveTypeModal';

const POLICY_YEARS = [2024, 2025, 2026, 2027, 2028, 2029];

export default function LeaveSettingsView() {
  const [selectedYear, setSelectedYear] = useState(2026);
  const [activeSubTab, setActiveSubTab] = useState<'policy' | 'holidays'>('policy');
  const [configs, setConfigs] = useState<any[]>([]);
  const [saved, setSaved] = useState(false);
  const [showAddLeave, setShowAddLeave] = useState(false);
  const [showAddHoliday, setShowAddHoliday] = useState(false);
  const [publishTrigger, setPublishTrigger] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchConfigs = (year: number = selectedYear) => {
    fetch(`/api/leaves/settings?year=${year}`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setConfigs(d); });
  };

  useEffect(() => { fetchConfigs(selectedYear); }, [selectedYear]);

  const handleUpdate = (id: number, field: string, value: any) => {
    setConfigs((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const c of configs) {
      await fetch(`/api/leaves/settings/${c.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: c.name, code: c.code, monthlyAccrual: Number(c.monthlyAccrual), annualQuota: Number(c.annualQuota), allowHalfDay: !!c.allowHalfDay, maxCarryForward: Number(c.maxCarryForward) || 0 }),
      });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleDeleteLeaveType = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete leave type "${name}" for ${selectedYear}?`)) return;
    await fetch(`/api/leaves/settings/${id}`, { method: 'DELETE' });
    setFeedback(`Leave type "${name}" deleted.`);
    fetchConfigs(selectedYear);
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="space-y-4">
      {/* Top Tab Bar with Controls on Right End */}
      <div className="border-b border-studio-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5">
        <div className="flex gap-6 text-[13px] font-medium">
          <button type="button" onClick={() => setActiveSubTab('policy')} className={`pb-1 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${activeSubTab === 'policy' ? 'border-brand-orange text-brand-orange font-bold' : 'border-transparent text-studio-muted hover:text-studio-text'}`}>
            <Sliders className="w-4 h-4" /> Leave Quotas
          </button>
          <button type="button" onClick={() => setActiveSubTab('holidays')} className={`pb-1 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${activeSubTab === 'holidays' ? 'border-brand-orange text-brand-orange font-bold' : 'border-transparent text-studio-muted hover:text-studio-text'}`}>
            <Calendar className="w-4 h-4" /> Holiday Calendar
          </button>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="px-2.5 py-1.5 border border-studio-border rounded bg-white text-[12px] font-semibold text-studio-text focus:outline-none focus:border-brand-orange shadow-2xs">
            {POLICY_YEARS.map((y) => (<option key={y} value={y}>{y}</option>))}
          </select>
          {activeSubTab === 'policy' ? (
            <>
              <button type="button" onClick={() => setShowAddLeave((p) => !p)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-studio-border hover:border-brand-orange text-studio-text rounded text-[12px] font-semibold transition-colors shadow-2xs cursor-pointer">
                <Plus className="w-3.5 h-3.5 text-brand-orange" /> Add Leave Type
              </button>
              <button type="button" onClick={handleSavePolicy} className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-orange text-white rounded text-[12px] font-semibold hover:bg-opacity-90 transition-all shadow-sm cursor-pointer">
                <Save className="w-3.5 h-3.5" /> Save {selectedYear}
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => setShowAddHoliday((p) => !p)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-studio-border hover:border-brand-orange text-studio-text rounded text-[12px] font-semibold transition-colors shadow-2xs cursor-pointer">
                <Plus className="w-3.5 h-3.5 text-brand-orange" /> Add Holiday
              </button>
              <button type="button" onClick={() => setPublishTrigger((c) => c + 1)} className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-orange text-white rounded text-[12px] font-semibold hover:bg-opacity-90 transition-all shadow-sm cursor-pointer">
                <ShieldCheck className="w-3.5 h-3.5" /> Publish {selectedYear}
              </button>
            </>
          )}
        </div>
      </div>

      {activeSubTab === 'policy' ? (
        <div className="space-y-4">
          {(saved || feedback) && (
            <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-center gap-2 text-[12px] font-semibold">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span>{feedback || `Leave quotas & carry-forward rules for ${selectedYear} saved successfully.`}</span>
            </div>
          )}

          <AddLeaveTypeModal open={showAddLeave} selectedYear={selectedYear} onClose={() => setShowAddLeave(false)} onCreated={(msg) => { setFeedback(msg); fetchConfigs(selectedYear); setTimeout(() => setFeedback(null), 3000); }} />

          <div className="border border-studio-border rounded-lg bg-white overflow-hidden shadow-sm">
            <table className="w-full text-left text-[12.5px]">
              <thead className="bg-studio-sidebar border-b border-studio-border text-[10px] uppercase font-bold text-studio-muted tracking-wider">
                <tr>
                  <th className="px-5 py-2.5 font-bold">Leave Type</th>
                  <th className="px-5 py-2.5 text-center font-bold">Monthly Accrual</th>
                  <th className="px-5 py-2.5 text-center font-bold">Annual Cap</th>
                  <th className="px-5 py-2.5 text-center font-bold">Half-Day (0.5)</th>
                  <th className="px-5 py-2.5 text-center font-bold">Carry Forward Limit</th>
                  <th className="px-5 py-2.5 text-right font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-studio-border bg-white">
                {configs.map((c) => (
                  <tr key={c.id} className="hover:bg-studio-hover/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <input type="text" value={c.name} onChange={(e) => handleUpdate(c.id, 'name', e.target.value)} className="font-semibold text-studio-text px-1.5 py-0.5 border border-transparent hover:border-studio-border focus:border-brand-orange rounded bg-transparent focus:bg-white text-[12px]" />
                      <span className="text-[10px] text-studio-muted font-mono font-normal ml-1">({c.code})</span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <input type="number" step="0.25" min="0" max="10" value={c.monthlyAccrual} onChange={(e) => handleUpdate(c.id, 'monthlyAccrual', e.target.value)} className="w-16 px-1.5 py-0.5 border border-studio-border rounded text-center font-mono font-semibold text-studio-text focus:outline-none focus:border-brand-orange" /> <span className="text-[11px] text-studio-muted ml-0.5">d/mo</span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <input type="number" min="0" max="180" value={c.annualQuota} onChange={(e) => handleUpdate(c.id, 'annualQuota', e.target.value)} className="w-16 px-1.5 py-0.5 border border-studio-border rounded text-center font-mono font-semibold text-studio-text focus:outline-none focus:border-brand-orange" /> <span className="text-[11px] text-studio-muted ml-0.5">d/yr</span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <input type="checkbox" checked={c.allowHalfDay ?? true} onChange={(e) => handleUpdate(c.id, 'allowHalfDay', e.target.checked)} className="rounded text-brand-orange focus:ring-brand-orange cursor-pointer" />
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <input type="number" min="0" max="90" value={c.maxCarryForward ?? 0} onChange={(e) => handleUpdate(c.id, 'maxCarryForward', e.target.value)} className="w-16 px-1.5 py-0.5 border border-studio-border rounded text-center font-mono font-semibold text-studio-text focus:outline-none focus:border-brand-orange" /> <span className="text-[11px] text-studio-muted ml-0.5">days</span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button type="button" onClick={() => handleDeleteLeaveType(c.id, c.name)} title={`Delete ${c.name}`} className="p-1 text-studio-muted hover:text-red-600 rounded hover:bg-red-50 transition-colors cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <HolidayManager selectedYear={selectedYear} showAdd={showAddHoliday} setShowAdd={setShowAddHoliday} publishTrigger={publishTrigger} />
      )}
    </div>
  );
}
