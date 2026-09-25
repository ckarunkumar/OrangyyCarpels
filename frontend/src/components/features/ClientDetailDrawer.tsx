import { X, Building2, Globe, FolderKanban, Pencil, Mail, Phone, MapPin, CreditCard, Shield, User, Clock } from 'lucide-react';
import { Client } from '../../types/registry';

interface ClientDetailDrawerProps {
  open: boolean;
  client: Client | null;
  isAdmin: boolean;
  onClose: () => void;
  onEdit: (client: Client) => void;
}

export default function ClientDetailDrawer({ open, client, isAdmin, onClose, onEdit }: ClientDetailDrawerProps) {
  if (!client) return null;

  const headingCls = "text-[12px] font-bold text-studio-text uppercase tracking-wider pb-1.5 border-b border-studio-border/70";
  const boxCls = "grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3.5 bg-slate-50/70 border border-studio-border rounded-xl p-4 text-[12.5px]";
  const labelCls = "text-studio-muted text-[10.5px] uppercase font-bold block";

  return (
    <>
      <div onClick={onClose} className={`fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />
      <div className={`fixed top-0 right-0 z-50 h-full w-full max-w-4xl bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-studio-border shrink-0 bg-white">
          <div>
            <h3 className="text-[16px] font-bold text-studio-text">Client Profile</h3>
            <p className="text-[11.5px] text-studio-muted font-mono">{client.id} • {client.name}</p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button type="button" onClick={() => { onClose(); onEdit(client); }} className="flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] font-semibold text-brand-orange bg-orange-50 border border-brand-orange/30 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer">
                <Pencil className="w-3 h-3" /> Edit Client
              </button>
            )}
            <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-studio-muted hover:bg-studio-sidebar transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Header Overview Card */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50/70 border border-studio-border shadow-2xs">
            <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center text-studio-muted border border-studio-border shrink-0 shadow-2xs">
              <Building2 className="w-7 h-7 text-brand-orange" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-[16px] font-bold text-studio-text truncate">{client.name}</h3>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white border border-studio-border text-studio-text">{client.id}</span>
                <span className={`text-[9.5px] font-semibold px-2.5 py-0.5 rounded-full border ${client.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>{client.status}</span>
                <span className="text-[11.5px] text-studio-muted">• {client.projects?.length || 0} active projects</span>
              </div>
            </div>
          </div>

          {/* 1. Company Info (3 Columns) */}
          <div className="space-y-2">
            <h4 className={headingCls}>1. Company Info</h4>
            <div className={boxCls}>
              <div><span className={labelCls}>Company Display Name</span><span className="text-studio-text font-semibold">{client.displayName || client.name}</span></div>
              <div><span className={labelCls}>Company Legal Name</span><span className="text-studio-text font-medium">{client.legalName || client.name}</span></div>
              <div><span className={labelCls}>Country</span><span className="text-studio-text flex items-center gap-1 mt-0.5"><Globe className="w-3 h-3 text-studio-muted" />{client.country || 'India'}</span></div>
              <div><span className={labelCls}>CIN No Or Inc No</span><span className="text-studio-text font-mono font-medium flex items-center gap-1 mt-0.5"><Shield className="w-3 h-3 text-amber-600" />{client.cinNumber || '—'}</span></div>
              <div><span className={labelCls}>GST Number</span><span className="text-studio-text font-mono font-medium flex items-center gap-1 mt-0.5"><Shield className="w-3 h-3 text-blue-600" />{client.gstNumber || '—'}</span></div>
              <div><span className={labelCls}>PAN Number</span><span className="text-studio-text font-mono font-bold flex items-center gap-1 mt-0.5"><Shield className="w-3 h-3 text-green-600" />{client.panNumber || '—'}</span></div>
              <div><span className={labelCls}>MSME Number</span><span className="text-studio-text font-mono flex items-center gap-1 mt-0.5"><Shield className="w-3 h-3 text-purple-600" />{client.msmeNumber || '—'}</span></div>
              <div className="col-span-full"><span className={labelCls}>Office Address</span><span className="text-studio-text leading-relaxed truncate block mt-0.5 flex items-center gap-1" title={client.address || '—'}><MapPin className="w-3 h-3 text-red-500 shrink-0" />{client.address || '—'}</span></div>
            </div>
          </div>

          {/* 2. Point of Contact (3 Columns) */}
          <div className="space-y-2">
            <h4 className={headingCls}>2. Point of Contact</h4>
            <div className={boxCls}>
              <div><span className={labelCls}>Contact Person</span><span className="text-studio-text font-medium flex items-center gap-1 mt-0.5"><User className="w-3 h-3 text-studio-muted" />{client.contactPerson || '—'}</span></div>
              <div><span className={labelCls}>Contact Email</span><span className="text-studio-text font-medium truncate flex items-center gap-1 mt-0.5"><Mail className="w-3 h-3 text-brand-blue" />{client.email || '—'}</span></div>
              <div><span className={labelCls}>Contact Phone</span><span className="text-studio-text flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3 text-green-600" />{client.phone || '—'}</span></div>
            </div>
          </div>

          {/* 3. Accounts Contact (3 Columns) */}
          <div className="space-y-2">
            <h4 className={headingCls}>3. Accounts Contact</h4>
            <div className={boxCls}>
              <div><span className={labelCls}>Account Person</span><span className="text-studio-text font-medium flex items-center gap-1 mt-0.5"><User className="w-3 h-3 text-studio-muted" />{client.accountsPerson || '—'}</span></div>
              <div><span className={labelCls}>Accounts Email</span><span className="text-studio-text font-medium truncate flex items-center gap-1 mt-0.5"><Mail className="w-3 h-3 text-brand-blue" />{client.accountsEmail || '—'}</span></div>
              <div><span className={labelCls}>Accounts Phone</span><span className="text-studio-text flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3 text-green-600" />{client.accountsPhone || '—'}</span></div>
            </div>
          </div>

          {/* 4. Billing Preferences (3 Columns) */}
          <div className="space-y-2">
            <h4 className={headingCls}>4. Billing Preferences</h4>
            <div className={boxCls}>
              <div><span className={labelCls}>Billing Currency</span><span className="font-semibold text-studio-text flex items-center gap-1 mt-0.5"><Globe className="w-3.5 h-3.5 text-studio-muted" /> {client.billingCurrency}</span></div>
              <div><span className={labelCls}>Billing Type</span><span className="font-semibold text-studio-text flex items-center gap-1 mt-0.5 truncate" title={client.defaultBillingType}><CreditCard className="w-3.5 h-3.5 text-studio-muted shrink-0" /> {client.defaultBillingType}</span></div>
              <div><span className={labelCls}>Due Time</span><span className="font-semibold text-brand-orange flex items-center gap-1 mt-0.5"><Clock className="w-3.5 h-3.5 text-brand-orange" /> {client.dueTime || '30 days'}</span></div>
            </div>
          </div>

          {/* Associated Projects */}
          <div className="space-y-2 pt-1">
            <h4 className="text-[11px] uppercase font-bold text-studio-muted tracking-wider flex items-center gap-1"><FolderKanban className="w-3.5 h-3.5" /> Associated Projects ({client.projects?.length || 0})</h4>
            {!client.projects || client.projects.length === 0 ? (
              <div className="text-[11px] text-studio-muted py-3 text-center border border-dashed border-studio-border rounded-lg bg-studio-sidebar/40">No active projects linked to this client.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {client.projects.map((p) => (
                  <div key={p.id} className="p-3 border border-studio-border rounded-lg bg-white flex justify-between items-center hover:border-studio-muted transition-colors shadow-sm">
                    <div className="min-w-0 pr-2"><p className="font-semibold text-[12.5px] text-studio-text truncate">{p.name}</p><p className="text-[10px] text-studio-muted font-mono">{p.id} • {p.billingType}</p></div>
                    <span className="text-[11px] font-bold text-brand-orange shrink-0">{p.loggedHours} / {p.budgetHours}h</span>
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
