import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmModalProps {
  open: boolean;
  title: string;
  description: React.ReactNode;
  isDeleting: boolean;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function DeleteConfirmModal({
  open,
  title,
  description,
  isDeleting,
  confirmLabel = 'Delete',
  onCancel,
  onConfirm,
}: DeleteConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl border border-studio-border shadow-2xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-studio-text">{title}</h3>
            <p className="text-[12px] text-studio-muted">This action cannot be undone.</p>
          </div>
        </div>
        <div className="text-[12.5px] text-studio-text leading-relaxed">
          {description}
        </div>
        <div className="pt-3 border-t border-studio-border flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 border border-studio-border rounded-lg text-[12px] font-semibold text-studio-text hover:bg-studio-sidebar cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-[12px] font-bold hover:bg-red-700 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
