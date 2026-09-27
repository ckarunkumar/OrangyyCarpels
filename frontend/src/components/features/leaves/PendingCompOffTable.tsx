interface PendingCompOffTableProps {
  compOffRequests: any[];
  onReview: (item: any, type: 'compoff') => void;
}

const formatDateDMY = (dateStr: string) => {
  if (!dateStr) return '';
  if (dateStr.includes('-') && dateStr.split('-')[0].length === 4) {
    const [y, m, d] = dateStr.split('-');
    return `${d}-${m}-${y}`;
  }
  return dateStr;
};

export default function PendingCompOffTable({ compOffRequests, onReview }: PendingCompOffTableProps) {
  return (
    <div className="border border-studio-border rounded-lg bg-white overflow-hidden shadow-xs">
      <div className="bg-slate-50/90 border-b border-studio-border px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
        <span>PENDING COMP-OFF OVERTIME CLAIMS</span>
        <span className="font-mono text-[11px] text-slate-500 font-bold uppercase">{compOffRequests.length} RECORDS</span>
      </div>
      {compOffRequests.length === 0 ? (
        <div className="p-8 text-center text-[12.5px] text-slate-500 font-medium">
          No pending comp-off claims requiring authorization
        </div>
      ) : (
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-studio-border/60 bg-white text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-5 font-bold">EMPLOYEE</th>
                <th className="py-2.5 px-5 font-bold">WORKED DATE</th>
                <th className="py-2.5 px-5 font-bold">HOURS WORKED</th>
                <th className="py-2.5 px-5 font-bold">DAYS CREDIT</th>
                <th className="py-2.5 px-5 font-bold">REASON / NOTES</th>
                <th className="py-2.5 px-5 font-bold text-left">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-studio-border/40 text-[12.5px] text-slate-700">
              {compOffRequests.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-5 font-medium text-slate-800">{c.employeeName}</td>
                  <td className="py-3.5 px-5 font-mono text-[12px] text-slate-700 font-medium">{formatDateDMY(c.workedDate)}</td>
                  <td className="py-3.5 px-5 text-slate-700 font-medium">{c.hoursWorked} hrs</td>
                  <td className="py-3.5 px-5 font-semibold text-brand-orange">+{c.daysCredit} Day</td>
                  <td className="py-3.5 px-5 text-slate-700 font-medium">{c.reason}</td>
                  <td className="py-3.5 px-5">
                    {c.status?.startsWith('Pending') ? (
                      <button
                        type="button"
                        onClick={() => onReview(c, 'compoff')}
                        className="px-4 py-1.5 bg-brand-orange text-white rounded text-[12px] font-semibold hover:bg-orange-600 transition-colors shadow-xs cursor-pointer"
                      >
                        Review
                      </button>
                    ) : c.status === 'Approved' ? (
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/80 text-[11px] font-medium">
                        Approved
                      </span>
                    ) : (
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200/80 text-[11px] font-medium">
                        Declined
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
