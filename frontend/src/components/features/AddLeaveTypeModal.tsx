import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface Props {
  open: boolean;
  selectedYear: number;
  onClose: () => void;
  onCreated: (msg: string) => void;
}

export default function AddLeaveTypeModal({ open, selectedYear, onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [monthlyAccrual, setMonthlyAccrual] = useState('1.0');
  const [annualQuota, setAnnualQuota] = useState('12');
  const [maxCarryForward, setMaxCarryForward] = useState('0');
  const [allowHalfDay, setAllowHalfDay] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Please enter a leave type name.'); return; }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/leaves/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          code: (code.trim() || name.trim().slice(0, 3)).toUpperCase(),
          monthlyAccrual: Number(monthlyAccrual) || 1.0,
          annualQuota: Number(annualQuota) || 12,
          allowHalfDay,
          maxCarryForward: Number(maxCarryForward) || 0,
          year: selectedYear,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create leave type.');
      }
      setName(''); setCode(''); setMonthlyAccrual('1.0'); setAnnualQuota('12'); setMaxCarryForward('0');
      onCreated(`Leave type "${name}" created for ${selectedYear}.`);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error creating leave type');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white border border-studio-border rounded-lg shadow-sm space-y-3 text-[12px] animate-in fade-in">
      <div className="flex justify-between items-center pb-2 border-b border-studio-border/60">
        <span className="font-bold text-studio-text">Create Leave Type ({selectedYear})</span>
        <button type="button" onClick={onClose} className="text-studio-muted hover:text-studio-text cursor-pointer"><X className="w-4 h-4" /></button>
      </div>

      {error && (
        <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded flex items-center gap-2 text-[11px]">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-[10px] font-bold text-studio-muted uppercase mb-1">Name</label>
          <input type="text" placeholder="e.g. Maternity Leave" value={name} onChange={(e) => { setName(e.target.value); setError(null); }} className="w-full px-2.5 py-1.5 border border-studio-border rounded bg-white text-studio-text focus:outline-none focus:border-brand-orange" required />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-studio-muted uppercase mb-1">Code</label>
          <input type="text" placeholder="ML" value={code} onChange={(e) => setCode(e.target.value)} className="w-full px-2.5 py-1.5 border border-studio-border rounded bg-white text-studio-text focus:outline-none focus:border-brand-orange uppercase font-mono" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-studio-muted uppercase mb-1">Monthly Accrual</label>
          <input type="number" step="0.25" value={monthlyAccrual} onChange={(e) => setMonthlyAccrual(e.target.value)} className="w-full px-2.5 py-1.5 border border-studio-border rounded bg-white text-studio-text font-mono text-center focus:outline-none focus:border-brand-orange" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-studio-muted uppercase mb-1">Annual Cap</label>
          <input type="number" value={annualQuota} onChange={(e) => setAnnualQuota(e.target.value)} className="w-full px-2.5 py-1.5 border border-studio-border rounded bg-white text-studio-text font-mono text-center focus:outline-none focus:border-brand-orange" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-studio-muted uppercase mb-1">Carry Forward</label>
          <input type="number" value={maxCarryForward} onChange={(e) => setMaxCarryForward(e.target.value)} className="w-full px-2.5 py-1.5 border border-studio-border rounded bg-white text-studio-text font-mono text-center focus:outline-none focus:border-brand-orange" />
        </div>
      </div>
      <div className="flex justify-between items-center pt-1">
        <label className="flex items-center gap-2 text-[11.5px] text-studio-text font-medium cursor-pointer">
          <input type="checkbox" checked={allowHalfDay} onChange={(e) => setAllowHalfDay(e.target.checked)} className="rounded text-brand-orange focus:ring-brand-orange" /> Allow Half-Day (0.5 Days)
        </label>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onClose} className="h-8 px-3.5 border border-studio-border rounded-lg text-[12px] font-bold text-studio-text hover:bg-studio-sidebar shadow-2xs transition-colors cursor-pointer">Cancel</button>
          <button type="submit" disabled={submitting} className="h-8 px-4 bg-brand-orange text-white rounded-lg text-[12px] font-bold hover:bg-opacity-95 cursor-pointer shadow-2xs disabled:opacity-50 transition-all">
            {submitting ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </form>
  );
}
