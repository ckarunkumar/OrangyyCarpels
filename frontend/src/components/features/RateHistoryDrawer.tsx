import React, { useState, useEffect } from 'react';
import { X, Plus, Calendar, History, ArrowRight } from 'lucide-react';

export interface RateVersion {
  id: number;
  projectId: string;
  billingType: string;
  rateAmount: number;
  currency: string;
  effectiveStartDate: string;
  effectiveEndDate?: string;
  notes?: string;
  createdAt: string;
}

interface RateHistoryDrawerProps {
  open: boolean;
  projectId: string;
  projectName: string;
  clientCurrency: string;
  currentBillingType: string;
  isAdmin: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const BILLING_TYPES = ['T&M', 'Resources Cost (Fix)', 'Project Cost (Fix)'];
const CURRENCIES = ['USD ($)', 'INR (₹)', 'EUR (€)', 'GBP (£)', 'SGD ($)', 'AUD ($)', 'CAD ($)', 'AED (د.إ)', 'JPY (¥)', 'CHF (Fr.)'];

export default function RateHistoryDrawer({
  open, projectId, projectName, clientCurrency, currentBillingType, isAdmin, onClose, onSaved,
}: RateHistoryDrawerProps) {
  const [history, setHistory] = useState<RateVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [billingType, setBillingType] = useState(currentBillingType);
  const [rateAmount, setRateAmount] = useState('');
  const [currency, setCurrency] = useState(clientCurrency || 'USD ($)');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = () => {
    if (!projectId) return;
    setLoading(true);
    fetch(`/api/billing/projects/${projectId}/rate-versions`)
      .then((res) => res.json())
      .then((data) => { setHistory(Array.isArray(data) ? data : []); })
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (open && projectId) {
      setShowAdd(false); setError(null);
      setBillingType(currentBillingType);
      setCurrency(clientCurrency || 'USD ($)');
      fetchHistory();
    }
  }, [open, projectId, currentBillingType, clientCurrency]);

  const handleAddVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(rateAmount);
    if (isNaN(amount) || amount < 0) { setError('Please enter a valid rate amount.'); return; }
    if (!startDate) { setError('Effective start date is required.'); return; }

    setSaving(true); setError(null);
    try {
      const res = await fetch(`/api/billing/projects/${projectId}/rate-versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingType, rateAmount: amount, currency, effectiveStartDate: startDate, notes }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to save rate version');
      setShowAdd(false); setRateAmount(''); setNotes('');
      fetchHistory(); onSaved();
    } catch (err: any) { setError(err.message); } finally { setSaving(false); }
  };

  return (
    <>
      <div onClick={onClose} className={`fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />
      <div className={`fixed top-0 right-0 z-50 h-full w-full max-w-[440px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-studio-border shrink-0">
          <div>
            <h3 className="text-[15px] font-bold text-studio-text flex items-center gap-1.5"><History className="w-4 h-4 text-brand-orange" /> Rate History</h3>
            <p className="text-[11px] text-studio-muted mt-0.5">{projectName} ({projectId})</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded flex items-center justify-center text-studio-muted hover:bg-studio-bg transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {isAdmin && !showAdd && (
            <button onClick={() => setShowAdd(true)} className="w-full py-2 bg-orange-50 border border-brand-orange/40 text-brand-orange rounded text-[12px] font-semibold flex items-center justify-center gap-1.5 hover:bg-orange-100 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add New Effective Rate Version
            </button>
          )}

          {showAdd && (
            <form onSubmit={handleAddVersion} className="p-4 border border-brand-orange/30 rounded-lg bg-orange-50/30 space-y-3">
              <div className="flex justify-between items-center"><span className="text-[12px] font-bold text-studio-text">New Rate Revision</span><button type="button" onClick={() => setShowAdd(false)} className="text-[11px] text-studio-muted hover:text-studio-text">Cancel</button></div>
              {error && <div className="text-[11px] text-red-600 bg-red-50 p-2 rounded">{error}</div>}
              <div>
                <label className="text-[10px] font-bold text-studio-muted uppercase block mb-1">Billing Type</label>
                <select value={billingType} onChange={(e) => setBillingType(e.target.value)} className="w-full px-2.5 py-1.5 text-[12px] border border-studio-border rounded bg-white">{BILLING_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}</select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-studio-muted uppercase block mb-1">Amount</label>
                  <input type="number" placeholder="50" value={rateAmount} onChange={(e) => setRateAmount(e.target.value)} className="w-full px-2.5 py-1.5 text-[12px] border border-studio-border rounded bg-white" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-studio-muted uppercase block mb-1">Currency</label>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full px-2.5 py-1.5 text-[12px] border border-studio-border rounded bg-white">{CURRENCIES.map((c) => (<option key={c} value={c}>{c}</option>))}</select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-studio-muted uppercase block mb-1">Effective Start Date</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-2.5 py-1.5 text-[12px] border border-studio-border rounded bg-white" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-studio-muted uppercase block mb-1">Revision Notes</label>
                <input type="text" placeholder="e.g. Annual client rate adjustment" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-2.5 py-1.5 text-[12px] border border-studio-border rounded bg-white" />
              </div>
              <button type="submit" disabled={saving} className="w-full py-1.5 bg-brand-orange text-white rounded text-[12px] font-semibold hover:bg-opacity-90 disabled:opacity-50">{saving ? 'Saving...' : 'Save Rate Version'}</button>
            </form>
          )}

          <div className="space-y-3">
            <h4 className="text-[11px] font-bold text-studio-muted uppercase tracking-wider">Historical Timeline</h4>
            {loading ? (
              <div className="text-[12px] text-studio-muted text-center py-6">Loading history...</div>
            ) : history.length === 0 ? (
              <div className="text-[12px] text-studio-muted text-center py-6 border border-dashed border-studio-border rounded-lg bg-studio-sidebar/40">No historical revisions recorded yet. Current rate in project settings applies.</div>
            ) : (
              <div className="space-y-2">
                {history.map((ver, idx) => (
                  <div key={ver.id} className="p-3 border border-studio-border rounded-lg bg-white shadow-sm space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[13px] font-bold text-studio-text">{ver.currency.replace(/\s*\(.*\)/, '')} {ver.rateAmount.toLocaleString()}{ver.billingType.includes('Hourly') ? '/hr' : ver.billingType.includes('Monthly') ? '/mo' : ' total'}</span>
                      {idx === 0 ? <span className="text-[9px] font-bold px-2 py-0.2 bg-green-50 text-green-700 border border-green-200 rounded-full">Current Active</span> : <span className="text-[9px] font-semibold px-2 py-0.2 bg-gray-50 text-gray-500 border border-gray-200 rounded-full">Archived</span>}
                    </div>
                    <div className="text-[11px] text-studio-muted font-medium">{ver.billingType}</div>
                    <div className="text-[10px] text-studio-muted flex items-center gap-1 font-mono pt-1 border-t border-studio-border/60">
                      <Calendar className="w-3 h-3 text-studio-muted" />
                      <span>{ver.effectiveStartDate}</span>
                      <ArrowRight className="w-2.5 h-2.5 text-studio-muted" />
                      <span>{ver.effectiveEndDate || 'Present'}</span>
                    </div>
                    {ver.notes && <div className="text-[10px] text-studio-muted italic">"{ver.notes}"</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
