import { useState } from 'react';
import { Building2, FolderGit2, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { ClientUser } from '../../types/registry';
import { maskEmail, maskPhone } from '../../utils/maskUtils';

interface ClientUserRowProps {
  user: ClientUser;
  isAdmin: boolean;
  onEdit: (user: ClientUser) => void;
  onDelete: (user: ClientUser) => void;
}

export default function ClientUserRow({
  user,
  isAdmin,
  onEdit,
  onDelete,
}: ClientUserRowProps) {
  const [showEmail, setShowEmail] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const assignedCount = user.projects?.length || 0;

  const getStatusBadge = (status: string) => {
    if (status === 'Active') return 'bg-green-50 text-green-700 border-green-200';
    if (status === 'Can Login') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (status === 'Cannot Login') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-gray-50 text-gray-500 border-gray-200';
  };

  return (
    <div className="group px-5 py-3.5 grid grid-cols-12 gap-3 text-[12.5px] items-center hover:bg-studio-hover/40 transition-colors">
      <div className="col-span-1">
        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-studio-sidebar border border-studio-border text-studio-text inline-block">
          {user.id}
        </span>
      </div>

      <div className="col-span-2 min-w-0 pr-2 flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-orange-50 flex items-center justify-center text-brand-orange border border-orange-200 shrink-0 font-bold text-[10px]">
          {user.name[0]}
        </div>
        <span className="font-semibold text-studio-text truncate">{user.name}</span>
      </div>

      <div className="col-span-2 text-studio-muted text-[11.5px] truncate flex items-center gap-1.5" title={showEmail ? user.email : 'Click eye icon to reveal'}>
        <span className="truncate max-w-[140px] text-slate-700">{showEmail ? user.email : maskEmail(user.email)}</span>
        {user.email && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowEmail(!showEmail);
            }}
            title={showEmail ? 'Hide Email' : 'Reveal Email'}
            className="p-0.5 text-slate-400 hover:text-brand-orange rounded transition-colors shrink-0 cursor-pointer"
          >
            {showEmail ? <EyeOff className="w-3.5 h-3.5 text-brand-orange" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      <div className="col-span-2 text-studio-muted text-[11.5px] truncate flex items-center gap-1.5">
        <span className="truncate text-slate-700">{showPhone ? (user.phone || '—') : maskPhone(user.phone)}</span>
        {user.phone && user.phone !== '-' && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowPhone(!showPhone);
            }}
            title={showPhone ? 'Hide Phone' : 'Reveal Phone'}
            className="p-0.5 text-slate-400 hover:text-brand-orange rounded transition-colors shrink-0 cursor-pointer"
          >
            {showPhone ? <EyeOff className="w-3.5 h-3.5 text-brand-orange" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      <div className="col-span-2 flex items-center gap-1.5 text-[12px] font-medium text-studio-text truncate">
        <Building2 className="w-3.5 h-3.5 text-studio-muted shrink-0" />
        <span className="truncate">{user.client?.displayName || user.client?.name || user.clientId}</span>
      </div>

      <div className="col-span-1 flex items-center">
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10.5px] font-bold border ${assignedCount > 0 ? 'bg-orange-50 border-orange-200 text-brand-orange' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
          <FolderGit2 className="w-2.5 h-2.5" />
          <span>{assignedCount}</span>
        </span>
      </div>

      <div className="col-span-1">
        <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border inline-block ${getStatusBadge(user.status)}`}>
          {user.status}
        </span>
      </div>

      <div className="col-span-1 text-right flex items-center justify-end gap-1">
        {isAdmin && (
          <>
            <button type="button" onClick={() => onEdit(user)} title="Edit Client User" className="p-1 hover:bg-studio-sidebar rounded text-studio-muted hover:text-brand-orange cursor-pointer transition-colors">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => onDelete(user)} title="Delete Client User" className="p-1 hover:bg-red-50 rounded text-studio-muted hover:text-red-600 cursor-pointer transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
