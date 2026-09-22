import { useState, useEffect } from 'react';
import { Building, CheckCircle2, Save, AlertCircle } from 'lucide-react';

export default function StudioIdentityForm() {
  const [studioName, setStudioName] = useState('Orangyy Design Studio');
  const [legalName, setLegalName] = useState('Orangyy Design Private Limited');
  const [contactEmail, setContactEmail] = useState('admin@orangy.design');
  const [studioDomain, setStudioDomain] = useState('orangy.design');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/settings/studio')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load studio settings');
        return res.json();
      })
      .then((data) => {
        if (data.studioName) setStudioName(data.studioName);
        if (data.legalName) setLegalName(data.legalName);
        if (data.contactEmail) setContactEmail(data.contactEmail);
        if (data.studioDomain) setStudioDomain(data.studioDomain);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/settings/studio', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studioName, legalName, contactEmail, studioDomain }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to save studio identity');
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-studio-border rounded-xl p-8 text-center text-studio-muted text-[12.5px] animate-pulse">
        Loading studio settings...
      </div>
    );
  }

  return (
    <form id="studio-identity-form" onSubmit={handleSave} className="space-y-4">
      {saveSuccess && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-center gap-2 text-[12.5px] font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          <span>Studio Identity & Contact saved and persisted successfully.</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2 text-[12.5px] font-medium">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white border border-studio-border rounded-xl p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-studio-border/60">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-brand-orange" />
            <h3 className="text-[14px] font-bold text-studio-text">Studio Identity & Contact</h3>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-orange text-white rounded-lg text-[12px] font-bold hover:bg-opacity-90 shadow-sm cursor-pointer disabled:opacity-50 transition-all"
          >
            <Save className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Save Identity'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-[12px]">
          <div>
            <label className="block text-[11px] font-semibold text-studio-muted uppercase mb-1.5">Studio Display Name</label>
            <input
              type="text"
              value={studioName}
              onChange={(e) => setStudioName(e.target.value)}
              className="w-full px-3 py-2 border border-studio-border rounded-lg text-studio-text focus:outline-none focus:border-brand-orange"
              placeholder="e.g. Orangyy Design Studio"
              required
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-studio-muted uppercase mb-1.5">Legal Entity Name</label>
            <input
              type="text"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              className="w-full px-3 py-2 border border-studio-border rounded-lg text-studio-text focus:outline-none focus:border-brand-orange"
              placeholder="e.g. Orangyy Design Private Limited"
              required
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-studio-muted uppercase mb-1.5">Admin / Operations Email</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full px-3 py-2 border border-studio-border rounded-lg text-studio-text focus:outline-none focus:border-brand-orange"
              placeholder="admin@orangy.design"
              required
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-studio-muted uppercase mb-1.5">Studio Domain</label>
            <input
              type="text"
              value={studioDomain}
              onChange={(e) => setStudioDomain(e.target.value)}
              className="w-full px-3 py-2 border border-studio-border rounded-lg text-studio-text focus:outline-none focus:border-brand-orange font-mono"
              placeholder="orangy.design"
              required
            />
          </div>
        </div>
      </div>
    </form>
  );
}
