import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export interface Client {
  id: string;
  name: string;
  legalName?: string;
  displayName?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  accountsPerson?: string;
  accountsEmail?: string;
  accountsPhone?: string;
  address?: string;
  country?: string;
  cinNumber?: string;
  gstNumber?: string;
  panNumber?: string;
  msmeNumber?: string;
  billingCurrency: string;
  defaultBillingType?: 'T&M' | 'Fixed RC' | 'Fixed PC' | 'Hourly Rate (T&M)' | 'Monthly Res Cost (Fixed)' | 'Project Cost (Fixed)' | string;
  dueTime?: '15 days' | '30 days' | '45 days' | '60 days' | '90 days' | string;
  status: 'Active' | 'Inactive';
  projects?: Array<{ id: string; name: string; billingType: string; rate: string; budgetHours: number; loggedHours: number; status: 'Active' | 'Inactive'; }>;
}

const CURRENCIES = ['USD ($)', 'INR (₹)', 'EUR (€)', 'GBP (£)', 'SGD ($)', 'AUD ($)', 'CAD ($)', 'AED (د.إ)', 'JPY (¥)', 'CHF (Fr.)'];
const BILLING_TYPES = ['T&M', 'Fixed RC', 'Fixed PC'] as const;
const DUE_TIMES = ['15 days', '30 days', '45 days', '60 days', '90 days'] as const;

type FormState = {
  clientId: string; name: string; legalName: string; displayName: string;
  contactPerson: string; email: string; phone: string;
  accountsPerson: string; accountsEmail: string; accountsPhone: string; address: string;
  country: string; cinNumber: string; gstNumber: string; panNumber: string; msmeNumber: string;
  billingCurrency: string; defaultBillingType: Client['defaultBillingType'];
  dueTime: string; status: 'Active' | 'Inactive';
};

const EMPTY_FORM: FormState = {
  clientId: '', name: '', legalName: '', displayName: '', contactPerson: '', email: '', phone: '',
  accountsPerson: '', accountsEmail: '', accountsPhone: '', address: '',
  country: 'India', cinNumber: '', gstNumber: '', panNumber: '', msmeNumber: '',
  billingCurrency: 'USD ($)', defaultBillingType: 'T&M', dueTime: '30 days', status: 'Active',
};

