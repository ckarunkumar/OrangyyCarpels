import { useState, useEffect, useCallback } from 'react';
import PmDashboardKpiCards from './PmDashboardKpiCards';
import PmStudioClientTable, { PmClientRowData } from './PmStudioClientTable';
import PmClientProjectsTable, { PmProjectRowData } from './PmClientProjectsTable';
import PmDashboardFilterHeader from './PmDashboardFilterHeader';

import { getCurrentFiscalYear, getAvailableFiscalYears } from '../../../utils/dateUtils';

interface PmOverviewData {
  tmHours: number;
  retainerHours: number;
  fixedHours: number;
  totalHours: number;
  activeProjectsCount: number;
  selectedFY: string;
  fromDate?: string;
  toDate?: string;
  hasDateFilter: boolean;
  clients: PmClientRowData[];
  projects: PmProjectRowData[];
}

export default function PmDashboardView() {
  const availableFYs = getAvailableFiscalYears(2, 0);
  const [data, setData] = useState<PmOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFY, setSelectedFY] = useState(getCurrentFiscalYear());
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedClient, setSelectedClient] = useState<PmClientRowData | null>(null);

  const fetchPmDashboard = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ fy: selectedFY });
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);
    if (selectedClient) params.append('clientId', selectedClient.clientId);

    fetch(`/api/timesheets/summary?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((resData) => {
        if (resData) setData(resData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedFY, fromDate, toDate, selectedClient]);

  useEffect(() => {
    fetchPmDashboard();
  }, [fetchPmDashboard]);

  return (
    <div className="w-full space-y-6">
      <PmDashboardFilterHeader
        title={selectedClient ? selectedClient.clientName : 'Studio Dashboard'}
        isDrilldown={!!selectedClient}
        onBackToStudio={() => setSelectedClient(null)}
        selectedFY={selectedFY}
        onChangeFY={setSelectedFY}
        fromDate={fromDate}
        toDate={toDate}
        onApplyDateRange={(from, to) => {
          setFromDate(from);
          setToDate(to);
        }}
        onClearDateRange={() => {
          setFromDate('');
          setToDate('');
        }}
        availableFYs={availableFYs}
      />

      <PmDashboardKpiCards
        tmHours={data?.tmHours || 0}
        retainerHours={data?.retainerHours || 0}
        fixedHours={data?.fixedHours || 0}
        totalHours={data?.totalHours || 0}
      />

      {selectedClient ? (
        <PmClientProjectsTable
          projects={data?.projects || []}
          loading={loading}
        />
      ) : (
        <PmStudioClientTable
          clients={data?.clients || []}
          loading={loading}
          onSelectClient={(client) => setSelectedClient(client)}
        />
      )}
    </div>
  );
}
