import { useState, useEffect } from 'react';
import { DollarSign, RefreshCw, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import FxRateHistoryTable, { MonthlyFxRecord } from './FxRateHistoryTable';

interface CurrencyBillingDefaultsFormProps {
  initialCurrency: string;
  initialDueTime: string;
  initialBillingType: string;
  onSaved?: () => void;
}

export default function CurrencyBillingDefaultsForm({
  initialCurrency,
  initialDueTime,
  initialBillingType,
  onSaved,
}: CurrencyBillingDefaultsFormProps) {
  const [defaultCurrency, setDefaultCurrency] = useState(initialCurrency || 'USD ($)');
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState(initialDueTime || '30 days');
  const [defaultBillingType, setDefaultBillingType] = useState(initialBillingType || 'T&M');
  const [saving, setSaving] = useState(false);
  const [syncingFX, setSyncingFX] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fxMsg, setFxMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<MonthlyFxRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const fetchHistory = () => {
    setHistoryLoading(true);
    fetch('/api/billing/rates/history?targetCurrency=INR')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch FX history');
        return res.json();
      })
      .then((data) => setHistory(data || []))
      .catch((err) => setError(err.message))
      .finally(() => setHistoryLoading(false));
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleSaveDefaults = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/settings/configurations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currencyBilling: { defaultCurrency, defaultPaymentTerms, defaultBillingType },
        }),
      });
      if (!res.ok) throw new Error('Failed to save currency & billing defaults');
      setSuccess(true);
      if (onSaved) onSaved();
      setTimeout(() => setSuccess(false), 3500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSyncFX = async () => {
    setSyncingFX(true);
    setFxMsg(null);
    setError(null);
    try {
      const res = await fetch('/api/billing/rates/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetCurrency: 'INR' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to sync exchange rates');
      setFxMsg('Live market rates fetched and current month FX snapshot updated successfully.');
      fetchHistory();
      setTimeout(() => setFxMsg(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Error connecting to live FX API provider.');
    } finally {
      setSyncingFX(false);
    }
  };

  return (
    <div className="space-y-6">
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-center gap-2 text-[12.5px] font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          <span>Currency and billing defaults saved successfully.</span>
        </div>
      )}

      {fxMsg && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg flex items-center gap-2 text-[12.5px] font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{fxMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2 text-[12.5px] font-medium">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSaveDefaults} className="bg-white border border-studio-border rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-studio-border/60">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-brand-orange" />
            <h3 className="text-[14px] font-bold text-studio-text">Currency & Billing Defaults</h3>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={syncingFX}
              onClick={handleSyncFX}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-studio-sidebar border border-studio-border rounded-lg text-[11.5px] font-semibold text-studio-text hover:bg-studio-hover transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-brand-orange ${syncingFX ? 'animate-spin' : ''}`} />
              <span>{syncingFX ? 'Syncing Rates...' : 'Sync FX Rates'}</span>
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-orange text-white rounded-lg text-[12px] font-bold hover:bg-opacity-90 shadow-sm cursor-pointer disabled:opacity-50 transition-all"
            >
              <Save className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Save Defaults'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[12px]">
          <div>
            <label className="block text-[11px] font-semibold text-studio-muted uppercase mb-1">Default Billing Currency</label>
            <select value={defaultCurrency} onChange={(e) => setDefaultCurrency(e.target.value)} className="w-full px-3 py-2 border border-studio-border rounded-lg text-studio-text focus:outline-none focus:border-brand-orange bg-white">
              <option value="USD ($)">USD ($) — US Dollar</option>
              <option value="INR (₹)">INR (₹) — Indian Rupee</option>
              <option value="EUR (€)">EUR (€) — Euro</option>
              <option value="GBP (£)">GBP (£) — British Pound</option>
              <option value="AED">AED — UAE Dirham</option>
              <option value="SGD ($)">SGD ($) — Singapore Dollar</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-studio-muted uppercase mb-1">Default Payment Due Terms</label>
            <select value={defaultPaymentTerms} onChange={(e) => setDefaultPaymentTerms(e.target.value)} className="w-full px-3 py-2 border border-studio-border rounded-lg text-studio-text focus:outline-none focus:border-brand-orange bg-white">
              <option value="15 days">15 days</option>
              <option value="30 days">30 days</option>
              <option value="45 days">45 days</option>
              <option value="60 days">60 days</option>
              <option value="90 days">90 days</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-studio-muted uppercase mb-1">Default Billing Model</label>
            <select value={defaultBillingType} onChange={(e) => setDefaultBillingType(e.target.value)} className="w-full px-3 py-2 border border-studio-border rounded-lg text-studio-text focus:outline-none focus:border-brand-orange bg-white">
              <option value="T&M">T&M (Time & Material)</option>
              <option value="Resources Cost (Fix)">Resources Cost (Fix)</option>
              <option value="Project Cost (Fix)">Project Cost (Fix)</option>
            </select>
          </div>
        </div>
      </form>

      {/* Monthly Rate History Component */}
      <FxRateHistoryTable history={history} loading={historyLoading} />
    </div>
  );
}
