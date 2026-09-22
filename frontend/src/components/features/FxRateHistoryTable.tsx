import { History, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';

export interface MonthlyFxRecord {
  id: number;
  sourceCurrency: string;
  targetCurrency: string;
  rate: number;
  month: number;
  year: number;
  effectivePeriod: string;
  syncedAt: string;
  source: string;
}

interface FxRateHistoryTableProps {
  history: MonthlyFxRecord[];
  loading: boolean;
}

export default function FxRateHistoryTable({ history, loading }: FxRateHistoryTableProps) {
  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-brand-orange" />
          <h4 className="text-[13px] font-bold text-studio-text">Monthly FX Rate Snapshots & History</h4>
        </div>
        <span className="text-[11px] text-studio-muted flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-green-600" /> Historical rates locked & preserved
        </span>
      </div>

      <div className="border border-studio-border rounded-xl bg-white overflow-hidden shadow-2xs">
        <div className="bg-studio-sidebar border-b border-studio-border px-4 py-2.5 text-[10px] font-bold text-studio-muted uppercase tracking-wider grid grid-cols-12 gap-3 items-center">
          <div className="col-span-3">Month / Year</div>
          <div className="col-span-3">Currency Pair</div>
          <div className="col-span-2">Monthly Rate</div>
          <div className="col-span-2">Last Synced</div>
          <div className="col-span-2 text-right">Data Source</div>
        </div>

        <div className="divide-y divide-studio-border max-h-72 overflow-y-auto">
          {loading ? (
            <div className="py-8 text-center text-[12px] text-studio-muted animate-pulse">
              Loading exchange rate history...
            </div>
          ) : history.length === 0 ? (
            <div className="py-8 text-center text-[12px] text-studio-muted">
              No historical rate snapshots recorded yet. Click "Sync FX Rates" to create the current month's snapshot.
            </div>
          ) : (
            history.map((rec) => {
              const dateStr = new Date(rec.syncedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div key={rec.id} className="px-4 py-2.5 grid grid-cols-12 gap-3 text-[12px] items-center hover:bg-studio-hover/40 transition-colors">
                  <div className="col-span-3 flex items-center gap-2 font-semibold text-studio-text">
                    <Calendar className="w-3.5 h-3.5 text-studio-muted" />
                    <span>{rec.effectivePeriod || `${rec.month}/${rec.year}`}</span>
                  </div>

                  <div className="col-span-3 flex items-center gap-1.5 font-mono text-[11.5px] font-bold text-studio-text">
                    <span className="px-1.5 py-0.5 rounded bg-studio-sidebar border border-studio-border">{rec.sourceCurrency}</span>
                    <ArrowRight className="w-3 h-3 text-studio-muted" />
                    <span className="px-1.5 py-0.5 rounded bg-orange-50 border border-orange-200 text-brand-orange">{rec.targetCurrency}</span>
                  </div>

                  <div className="col-span-2 font-mono font-bold text-studio-text">
                    {rec.targetCurrency === 'INR' ? `₹${rec.rate.toFixed(2)}` : rec.rate.toFixed(4)}
                  </div>

                  <div className="col-span-2 text-[11px] text-studio-muted truncate" title={dateStr}>
                    {dateStr}
                  </div>

                  <div className="col-span-2 text-right">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 border border-green-200 text-green-700">
                      {rec.source}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
