import { useState } from 'react';
import { Shield, FolderGit2, MapPin, Calendar, Pencil, Eye, EyeOff } from 'lucide-react';
import { Employee } from '../../types/registry';
import { maskEmail, maskPhone } from '../../utils/maskUtils';

interface EmployeeLoginsInfoRowProps {
  emp: Employee;
  isAdmin: boolean;
  onEdit?: (emp: Employee) => void;
}

export default function EmployeeLoginsInfoRow({
  emp,
  isAdmin,
  onEdit,
}: EmployeeLoginsInfoRowProps) {
  const [showEmail, setShowEmail] = useState(false);
  const [showPhone, setShowPhone] = useState(false);

  const assignedProjs = emp.assignedProjects || [];

  return (
    <tr className="hover:bg-studio-hover/40 transition-colors group">
      {/* 1. Employee ID */}
      <td className="py-3.5 px-5 whitespace-nowrap">
        <span
          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border inline-block transition-colors cursor-pointer ${
            emp.status === 'Active'
              ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:border-green-300'
              : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:border-red-300'
          }`}
        >
          {emp.employeeId}
        </span>
      </td>

      {/* 2. Name */}
      <td className="py-3.5 px-5 whitespace-nowrap">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-bold text-slate-600 border border-slate-200 shrink-0 overflow-hidden">
            {emp.avatar ? (
              <img src={emp.avatar} alt={emp.fullName} className="w-full h-full object-cover" />
            ) : (
              <span>{emp.fullName[0]}</span>
            )}
          </div>
          <span className="font-semibold text-slate-800 group-hover:text-brand-orange transition-colors">
            {emp.fullName}
          </span>
        </div>
      </td>

      {/* 3. System Role */}
      <td className="py-3.5 px-5 whitespace-nowrap">
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border ${
            emp.role === 'Super Admin'
              ? 'bg-purple-50 text-purple-700 border-purple-200'
              : emp.role === 'Project Manager'
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-slate-50 text-slate-700 border-slate-200'
          }`}
        >
          <Shield className="w-2.5 h-2.5 shrink-0" />
          <span>{emp.role || 'Employee'}</span>
        </span>
      </td>

      {/* 4. Email ID */}
      <td className="py-3.5 px-5 whitespace-nowrap">
        <div className="flex items-center gap-1.5 text-slate-600">
          <span className="truncate max-w-[180px]" title={showEmail ? emp.email : 'Click eye icon to reveal'}>
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
      </td>

      {/* 5. Phone Number */}
      <td className="py-3.5 px-5 whitespace-nowrap">
        <div className="flex items-center gap-1.5 text-slate-600">
          <span className="truncate" title={showPhone ? (emp.phone || '—') : 'Click eye icon to reveal'}>
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
      </td>

      {/* 6. No. of Projects */}
      <td className="py-3.5 px-5 text-center whitespace-nowrap">
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border ${
            (emp.assignedProjectsCount || 0) > 0
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-slate-50 text-slate-600 border-slate-200'
          }`}
        >
          <FolderGit2 className="w-2.5 h-2.5 text-blue-600" />
          <span>{emp.assignedProjectsCount || 0}</span>
        </span>
      </td>

      {/* 7. Location */}
      <td className="py-3.5 px-5 whitespace-nowrap text-slate-600">
        <div className="flex items-center gap-1 text-[11.5px]">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{emp.location || 'Remote'}</span>
        </div>
      </td>

      {/* 8. Date of Joining */}
      <td className="py-3.5 px-5 whitespace-nowrap text-slate-600 font-mono text-[11.5px]">
        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{emp.joiningDate || '—'}</span>
        </div>
      </td>

      {/* 9. Projects Working */}
      <td className="py-3.5 px-5">
        {assignedProjs.length > 0 ? (
          <div className="flex items-center gap-1 flex-wrap max-w-xs">
            {assignedProjs.map((p) => (
              <span
                key={p.id}
                className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 truncate max-w-[140px]"
                title={p.name}
              >
                {p.name}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-slate-400 text-[11px] italic">No active projects</span>
        )}
      </td>

      {/* 10. Super Admin Edit on Hover */}
      {isAdmin && (
        <td className="py-3.5 px-3 text-right whitespace-nowrap">
          <button
            type="button"
            onClick={() => onEdit?.(emp)}
            title="Edit Team Member"
            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-brand-orange hover:bg-orange-50 rounded transition-all cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </td>
      )}
    </tr>
  );
}
