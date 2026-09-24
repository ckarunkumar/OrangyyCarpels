import { AlertTriangle } from 'lucide-react';
import { ClientUser } from '../../types/registry';

interface DeleteClientUserModalProps {
  user: ClientUser | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function DeleteClientUserModal({
  user,
  isDeleting,
  onCancel,
  onConfirm,
}: DeleteClientUserModalProps) {
  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl border border-studio-border shadow-2xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-studio-text">Delete Client User</h3>
            <p className="text-[12px] text-studio-muted">This action cannot be undone.</p>
          </div>
        </div>
        <p className="text-[12.5px] text-studio-text leading-relaxed">
          Are you sure you want to delete client user <span className="font-bold text-studio-text">{user.name}</span> ({user.id})? Their login access and project assignments will be removed.
        </p>
        <div className="pt-3 border-t border-studio-border flex justify-end gap-2.5">
          <button type="button" onClick={onCancel} disabled={isDeleting} className="px-4 py-2 border border-studio-border rounded-lg text-[12px] font-semibold text-studio-text hover:bg-studio-sidebar cursor-pointer">Cancel</button>
          <button type="button" onClick={onConfirm} disabled={isDeleting} className="px-4 py-2 bg-red-600 text-white rounded-lg text-[12px] font-bold hover:bg-red-700 transition-colors shadow-sm cursor-pointer disabled:opacity-50">{isDeleting ? 'Deleting...' : 'Delete User'}</button>
        </div>
      </div>
    </div>
  );
}
