import { Calendar } from 'lucide-react';

interface Props {
  holidays: any[];
}

const getDayName = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { weekday: 'long' });
};

const groupByMonth = (list: any[]) => {
  const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
  const groups: { month: string; items: any[] }[] = [];
  for (const h of sorted) {
    const d = new Date(h.date + 'T00:00:00');
    const month = isNaN(d.getTime()) ? 'OTHER' : d.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();
    const existing = groups.find((g) => g.month === month);
    if (existing) existing.items.push(h);
    else groups.push({ month, items: [h] });
  }
  return groups;
};

export default function TeamAvailabilityView({ holidays }: Props) {
  const grouped = groupByMonth(holidays);

  return (
    <div className="border border-studio-border rounded-lg bg-white overflow-hidden shadow-xs">
      {/* Top Card Header */}
      <div className="bg-slate-50/90 border-b border-studio-border px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
        <span className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-brand-orange" />
          PUBLISHED STUDIO HOLIDAYS
        </span>
        <span className="font-mono text-[11px] text-slate-500 font-bold uppercase">{holidays.length} HOLIDAYS</span>
      </div>

      {holidays.length === 0 ? (
        <div className="p-10 text-center text-[12.5px] text-studio-muted">No published holidays for this calendar year.</div>
      ) : (
        <div className="divide-y divide-studio-border">
          {grouped.map(({ month, items }) => (
            <div key={month} className="bg-white">
              {/* Month Group Header */}
              <div className="bg-slate-100/70 px-5 py-2.5 border-b border-studio-border text-[11px] font-bold text-slate-600 uppercase tracking-wider flex justify-between items-center">
                <span>{month}</span>
                <span className="font-mono text-[10.5px] text-slate-500 font-bold">{items.length} HOLIDAYS</span>
              </div>

              {/* Month Table */}
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-studio-border/60 bg-white text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-2.5 px-5 font-bold w-1/4">DATE</th>
                      <th className="py-2.5 px-5 font-bold w-1/4">DAY</th>
                      <th className="py-2.5 px-5 font-bold w-1/3">HOLIDAY NAME</th>
                      <th className="py-2.5 px-5 font-bold text-left">HOLIDAY TYPE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-studio-border/40 text-[12.5px] text-slate-700">
                    {items.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-5 font-mono text-[12px] text-slate-700 font-medium">{h.date}</td>
                        <td className="py-3.5 px-5 text-slate-700 font-medium">{getDayName(h.date)}</td>
                        <td className="py-3.5 px-5 font-semibold text-slate-800">{h.name}</td>
                        <td className="py-3.5 px-5">
                          {h.type === 'Mandatory' || h.type === 'MH' ? (
                            <span className="inline-block px-3 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-200/80 text-[11px] font-medium">
                              Mandatory Holiday (MH)
                            </span>
                          ) : (
                            <span className="inline-block px-3 py-1 rounded-full bg-purple-50 text-purple-600 border border-purple-200/80 text-[11px] font-medium">
                              Optional Holiday (OH)
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
