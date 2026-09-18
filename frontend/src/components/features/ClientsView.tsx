import { useState, useEffect } from 'react';
import { UserRole } from '../ui/Layout';
import { Plus, Building2, Globe, Pencil, Mail, Phone, CheckCircle2 } from 'lucide-react';
import { SkeletonRow } from '../ui/Skeleton';
import { Client } from './ClientDrawer';
import ClientDetailDrawer from './ClientDetailDrawer';
import ClientProjectsDrawer from './ClientProjectsDrawer';
import ClientFormView from './ClientFormView';
import Breadcrumbs from '../ui/Breadcrumbs';

export default function ClientsView({ activeRole }: { activeRole: UserRole }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [projectsClient, setProjectsClient] = useState<Client | null>(null);
  const [projectsFilter, setProjectsFilter] = useState<'all' | 'Active' | 'Inactive'>('all');
  const [detailOpen, setDetailOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [targetClient, setTargetClient] = useState<Client | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fetchClients = () => {
    setLoading(true);
    fetch('/api/clients')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch clients list');
        return res.json();
      })
      .then((data) => { setClients(data || []); setError(null); })
      .catch((err) => { setError(err.message); setClients([]); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchClients(); }, [activeRole]);

  const isAdmin = activeRole === 'Super Admin';

  const handleOpenEdit = (client: Client) => {
    setSelectedClient(null); setDetailOpen(false);
    setTargetClient(client); setFormMode('edit'); setViewMode('form');
  };

  const handleOpenAdd = () => {
    setTargetClient(null); setFormMode('add'); setViewMode('form');
  };

  const handleOpenProjects = (client: Client, filter: 'Active' | 'Inactive') => {
    setProjectsFilter(filter); setProjectsClient(client);
  };

  const handleSaved = (msg?: string) => {
    setViewMode('list');
    if (msg) {
      setSuccessToast(msg);
      setTimeout(() => setSuccessToast(null), 5000);
    }
    fetchClients();
  };

  if (viewMode === 'form') {
    return (
      <ClientFormView
        mode={formMode}
        client={formMode === 'edit' ? targetClient : null}
        onBack={() => setViewMode('list')}
        onSaved={handleSaved}
      />
    );
  }

  return (
    <>
      <ClientDetailDrawer open={detailOpen} client={selectedClient} isAdmin={isAdmin} onClose={() => setDetailOpen(false)} onEdit={handleOpenEdit} />
      <ClientProjectsDrawer open={!!projectsClient} client={projectsClient} initialFilter={projectsFilter} onClose={() => setProjectsClient(null)} />

      <div className="w-full space-y-5 animate-in fade-in duration-200">
        {successToast && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-center justify-between text-[12.5px] font-semibold animate-in fade-in slide-in-from-top-1 shadow-2xs">
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" /><span>{successToast}</span></div>
            <button onClick={() => setSuccessToast(null)} className="text-green-600 hover:text-green-800 text-[11px] font-bold cursor-pointer">Dismiss</button>
          </div>
        )}

        <Breadcrumbs items={[{ label: 'Clientele' }]} />
        <div className="flex justify-between items-center border-b border-studio-border pb-3">
          <div><h2 className="text-[20px] font-bold tracking-tight text-studio-text">Clientele</h2><p className="text-[12px] text-studio-muted">Manage studio client accounts, contact details, billing currencies, and linked projects</p></div>
          {isAdmin && (
            <button type="button" onClick={handleOpenAdd} className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-orange text-white rounded text-[12px] font-semibold hover:bg-opacity-90 transition-colors shadow-sm cursor-pointer">
              <Plus className="w-4 h-4" /> Add Client
            </button>
          )}
        </div>

        {error && <div className="p-4 border border-red-200 bg-red-50 text-red-700 rounded text-[13px] font-semibold">{error}</div>}

        <div className="border border-studio-border rounded-lg bg-white overflow-hidden shadow-sm">
          <div className="bg-studio-sidebar border-b border-studio-border px-5 py-2.5 text-[10px] font-bold text-studio-muted uppercase tracking-wider grid grid-cols-12 gap-3 items-center">
            <div className="col-span-2">Client ID</div>
            <div className="col-span-3">Company Name</div>
            <div className="col-span-2">Contact Details</div>
            <div className="col-span-2">Billing Currency</div>
            <div className="col-span-2">Projects</div>
            <div className="col-span-1 text-right">Status</div>
          </div>

          <div className="divide-y divide-studio-border bg-white">
            {loading ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />) : clients.length === 0 ? (
              <div className="text-center py-8 text-[12px] text-studio-muted">No clients registered.</div>
            ) : (
              clients.map((client) => {
                const activeCount = client.projects?.filter((p) => p.status === 'Active').length || 0;
                const inactiveCount = client.projects?.filter((p) => p.status === 'Inactive').length || 0;

                return (
                  <div key={client.id} onClick={() => { setSelectedClient(client); setDetailOpen(true); }} className="group px-5 py-3 grid grid-cols-12 gap-3 text-[12.5px] items-center hover:bg-studio-hover/40 transition-colors cursor-pointer relative">
                    <div className="col-span-2"><span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-studio-sidebar border border-studio-border text-studio-text">{client.id}</span></div>
                    <div className="col-span-3 min-w-0 pr-2 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded bg-studio-sidebar flex items-center justify-center text-studio-muted border border-studio-border shrink-0"><Building2 className="w-3.5 h-3.5" /></div>
                      <p className="font-semibold text-studio-text truncate group-hover:text-brand-orange transition-colors">{client.name}</p>
                    </div>
                    <div className="col-span-2 text-studio-muted truncate flex items-center gap-2">
                      {client.email ? (
                        <span className="flex items-center gap-1 truncate" title={client.email}><Mail className="w-3.5 h-3.5 text-studio-muted shrink-0" /><span className="truncate">{client.email}</span></span>
                      ) : client.phone ? (
                        <span className="flex items-center gap-1 truncate" title={client.phone}><Phone className="w-3.5 h-3.5 text-studio-muted shrink-0" /><span className="truncate">{client.phone}</span></span>
                      ) : (
                        <span className="text-studio-muted/60 italic text-[11px]">No contact details</span>
                      )}
                    </div>
                    <div className="col-span-2 text-studio-muted truncate flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-studio-muted shrink-0" /><span className="truncate">{client.billingCurrency}</span></div>
                    
                    <div className="col-span-2 flex items-center gap-2">
                      <button type="button" onClick={(e) => { e.stopPropagation(); handleOpenProjects(client, 'Active'); }} title={`Active Projects: ${activeCount}`} className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-700 font-bold text-[12px] hover:bg-green-100 hover:border-green-300 transition-all cursor-pointer shadow-2xs">
                        <span className="w-2 h-2 rounded-full bg-green-500 shrink-0"></span>
                        <span>{activeCount}</span>
                      </button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); handleOpenProjects(client, 'Inactive'); }} title={`Inactive Projects: ${inactiveCount}`} className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-600 font-bold text-[12px] hover:bg-red-100 hover:border-red-300 transition-all cursor-pointer shadow-2xs">
                        <span className="w-2 h-2 rounded-full bg-red-400 shrink-0"></span>
                        <span>{inactiveCount}</span>
                      </button>
                    </div>

                    <div className="col-span-1 text-right flex items-center justify-end gap-1.5">
                      {isAdmin && (
                        <button type="button" onClick={(e) => { e.stopPropagation(); handleOpenEdit(client); }} title="Edit Client" className="opacity-0 group-hover:opacity-100 p-1 hover:bg-studio-sidebar rounded text-studio-muted hover:text-brand-orange cursor-pointer transition-opacity">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${client.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>{client.status}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}
