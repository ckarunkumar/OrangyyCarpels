import { FolderKanban, Pencil, UserCheck, Users } from 'lucide-react';
import { Project, Employee } from '../../types/registry';
import BillingBadge from '../ui/BillingBadge';

interface ClientProjectsRowProps {
  proj: Project;
  employees: Employee[];
  isAdmin: boolean;
  onSelect: (proj: Project) => void;
  onEdit: (proj: Project) => void;
}

export default function ClientProjectsRow({ proj, employees, isAdmin, onSelect, onEdit }: ClientProjectsRowProps) {
  const isHourly = proj.billingType === 'T&M' || proj.billingType === 'Hourly Rate (T&M)';
  const consumption = isHourly ? Math.round(((proj.loggedHours || 0) / (proj.budgetHours || 1)) * 100) : 0;
  const assignedCount = proj.assignedEmployees?.length || 0;
  const assignedNames = proj.assignedEmployees && proj.assignedEmployees.length > 0
    ? proj.assignedEmployees.map((id) => {
        const found = employees.find((e) => (e.employeeId || String(e.id)) === id);
        return found ? found.fullName : id;
      }).join(', ')
    : 'No team members assigned';

  return (
    <div onClick={() => onSelect(proj)} className="group px-5 py-3 grid grid-cols-12 gap-3 text-[12.5px] items-center hover:bg-studio-hover/40 transition-colors cursor-pointer">
      {/* 1. Project Code */}
      <div className="col-span-1 min-w-[70px]">
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-studio-sidebar border border-studio-border text-studio-text inline-block">
          {proj.id}
        </span>
      </div>

      {/* 2. Project Name */}
      <div className="col-span-3 min-w-0 pr-2 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded bg-studio-sidebar flex items-center justify-center text-studio-muted border border-studio-border shrink-0">
          <FolderKanban className="w-3.5 h-3.5 text-studio-muted group-hover:text-brand-orange transition-colors" />
        </div>
        <p className="font-semibold text-studio-text truncate group-hover:text-brand-orange transition-colors text-[12.5px]">{proj.name}</p>
      </div>

      {/* 3. Project Manager */}
      <div className="col-span-2 min-w-0 pr-2">
        <p className="text-[12px] font-medium text-studio-text truncate flex items-center gap-1.5">
          <UserCheck className="w-3.5 h-3.5 text-brand-orange shrink-0" />
          <span className="truncate">{proj.managerName || proj.managerId || 'Unassigned'}</span>
        </p>
      </div>

      {/* 4. Team */}
      <div className="col-span-1 text-center" title={assignedNames}>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 cursor-help">
          <Users className="w-3 h-3 text-blue-600 shrink-0" />
          <span>{assignedCount}</span>
        </span>
      </div>

      {/* 5. Billing Type */}
      <div className="col-span-1 flex items-center">
        <BillingBadge type={proj.billingType} />
      </div>

      {/* 6. Budget / Hours */}
      <div className="col-span-2 pr-2">
        {isHourly ? (
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10.5px] font-mono text-studio-muted">
              <span>{proj.loggedHours || 0}/{proj.budgetHours || 0}h</span>
              <span className="font-bold text-brand-orange">{consumption}%</span>
            </div>
            <div className="w-full h-1.5 bg-studio-sidebar rounded-full overflow-hidden border border-studio-border/60">
              <div className="h-full bg-brand-orange transition-all duration-300" style={{ width: `${Math.min(100, consumption)}%` }} />
            </div>
          </div>
        ) : (
          <span className="text-[11.5px] font-mono text-studio-muted">{proj.loggedHours || 0}h tracked</span>
        )}
      </div>

      {/* 7. Status */}
      <div className="col-span-1 flex items-center">
        <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${proj.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
          {proj.status}
        </span>
      </div>

      {/* 8. Action (Edit Icon Only) */}
      <div className="col-span-1 text-right flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
        {isAdmin && (
          <button
            type="button"
            onClick={() => onEdit(proj)}
            className="p-1.5 text-studio-muted hover:text-brand-orange hover:bg-orange-50 rounded transition-colors cursor-pointer"
            title="Edit Project"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
