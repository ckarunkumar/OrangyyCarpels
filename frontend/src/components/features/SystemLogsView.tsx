import { useState, useEffect, useCallback, useMemo } from 'react';
import SystemLogsMapModal from './SystemLogsMapModal';
import { LoginLogItem } from './SystemLogsRow';
import SystemLogsControlsHeader from './SystemLogsControlsHeader';
import SystemAuditLogsTable from './SystemAuditLogsTable';
import EmployeeLoginsInfoTable from './EmployeeLoginsInfoTable';
import EmployeeDetailDrawer from './EmployeeDetailDrawer';
import EmployeeFormView from './EmployeeFormView';
import { useSearch } from '../../context/SearchContext';
import { useAuth } from '../../context/AuthContext';
import { Employee } from '../../types/registry';

export default function SystemLogsView() {
  const { role } = useAuth();
  const { searchQuery, setSearchPlaceholder } = useSearch();
  const [activeTab, setActiveTab] = useState<'employees' | 'audit'>('employees');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [empLoading, setEmpLoading] = useState(true);
  const [empFilter, setEmpFilter] = useState<'all' | 'Active' | 'Inactive'>('Active');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [targetEmployee, setTargetEmployee] = useState<Employee | null>(null);

  const [logs, setLogs] = useState<LoginLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedMapLog, setSelectedMapLog] = useState<LoginLogItem | null>(null);

  const isAdmin = role === 'Super Admin';

  useEffect(() => {
    setSearchPlaceholder(
      activeTab === 'employees'
        ? 'Search employee logins (name, Emp ID, email, role)...'
        : 'Search system logs (user, email, IP, city, OS, device)...'
    );
  }, [activeTab, setSearchPlaceholder]);

  const fetchEmployees = useCallback(() => {
    setEmpLoading(true);
    fetch('/api/employees')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setEmployees(data || []))
      .catch(() => setEmployees([]))
      .finally(() => setEmpLoading(false));
  }, []);

  const fetchLogs = useCallback(async (targetPage = 1, query = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: targetPage.toString(),
        limit: '25',
        ...(query ? { search: query } : {}),
      });
      const res = await fetch(`/api/logs/logins?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch logs');
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setPage(data.page || 1);
      setTotalPages(data.totalPages || 1);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchLogs(page, searchQuery);
    }
  }, [activeTab, page, searchQuery, fetchLogs]);

  const counts = useMemo(() => ({
    total: employees.length,
    active: employees.filter((e) => e.status === 'Active').length,
    inactive: employees.filter((e) => e.status === 'Inactive').length,
  }), [employees]);

  const filteredEmployees = employees.filter((emp) => {
    if (empFilter === 'Active' && emp.status !== 'Active') return false;
    if (empFilter === 'Inactive' && emp.status !== 'Inactive') return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      emp.employeeId.toLowerCase().includes(q) ||
      emp.fullName.toLowerCase().includes(q) ||
      (emp.email && emp.email.toLowerCase().includes(q)) ||
      (emp.phone && emp.phone.toLowerCase().includes(q))
    );
  });

  const handleOpenEdit = (emp: Employee) => {
    if (!isAdmin) return;
    setSelectedEmployee(null);
    setDetailOpen(false);
    setTargetEmployee(emp);
    setViewMode('form');
  };

  if (viewMode === 'form' && isAdmin) {
    return (
      <EmployeeFormView
        mode="edit"
        employee={targetEmployee}
        onBack={() => setViewMode('list')}
        onSaved={() => {
          setViewMode('list');
          fetchEmployees();
        }}
      />
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <EmployeeDetailDrawer
        open={detailOpen}
        employee={selectedEmployee}
        isAdmin={isAdmin}
        onClose={() => setDetailOpen(false)}
        onEdit={handleOpenEdit}
      />

      <SystemLogsMapModal
        isOpen={Boolean(selectedMapLog)}
        onClose={() => setSelectedMapLog(null)}
        locationInfo={
          selectedMapLog
            ? {
                city: selectedMapLog.city,
                region: selectedMapLog.region,
                country: selectedMapLog.country,
                latitude: selectedMapLog.latitude,
                longitude: selectedMapLog.longitude,
                ipAddress: selectedMapLog.ipAddress,
                userName: selectedMapLog.fullName,
              }
            : null
        }
      />

      <SystemLogsControlsHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        empFilter={empFilter}
        onEmpFilterChange={setEmpFilter}
        counts={counts}
        totalAuditLogs={total}
        loading={loading}
        onRefreshAudit={() => fetchLogs(page, searchQuery)}
      />

      {activeTab === 'employees' ? (
        <EmployeeLoginsInfoTable
          employees={filteredEmployees}
          loading={empLoading}
          isAdmin={isAdmin}
          searchQuery={searchQuery}
          onEdit={isAdmin ? handleOpenEdit : undefined}
        />
      ) : (
        <SystemAuditLogsTable
          logs={logs}
          loading={loading}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          onOpenMap={setSelectedMapLog}
        />
      )}
    </div>
  );
}
