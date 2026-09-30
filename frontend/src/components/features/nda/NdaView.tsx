import { useState, useEffect } from 'react';
import { UserRole } from '../../ui/Layout';
import { useSearch } from '../../../context/SearchContext';
import Breadcrumbs, { BreadcrumbItem } from '../../ui/Breadcrumbs';
import NdaClientsGrid, { ClientNDASummary } from './NdaClientsGrid';
import NdaClientListView, { ClientNDAItem } from './NdaClientListView';
import NdaDetailView from './NdaDetailView';
import CreateNdaFormView, { EditingNDAData } from './CreateNdaFormView';
import EmployeeNdaView from './EmployeeNdaView';
import { Client, Employee } from '../../../types/registry';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

interface NdaViewProps {
  activeRole: UserRole;
}

export default function NdaView({ activeRole }: NdaViewProps) {
  const { searchQuery, setSearchPlaceholder } = useSearch();
  const isSuperAdmin = activeRole === 'Super Admin';

  // Navigation states for SA flow
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClientName, setSelectedClientName] = useState<string>('');
  const [selectedNdaId, setSelectedNdaId] = useState<string | null>(null);

  // Full-page Create / Edit Form State
  const [isCreatingOrEditing, setIsCreatingOrEditing] = useState(false);
  const [editingNdaItem, setEditingNdaItem] = useState<EditingNDAData | null>(null);

  // Data states
  const [clientSummaries, setClientSummaries] = useState<ClientNDASummary[]>([]);
  const [clientNdas, setClientNdas] = useState<ClientNDAItem[]>([]);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Fetch registries for creation view
  useEffect(() => {
    if (isSuperAdmin) {
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
    setIsCreatingOrEditing(false);
  };

  const handleNdaCreated = (msg: string) => {
    setSuccessToast(msg);
    if (selectedClientId) {
      fetchClientNdas(selectedClientId);
    }
    fetchClientSummaries();
    setTimeout(() => setSuccessToast(null), 5000);
  };

  const handleOpenEdit = async (ndaItem: ClientNDAItem) => {
    try {
      const res = await fetch(`/api/ndas/${ndaItem.id}`);
      if (res.ok) {
        const detail = await res.json();
        const empIds = detail.assignments ? detail.assignments.map((a: any) => a.employeeId) : [];
        setEditingNdaItem({
          id: ndaItem.id,
          ndaCode: ndaItem.ndaCode,
          ndaName: ndaItem.ndaName,
          documentContent: detail.documentContent || ndaItem.documentContent || '',
          employeeIds: empIds,
        });
        setIsCreatingOrEditing(true);
      }
    } catch {
      setEditingNdaItem({
        id: ndaItem.id,
        ndaCode: ndaItem.ndaCode,
        ndaName: ndaItem.ndaName,
        documentContent: ndaItem.documentContent || '',
      });
      setIsCreatingOrEditing(true);
    }
  };

  // Employee View
  if (!isSuperAdmin) {
    return (
      <div className="w-full space-y-5 animate-in fade-in duration-200">
        <Breadcrumbs items={[{ label: 'NDA E-Signing History' }]} />
        <div className="border-b border-studio-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-orange-50 text-brand-orange border border-orange-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[20px] font-bold tracking-tight text-studio-text">Non Disclosure Agreement</h2>
            </div>
          </div>
        </div>
        <EmployeeNdaView searchQuery={searchQuery} />
      </div>
    );
  }

  // Breadcrumb items calculation
  const breadcrumbItems: BreadcrumbItem[] = [
    {
      label: 'Non Disclosure Agreement',
      onClick: () => {
        setSelectedClientId(null);
        setSelectedNdaId(null);
        setIsCreatingOrEditing(false);
      },
    },
  ];

  if (selectedClientId) {
    breadcrumbItems.push({
      label: selectedClientName || selectedClientId,
      onClick: () => {
        setSelectedNdaId(null);
        setIsCreatingOrEditing(false);
      },
    });
  }

  if (isCreatingOrEditing) {
    breadcrumbItems.push({
      label: editingNdaItem ? `Edit NDA (${editingNdaItem.ndaCode})` : 'Create New NDA',
    });
  } else if (selectedNdaId) {
    breadcrumbItems.push({
      label: 'NDA Details & Audit Trail',
    });
  }

  return (
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

      {/* Full Page View: Create / Edit NDA View */}
      {isCreatingOrEditing ? (
        <CreateNdaFormView
          clientId={selectedClientId || undefined}
          clients={allClients}
          employees={allEmployees}
          editingNda={editingNdaItem}
          onCancel={() => {
            setIsCreatingOrEditing(false);
            setEditingNdaItem(null);
          }}
          onCreated={handleNdaCreated}
        />
      ) : selectedNdaId ? (
        /* Level 3: NDA Detail View */
        <NdaDetailView ndaId={selectedNdaId} isSuperAdmin={isSuperAdmin} onBack={() => setSelectedNdaId(null)} />
      ) : selectedClientId ? (
        /* Level 2: Client's NDA List */
        <NdaClientListView
          clientId={selectedClientId}
          clientName={selectedClientName}
          loading={loading}
          ndas={clientNdas}
          searchQuery={searchQuery}
          isSuperAdmin={isSuperAdmin}
          onBack={() => setSelectedClientId(null)}
          onCreateNew={() => {
            setEditingNdaItem(null);
            setIsCreatingOrEditing(true);
          }}
          onEditNDA={handleOpenEdit}
          onSelectNDA={(ndaId) => setSelectedNdaId(ndaId)}
          onRefresh={() => fetchClientNdas(selectedClientId)}
        />
      ) : (
        /* Level 1: Client List Summary */
        <div className="space-y-4">
          <div className="border-b border-studio-border pb-3">
            <h2 className="text-[20px] font-bold tracking-tight text-studio-text">Non Disclosure Agreement</h2>
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
  );
}
