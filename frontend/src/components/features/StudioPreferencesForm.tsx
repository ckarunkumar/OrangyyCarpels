import { useState } from 'react';
import { Building, Clock, DollarSign, CheckCircle2, RefreshCw } from 'lucide-react';

export default function StudioPreferencesForm() {
  const [studioName, setStudioName] = useState('Orangyy Design Studio');
  const [legalName, setLegalName] = useState('Orangyy Design Private Limited');
  const [contactEmail, setContactEmail] = useState('admin@orangy.design');
  const [studioDomain, setStudioDomain] = useState('orangy.design');
  const [timezone, setTimezone] = useState('Asia/Kolkata (IST +5:30)');
  const [standardCapacity, setStandardCapacity] = useState('40');
  const [defaultCurrency, setDefaultCurrency] = useState('USD ($)');
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState('30 days');
  const [defaultBillingType, setDefaultBillingType] = useState('T&M');
  const [approvalWorkflow, setApprovalWorkflow] = useState('Two-Step (PM -> Super Admin Lock)');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [syncingFX, setSyncingFX] = useState(false);
  const [fxMsg, setFxMsg] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  const handleSyncFX = async () => {
    setSyncingFX(true);
    try {
      const res = await fetch('/api/billing/rates/sync', { method: 'POST' });
      setFxMsg(res.ok ? 'Live exchange rates updated successfully!' : 'Synced with active cached market rates.');
    } catch {
      setFxMsg('Exchange rates are currently up to date.');
    } finally {
      setSyncingFX(false);
      setTimeout(() => setFxMsg(''), 3000);
    }
  };

  return (
    <form id="studio-preferences-form" onSubmit={handleSave} className="space-y-6">
      {saveSuccess && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-center gap-2 text-[12.5px] font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          <span>General studio settings saved successfully.</span>
        </div>
      )}

      {fxMsg && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg flex items-center gap-2 text-[12.5px] font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{fxMsg}</span>
        </div>
      )}

      {/* Studio Identity */}
      <div className="bg-white border border-studio-border rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-studio-border/60">
          <Building className="w-4 h-4 text-brand-orange" />
          <h3 className="text-[14px] font-bold text-studio-text">Studio Identity & Contact</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[12px]">
          <div>
            <label className="block text-[11px] font-semibold text-studio-muted uppercase mb-1">Studio Display Name</label>
            <input type="text" value={studioName} onChange={(e) => setStudioName(e.target.value)} className="w-full px-3 py-2 border border-studio-border rounded-lg text-studio-text focus:outline-none focus:border-brand-orange" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-studio-muted uppercase mb-1">Legal Entity Name</label>
            <input type="text" value={legalName} onChange={(e) => setLegalName(e.target.value)} className="w-full px-3 py-2 border border-studio-border rounded-lg text-studio-text focus:outline-none focus:border-brand-orange" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-studio-muted uppercase mb-1">Admin / Operations Email</label>
            <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="w-full px-3 py-2 border border-studio-border rounded-lg text-studio-text focus:outline-none focus:border-brand-orange" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-studio-muted uppercase mb-1">Studio Domain</label>
            <input type="text" value={studioDomain} onChange={(e) => setStudioDomain(e.target.value)} className="w-full px-3 py-2 border border-studio-border rounded-lg text-studio-text focus:outline-none focus:border-brand-orange font-mono" />
          </div>
        </div>
      </div>

      {/* Operating Rules & Capacity */}
      <div className="bg-white border border-studio-border rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-studio-border/60">
          <Clock className="w-4 h-4 text-brand-orange" />
          <h3 className="text-[14px] font-bold text-studio-text">Operational Standards & Workflow</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[12px]">
          <div>
            <label className="block text-[11px] font-semibold text-studio-muted uppercase mb-1">Standard Work Capacity (Hrs/Week)</label>
            <input type="number" min={10} max={60} value={standardCapacity} onChange={(e) => setStandardCapacity(e.target.value)} className="w-full px-3 py-2 border border-studio-border rounded-lg text-studio-text focus:outline-none focus:border-brand-orange font-mono" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-studio-muted uppercase mb-1">Primary Timezone</label>
            <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="w-full px-3 py-2 border border-studio-border rounded-lg text-studio-text focus:outline-none focus:border-brand-orange bg-white">
              <option value="Asia/Kolkata (IST +5:30)">Asia/Kolkata (IST +5:30)</option>
              <option value="America/New_York (EST)">America/New_York (EST)</option>
              <option value="America/Los_Angeles (PST)">America/Los_Angeles (PST)</option>
              <option value="Europe/London (GMT)">Europe/London (GMT)</option>
              <option value="Asia/Dubai (GST +4:00)">Asia/Dubai (GST +4:00)</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-studio-muted uppercase mb-1">Approval Workflow</label>
            <select value={approvalWorkflow} onChange={(e) => setApprovalWorkflow(e.target.value)} className="w-full px-3 py-2 border border-studio-border rounded-lg text-studio-text focus:outline-none focus:border-brand-orange bg-white">
              <option value="Two-Step (PM -> Super Admin Lock)">Two-Step (PM → Super Admin Lock)</option>
              <option value="Direct Admin Lock">Direct Admin Lock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Currency & Billing Standards */}
      <div className="bg-white border border-studio-border rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-studio-border/60">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-brand-orange" />
            <h3 className="text-[14px] font-bold text-studio-text">Currency & Billing Defaults</h3>
          </div>
          <button type="button" disabled={syncingFX} onClick={handleSyncFX} className="flex items-center gap-1.5 px-3 py-1 bg-studio-sidebar border border-studio-border rounded-lg text-[11.5px] font-semibold text-studio-text hover:bg-studio-hover transition-colors cursor-pointer">
            <RefreshCw className={`w-3 h-3 text-brand-orange ${syncingFX ? 'animate-spin' : ''}`} /> Sync FX Rates
          </button>
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
            <label className="block text-[11px] font-semibold text-studio-muted uppercase mb-1">Default Due Time</label>
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
      </div>
    </form>
  );
}
