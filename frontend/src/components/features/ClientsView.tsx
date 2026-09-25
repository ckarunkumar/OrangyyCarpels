import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { UserRole } from '../ui/Layout';
import { Plus, CheckCircle2 } from 'lucide-react';
import { Client } from '../../types/registry';
import ClientDetailDrawer from './ClientDetailDrawer';
import ClientProjectsDrawer from './ClientProjectsDrawer';
import ClientFormView from './ClientFormView';
import ClientProjectsView from './ClientProjectsView';
import ClientTable from './ClientTable';
import DeleteConfirmModal from '../ui/DeleteConfirmModal';
import Breadcrumbs from '../ui/Breadcrumbs';
import { useSearch } from '../../context/SearchContext';

export default function ClientsView({ activeRole }: { activeRole: UserRole }) {
  const { searchQuery, setSearchPlaceholder } = useSearch();
  const [searchParams, setSearchParams] = useSearchParams();
  const [clients, setClients] = useState<Client[]>([]);
  const [clientStatusFilter, setClientStatusFilter] = useState<'all' | 'Active' | 'Inactive'>('all');
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
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    setSearchPlaceholder('Search clients (company, ID, contact)...');
  }, [setSearchPlaceholder]);

  const fetchClients = () => {
    setLoading(true);
    fetch('/api/clients')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const clientList = data || [];
        setClients(clientList); setError(null);
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

  const clientCounts = useMemo(() => ({
    total: clients.length,
    active: clients.filter((c) => c.status === 'Active').length,
    inactive: clients.filter((c) => c.status === 'Inactive').length,
  }), [clients]);

  const isAdmin = activeRole === 'Super Admin';

  const handleOpenEdit = (client: Client) => {
    setSelectedClient(null); setDetailOpen(false);
    setTargetClient(client); setFormMode('edit'); setViewMode('form');
  };

  const handleSaved = (msg?: string) => {
    setViewMode('list');
    if (msg) { setSuccessToast(msg); setTimeout(() => setSuccessToast(null), 5000); }
    fetchClients();
  };

  const confirmDelete = async () => {
    if (!deletingClient) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/clients/${deletingClient.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete client');
      setSuccessToast(`Client "${deletingClient.name}" deleted successfully.`);
      setDeletingClient(null);
      fetchClients();
      setTimeout(() => setSuccessToast(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Error deleting client');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredClients = clients.filter((c) => {
    if (clientStatusFilter === 'Active' && c.status !== 'Active') return false;
    if (clientStatusFilter === 'Inactive' && c.status !== 'Inactive') return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return c.id.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || (c.displayName && c.displayName.toLowerCase().includes(q)) || (c.contactPerson && c.contactPerson.toLowerCase().includes(q)) || (c.email && c.email.toLowerCase().includes(q));
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
      <DeleteConfirmModal
        open={!!deletingClient}
        title="Delete Client"
        description={
          deletingClient ? (
            <p>
              Are you sure you want to delete client <span className="font-bold text-studio-text">{deletingClient.name}</span> ({deletingClient.id})? This action cannot be undone.
            </p>
          ) : null
        }
        confirmLabel="Delete Client"
        isDeleting={isDeleting}
        onCancel={() => setDeletingClient(null)}
        onConfirm={confirmDelete}
      />

      <div className="w-full space-y-5 animate-in fade-in duration-200">
        {successToast && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-center justify-between text-[12.5px] font-semibold animate-in fade-in shadow-2xs">
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" /><span>{successToast}</span></div>
            <button onClick={() => setSuccessToast(null)} className="text-green-600 hover:text-green-800 text-[11px] font-bold cursor-pointer">Dismiss</button>
          </div>
        )}

        <Breadcrumbs items={[{ label: 'Client Management' }]} />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-studio-border pb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-[20px] font-bold tracking-tight text-studio-text">Client Management</h2>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button type="button" onClick={() => setClientStatusFilter('all')} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11.5px] border transition-all cursor-pointer shadow-2xs ${clientStatusFilter === 'all' ? 'bg-white text-studio-text border-slate-300 font-bold' : 'bg-studio-sidebar/60 border-studio-border text-studio-muted hover:text-studio-text hover:bg-studio-sidebar font-medium'}`}>
                <span>All</span><span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700">{clientCounts.total}</span>
              </button>
              <button type="button" onClick={() => setClientStatusFilter(clientStatusFilter === 'Active' ? 'all' : 'Active')} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11.5px] border transition-all cursor-pointer shadow-2xs ${clientStatusFilter === 'Active' ? 'bg-white text-studio-text border-slate-300 font-bold' : 'bg-studio-sidebar/60 border-studio-border text-studio-muted hover:text-studio-text hover:bg-studio-sidebar font-medium'}`}>
                <span>Active</span><span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700">{clientCounts.active}</span>
              </button>
              <button type="button" onClick={() => setClientStatusFilter(clientStatusFilter === 'Inactive' ? 'all' : 'Inactive')} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11.5px] border transition-all cursor-pointer shadow-2xs ${clientStatusFilter === 'Inactive' ? 'bg-white text-studio-text border-slate-300 font-bold' : 'bg-studio-sidebar/60 border-studio-border text-studio-muted hover:text-studio-text hover:bg-studio-sidebar font-medium'}`}>
                <span>Inactive</span><span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700">{clientCounts.inactive}</span>
              </button>
            </div>
            {isAdmin && (
              <button type="button" onClick={() => { setTargetClient(null); setFormMode('add'); setViewMode('form'); }} className="flex items-center gap-1.5 px-4 py-2 bg-brand-orange text-white rounded-lg text-[12px] font-bold hover:bg-opacity-90 shadow-sm cursor-pointer shrink-0">
                <Plus className="w-4 h-4" /> Add Client
              </button>
            )}
          </div>
        </div>

        {error && <div className="p-4 border border-red-200 bg-red-50 text-red-700 rounded text-[13px] font-semibold">{error}</div>}

        <ClientTable
          loading={loading}
          clients={filteredClients}
          isAdmin={isAdmin}
          searchQuery={searchQuery}
          onSelectClientProjects={(c) => { setActiveClientForProjects(c); setSearchParams({ clientId: c.id }); }}
          onOpenDetail={(c) => { setSelectedClient(c); setDetailOpen(true); }}
          onOpenProjectsDrawer={(c, f) => { setProjectsFilter(f); setProjectsClient(c); }}
          onOpenEdit={handleOpenEdit}
          onDelete={(c) => setDeletingClient(c)}
        />
      </div>
    </>
  );
}
