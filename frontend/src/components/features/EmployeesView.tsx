import { useState, useEffect } from 'react';
import { UserRole } from '../ui/Layout';
import { Plus, Mail, Phone, Pencil, CheckCircle2, Shield, FolderGit2 } from 'lucide-react';
import { SkeletonRow } from '../ui/Skeleton';
import { Employee } from './EmployeeDrawer';
import EmployeeDetailDrawer from './EmployeeDetailDrawer';
import EmployeeFormView from './EmployeeFormView';
import Breadcrumbs from '../ui/Breadcrumbs';

export default function EmployeesView({ activeRole }: { activeRole: UserRole }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [targetEmployee, setTargetEmployee] = useState<Employee | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fetchEmployees = () => {
    setLoading(true);
    fetch('/api/employees')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch employees list');
        return res.json();
      })
      .then((data) => { setEmployees(data || []); setError(null); })
      .catch((err) => { setError(err.message); setEmployees([]); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEmployees(); }, [activeRole]);

  const isAdmin = activeRole === 'Super Admin';

  const handleOpenEdit = (emp: Employee) => {
    setSelectedEmployee(null); setDetailOpen(false);
    setTargetEmployee(emp); setFormMode('edit'); setViewMode('form');
  };

  const handleOpenAdd = () => {
    setTargetEmployee(null); setFormMode('add'); setViewMode('form');
  };

  const handleSaved = (msg?: string) => {
    setViewMode('list');
    if (msg) {
      setSuccessToast(msg);
      setTimeout(() => setSuccessToast(null), 5000);
    }
    fetchEmployees();
  };

  if (viewMode === 'form') {
    return (
      <EmployeeFormView
        mode={formMode}
        employee={formMode === 'edit' ? targetEmployee : null}
        onBack={() => setViewMode('list')}
        onSaved={handleSaved}
      />
    );
  }

  return (
    <>
      <EmployeeDetailDrawer open={detailOpen} employee={selectedEmployee} isAdmin={isAdmin} onClose={() => setDetailOpen(false)} onEdit={handleOpenEdit} />

      <div className="w-full space-y-5 animate-in fade-in duration-200">
        {successToast && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-center justify-between text-[12.5px] font-semibold animate-in fade-in slide-in-from-top-1 shadow-2xs">
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" /><span>{successToast}</span></div>
            <button onClick={() => setSuccessToast(null)} className="text-green-600 hover:text-green-800 text-[11px] font-bold cursor-pointer">Dismiss</button>
          </div>
        )}

        <Breadcrumbs items={[{ label: 'Team' }]} />
        <div className="flex justify-between items-center border-b border-studio-border pb-3">
          <div><h2 className="text-[20px] font-bold tracking-tight text-studio-text">Team</h2><p className="text-[12px] text-studio-muted">Manage studio team members, contact details, and assigned projects</p></div>
          {isAdmin && (
            <button type="button" onClick={handleOpenAdd} className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-orange text-white rounded text-[12px] font-semibold hover:bg-opacity-90 transition-colors shadow-sm cursor-pointer">
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
              <div className="col-span-3">Name</div>
              <div className="col-span-2">System Role</div>
              <div className="col-span-2">Email</div>
              <div className="col-span-1">Phone</div>
              <div className="col-span-2">Project's</div>
              <div className="col-span-1 text-right">Status</div>
            </div>

            <div className="divide-y divide-studio-border bg-white">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
              ) : employees.length === 0 ? (
                <div className="text-center py-8 text-[12px] text-studio-muted">No employees registered.</div>
              ) : (
                employees.map((emp) => (
                  <div key={emp.employeeId} onClick={() => { setSelectedEmployee(emp); setDetailOpen(true); }} className="group px-5 py-3 grid grid-cols-12 gap-3 text-[12.5px] items-center hover:bg-studio-hover/40 transition-colors cursor-pointer relative">
                    <div className="col-span-1"><span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-studio-sidebar border border-studio-border text-studio-text">{emp.employeeId}</span></div>
                    <div className="col-span-3 min-w-0 pr-1 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-studio-sidebar flex items-center justify-center text-[11px] font-bold text-studio-muted border border-studio-border shrink-0 overflow-hidden">
                        {emp.avatar ? <img src={emp.avatar} alt={emp.fullName} className="w-full h-full object-cover" /> : <span>{emp.fullName[0]}</span>}
                      </div>
                      <p className="font-semibold text-studio-text truncate group-hover:text-brand-orange transition-colors">{emp.fullName}</p>
                    </div>
                    <div className="col-span-2">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border ${
                        emp.role === 'Super Admin'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : emp.role === 'Project Manager'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}>
                        <Shield className={`w-2.5 h-2.5 ${emp.role === 'Super Admin' ? 'text-purple-600' : emp.role === 'Project Manager' ? 'text-blue-600' : 'text-slate-500'}`} />
                        {emp.role || 'Employee'}
                      </span>
                    </div>
                    <div className="col-span-2 text-studio-muted truncate flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-studio-muted shrink-0" /><span className="truncate">{emp.email}</span></div>
                    <div className="col-span-1 text-studio-muted truncate flex items-center gap-1"><Phone className="w-3 h-3 text-studio-muted shrink-0" /><span className="truncate text-[11px]">{emp.phone}</span></div>
                    <div className="col-span-2">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded border ${
                        (emp.assignedProjectsCount || 0) > 0
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                        <FolderGit2 className={`w-3 h-3 ${(emp.assignedProjectsCount || 0) > 0 ? 'text-blue-600' : 'text-slate-400'}`} />
                        {(emp.assignedProjectsCount || 0)} {(emp.assignedProjectsCount || 0) === 1 ? 'Project' : 'Projects'}
                      </span>
                    </div>
                    <div className="col-span-1 text-right flex items-center justify-end gap-1.5">
                      {isAdmin && <button type="button" onClick={(e) => { e.stopPropagation(); handleOpenEdit(emp); }} title="Edit Employee" className="opacity-0 group-hover:opacity-100 p-1 hover:bg-studio-sidebar rounded text-studio-muted hover:text-brand-orange cursor-pointer transition-opacity"><Pencil className="w-3.5 h-3.5" /></button>}
                      <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${emp.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>{emp.status}</span>
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
