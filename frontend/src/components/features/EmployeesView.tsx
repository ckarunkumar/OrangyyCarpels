import { useState, useEffect, useMemo } from 'react';
import { UserRole } from '../ui/Layout';
import { Plus, Mail, Phone, Pencil, CheckCircle2, Shield, FolderGit2 } from 'lucide-react';
import { SkeletonRow } from '../ui/Skeleton';
import { Employee } from '../../types/registry';
import EmployeeDetailDrawer from './EmployeeDetailDrawer';
import EmployeeFormView from './EmployeeFormView';
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

      <div className="w-full space-y-5 animate-in fade-in duration-200">
        {successToast && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-center justify-between text-[12.5px] font-semibold animate-in fade-in shadow-2xs">
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" /><span>{successToast}</span></div>
            <button onClick={() => setSuccessToast(null)} className="text-green-600 hover:text-green-800 text-[11px] font-bold cursor-pointer">Dismiss</button>
          </div>
        )}

        <Breadcrumbs items={[{ label: 'Team' }]} />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-studio-border pb-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-[20px] font-bold tracking-tight text-studio-text">Team</h2>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button type="button" onClick={() => setFilterType('all')} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11.5px] border transition-all cursor-pointer shadow-2xs ${filterType === 'all' ? 'bg-slate-900 text-white border-slate-900 font-bold' : 'bg-white border-studio-border text-studio-text hover:bg-studio-sidebar font-medium'}`}>
                <span>All</span><span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${filterType === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}`}>{counts.total}</span>
              </button>
              <button type="button" onClick={() => setFilterType(filterType === 'Super Admin' ? 'all' : 'Super Admin')} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11.5px] border transition-all cursor-pointer shadow-2xs ${filterType === 'Super Admin' ? 'bg-purple-600 text-white border-purple-700 font-bold' : 'bg-white border-studio-border text-studio-text hover:bg-studio-sidebar font-medium'}`}>
                <span>Super Admin</span><span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${filterType === 'Super Admin' ? 'bg-purple-700 text-white' : 'bg-purple-50 text-purple-700 border border-purple-200'}`}>{counts.sa}</span>
              </button>
              <button type="button" onClick={() => setFilterType(filterType === 'Project Manager' ? 'all' : 'Project Manager')} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11.5px] border transition-all cursor-pointer shadow-2xs ${filterType === 'Project Manager' ? 'bg-blue-600 text-white border-blue-700 font-bold' : 'bg-white border-studio-border text-studio-text hover:bg-studio-sidebar font-medium'}`}>
                <span>Project Manager</span><span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${filterType === 'Project Manager' ? 'bg-blue-700 text-white' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>{counts.pm}</span>
              </button>
              <button type="button" onClick={() => setFilterType(filterType === 'Employee' ? 'all' : 'Employee')} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11.5px] border transition-all cursor-pointer shadow-2xs ${filterType === 'Employee' ? 'bg-slate-700 text-white border-slate-800 font-bold' : 'bg-white border-studio-border text-studio-text hover:bg-studio-sidebar font-medium'}`}>
                <span>Team Members</span><span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${filterType === 'Employee' ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-700 border border-slate-200'}`}>{counts.emp}</span>
              </button>
              <button type="button" onClick={() => setFilterType(filterType === 'Active' ? 'all' : 'Active')} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11.5px] border transition-all cursor-pointer shadow-2xs ${filterType === 'Active' ? 'bg-emerald-600 text-white border-emerald-700 font-bold' : 'bg-white border-studio-border text-studio-text hover:bg-studio-sidebar font-medium'}`}>
                <span>Active</span><span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${filterType === 'Active' ? 'bg-emerald-700 text-white' : 'bg-green-50 text-green-700 border border-green-200'}`}>{counts.active}</span>
              </button>
              <button type="button" onClick={() => setFilterType(filterType === 'Inactive' ? 'all' : 'Inactive')} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11.5px] border transition-all cursor-pointer shadow-2xs ${filterType === 'Inactive' ? 'bg-rose-600 text-white border-rose-700 font-bold' : 'bg-white border-studio-border text-studio-text hover:bg-studio-sidebar font-medium'}`}>
                <span>Inactive</span><span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${filterType === 'Inactive' ? 'bg-rose-700 text-white' : 'bg-gray-50 text-gray-600 border border-gray-200'}`}>{counts.inactive}</span>
              </button>
            </div>
          </div>
          {isAdmin && (
            <button type="button" onClick={() => { setTargetEmployee(null); setFormMode('add'); setViewMode('form'); }} className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-orange text-white rounded-lg text-[12px] font-semibold hover:bg-opacity-90 transition-colors shadow-sm cursor-pointer shrink-0">
              <Plus className="w-4 h-4" /> Add Team Member
            </button>
          )}
        </div>

        {error ? (
          <div className="p-4 border border-red-200 bg-red-50 text-red-700 rounded text-[13px] font-semibold">{error}</div>
        ) : (
          <div className="border border-studio-border rounded-lg bg-white overflow-hidden shadow-sm">
            <div className="bg-studio-sidebar border-b border-studio-border px-5 py-2.5 text-[10px] font-bold text-studio-muted uppercase tracking-wider grid grid-cols-12 gap-3 items-center">
              <div className="col-span-1">Emp ID</div>
              <div className="col-span-2">Name</div>
              <div className="col-span-2">System Role</div>
              <div className="col-span-3">Email</div>
              <div className="col-span-2">Phone</div>
              <div className="col-span-1">Projects</div>
              <div className="col-span-1 text-right">Status</div>
            </div>

            <div className="divide-y divide-studio-border bg-white">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filteredEmployees.length === 0 ? (
                <div className="text-center py-8 text-[12px] text-studio-muted">{searchQuery ? `No team members matching "${searchQuery}"` : 'No team members matching filter.'}</div>
              ) : (
                filteredEmployees.map((emp) => (
                  <div key={emp.employeeId} onClick={() => { setSelectedEmployee(emp); setDetailOpen(true); }} className="group px-5 py-3 grid grid-cols-12 gap-3 text-[12.5px] items-center hover:bg-studio-hover/40 transition-colors cursor-pointer relative">
                    <div className="col-span-1 min-w-0 flex items-center">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-studio-sidebar border border-studio-border text-studio-text inline-block">{emp.employeeId}</span>
                    </div>
                    <div className="col-span-2 min-w-0 pr-2 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-studio-sidebar flex items-center justify-center text-[11px] font-bold text-studio-muted border border-studio-border shrink-0 overflow-hidden">
                        {emp.avatar ? <img src={emp.avatar} alt={emp.fullName} className="w-full h-full object-cover" /> : <span>{emp.fullName[0]}</span>}
                      </div>
                      <p className="font-semibold text-studio-text truncate group-hover:text-brand-orange transition-colors">{emp.fullName}</p>
                    </div>
                    <div className="col-span-2 flex items-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border ${
                        emp.role === 'Super Admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : emp.role === 'Project Manager' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}>
                        <Shield className={`w-2.5 h-2.5 ${emp.role === 'Super Admin' ? 'text-purple-600' : emp.role === 'Project Manager' ? 'text-blue-600' : 'text-slate-500'}`} />
                        {emp.role || 'Employee'}
                      </span>
                    </div>
                    <div className="col-span-3 text-studio-muted flex items-center gap-2 whitespace-nowrap">
                      <Mail className="w-3.5 h-3.5 text-studio-muted shrink-0" />
                      <span className="text-[12px] text-studio-text font-normal">{emp.email}</span>
                    </div>
                    <div className="col-span-2 text-studio-muted flex items-center gap-2 whitespace-nowrap">
                      <Phone className="w-3.5 h-3.5 text-studio-muted shrink-0" />
                      <span className="text-[12px] text-studio-text font-normal">{emp.phone || '-'}</span>
                    </div>
                    <div className="col-span-1 flex items-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border whitespace-nowrap ${
                        (emp.assignedProjectsCount || 0) > 0 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                        <FolderGit2 className={`w-2.5 h-2.5 ${(emp.assignedProjectsCount || 0) > 0 ? 'text-blue-600' : 'text-slate-400'}`} />
                        <span>{(emp.assignedProjectsCount || 0)}</span>
                      </span>
                    </div>
                    <div className="col-span-1 text-right flex items-center justify-end gap-1.5">
                      <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${emp.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>{emp.status}</span>
                      {isAdmin && <button type="button" onClick={(e) => { e.stopPropagation(); handleOpenEdit(emp); }} title="Edit Employee" className="opacity-0 group-hover:opacity-100 p-1 hover:bg-studio-sidebar rounded text-studio-muted hover:text-brand-orange cursor-pointer transition-opacity"><Pencil className="w-3.5 h-3.5" /></button>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
