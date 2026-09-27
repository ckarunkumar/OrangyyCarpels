import { useState } from 'react';
import { Clock, Save, CheckCircle2, AlertCircle } from 'lucide-react';

interface OperationalStandardsFormProps {
  initialCapacity: string;
  initialTimezone: string;
  initialWorkflow: string;
  onSaved?: () => void;
}

export default function OperationalStandardsForm({
  initialCapacity,
  initialTimezone,
  initialWorkflow,
  onSaved,
}: OperationalStandardsFormProps) {
  const [standardCapacity, setStandardCapacity] = useState(initialCapacity || '40');
  const [timezone, setTimezone] = useState(initialTimezone || 'Asia/Kolkata (IST +5:30)');
  const [approvalWorkflow, setApprovalWorkflow] = useState(initialWorkflow || 'Two-Step (PM -> Super Admin Lock)');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/settings/configurations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operational: { standardCapacity, timezone, approvalWorkflow },
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to save operational standards');
      }
      setSuccess(true);
      if (onSaved) onSaved();
      setTimeout(() => setSuccess(false), 3500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-center gap-2 text-[12.5px] font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          <span>Operational standards saved successfully.</span>
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2 text-[12.5px] font-medium">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white border border-studio-border rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-studio-border/60">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-orange" />
            <h3 className="text-[14px] font-bold text-studio-text">Operational Standards & Workflow</h3>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-orange text-white rounded-lg text-[12px] font-bold hover:bg-opacity-90 shadow-sm cursor-pointer disabled:opacity-50 transition-all"
          >
            <Save className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Save Workflow'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[12px]">
          <div>
            <label className="block text-[11px] font-semibold text-studio-muted uppercase mb-1">Standard Work Capacity (Hrs/Week)</label>
            <input
              type="number"
              min={10}
              max={60}
              value={standardCapacity}
              onChange={(e) => setStandardCapacity(e.target.value)}
              className="w-full px-3 py-2 border border-studio-border rounded-lg text-studio-text focus:outline-none focus:border-brand-orange font-mono"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-studio-muted uppercase mb-1">Primary Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3 py-2 border border-studio-border rounded-lg text-studio-text focus:outline-none focus:border-brand-orange bg-white"
            >
              <option value="Asia/Kolkata (IST +5:30)">Asia/Kolkata (IST +5:30)</option>
              <option value="America/New_York (EST)">America/New_York (EST)</option>
              <option value="America/Los_Angeles (PST)">America/Los_Angeles (PST)</option>
              <option value="Europe/London (GMT)">Europe/London (GMT)</option>
              <option value="Asia/Dubai (GST +4:00)">Asia/Dubai (GST +4:00)</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-studio-muted uppercase mb-1">Approval Workflow</label>
            <select
              value={approvalWorkflow}
              onChange={(e) => setApprovalWorkflow(e.target.value)}
              className="w-full px-3 py-2 border border-studio-border rounded-lg text-studio-text focus:outline-none focus:border-brand-orange bg-white"
            >
              <option value="Two-Step (PM -> Super Admin Lock)">Two-Step (PM → Super Admin Lock)</option>
              <option value="Direct Admin Lock">Direct Admin Lock</option>
            </select>
          </div>
        </div>
      </div>
    </form>
  );
}
