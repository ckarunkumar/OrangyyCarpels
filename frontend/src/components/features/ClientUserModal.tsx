import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Client, Project, ClientUser } from '../../types/registry';

interface ClientUserModalProps {
  open: boolean;
  user: ClientUser | null;
  clients: Client[];
  defaultClientId?: string;
  onClose: () => void;
  onSaved: (msg: string) => void;
}

export default function ClientUserModal({ open, user, clients, defaultClientId, onClose, onSaved }: ClientUserModalProps) {
  const isEdit = !!user;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [clientId, setClientId] = useState('');
  const [status, setStatus] = useState<'Active' | 'Can Login' | 'Cannot Login'>('Active');
  const [clientProjects, setClientProjects] = useState<Project[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      if (user) {
        setName(user.name);
        setEmail(user.email);
        setPhone(user.phone || '');
        setPassword('');
        setClientId(user.clientId);
        setStatus((user.status as any) || 'Active');
        setSelectedProjectIds(user.projects?.map((p) => p.projectId) || []);
      } else {
        setName(''); setEmail(''); setPhone(''); setPassword('Client@123');
        setClientId(defaultClientId || clients[0]?.id || ''); setStatus('Active'); setSelectedProjectIds([]);
      }
    }
  }, [open, user, clients, defaultClientId]);

  useEffect(() => {
    if (clientId) {
      setLoadingProjects(true);
      fetch(`/api/clients/${clientId}/projects`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setClientProjects(data || []))
        .catch(() => setClientProjects([]))
        .finally(() => setLoadingProjects(false));
    } else {
      setClientProjects([]);
    }
  }, [clientId]);

  if (!open) return null;

  const toggleProject = (pId: string) => {
    setSelectedProjectIds((prev) => prev.includes(pId) ? prev.filter((id) => id !== pId) : [...prev, pId]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !clientId) {
      setError('Please fill in all required fields (Full Name, Email Address, and Client Name).');
      return;
    }
    setSaving(true);
    setError(null);

    const payload: any = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      clientId,
      status,
      projectIds: selectedProjectIds,
    };
    if (password.trim()) payload.password = password.trim();

    try {
      const url = isEdit ? `/api/client-users/${user!.id}` : '/api/client-users';
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save client user');
      onSaved(isEdit ? `Client user "${name}" updated successfully.` : `Client user "${name}" created successfully.`);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full px-3 py-2 border border-studio-border rounded-lg text-[12.5px] text-studio-text focus:outline-none focus:border-brand-orange bg-white";
  const labelCls = "block text-[11px] font-semibold text-studio-muted uppercase mb-1";

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-studio-border flex flex-col justify-between animate-in slide-in-from-right duration-200">
          <div className="px-6 py-4 border-b border-studio-border flex justify-between items-center bg-studio-sidebar/40">
            <div>
              <h3 className="text-[16px] font-bold text-studio-text">{isEdit ? 'Edit Client User' : 'Add Client User'}</h3>
              <p className="text-[11.5px] text-studio-muted">External client user account for project visibility and reporting</p>
            </div>
            <button type="button" onClick={onClose} className="p-1 rounded-lg text-studio-muted hover:bg-studio-hover cursor-pointer"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-[12.5px]">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2 text-[12px] font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Full Name *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Samyutha Verma" className={inputCls} required />
              </div>
              <div>
                <label className={labelCls}>Email Address (Username) *</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="samyutha@abc.com" className={inputCls} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Mobile / Phone</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Client Name *</label>
                <select value={clientId} onChange={(e) => { setClientId(e.target.value); setSelectedProjectIds([]); }} className={inputCls} required>
                  {clients.map((c) => (<option key={c.id} value={c.id}>{c.displayName || c.name}</option>))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Status *</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as any)} className={inputCls}>
                  <option value="Active">Active</option>
                  <option value="Can Login">Can Login</option>
                  <option value="Cannot Login">Cannot Login</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>{isEdit ? 'Reset Password (Optional)' : 'Password *'}</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={isEdit ? 'Leave blank to keep current' : 'Min 6 characters'} className={inputCls} />
              </div>
            </div>
            <div className="pt-2 border-t border-studio-border/60">
              <div className="flex items-center justify-between mb-1">
                <label className={labelCls}>Project Assignment</label>
                <span className="text-[11px] font-bold text-brand-orange bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                  {selectedProjectIds.length} Selected
                </span>
              </div>
              <p className="text-[11px] text-studio-muted mb-2">Select the projects this client user is authorized to view:</p>
              <div className="border border-studio-border rounded-lg p-3 bg-studio-sidebar/20 max-h-36 overflow-y-auto space-y-1.5">
                {loadingProjects ? (
                  <div className="text-center py-2 text-studio-muted text-[11px]">Loading client projects...</div>
                ) : clientProjects.length === 0 ? (
                  <div className="text-center py-2 text-studio-muted text-[11px]">No projects registered under this client yet.</div>
                ) : (
                  clientProjects.map((proj) => (
                    <label key={proj.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-studio-hover cursor-pointer transition-colors bg-white/60">
                      <input type="checkbox" checked={selectedProjectIds.includes(proj.id)} onChange={() => toggleProject(proj.id)} className="rounded text-brand-orange focus:ring-brand-orange" />
                      <span className="font-mono text-[11px] font-bold text-studio-text bg-white px-1.5 py-0.2 rounded border border-studio-border">{proj.id}</span>
                      <span className="text-[12px] font-medium text-studio-text truncate">{proj.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
            <div className="pt-3 border-t border-studio-border flex justify-end gap-2.5">
              <button type="button" onClick={onClose} className="px-4 py-2 border border-studio-border rounded-lg text-[12px] font-semibold text-studio-text hover:bg-studio-sidebar cursor-pointer">Cancel</button>
              <button type="submit" disabled={saving} className="px-5 py-2 bg-brand-orange text-white rounded-lg text-[12px] font-bold hover:bg-opacity-90 shadow-sm disabled:opacity-50 cursor-pointer">{saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Client User'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
