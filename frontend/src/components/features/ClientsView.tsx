import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { UserRole } from '../ui/Layout';
import { Plus, CheckCircle2 } from 'lucide-react';
import { Client } from '../../types/registry';
import ClientDetailDrawer from './ClientDetailDrawer';
import ClientProjectsDrawer from './ClientProjectsDrawer';
import ClientFormView from './ClientFormView';
import ClientProjectsView from './ClientProjectsView';
import ClientUsersListView from './ClientUsersListView';
import ClientTable from './ClientTable';
import Breadcrumbs from '../ui/Breadcrumbs';
import { useSearch } from '../../context/SearchContext';

export default function ClientsView({ activeRole }: { activeRole: UserRole }) {
  const { searchQuery, setSearchPlaceholder } = useSearch();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<'clients' | 'client-users'>('clients');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientUserFilter, setSelectedClientUserFilter] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [activeClientForProjects, setActiveClientForProjects] = useState<Client | null>(null);
  const [projectsClient, setProjectsClient] = useState<Client | null>(null);
  const [projectsFilter, setProjectsFilter] = useState<'all' | 'Active' | 'Inactive'>('all');
  const [detailOpen, setDetailOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [targetClient, setTargetClient] = useState<Client | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [openAddUserModal, setOpenAddUserModal] = useState(false);

  useEffect(() => {
    setSearchPlaceholder(tab === 'clients' ? 'Search clients (company, ID, contact)...' : 'Search client users (name, email, ID)...');
  }, [tab, setSearchPlaceholder]);

  const fetchClients = () => {
    setLoading(true);
    fetch('/api/clients')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const clientList = data || [];
        setClients(clientList);
        setError(null);
        const clientId = searchParams.get('clientId');
        if (clientId) {
          const match = clientList.find((c: Client) => c.id === clientId);
          if (match) setActiveClientForProjects(match);
        }
      })
      .catch((err) => { setError(err.message); setClients([]); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchClients(); }, [activeRole]);

  useEffect(() => {
    const clientId = searchParams.get('clientId');
    if (clientId && clients.length > 0) {
      const match = clients.find((c) => c.id === clientId);
      if (match) setActiveClientForProjects(match);
    } else if (!clientId) {
      setActiveClientForProjects(null);
    }
  }, [searchParams, clients]);

  const isAdmin = activeRole === 'Super Admin';

  const handleOpenEdit = (client: Client) => {
    setSelectedClient(null); setDetailOpen(false);
    setTargetClient(client); setFormMode('edit'); setViewMode('form');
  };

  const handleOpenAdd = () => { setTargetClient(null); setFormMode('add'); setViewMode('form'); };

  const handleSaved = (msg?: string) => {
    setViewMode('list');
    if (msg) { setSuccessToast(msg); setTimeout(() => setSuccessToast(null), 5000); }
    fetchClients();
  };

  const filteredClients = clients.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      c.id.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      (c.displayName && c.displayName.toLowerCase().includes(q)) ||
      (c.contactPerson && c.contactPerson.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.billingCurrency && c.billingCurrency.toLowerCase().includes(q))
    );
  });

  if (activeClientForProjects) {
    return <ClientProjectsView client={activeClientForProjects} activeRole={activeRole} allClients={clients} onBack={() => { setActiveClientForProjects(null); setSearchParams({}); fetchClients(); }} />;
  }

  if (viewMode === 'form') {
    return <ClientFormView mode={formMode} client={formMode === 'edit' ? targetClient : null} onBack={() => setViewMode('list')} onSaved={handleSaved} />;
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

        <Breadcrumbs items={[{ label: 'Client Management' }, { label: tab === 'clients' ? 'Clients' : 'Client Users' }]} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-studio-border pb-3">
          <div>
            <h2 className="text-[20px] font-bold tracking-tight text-studio-text">Client Management</h2>
            <p className="text-[12px] text-studio-muted">Manage studio client accounts, external client users, contact details, and linked projects</p>
          </div>
          <div className="flex items-center gap-2.5">
            {/* Tabs: [Clients] [Client Users] */}
            <div className="flex p-0.5 rounded-lg bg-studio-sidebar border border-studio-border">
              <button
                type="button"
                onClick={() => setTab('clients')}
                className={`px-3 py-1.5 text-[12px] rounded-md transition-colors cursor-pointer ${tab === 'clients' ? 'bg-white text-brand-orange shadow-2xs font-bold' : 'text-studio-muted hover:text-studio-text font-medium'}`}
              >
                Clients ({clients.length})
              </button>
              <button
                type="button"
                onClick={() => setTab('client-users')}
                className={`px-3 py-1.5 text-[12px] rounded-md transition-colors cursor-pointer ${tab === 'client-users' ? 'bg-white text-brand-orange shadow-2xs font-bold' : 'text-studio-muted hover:text-studio-text font-medium'}`}
              >
                Client Users
              </button>
            </div>

            {/* "All Clients" Filter positioned directly beside Clients / Client Users tabs */}
            {tab === 'client-users' && (
              <select
                value={selectedClientUserFilter}
                onChange={(e) => setSelectedClientUserFilter(e.target.value)}
                className="px-3 py-1.5 border border-studio-border rounded-lg text-[12px] text-studio-text focus:outline-none focus:border-brand-orange bg-white shadow-2xs cursor-pointer"
              >
                <option value="all">All Clients ({clients.length})</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.displayName || c.name}
                  </option>
                ))}
              </select>
            )}

            {isAdmin && (
              tab === 'clients' ? (
                <button type="button" onClick={handleOpenAdd} className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-orange text-white rounded-lg text-[12px] font-semibold hover:bg-opacity-90 transition-colors shadow-sm cursor-pointer shrink-0">
                  <Plus className="w-4 h-4" /> Add Client
                </button>
              ) : (
                <button type="button" onClick={() => setOpenAddUserModal(true)} className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-orange text-white rounded-lg text-[12px] font-semibold hover:bg-opacity-90 transition-colors shadow-sm cursor-pointer shrink-0">
                  <Plus className="w-4 h-4" /> Add Client User
                </button>
              )
            )}
          </div>
        </div>

        {error && <div className="p-4 border border-red-200 bg-red-50 text-red-700 rounded text-[13px] font-semibold">{error}</div>}

        {tab === 'client-users' ? (
          <ClientUsersListView
            clients={clients}
            isAdmin={isAdmin}
            selectedClientId={selectedClientUserFilter}
            openAddModal={openAddUserModal}
            onCloseAddModal={() => setOpenAddUserModal(false)}
          />
        ) : (
          <ClientTable
            loading={loading}
            clients={filteredClients}
            isAdmin={isAdmin}
            searchQuery={searchQuery}
            onSelectClientProjects={(c) => { setActiveClientForProjects(c); setSearchParams({ clientId: c.id }); }}
            onOpenDetail={(c) => { setSelectedClient(c); setDetailOpen(true); }}
            onOpenProjectsDrawer={(c, f) => { setProjectsFilter(f); setProjectsClient(c); }}
            onOpenEdit={handleOpenEdit}
          />
        )}
      </div>
    </>
  );
}
