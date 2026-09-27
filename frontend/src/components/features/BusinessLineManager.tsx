import { useState, useEffect } from 'react';
import { Plus, Trash2, Tag, Check, X, AlertCircle } from 'lucide-react';

export interface ServiceItem {
  id: number;
  name: string;
  businessLineId?: number | null;
  status: string;
}

export interface BusinessLineItem {
  id: number;
  name: string;
  description?: string | null;
  status: string;
  services: ServiceItem[];
}

interface BusinessLineManagerProps {
  addingBL?: boolean;
  onAddingBLChange?: (val: boolean) => void;
}

export default function BusinessLineManager({ addingBL: controlledAddingBL, onAddingBLChange }: BusinessLineManagerProps = {}) {
  const [businessLines, setBusinessLines] = useState<BusinessLineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBLName, setNewBLName] = useState('');
  const [newBLDesc, setNewBLDesc] = useState('');
  const [internalAddingBL, setInternalAddingBL] = useState(false);
  const isAddingBL = controlledAddingBL !== undefined ? controlledAddingBL : internalAddingBL;
  const setAddingBL = (val: boolean) => {
    setInternalAddingBL(val);
    if (onAddingBLChange) onAddingBLChange(val);
  };
  const [addingServiceForId, setAddingServiceForId] = useState<number | null>(null);
  const [newServiceName, setNewServiceName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/settings/business-lines');
      const data = await res.json();
      if (Array.isArray(data)) setBusinessLines(data);
    } catch { setErrorMsg('Failed to load Business Lines inventory.'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchInventory(); }, []);
  const notify = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(null), 3000); };

  const handleCreateBL = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBLName.trim()) return;
    try {
      const res = await fetch('/api/settings/business-lines', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newBLName.trim(), description: newBLDesc.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create business line.');
      setNewBLName(''); setNewBLDesc(''); setAddingBL(false);
      notify(`Business Line "${data.name}" added successfully.`);
      fetchInventory();
    } catch (err: any) { setErrorMsg(err.message); setTimeout(() => setErrorMsg(null), 4000); }
  };

  const handleDeleteBL = async (id: number, name: string) => {
    if (!window.confirm(`Delete Business Line "${name}" and all its mapped services?`)) return;
    try {
      await fetch(`/api/settings/business-lines/${id}`, { method: 'DELETE' });
      notify(`Business Line "${name}" removed.`);
      fetchInventory();
    } catch { setErrorMsg('Failed to delete business line.'); }
  };

  const handleAddService = async (blId: number) => {
    if (!newServiceName.trim()) return;
    try {
      const res = await fetch('/api/settings/services', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessLineId: blId, name: newServiceName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add service.');
      setNewServiceName(''); setAddingServiceForId(null);
      notify(`Service "${data.name}" added.`);
      fetchInventory();
    } catch (err: any) { setErrorMsg(err.message); setTimeout(() => setErrorMsg(null), 4000); }
  };

  const handleDeleteService = async (sId: number) => {
    try {
      await fetch(`/api/settings/services/${sId}`, { method: 'DELETE' });
      notify('Service deleted.');
      fetchInventory();
    } catch { setErrorMsg('Failed to delete service.'); }
  };

  return (
    <div className="space-y-5">
      {successMsg && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-center gap-2 text-[12px] font-semibold">
          <Check className="w-4 h-4 text-green-600" /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2 text-[12px] font-semibold">
          <AlertCircle className="w-4 h-4 text-red-600" /> {errorMsg}
        </div>
      )}

      {/* Add BL Modal / Form */}
      {isAddingBL && (
        <form onSubmit={handleCreateBL} className="p-4 bg-orange-50/50 border border-orange-200 rounded-xl space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h4 className="text-[13px] font-bold text-studio-text">New Business Line</h4>
            <button type="button" onClick={() => setAddingBL(false)} className="text-studio-muted hover:text-studio-text"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[12px]">
            <div>
              <label className="block text-[11px] font-semibold text-studio-muted mb-1">Business Line Name *</label>
              <input type="text" placeholder="e.g. Spatial & Exhibit Design" value={newBLName} onChange={(e) => setNewBLName(e.target.value)} className="w-full px-3 py-1.5 bg-white border border-studio-border rounded-md text-studio-text focus:outline-none focus:border-brand-orange" autoFocus />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-studio-muted mb-1">Description (Optional)</label>
              <input type="text" placeholder="e.g. Physical spaces, environmental graphics, and pop-ups" value={newBLDesc} onChange={(e) => setNewBLDesc(e.target.value)} className="w-full px-3 py-1.5 bg-white border border-studio-border rounded-md text-studio-text focus:outline-none focus:border-brand-orange" />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={() => setAddingBL(false)} className="h-8 px-3.5 border border-studio-border rounded-lg text-[12px] font-bold text-studio-text hover:bg-white shadow-2xs transition-colors cursor-pointer">Cancel</button>
            <button type="submit" className="h-8 px-4 bg-brand-orange text-white rounded-lg text-[12px] font-bold hover:bg-opacity-95 shadow-2xs transition-all cursor-pointer">Save Business Line</button>
          </div>
        </form>
      )}

      {/* Business Lines Grid */}
      {loading ? (
        <div className="py-8 text-center text-[12px] text-studio-muted animate-pulse">Loading Business Lines inventory...</div>
      ) : (
        <div className="space-y-4">
          {businessLines.map((bl) => (
            <div key={bl.id} className="bg-white border border-studio-border rounded-xl p-4 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-[14px] font-bold text-studio-text">{bl.name}</h4>
                    <span className="px-2 py-0.2 bg-studio-sidebar border border-studio-border text-studio-muted text-[10px] font-mono font-semibold rounded-full">
                      {bl.services.length} {bl.services.length === 1 ? 'Service' : 'Services'}
                    </span>
                  </div>
                  {bl.description && <p className="text-[11.5px] text-studio-muted mt-0.5">{bl.description}</p>}
                </div>
                <button type="button" onClick={() => handleDeleteBL(bl.id, bl.name)} className="p-1 text-studio-muted hover:text-red-600 rounded transition-colors" title="Delete Business Line">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Services Chip List */}
              <div className="pt-2 border-t border-studio-border/60">
                <div className="flex flex-wrap items-center gap-2">
                  {bl.services.map((s) => (
                    <span key={s.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-studio-sidebar border border-studio-border/80 rounded-md text-[11.5px] font-medium text-studio-text group">
                      <Tag className="w-3 h-3 text-brand-orange" />
                      <span>{s.name}</span>
                      <button type="button" onClick={() => handleDeleteService(s.id)} className="opacity-40 group-hover:opacity-100 hover:text-red-600 ml-0.5 cursor-pointer">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}

                  {addingServiceForId === bl.id ? (
                    <div className="flex items-center gap-1.5 animate-in fade-in">
                      <input type="text" placeholder="Service name..." value={newServiceName} onChange={(e) => setNewServiceName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddService(bl.id); } }} className="px-2.5 py-1 text-[11.5px] border border-brand-orange rounded-md focus:outline-none bg-white w-40" autoFocus />
                      <button type="button" onClick={() => handleAddService(bl.id)} className="p-1 bg-brand-orange text-white rounded hover:bg-opacity-90"><Check className="w-3 h-3" /></button>
                      <button type="button" onClick={() => { setAddingServiceForId(null); setNewServiceName(''); }} className="p-1 text-studio-muted hover:text-studio-text"><X className="w-3 h-3" /></button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => { setAddingServiceForId(bl.id); setNewServiceName(''); }} className="inline-flex items-center gap-1 px-2.5 py-1 text-[11.5px] font-medium text-brand-orange bg-orange-50/70 border border-dashed border-brand-orange/40 rounded-md hover:bg-orange-100 transition-colors cursor-pointer">
                      <Plus className="w-3 h-3" /> Add Service
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
