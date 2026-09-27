import { History, Calendar, ArrowRight, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';

export interface FxObservationSnapshot {
  id?: number;
  slot: '1st' | '15th' | 'Month-End';
  day: number;
  rate: number;
  effectiveDate: string;
  source: string;
}

export interface MonthlyFxRecord {
  id: number;
  sourceCurrency: string;
  targetCurrency: string;
  rate: number;
  month: number;
  year: number;
  effectivePeriod: string;
  observationsCount?: number;
  calculationStatus?: string;
  syncedAt: string;
  source: string;
  observations?: FxObservationSnapshot[];
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
          <h4 className="text-[13px] font-bold text-studio-text">Monthly FX Rate Snapshots & Averaging History</h4>
        </div>
        <span className="text-[11px] text-studio-muted flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-green-600" /> Historical rates locked & preserved
        </span>
      </div>

      <div className="border border-studio-border rounded-xl bg-white overflow-hidden shadow-2xs">
        <div className="bg-studio-sidebar border-b border-studio-border px-4 py-2.5 text-[10px] font-bold text-studio-muted uppercase tracking-wider grid grid-cols-12 gap-3 items-center">
          <div className="col-span-2">Month / Year</div>
          <div className="col-span-2">Currency Pair</div>
          <div className="col-span-2">Monthly Average</div>
          <div className="col-span-4">Scheduled Observations (1st, 15th, End)</div>
          <div className="col-span-2 text-right">Calculation Status</div>
        </div>

        <div className="divide-y divide-studio-border max-h-80 overflow-y-auto">
          {loading ? (
            <div className="py-8 text-center text-[12px] text-studio-muted animate-pulse">
              Loading exchange rate history...
            </div>
          ) : history.length === 0 ? (
            <div className="py-8 text-center text-[12px] text-studio-muted">
              No historical rate snapshots recorded yet. Scheduled sync will fetch on 1st, 15th, and Month-End.
            </div>
          ) : (
            history.map((rec) => {
              const obs = rec.observations || [];
              const obs1st = obs.find((o) => o.slot === '1st');
              const obs15th = obs.find((o) => o.slot === '15th');
              const obsEnd = obs.find((o) => o.slot === 'Month-End');
              const isFinalized = (rec.observationsCount || 0) >= 3 || rec.calculationStatus?.includes('Finalized');

              return (
                <div key={rec.id} className="px-4 py-3 grid grid-cols-12 gap-3 text-[12px] items-center hover:bg-studio-hover/40 transition-colors">
                  <div className="col-span-2 flex items-center gap-2 font-semibold text-studio-text">
                    <Calendar className="w-3.5 h-3.5 text-studio-muted" />
                    <span>{rec.effectivePeriod || `${rec.month}/${rec.year}`}</span>
                  </div>

                  <div className="col-span-2 flex items-center gap-1.5 font-mono text-[11.5px] font-bold text-studio-text">
                    <span className="px-1.5 py-0.5 rounded bg-studio-sidebar border border-studio-border">{rec.sourceCurrency}</span>
                    <ArrowRight className="w-3 h-3 text-studio-muted" />
                    <span className="px-1.5 py-0.5 rounded bg-orange-50 border border-orange-200 text-brand-orange">{rec.targetCurrency}</span>
                  </div>

                  <div className="col-span-2 font-mono font-bold text-studio-text">
                    <span className="text-[13px]">{rec.targetCurrency === 'INR' ? `₹${rec.rate.toFixed(2)}` : rec.rate.toFixed(4)}</span>
                    <span className="text-[10px] text-studio-muted block font-sans font-normal">Monthly Average</span>
                  </div>

                  <div className="col-span-4 flex items-center gap-1.5 text-[11px] font-mono flex-wrap">
                    <span className={`px-2 py-0.5 rounded border ${obs1st ? 'bg-slate-50 border-slate-200 text-studio-text font-bold' : 'bg-gray-50 border-dashed border-gray-200 text-gray-400'}`}>
                      1st: {obs1st ? (rec.targetCurrency === 'INR' ? `₹${obs1st.rate.toFixed(2)}` : obs1st.rate.toFixed(2)) : '—'}
                    </span>
                    <span className={`px-2 py-0.5 rounded border ${obs15th ? 'bg-slate-50 border-slate-200 text-studio-text font-bold' : 'bg-gray-50 border-dashed border-gray-200 text-gray-400'}`}>
                      15th: {obs15th ? (rec.targetCurrency === 'INR' ? `₹${obs15th.rate.toFixed(2)}` : obs15th.rate.toFixed(2)) : '—'}
                    </span>
                    <span className={`px-2 py-0.5 rounded border ${obsEnd ? 'bg-slate-50 border-slate-200 text-studio-text font-bold' : 'bg-gray-50 border-dashed border-gray-200 text-gray-400'}`}>
                      End: {obsEnd ? (rec.targetCurrency === 'INR' ? `₹${obsEnd.rate.toFixed(2)}` : obsEnd.rate.toFixed(2)) : '—'}
                    </span>
                  </div>

                  <div className="col-span-2 text-right">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${isFinalized ? 'bg-green-50 border-green-200 text-green-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                      {isFinalized ? <CheckCircle2 className="w-2.5 h-2.5 text-green-600" /> : <Clock className="w-2.5 h-2.5 text-blue-600" />}
                      {rec.calculationStatus || `${obs.length}/3 Synced`}
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
