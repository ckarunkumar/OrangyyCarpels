import { useState, useEffect } from 'react';
import OperationalStandardsForm from './OperationalStandardsForm';
import CurrencyBillingDefaultsForm from './CurrencyBillingDefaultsForm';

export default function ConfigurationsView() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfigs = () => {
    setLoading(true);
    fetch('/api/settings/configurations')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load configurations');
        return res.json();
      })
      .then((data) => setConfig(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-studio-border rounded-xl p-8 text-center text-studio-muted text-[12.5px] animate-pulse">
        Loading system configurations...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-[12.5px] font-medium">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Operational Standards & Workflow */}
      <OperationalStandardsForm
        initialCapacity={config?.operational?.standardCapacity}
        initialTimezone={config?.operational?.timezone}
        initialWorkflow={config?.operational?.approvalWorkflow}
        onSaved={fetchConfigs}
      />

      {/* 2. Currency & Billing Defaults (with FX Sync and History) */}
      <CurrencyBillingDefaultsForm
        initialCurrency={config?.currencyBilling?.defaultCurrency}
        initialDueTime={config?.currencyBilling?.defaultPaymentTerms}
        initialBillingType={config?.currencyBilling?.defaultBillingType}
        onSaved={fetchConfigs}
      />
    </div>
  );
}
