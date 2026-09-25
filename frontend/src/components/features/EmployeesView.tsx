import { useState, useEffect, useMemo } from 'react';
import { UserRole } from '../ui/Layout';
import { Plus, CheckCircle2 } from 'lucide-react';
import { Employee } from '../../types/registry';
import EmployeeDetailDrawer from './EmployeeDetailDrawer';
import EmployeeFormView from './EmployeeFormView';
import EmployeeTable from './EmployeeTable';
import DeleteConfirmModal from '../ui/DeleteConfirmModal';
import Breadcrumbs from '../ui/Breadcrumbs';
import { useSearch } from '../../context/SearchContext';

type TeamFilterType = 'all' | 'Super Admin' | 'Project Manager' | 'Employee' | 'Active' | 'Inactive';

export default function EmployeesView({ activeRole }: { activeRole: UserRole }) {
  const { searchQuery, setSearchPlaceholder } = useSearch();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [filterType, setFilterType] = useState<TeamFilterType>('all');
  const [detailOpen, setDetailOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [targetEmployee, setTargetEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    setSearchPlaceholder('Search team members (name, Emp ID, email, role)...');
  }, [setSearchPlaceholder]);

  const fetchEmployees = () => {
    setLoading(true);
    fetch('/api/employees')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => { setEmployees(data || []); setError(null); })
      .catch((err) => { setError(err.message); setEmployees([]); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEmployees(); }, [activeRole]);

  const isAdmin = activeRole === 'Super Admin';

  const counts = useMemo(() => {
    const total = employees.length;
    const sa = employees.filter((e) => e.role === 'Super Admin').length;
    const pm = employees.filter((e) => e.role === 'Project Manager').length;
    const emp = employees.filter((e) => e.role === 'Employee' || !e.role).length;
    const active = employees.filter((e) => e.status === 'Active').length;
    const inactive = employees.filter((e) => e.status === 'Inactive').length;
    return { total, sa, pm, emp, active, inactive };
  }, [employees]);

  const handleOpenEdit = (emp: Employee) => {
    setSelectedEmployee(null); setDetailOpen(false);
    setTargetEmployee(emp); setFormMode('edit'); setViewMode('form');
  };

  const handleSaved = (msg?: string) => {
    setViewMode('list');
    if (msg) { setSuccessToast(msg); setTimeout(() => setSuccessToast(null), 5000); }
    fetchEmployees();
  };

  const confirmDelete = async () => {
    if (!deletingEmployee) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/employees/${deletingEmployee.employeeId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete team member');
      setSuccessToast(`Team member "${deletingEmployee.fullName}" deleted successfully.`);
      setDeletingEmployee(null);
      fetchEmployees();
      setTimeout(() => setSuccessToast(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Error deleting team member');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    if (filterType === 'Super Admin' && emp.role !== 'Super Admin') return false;
    if (filterType === 'Project Manager' && emp.role !== 'Project Manager') return false;
    if (filterType === 'Employee' && emp.role !== 'Employee' && emp.role) return false;
    if (filterType === 'Active' && emp.status !== 'Active') return false;
    if (filterType === 'Inactive' && emp.status !== 'Inactive') return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return emp.employeeId.toLowerCase().includes(q) || emp.fullName.toLowerCase().includes(q) || (emp.email && emp.email.toLowerCase().includes(q)) || (emp.phone && emp.phone.toLowerCase().includes(q));
  });

  if (viewMode === 'form') {
    return <EmployeeFormView mode={formMode} employee={formMode === 'edit' ? targetEmployee : null} onBack={() => setViewMode('list')} onSaved={handleSaved} />;
  }

  return (
    <>
      <EmployeeDetailDrawer open={detailOpen} employee={selectedEmployee} isAdmin={isAdmin} onClose={() => setDetailOpen(false)} onEdit={handleOpenEdit} />
      <DeleteConfirmModal
        open={!!deletingEmployee}
        title="Delete Team Member"
        description={
          deletingEmployee ? (
            <p>
              Are you sure you want to delete team member <span className="font-bold text-studio-text">{deletingEmployee.fullName}</span> ({deletingEmployee.employeeId})? This action cannot be undone.
            </p>
          ) : null
        }
        confirmLabel="Delete Member"
        isDeleting={isDeleting}
        onCancel={() => setDeletingEmployee(null)}
        onConfirm={confirmDelete}
      />

      <div className="w-full space-y-5 animate-in fade-in duration-200">
        {successToast && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-center justify-between text-[12.5px] font-semibold animate-in fade-in shadow-2xs">
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" /><span>{successToast}</span></div>
            <button onClick={() => setSuccessToast(null)} className="text-green-600 hover:text-green-800 text-[11px] font-bold cursor-pointer">Dismiss</button>
          </div>
        )}

        <Breadcrumbs items={[{ label: 'Team' }]} />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-studio-border pb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-[20px] font-bold tracking-tight text-studio-text">Team</h2>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button type="button" onClick={() => setFilterType('all')} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11.5px] border transition-all cursor-pointer shadow-2xs ${filterType === 'all' ? 'bg-white text-studio-text border-slate-300 font-bold' : 'bg-studio-sidebar/60 border-studio-border text-studio-muted hover:text-studio-text hover:bg-studio-sidebar font-medium'}`}>
                <span>All</span><span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700">{counts.total}</span>
              </button>
              <button type="button" onClick={() => setFilterType(filterType === 'Super Admin' ? 'all' : 'Super Admin')} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11.5px] border transition-all cursor-pointer shadow-2xs ${filterType === 'Super Admin' ? 'bg-white text-studio-text border-slate-300 font-bold' : 'bg-studio-sidebar/60 border-studio-border text-studio-muted hover:text-studio-text hover:bg-studio-sidebar font-medium'}`}>
                <span>Super Admin</span><span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700">{counts.sa}</span>
              </button>
              <button type="button" onClick={() => setFilterType(filterType === 'Project Manager' ? 'all' : 'Project Manager')} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11.5px] border transition-all cursor-pointer shadow-2xs ${filterType === 'Project Manager' ? 'bg-white text-studio-text border-slate-300 font-bold' : 'bg-studio-sidebar/60 border-studio-border text-studio-muted hover:text-studio-text hover:bg-studio-sidebar font-medium'}`}>
                <span>Project Manager</span><span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700">{counts.pm}</span>
              </button>
              <button type="button" onClick={() => setFilterType(filterType === 'Employee' ? 'all' : 'Employee')} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11.5px] border transition-all cursor-pointer shadow-2xs ${filterType === 'Employee' ? 'bg-white text-studio-text border-slate-300 font-bold' : 'bg-studio-sidebar/60 border-studio-border text-studio-muted hover:text-studio-text hover:bg-studio-sidebar font-medium'}`}>
                <span>Team Members</span><span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700">{counts.emp}</span>
              </button>
              <button type="button" onClick={() => setFilterType(filterType === 'Active' ? 'all' : 'Active')} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11.5px] border transition-all cursor-pointer shadow-2xs ${filterType === 'Active' ? 'bg-white text-studio-text border-slate-300 font-bold' : 'bg-studio-sidebar/60 border-studio-border text-studio-muted hover:text-studio-text hover:bg-studio-sidebar font-medium'}`}>
                <span>Active</span><span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700">{counts.active}</span>
              </button>
              <button type="button" onClick={() => setFilterType(filterType === 'Inactive' ? 'all' : 'Inactive')} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11.5px] border transition-all cursor-pointer shadow-2xs ${filterType === 'Inactive' ? 'bg-white text-studio-text border-slate-300 font-bold' : 'bg-studio-sidebar/60 border-studio-border text-studio-muted hover:text-studio-text hover:bg-studio-sidebar font-medium'}`}>
                <span>Inactive</span><span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700">{counts.inactive}</span>
              </button>
            </div>
            {isAdmin && (
              <button type="button" onClick={() => { setTargetEmployee(null); setFormMode('add'); setViewMode('form'); }} className="flex items-center gap-1.5 px-4 py-2 bg-brand-orange text-white rounded-lg text-[12px] font-bold hover:bg-opacity-90 transition-colors shadow-sm cursor-pointer shrink-0">
                <Plus className="w-4 h-4" /> Add Team Member
              </button>
            )}
          </div>
        </div>

        {error ? (
          <div className="p-4 border border-red-200 bg-red-50 text-red-700 rounded text-[13px] font-semibold">{error}</div>
        ) : (
          <EmployeeTable
            loading={loading}
            employees={filteredEmployees}
            isAdmin={isAdmin}
            searchQuery={searchQuery}
            onSelect={(emp) => { setSelectedEmployee(emp); setDetailOpen(true); }}
            onEdit={handleOpenEdit}
            onDelete={(emp) => setDeletingEmployee(emp)}
          />
        )}
      </div>
    </>
  );
}
