import { useState, useEffect } from 'react';

export default function UsdRateIndicator() {
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    fetch('/api/billing/rates/current?targetCurrency=INR')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted) return;
        if (Array.isArray(data)) {
          const usdItem = data.find((r: any) => r.sourceCurrency === 'USD');
          if (usdItem && typeof usdItem.rate === 'number') {
            setRate(usdItem.rate);
            return;
          }
        }
        return fetch('/api/billing/rates')
          .then((res) => (res.ok ? res.json() : null))
          .then((fallbackData) => {
            if (!isMounted || !Array.isArray(fallbackData)) return;
            const usdItem = fallbackData.find((r: any) => r.currency === 'USD');
            if (usdItem && typeof usdItem.rateToINR === 'number') {
              setRate(usdItem.rateToINR);
            }
          });
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div
      title="Current System USD Exchange Rate"
      className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-[12.5px] text-slate-700 shadow-xs select-none"
    >
      <span className="text-slate-500 font-medium text-[11.5px] tracking-tight">USD →</span>
      <span className="font-semibold text-slate-900 tracking-tight">
        {loading ? (
          <span className="text-slate-400 animate-pulse">...</span>
        ) : rate !== null ? (
          `₹${rate.toFixed(2)}`
        ) : (
          '₹87.50'
        )}
      </span>
    </div>
  );
}
