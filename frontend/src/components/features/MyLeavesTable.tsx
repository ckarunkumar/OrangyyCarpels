import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Pencil, Ban, Trash2 } from 'lucide-react';

interface MyLeavesTableProps {
  myRequests: any[];
  onSelect: (req: any) => void;
  onEdit: (req: any) => void;
  onCancel: (id: number | string) => void;
  onDelete: (id: number | string) => void;
}

const formatDateDMY = (dateStr: string) => {
  if (!dateStr) return '';
  if (dateStr.includes('-') && dateStr.split('-')[0].length === 4) {
    const [y, m, d] = dateStr.split('-');
    return `${d}-${m}-${y}`;
  }
  return dateStr;
};

const getCategoryLabel = (req: any) => {
  if (req.leaveCategory) return req.leaveCategory;
  if (req.leaveType === 'Work From Home') return 'WFH';
  if (req.leaveType === 'Casual Leave' || req.leaveType === 'casual Leave') return 'Casual Leave';
  if (req.leaveType === 'Sick Leave') return 'Sick Leave';
  if (req.leaveType === 'Earned Leave') return 'Earned Leave';
  if (req.leaveType === 'Optional Holiday' || req.leaveType === 'optional Holiday') return 'Optional Holiday';
  return req.leaveType;
};

export default function MyLeavesTable({ myRequests, onSelect, onEdit, onCancel, onDelete }: MyLeavesTableProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setActiveMenuId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="border border-studio-border rounded-lg bg-white overflow-hidden shadow-xs">
      <div className="bg-slate-50/90 border-b border-studio-border px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
        <span>MY APPLICATIONS & REQUESTS</span>
        <span className="font-mono text-[11px] text-slate-500 font-bold uppercase">{myRequests.length} RECORDS</span>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-studio-border/60 bg-white text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-2.5 px-5 font-bold">APPLICATION TYPE</th>
              <th className="py-2.5 px-5 font-bold">LEAVE CATEGORY</th>
              <th className="py-2.5 px-5 font-bold">START DATE</th>
              <th className="py-2.5 px-5 font-bold">END DATE</th>
              <th className="py-2.5 px-5 font-bold">HALF-DAY</th>
              <th className="py-2.5 px-5 font-bold">NUMBER OF DAYS</th>
              <th className="py-2.5 px-5 font-bold">REASON / NOTES</th>
              <th className="py-2.5 px-5 font-bold text-left">STATUS</th>
              <th className="py-2.5 px-5 font-bold text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-studio-border/40 text-[12.5px] text-slate-700">
            {myRequests.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500 text-[12.5px]">
                  No applications submitted yet. Click "+ Apply" to submit time-off or WFH.
                </td>
              </tr>
            ) : (
              myRequests.map((r) => {
                const isPending = r.status?.startsWith('Pending') || r.status === 'Pending_PM' || r.status === 'Pending_SA';
                const isApproved = r.status === 'Approved';
                const isDeclined = r.status === 'Declined' || r.status === 'Rejected';
                const isCancelled = r.status === 'Cancelled';

                return (
                  <tr key={r.id} onClick={() => onSelect(r)} className="hover:bg-slate-50 transition-colors cursor-pointer group">
                    <td className="py-3.5 px-5 font-medium text-slate-800 group-hover:text-brand-orange transition-colors">{r.leaveType}</td>
                    <td className="py-3.5 px-5 text-slate-600 font-medium">{getCategoryLabel(r)}</td>
                    <td className="py-3.5 px-5 font-mono text-[12px] text-slate-700 font-medium">{formatDateDMY(r.startDate)}</td>
                    <td className="py-3.5 px-5 font-mono text-[12px] text-slate-700 font-medium">{formatDateDMY(r.endDate)}</td>
                    <td className="py-3.5 px-5">
                      {r.halfDaySession?.includes('First') ? (
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200/80 text-[11px] font-medium">First half</span>
                      ) : r.halfDaySession?.includes('Second') ? (
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200/80 text-[11px] font-medium">Second Half</span>
                      ) : (<span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[11px] font-medium">None</span>)}
                    </td>
                    <td className="py-3.5 px-5 text-slate-700 font-medium">{r.daysCount === 0.5 ? '0.5 Day' : `${r.daysCount} Day`}</td>
                    <td className="py-3.5 px-5 text-slate-700 font-medium truncate max-w-xs">{r.reason}</td>
                    <td className="py-3.5 px-5">
                      {isPending ? (
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-orange-50 text-brand-orange border border-orange-200 text-[11px] font-semibold">{r.status}</span>
                      ) : isApproved ? (
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">Approved</span>
                      ) : isDeclined ? (
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[11px] font-semibold">Declined</span>
                      ) : isCancelled ? (
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-300 text-[11px] font-semibold">Cancelled</span>
                      ) : (
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium">{r.status}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right relative" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-block text-left" ref={activeMenuId === r.id ? menuRef : undefined}>
                        <button type="button" onClick={() => setActiveMenuId(activeMenuId === r.id ? null : r.id)} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer" title="Actions"><MoreVertical className="w-4 h-4" /></button>
                        {activeMenuId === r.id && (
                          <div className="absolute right-5 mt-1 w-36 bg-white rounded-md shadow-lg border border-studio-border py-1 z-20 animate-in fade-in zoom-in-95 duration-100">
                            <button type="button" onClick={() => { setActiveMenuId(null); onEdit(r); }} className="w-full text-left px-3 py-1.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer">
                              <Pencil className="w-3.5 h-3.5 text-slate-500" /> {isDeclined ? 'Re-apply / Edit' : 'Edit'}
                            </button>
                            {!isCancelled && (
                              <button type="button" onClick={() => { setActiveMenuId(null); onCancel(r.id); }} className="w-full text-left px-3 py-1.5 text-[12px] font-medium text-amber-700 hover:bg-amber-50 flex items-center gap-2 cursor-pointer">
                                <Ban className="w-3.5 h-3.5 text-amber-600" /> Cancel
                              </button>
                            )}
                            <button type="button" onClick={() => { setActiveMenuId(null); onDelete(r.id); }} className="w-full text-left px-3 py-1.5 text-[12px] font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer">
                              <Trash2 className="w-3.5 h-3.5 text-red-500" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
