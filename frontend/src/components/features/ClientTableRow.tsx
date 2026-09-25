import { Pencil, Mail, Phone } from 'lucide-react';
import { Client } from '../../types/registry';

interface ClientTableRowProps {
  client: Client;
  isAdmin: boolean;
  onSelectRow: (client: Client) => void;
  onOpenDetail: (client: Client) => void;
  onOpenProjectsDrawer: (client: Client, filter: 'Active' | 'Inactive') => void;
  onOpenEdit: (client: Client) => void;
}

export default function ClientTableRow({
  client,
  isAdmin,
  onSelectRow,
  onOpenDetail,
  onOpenProjectsDrawer,
  onOpenEdit,
}: ClientTableRowProps) {
  const activeCount = client.projects?.filter((p) => p.status === 'Active').length || 0;
  const inactiveCount = client.projects?.filter((p) => p.status === 'Inactive').length || 0;

  return (
    <div onClick={() => onSelectRow(client)} className="group px-5 py-3 grid grid-cols-12 gap-3 text-[12.5px] items-center hover:bg-studio-hover/40 transition-colors cursor-pointer relative">
      {/* 1. Client ID / Code */}
      <div className="col-span-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetail(client);
          }}
          title="View Client Details"
          className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-studio-sidebar border border-studio-border text-studio-text hover:border-brand-orange/60 hover:text-brand-orange transition-colors cursor-pointer"
        >
          {client.id}
        </button>
      </div>

      {/* 2. Company Name */}
      <div className="col-span-3 min-w-0 pr-2 flex items-center">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetail(client);
          }}
          title="View Client Details"
          className="font-semibold text-studio-text truncate group-hover:text-brand-orange hover:underline transition-colors text-left cursor-pointer"
        >
          {client.name}
        </button>
      </div>

      {/* 3. Contact Details */}
      <div className="col-span-2 text-studio-muted truncate flex items-center gap-2">
        {client.email ? (
          <span className="flex items-center gap-1 truncate" title={client.email}>
            <Mail className="w-3.5 h-3.5 text-studio-muted shrink-0" />
            <span className="truncate">{client.email}</span>
          </span>
        ) : client.phone ? (
          <span className="flex items-center gap-1 truncate" title={client.phone}>
            <Phone className="w-3.5 h-3.5 text-studio-muted shrink-0" />
            <span className="truncate">{client.phone}</span>
          </span>
        ) : (
          <span className="text-studio-muted/60 italic text-[11px]">No contact details</span>
        )}
      </div>

      {/* 4. Billing Currency */}
      <div className="col-span-2 text-studio-muted truncate flex items-center">
        <span className="truncate">{client.billingCurrency}</span>
      </div>

      {/* 5. Projects Count Badges */}
      <div className="col-span-2 flex items-center gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenProjectsDrawer(client, 'Active');
          }}
          title={`Active Projects: ${activeCount}`}
          className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-700 font-bold text-[12px] hover:bg-green-100 hover:border-green-300 transition-all cursor-pointer shadow-2xs"
        >
          <span className="w-2 h-2 rounded-full bg-green-500 shrink-0"></span>
          <span>{activeCount}</span>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenProjectsDrawer(client, 'Inactive');
          }}
          title={`Inactive Projects: ${inactiveCount}`}
          className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-600 font-bold text-[12px] hover:bg-red-100 hover:border-red-300 transition-all cursor-pointer shadow-2xs"
        >
          <span className="w-2 h-2 rounded-full bg-red-400 shrink-0"></span>
          <span>{inactiveCount}</span>
        </button>
      </div>

      {/* 6. Status & Actions (Status first, Edit last) */}
      <div className="col-span-1 text-right flex items-center justify-end gap-1.5">
        <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${client.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
          {client.status}
        </span>
        {isAdmin && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenEdit(client);
            }}
            title="Edit Client"
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-studio-sidebar rounded text-studio-muted hover:text-brand-orange cursor-pointer transition-opacity"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
