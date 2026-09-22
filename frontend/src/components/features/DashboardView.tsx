import { useState, useEffect, useCallback } from 'react';
import { UserRole } from '../ui/Layout';
import Breadcrumbs from '../ui/Breadcrumbs';
import DashboardKpiCards from './dashboard/DashboardKpiCards';
import StudioClientTable, { ClientRowData } from './dashboard/StudioClientTable';
import ClientProjectsTable, { ProjectRowData } from './dashboard/ClientProjectsTable';
import DashboardFilterHeader from './dashboard/DashboardFilterHeader';
import RateHistoryDrawer from './RateHistoryDrawer';
import PmDashboardView from './dashboard/PmDashboardView';
import EmployeeDashboardView from './dashboard/EmployeeDashboardView';
import ClientDashboardView from './ClientDashboardView';

import { getCurrentFiscalYear, getCurrentMonthShort, getAvailableFiscalYears } from '../../utils/dateUtils';

interface BillingOverview {
  totalRevenueINR: number;
  tmRevenueINR: number;
  monthlyFixedRevenueINR: number;
  projectFixedRevenueINR: number;
  totalHoursLogged: number;
  activeProjectsCount: number;
  activeMonthYear: string;
  periodType: string;
  selectedMonth: string;
  selectedFY: string;
  clients: ClientRowData[];
  projects: ProjectRowData[];
}

export default function DashboardView({ activeRole }: { activeRole: UserRole }) {
  const availableFYs = getAvailableFiscalYears(2, 0);
  const [data, setData] = useState<BillingOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodType, setPeriodType] = useState<'yearly' | 'monthly'>('monthly');
  const [selectedFY, setSelectedFY] = useState(getCurrentFiscalYear());
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthShort());
  const [selectedClient, setSelectedClient] = useState<ClientRowData | null>(null);
  const [historyProj, setHistoryProj] = useState<ProjectRowData | null>(null);

  const fetchDashboard = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      fy: selectedFY,
      month: selectedMonth,
      periodType,
    });
    if (selectedClient) {
      params.append('clientId', selectedClient.clientId);
    }

    fetch(`/api/billing/summary?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((resData) => {
        if (resData) setData(resData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedFY, selectedMonth, periodType, selectedClient]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard, activeRole]);

  const handleSelectClient = (client: ClientRowData) => {
    setSelectedClient(client);
  };

  const handleBackToStudio = () => {
    setSelectedClient(null);
  };

  if (activeRole === 'Project Manager') {
    return <PmDashboardView />;
  }

  if (activeRole === 'Employee') {
    return <EmployeeDashboardView />;
  }

  if (activeRole === 'Client') {
    return <ClientDashboardView />;
  }

  const handleFYChange = (newFY: string) => {
    setSelectedFY(newFY);
    const startYear = parseInt((newFY.match(/\d{4}/) || ['2026'])[0], 10);
    const monthShort = (selectedMonth.split(' ')[0]) || 'Apr';
    const isQ4 = ['Jan', 'Feb', 'Mar'].includes(monthShort);
    const newMonthYear = isQ4 ? startYear + 1 : startYear;
    setSelectedMonth(`${monthShort} ${newMonthYear}`);
  };

  return (
    <>
      <RateHistoryDrawer
        open={!!historyProj}
        projectId={historyProj?.projectId || ''}
        projectName={historyProj?.projectName || ''}
        clientCurrency={historyProj?.currency || 'USD ($)'}
        currentBillingType={historyProj?.billingType || 'Hourly Rate (T&M)'}
        isAdmin={activeRole === 'Super Admin'}
        onClose={() => setHistoryProj(null)}
        onSaved={fetchDashboard}
      />

      <div className="w-full space-y-6">
        <Breadcrumbs
          items={
            selectedClient
              ? [{ label: 'Studio Dashboard', onClick: handleBackToStudio }, { label: selectedClient.clientName }]
              : [{ label: 'Studio Dashboard' }]
          }
        />

        <DashboardFilterHeader
          title={selectedClient ? selectedClient.clientName : 'Studio Dashboard'}
          isDrilldown={!!selectedClient}
          onBackToStudio={handleBackToStudio}
          periodType={periodType}
          onChangePeriodType={setPeriodType}
          selectedFY={selectedFY}
          onChangeFY={handleFYChange}
          selectedMonth={selectedMonth}
          onChangeMonth={setSelectedMonth}
          availableFYs={availableFYs}
        />

        <DashboardKpiCards
          hourlyRevenueINR={data?.tmRevenueINR || 0}
          billableHours={data?.totalHoursLogged || 0}
          monthlyRetainersINR={data?.monthlyFixedRevenueINR || 0}
          fixedProjectsINR={data?.projectFixedRevenueINR || 0}
          activeProjectsCount={data?.activeProjectsCount || 0}
          totalRevenueINR={data?.totalRevenueINR || 0}
          isClientView={!!selectedClient}
        />

        {selectedClient ? (
          <ClientProjectsTable
            projects={data?.projects || []}
            loading={loading}
            onOpenRateHistory={(proj) => setHistoryProj(proj)}
          />
        ) : (
          <StudioClientTable
            clients={data?.clients || []}
            loading={loading}
            onSelectClient={handleSelectClient}
          />
        )}
      </div>
    </>
  );
}
