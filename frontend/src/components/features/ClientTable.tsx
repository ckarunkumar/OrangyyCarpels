import { Client } from '../../types/registry';
import ClientTableRow from './ClientTableRow';
import { SkeletonRow } from '../ui/Skeleton';

interface ClientTableProps {
  loading: boolean;
  clients: Client[];
  isAdmin: boolean;
  searchQuery?: string;
  onSelectClientProjects: (client: Client) => void;
  onOpenDetail: (client: Client) => void;
  onOpenProjectsDrawer: (client: Client, filter: 'Active' | 'Inactive') => void;
  onOpenEdit: (client: Client) => void;
}

export default function ClientTable({
  loading,
  clients,
  isAdmin,
  searchQuery,
  onSelectClientProjects,
  onOpenDetail,
  onOpenProjectsDrawer,
  onOpenEdit,
}: ClientTableProps) {
  return (
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
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
        ) : clients.length === 0 ? (
          <div className="text-center py-8 text-[12px] text-studio-muted">
            {searchQuery ? `No clients matching "${searchQuery}"` : 'No clients registered.'}
          </div>
        ) : (
          clients.map((client) => (
            <ClientTableRow
              key={client.id}
              client={client}
              isAdmin={isAdmin}
              onSelectRow={onSelectClientProjects}
              onOpenDetail={onOpenDetail}
              onOpenProjectsDrawer={onOpenProjectsDrawer}
              onOpenEdit={onOpenEdit}
            />
          ))
        )}
      </div>
    </div>
  );
}
