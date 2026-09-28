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

  const isUserActive = user.status === 'Active' || user.status === 'Can Login';

  return (
    <div className="group px-5 py-3.5 grid grid-cols-12 gap-3 text-[12.5px] items-center hover:bg-studio-hover/40 transition-colors relative">
      {/* 1. User ID (Green for Active/Can Login, Red for Inactive/Cannot Login) */}
      <div className="col-span-1 min-w-[70px]">
        <span
          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border inline-block transition-colors cursor-pointer ${
            isUserActive
              ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:border-green-300'
              : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:border-red-300'
          }`}
          title={`User ID: ${user.id} (${user.status || 'Active'})`}
        >
          {user.id}
        </span>
      </div>

      {/* 2. Full Name */}
      <div className="col-span-3 min-w-0 pr-2 flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-orange-50 flex items-center justify-center text-brand-orange border border-orange-200 shrink-0 font-bold text-[10px]">
          {user.name[0]}
        </div>
        <span className="font-semibold text-studio-text truncate group-hover:text-brand-orange transition-colors">{user.name}</span>
      </div>

      {/* 3. Email Address */}
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

      {/* 4. Mobile / Phone */}
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

      {/* 5. Client Name */}
      <div className="col-span-2 flex items-center gap-1.5 text-[12px] font-medium text-studio-text truncate">
        <Building2 className="w-3.5 h-3.5 text-studio-muted shrink-0" />
        <span className="truncate">{user.client?.displayName || user.client?.name || user.clientId}</span>
      </div>

      {/* 6. Assigned Projects & Mouse Over Actions */}
      <div className="col-span-2 flex items-center justify-between min-w-0 pr-1">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${assignedCount > 0 ? 'bg-orange-50 border-orange-200 text-brand-orange' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
          <FolderGit2 className="w-2.5 h-2.5" />
          <span>{assignedCount}</span>
        </span>

        {isAdmin && (
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all shrink-0">
            <button type="button" onClick={(e) => { e.stopPropagation(); onEdit(user); }} title="Edit Client User" className="p-1 hover:bg-orange-50 rounded text-slate-400 hover:text-brand-orange cursor-pointer transition-colors">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(user); }} title="Delete Client User" className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-600 cursor-pointer transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
