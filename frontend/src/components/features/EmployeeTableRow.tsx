import { useState } from 'react';
import { Pencil, Shield, FolderGit2, Clock, Eye, EyeOff } from 'lucide-react';
import { Employee } from '../../types/registry';
import { maskEmail, maskPhone } from '../../utils/maskUtils';

interface EmployeeTableRowProps {
  emp: Employee;
  isAdmin: boolean;
  onSelect: (emp: Employee) => void;
  onEdit: (emp: Employee) => void;
}

export default function EmployeeTableRow({
  emp,
  isAdmin,
  onSelect,
  onEdit,
}: EmployeeTableRowProps) {
  const [showEmail, setShowEmail] = useState(false);
  const [showPhone, setShowPhone] = useState(false);

  const formatLoginTime = (timeStr?: string | null) => {
    if (!timeStr) return '—';
    try {
      const d = new Date(timeStr);
      if (isNaN(d.getTime())) return '—';
      const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      return `${date}, ${time}`;
    } catch {
      return '—';
    }
  };

  return (
    <div
      onClick={() => onSelect(emp)}
      className="group grid grid-cols-12 gap-3 px-5 py-3.5 items-center hover:bg-studio-hover/40 transition-colors cursor-pointer text-[12.5px] relative"
    >
      {/* 1. Employee ID (Green for Active, Red for Inactive) */}
      <div className="col-span-1 min-w-[70px] flex items-center">
        <span
          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border inline-block transition-colors cursor-pointer ${
            emp.status === 'Active'
              ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:border-green-300'
              : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:border-red-300'
          }`}
        >
          {emp.employeeId}
        </span>
      </div>

      {/* 2. Name */}
      <div className="col-span-3 min-w-0 pr-2 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-bold text-slate-600 border border-slate-200 shrink-0 overflow-hidden">
          {emp.avatar ? (
            <img src={emp.avatar} alt={emp.fullName} className="w-full h-full object-cover" />
          ) : (
            <span>{emp.fullName[0]}</span>
          )}
        </div>
        <p className="font-semibold text-slate-800 truncate group-hover:text-brand-orange transition-colors">
          {emp.fullName}
        </p>
      </div>

      {/* 3. System Role */}
      <div className="col-span-2 flex items-center min-w-0">
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border truncate ${
            emp.role === 'Super Admin'
              ? 'bg-purple-50 text-purple-700 border-purple-200'
              : emp.role === 'Project Manager'
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-slate-50 text-slate-700 border-slate-200'
          }`}
        >
          <Shield
            className={`w-2.5 h-2.5 shrink-0 ${
              emp.role === 'Super Admin'
                ? 'text-purple-600'
                : emp.role === 'Project Manager'
                ? 'text-blue-600'
                : 'text-slate-500'
            }`}
          />
          <span className="truncate">{emp.role || 'Employee'}</span>
        </span>
      </div>

      {/* 4. Email ID with eye mask (no email icon, no copy button) */}
      <div className="col-span-2 text-slate-600 flex items-center gap-1.5 whitespace-nowrap min-w-0">
        <span className="text-[12px] text-slate-700 truncate" title={showEmail ? emp.email : 'Click eye icon to reveal'}>
          {showEmail ? emp.email : maskEmail(emp.email)}
        </span>
        {emp.email && emp.email !== '-' && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowEmail(!showEmail);
            }}
            title={showEmail ? 'Hide Email' : 'Reveal Email'}
            className="p-0.5 text-slate-400 hover:text-brand-orange rounded transition-colors shrink-0 cursor-pointer"
          >
            {showEmail ? <EyeOff className="w-3.5 h-3.5 text-brand-orange" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* 5. Phone Number with eye mask (no phone icon, no copy button) */}
      <div className="col-span-2 text-slate-600 flex items-center gap-1.5 whitespace-nowrap min-w-0">
        <span className="text-[12px] text-slate-700 truncate" title={showPhone ? (emp.phone || '—') : 'Click eye icon to reveal'}>
          {showPhone ? (emp.phone || '—') : maskPhone(emp.phone)}
        </span>
        {emp.phone && emp.phone !== '-' && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowPhone(!showPhone);
            }}
            title={showPhone ? 'Hide Phone' : 'Reveal Phone'}
            className="p-0.5 text-slate-400 hover:text-brand-orange rounded transition-colors shrink-0 cursor-pointer"
          >
            {showPhone ? <EyeOff className="w-3.5 h-3.5 text-brand-orange" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* 6. Projects Count */}
      <div className="col-span-1 flex items-center min-w-0">
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

      {/* 7. Login Time & Hover Edit Action */}
      <div className="col-span-1 flex items-center justify-between min-w-0 gap-1 text-slate-600 text-[11.5px]">
        <span className="truncate flex items-center gap-1 text-slate-500 font-mono text-[11px]" title={emp.loginTime ? formatLoginTime(emp.loginTime) : 'Never logged in'}>
          <Clock className="w-2.5 h-2.5 text-slate-400 shrink-0" />
          <span className="truncate">{formatLoginTime(emp.loginTime)}</span>
        </span>

        {isAdmin && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(emp);
            }}
            title="Edit Team Member"
            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-brand-orange hover:bg-orange-50 rounded transition-all cursor-pointer shrink-0"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
