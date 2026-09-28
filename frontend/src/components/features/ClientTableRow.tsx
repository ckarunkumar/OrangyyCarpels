import { useState } from 'react';
import { Pencil, User, Eye, EyeOff } from 'lucide-react';
import { Client } from '../../types/registry';
import { maskEmail, maskPhone } from '../../utils/maskUtils';

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
  const [showContact, setShowContact] = useState(false);
  const activeCount = client.projects?.filter((p) => p.status === 'Active').length || 0;
  const inactiveCount = client.projects?.filter((p) => p.status === 'Inactive').length || 0;
  const clientUsersCount = client.clientUsers?.length || 0;

  return (
    <div
      onClick={() => onSelectRow(client)}
      className="group px-5 py-3.5 grid grid-cols-12 gap-3 text-[12.5px] items-center hover:bg-studio-hover/40 transition-colors cursor-pointer relative"
    >
      {/* 1. Client Code (Green for Active, Red for Inactive, opens Details) */}
      <div className="col-span-1 min-w-[70px]">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetail(client);
          }}
          title={`View Client Details (${client.status})`}
          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border inline-block transition-colors cursor-pointer ${
            client.status === 'Active'
              ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:border-green-300'
              : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:border-red-300'
          }`}
        >
          {client.id}
        </button>
      </div>

      {/* 2. Company Name */}
      <div className="col-span-3 min-w-0 pr-2 flex items-center">
        <span className="font-semibold text-studio-text truncate">
          {client.name}
        </span>
      </div>

      {/* 3. Client Users Count */}
      <div className="col-span-1 min-w-0 flex items-center">
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border whitespace-nowrap ${
            clientUsersCount > 0
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-slate-50 text-slate-600 border-slate-200'
          }`}
        >
          <User className={`w-2.5 h-2.5 ${clientUsersCount > 0 ? 'text-blue-600' : 'text-slate-400'}`} />
          <span>{clientUsersCount}</span>
        </span>
      </div>

      {/* 4. Contact Details (No mail/phone icon) */}
      <div className="col-span-2 text-studio-muted truncate flex items-center gap-1.5 min-w-0">
        {client.email ? (
          <span className="truncate min-w-0 text-slate-700" title={showContact ? client.email : 'Click eye icon to reveal'}>
            {showContact ? client.email : maskEmail(client.email)}
          </span>
        ) : client.phone ? (
          <span className="truncate min-w-0 text-slate-700" title={showContact ? client.phone : 'Click eye icon to reveal'}>
            {showContact ? client.phone : maskPhone(client.phone)}
          </span>
        ) : (
          <span className="text-studio-muted/60 italic text-[11px]">No contact details</span>
        )}
        {(client.email || client.phone) && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowContact(!showContact);
            }}
            title={showContact ? 'Hide Contact Details' : 'Reveal Contact Details'}
            className="p-0.5 text-slate-400 hover:text-brand-orange rounded transition-colors shrink-0 cursor-pointer"
          >
            {showContact ? <EyeOff className="w-3.5 h-3.5 text-brand-orange" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* 5. Billing Currency */}
      <div className="col-span-2 text-studio-muted truncate flex items-center whitespace-nowrap min-w-0">
        <span className="truncate">{client.billingCurrency}</span>
      </div>

      {/* 6. Projects Badges & Mouse Over Edit Icon */}
      <div className="col-span-3 flex items-center justify-between min-w-0 pr-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenProjectsDrawer(client, 'Active');
            }}
            title={`Active Projects: ${activeCount}`}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-700 font-bold text-[11px] hover:bg-green-100 hover:border-green-300 transition-all cursor-pointer shadow-2xs"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"></span>
            <span>{activeCount}</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenProjectsDrawer(client, 'Inactive');
            }}
            title={`Inactive Projects: ${inactiveCount}`}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-600 font-bold text-[11px] hover:bg-red-100 hover:border-red-300 transition-all cursor-pointer shadow-2xs"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0"></span>
            <span>{inactiveCount}</span>
          </button>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenEdit(client);
            }}
            title="Edit Client"
            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-brand-orange hover:bg-orange-50 rounded transition-all cursor-pointer shrink-0"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
