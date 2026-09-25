import { Mail, Phone, Pencil, Shield, FolderGit2, Trash2 } from 'lucide-react';
import { Employee } from '../../types/registry';

interface EmployeeTableRowProps {
  emp: Employee;
  isAdmin: boolean;
  onSelect: (emp: Employee) => void;
  onEdit: (emp: Employee) => void;
  onDelete: (emp: Employee) => void;
}

export default function EmployeeTableRow({
  emp,
  isAdmin,
  onSelect,
  onEdit,
  onDelete,
}: EmployeeTableRowProps) {
  return (
    <div
      onClick={() => onSelect(emp)}
      className="group px-5 py-3 grid grid-cols-12 gap-3 text-[12.5px] items-center hover:bg-studio-hover/40 transition-colors cursor-pointer relative"
    >
      <div className="col-span-1 min-w-0 flex items-center">
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-studio-sidebar border border-studio-border text-studio-text inline-block">
          {emp.employeeId}
        </span>
      </div>

      <div className="col-span-2 min-w-0 pr-2 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-studio-sidebar flex items-center justify-center text-[11px] font-bold text-studio-muted border border-studio-border shrink-0 overflow-hidden">
          {emp.avatar ? (
            <img src={emp.avatar} alt={emp.fullName} className="w-full h-full object-cover" />
          ) : (
            <span>{emp.fullName[0]}</span>
          )}
        </div>
        <p className="font-semibold text-studio-text truncate group-hover:text-brand-orange transition-colors">
          {emp.fullName}
        </p>
      </div>

      <div className="col-span-2 flex items-center">
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border ${
            emp.role === 'Super Admin'
              ? 'bg-purple-50 text-purple-700 border-purple-200'
              : emp.role === 'Project Manager'
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-slate-50 text-slate-700 border-slate-200'
          }`}
        >
          <Shield
            className={`w-2.5 h-2.5 ${
              emp.role === 'Super Admin'
                ? 'text-purple-600'
                : emp.role === 'Project Manager'
                ? 'text-blue-600'
                : 'text-slate-500'
            }`}
          />
          {emp.role || 'Employee'}
        </span>
      </div>

      <div className="col-span-2 text-studio-muted flex items-center gap-2 whitespace-nowrap min-w-0">
        <Mail className="w-3.5 h-3.5 text-studio-muted shrink-0" />
        <span className="text-[12px] text-studio-text font-normal truncate">{emp.email}</span>
      </div>

      <div className="col-span-2 text-studio-muted flex items-center gap-2 whitespace-nowrap min-w-0">
        <Phone className="w-3.5 h-3.5 text-studio-muted shrink-0" />
        <span className="text-[12px] text-studio-text font-normal truncate">{emp.phone || '-'}</span>
      </div>

      <div className="col-span-1 flex items-center">
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border whitespace-nowrap ${
            (emp.assignedProjectsCount || 0) > 0
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-slate-50 text-slate-600 border-slate-200'
          }`}
        >
          <FolderGit2
            className={`w-2.5 h-2.5 ${
              (emp.assignedProjectsCount || 0) > 0 ? 'text-blue-600' : 'text-slate-400'
            }`}
          />
          <span>{emp.assignedProjectsCount || 0}</span>
        </span>
      </div>

      <div className="col-span-1 flex items-center">
        <span
          className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
            emp.status === 'Active'
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-gray-50 text-gray-500 border-gray-200'
          }`}
        >
          {emp.status}
        </span>
      </div>

      <div
        className="col-span-1 text-right flex items-center justify-end gap-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        {isAdmin && (
          <>
            <button
              type="button"
              onClick={() => onEdit(emp)}
              title="Edit Team Member"
              className="p-1.5 text-studio-muted hover:text-brand-orange hover:bg-orange-50 rounded transition-colors cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(emp)}
              title="Delete Team Member"
              className="p-1.5 text-studio-muted hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
