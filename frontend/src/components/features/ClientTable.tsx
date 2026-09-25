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
  onDelete: (client: Client) => void;
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
  onDelete,
}: ClientTableProps) {
  return (
    <div className="border border-studio-border rounded-lg bg-white overflow-hidden shadow-sm">
      <div className="bg-studio-sidebar border-b border-studio-border px-5 py-2.5 text-[10px] font-bold text-studio-muted uppercase tracking-wider grid grid-cols-12 gap-3 items-center">
        <div className="col-span-1 min-w-[70px]">CLIENT ID</div>
        <div className="col-span-3 min-w-0">COMPANY NAME</div>
        <div className="col-span-1 min-w-0">CLIENT USERS</div>
        <div className="col-span-2 min-w-0">CONTACT DETAILS</div>
        <div className="col-span-2 whitespace-nowrap min-w-0">BILLING CURRENCY</div>
        <div className="col-span-2 min-w-0 flex items-center">PROJECTS</div>
        <div className="col-span-1 text-right">ACTION</div>
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
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