interface ClientDrawerProps {
  open: boolean;
  mode: 'add' | 'edit';
  client: Client | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function ClientDrawer({ open, mode, client, onClose, onSaved }: ClientDrawerProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const legalNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      if (mode === 'edit' && client) {
        setForm({
          clientId: client.id, name: client.name,
          legalName: client.legalName || client.name, displayName: client.displayName || client.name,
          contactPerson: client.contactPerson || '', email: client.email || '', phone: client.phone || '',
          accountsPerson: client.accountsPerson || '', accountsEmail: client.accountsEmail || '',
          accountsPhone: client.accountsPhone || '', address: client.address || '', country: client.country || 'India',
          cinNumber: client.cinNumber || '', gstNumber: client.gstNumber || '', panNumber: client.panNumber || '', msmeNumber: client.msmeNumber || '',
          billingCurrency: client.billingCurrency || 'USD ($)', defaultBillingType: client.defaultBillingType || 'T&M',
          dueTime: client.dueTime || '30 days', status: client.status,
        });
      } else {
        setForm(EMPTY_FORM);
        fetch('/api/clients/next-id')
          .then((res) => res.json())
          .then((d) => { if (d.nextId) setForm((prev) => ({ ...prev, clientId: d.nextId })); })
          .catch(() => setForm((prev) => ({ ...prev, clientId: 'ODC0001' })));
      }
      setTimeout(() => legalNameRef.current?.focus(), 150);
    }
  }, [open, mode, client]);

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const legalName = form.legalName.trim();
    const displayName = form.displayName.trim();
    if (!legalName) { setError('Company Legal Name is required.'); return; }
    if (!displayName) { setError('Company Display Name is required.'); return; }
    setSaving(true); setError(null);

    const payload = {
      ...(form.clientId.trim() && { id: form.clientId.trim().toUpperCase() }),
      name: displayName, legalName, displayName,
      contactPerson: form.contactPerson.trim(), email: form.email.trim(), phone: form.phone.trim(),
      accountsPerson: form.accountsPerson.trim(), accountsEmail: form.accountsEmail.trim(),
      accountsPhone: form.accountsPhone.trim(), address: form.address.trim(), country: form.country.trim(),
      cinNumber: form.cinNumber.trim().toUpperCase(),
      gstNumber: form.gstNumber.trim().toUpperCase(), panNumber: form.panNumber.trim().toUpperCase(),
      msmeNumber: form.msmeNumber.trim().toUpperCase(), billingCurrency: form.billingCurrency,
      defaultBillingType: form.defaultBillingType, dueTime: form.dueTime, status: form.status,
    };

    try {
      const url = mode === 'edit' ? `/api/clients/${client!.id}` : '/api/clients';
      const res = await fetch(url, { method: mode === 'edit' ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save client.');
      onSaved(); onClose();
    } catch (err: any) { setError(err.message); } finally { setSaving(false); }
  };

  const inputCls = "w-full px-3 py-1.5 border border-studio-border hover:border-studio-muted/50 rounded text-[12.5px] text-studio-text bg-white focus:outline-none focus:border-brand-orange transition-colors";
  const labelCls = "block text-[11px] font-medium text-studio-muted mb-1";
  const headingCls = "text-[12px] font-bold text-studio-text pb-1 border-b border-studio-border/70";

  return (
    <>
      <div onClick={onClose} className={`fixed inset-0 z-40 bg-black/15 backdrop-blur-[1px] transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />
      <div className={`fixed top-0 right-0 z-50 h-full w-full max-w-4xl bg-white shadow-xl flex flex-col transition-transform duration-250 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-7 py-3.5 border-b border-studio-border shrink-0">
          <div>
            <h3 className="text-[16px] font-semibold text-studio-text">{mode === 'edit' ? 'Edit Client' : 'New Client'}</h3>
            <p className="text-[11px] text-studio-muted mt-0.5">{mode === 'edit' ? `Client: ${client?.displayName || client?.name}` : 'Fill in company legal & display names, contacts & billing'}</p>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-studio-muted hover:bg-studio-sidebar transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
        </div>

        <form id="client-drawer-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-7 py-5 space-y-5">
          {error && <div className="p-2.5 bg-red-50 text-red-700 rounded text-[11px] font-medium">{error}</div>}

          {/* 1. Company Info */}
          <div className="space-y-2.5">
            <h4 className={headingCls}>Company Info</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3">
              <div><label className="block text-[11px] font-bold text-brand-orange mb-1">Client ID *</label><input type="text" placeholder="ODC0001" disabled={mode === 'edit'} value={form.clientId} onChange={set('clientId')} className={`${inputCls} font-mono ${mode === 'edit' ? 'bg-studio-sidebar opacity-75' : ''}`} /></div>
              <div><label className={labelCls}>Company Legal Name *</label><input ref={legalNameRef} type="text" placeholder="e.g. Acme Corporation Pvt Ltd" value={form.legalName} onChange={set('legalName')} className={inputCls} /></div>
              <div><label className={labelCls}>Company Display Name *</label><input type="text" placeholder="e.g. Acme" value={form.displayName} onChange={set('displayName')} className={inputCls} /></div>
              <div><label className={labelCls}>Office Address</label><input type="text" placeholder="Street, City, PIN" value={form.address} onChange={set('address')} className={inputCls} /></div>
              <div><label className={labelCls}>Country</label><input type="text" placeholder="India" value={form.country} onChange={set('country')} className={inputCls} /></div>
              <div><label className={labelCls}>CIN No Or Inc No</label><input type="text" placeholder="U72200DL2021PTC123456" value={form.cinNumber} onChange={set('cinNumber')} className={`${inputCls} font-mono uppercase`} /></div>
              <div><label className={labelCls}>GST Number</label><input type="text" placeholder="22AAAAA0000A1Z5" maxLength={15} value={form.gstNumber} onChange={set('gstNumber')} className={`${inputCls} font-mono uppercase`} /></div>
              <div><label className={labelCls}>PAN Number</label><input type="text" placeholder="AAACA0000A" maxLength={10} value={form.panNumber} onChange={set('panNumber')} className={`${inputCls} font-mono uppercase`} /></div>
              <div><label className={labelCls}>MSME Number</label><input type="text" placeholder="UDYAM-XX-00-0000000" value={form.msmeNumber} onChange={set('msmeNumber')} className={`${inputCls} font-mono uppercase`} /></div>
            </div>
          </div>

          {/* 2. Point of Contact */}
          <div className="space-y-2.5">
            <h4 className={headingCls}>Point of Contact</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3">
              <div><label className={labelCls}>Contact Person</label><input type="text" placeholder="Primary Contact Name" value={form.contactPerson} onChange={set('contactPerson')} className={inputCls} /></div>
              <div><label className={labelCls}>Contact Email</label><input type="email" placeholder="contact@company.com" value={form.email} onChange={set('email')} className={inputCls} /></div>
              <div><label className={labelCls}>Contact Phone</label><input type="tel" placeholder="+1 555-0100" value={form.phone} onChange={set('phone')} className={inputCls} /></div>
            </div>
          </div>

          {/* 3. Accounts Contact */}
          <div className="space-y-2.5">
            <h4 className={headingCls}>Accounts Contact</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3">
              <div><label className={labelCls}>Account Person</label><input type="text" placeholder="Finance Officer" value={form.accountsPerson} onChange={set('accountsPerson')} className={inputCls} /></div>
              <div><label className={labelCls}>Accounts Email</label><input type="email" placeholder="billing@company.com" value={form.accountsEmail} onChange={set('accountsEmail')} className={inputCls} /></div>
              <div><label className={labelCls}>Accounts Phone</label><input type="tel" placeholder="+1 555-0200" value={form.accountsPhone} onChange={set('accountsPhone')} className={inputCls} /></div>
            </div>
          </div>

          {/* 4. Billing */}
          <div className="space-y-2.5">
            <h4 className={headingCls}>Billing</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3">
              <div><label className={labelCls}>Billing Currency</label><select value={form.billingCurrency} onChange={set('billingCurrency')} className={inputCls}>{CURRENCIES.map((c) => (<option key={c} value={c}>{c}</option>))}</select></div>
              <div><label className={labelCls}>Billing Type</label><select value={form.defaultBillingType} onChange={set('defaultBillingType')} className={inputCls}>{BILLING_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}</select></div>
              <div><label className={labelCls}>Due Time</label><select value={form.dueTime} onChange={set('dueTime')} className={inputCls}>{DUE_TIMES.map((d) => (<option key={d} value={d}>{d}</option>))}</select></div>
              <div><label className={labelCls}>Status</label><select value={form.status} onChange={set('status')} className={inputCls}><option value="Active">Active</option><option value="Inactive">Inactive</option></select></div>
            </div>
          </div>
        </form>

        <div className="shrink-0 px-7 py-3.5 border-t border-studio-border flex items-center justify-end gap-3 bg-white">
          <button type="button" onClick={onClose} className="px-4 py-1.5 text-[12px] font-medium text-studio-muted hover:text-studio-text transition-colors cursor-pointer">Cancel</button>
          <button type="submit" form="client-drawer-form" disabled={saving} className="px-4 py-1.5 text-[12px] font-semibold text-white bg-brand-orange rounded hover:bg-opacity-95 transition-colors disabled:opacity-50 cursor-pointer">{saving ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Create Client'}</button>
        </div>
      </div>
    </>
  );
}
