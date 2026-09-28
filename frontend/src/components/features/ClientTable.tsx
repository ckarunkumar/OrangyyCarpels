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
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
      <div className="grid grid-cols-12 gap-3 px-6 py-3.5 bg-[#fafbfc] border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-wider items-center">
        <div className="col-span-1 min-w-[70px]">CLIENT ID</div>
        <div className="col-span-3 min-w-0">COMPANY NAME</div>
        <div className="col-span-1 min-w-0">CLIENT USERS</div>
        <div className="col-span-2 min-w-0">CONTACT DETAILS</div>
        <div className="col-span-2 whitespace-nowrap min-w-0">BILLING CURRENCY</div>
        <div className="col-span-2 min-w-0 flex items-center">PROJECTS</div>
        <div className="col-span-1 text-right">ACTION</div>
      </div>

      <div className="divide-y divide-slate-100/80">
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
