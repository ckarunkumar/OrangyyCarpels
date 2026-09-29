import { useState, useEffect } from 'react';
import { UserRole } from '../../ui/Layout';
import { useSearch } from '../../../context/SearchContext';
import Breadcrumbs, { BreadcrumbItem } from '../../ui/Breadcrumbs';
import NdaClientsGrid, { ClientNDASummary } from './NdaClientsGrid';
import NdaClientListView, { ClientNDAItem } from './NdaClientListView';
import NdaDetailView from './NdaDetailView';
import CreateNdaModal from './CreateNdaModal';
import EmployeeNdaView from './EmployeeNdaView';
import { Client, Employee } from '../../../types/registry';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

interface NdaViewProps {
  activeRole: UserRole;
}

export default function NdaView({ activeRole }: NdaViewProps) {
  const { searchQuery, setSearchPlaceholder } = useSearch();
  const isSuperAdminOrPM = activeRole === 'Super Admin' || activeRole === 'Project Manager';

  // Navigation states for SA flow
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClientName, setSelectedClientName] = useState<string>('');
  const [selectedNdaId, setSelectedNdaId] = useState<string | null>(null);

  // Data states
  const [clientSummaries, setClientSummaries] = useState<ClientNDASummary[]>([]);
  const [clientNdas, setClientNdas] = useState<ClientNDAItem[]>([]);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    setSearchPlaceholder('Search NDA (name, code, client)...');
  }, [setSearchPlaceholder]);

  // Fetch Level 1 client summary list
  const fetchClientSummaries = () => {
    setLoading(true);
    fetch('/api/ndas/clients-summary')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setClientSummaries(data || []))
      .catch(() => setClientSummaries([]))
      .finally(() => setLoading(false));
  };

  // Fetch Level 2 client NDAs list
  const fetchClientNdas = (cId: string) => {
    setLoading(true);
    fetch(`/api/ndas/client/${cId}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setClientNdas(data || []))
      .catch(() => setClientNdas([]))
      .finally(() => setLoading(false));
  };

  // Fetch registries for modal creation
  useEffect(() => {
    if (isSuperAdminOrPM) {
      fetchClientSummaries();
      fetch('/api/clients')
        .then((r) => (r.ok ? r.json() : []))
        .then((d) => setAllClients(d || []))
        .catch(() => {});
      fetch('/api/employees')
        .then((r) => (r.ok ? r.json() : []))
        .then((d) => setAllEmployees(d || []))
        .catch(() => {});
    }
  }, [activeRole]);

  useEffect(() => {
    if (selectedClientId) {
      fetchClientNdas(selectedClientId);
    }
  }, [selectedClientId]);

  const handleSelectClient = (cId: string, cName: string) => {
    setSelectedClientId(cId);
    setSelectedClientName(cName);
    setSelectedNdaId(null);
  };

  const handleNdaCreated = (msg: string) => {
    setSuccessToast(msg);
    if (selectedClientId) {
      fetchClientNdas(selectedClientId);
    }
    fetchClientSummaries();
    setTimeout(() => setSuccessToast(null), 5000);
  };

  // Employee View
  if (!isSuperAdminOrPM) {
    return (
      <div className="w-full space-y-5 animate-in fade-in duration-200">
        <Breadcrumbs items={[{ label: 'NDA E-Signing History' }]} />
        <div className="flex items-center justify-between border-b border-studio-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-orange-50 text-brand-orange border border-orange-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[20px] font-bold tracking-tight text-studio-text">Non-Disclosure Agreements</h2>
              <p className="text-[12px] text-studio-muted">View your assigned NDA documents and complete OTP e-signature</p>
            </div>
          </div>
        </div>
        <EmployeeNdaView searchQuery={searchQuery} />
      </div>
    );
  }

  // Super Admin / PM View
  // Breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'NDA Module', onClick: () => { setSelectedClientId(null); setSelectedNdaId(null); } },
  ];

  if (selectedClientId) {
    breadcrumbItems.push({
      label: selectedClientName || selectedClientId,
      onClick: () => setSelectedNdaId(null),
    });
  }

  if (selectedNdaId) {
    breadcrumbItems.push({
      label: 'NDA Details & Audit Trail',
    });
  }

  return (
    <>
      <CreateNdaModal
        open={createModalOpen}
        clientId={selectedClientId || undefined}
        clients={allClients}
        employees={allEmployees}
        onClose={() => setCreateModalOpen(false)}
        onCreated={handleNdaCreated}
      />

      <div className="w-full space-y-5 animate-in fade-in duration-200">
        {successToast && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-center justify-between text-[12.5px] font-semibold animate-in fade-in shadow-2xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              <span>{successToast}</span>
            </div>
            <button onClick={() => setSuccessToast(null)} className="text-green-600 hover:text-green-800 text-[11px] font-bold cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        <Breadcrumbs items={breadcrumbItems} />

        {/* Level 3: NDA Detail View */}
        {selectedNdaId ? (
          <NdaDetailView ndaId={selectedNdaId} onBack={() => setSelectedNdaId(null)} />
        ) : selectedClientId ? (
          /* Level 2: Client's NDA List */
          <NdaClientListView
            clientId={selectedClientId}
            clientName={selectedClientName}
            loading={loading}
            ndas={clientNdas}
            searchQuery={searchQuery}
            onBack={() => setSelectedClientId(null)}
            onCreateNew={() => setCreateModalOpen(true)}
            onSelectNDA={(ndaId) => setSelectedNdaId(ndaId)}
          />
        ) : (
          /* Level 1: Client List Summary */
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-studio-border pb-3">
              <div>
                <h2 className="text-[20px] font-bold tracking-tight text-studio-text">NDA Module</h2>
                <p className="text-[12px] text-studio-muted">Select a client to view, create, or audit Non-Disclosure Agreements</p>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-brand-orange text-white rounded-lg text-[12px] font-bold hover:bg-opacity-90 transition-colors shadow-sm cursor-pointer shrink-0"
              >
                + Create New NDA
              </button>
            </div>

            <NdaClientsGrid
              loading={loading}
              clients={clientSummaries}
              searchQuery={searchQuery}
              onSelectClient={handleSelectClient}
            />
          </div>
        )}
      </div>
    </>
  );
}
