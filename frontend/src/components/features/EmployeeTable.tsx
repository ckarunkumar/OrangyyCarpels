import { Employee } from '../../types/registry';
import EmployeeTableRow from './EmployeeTableRow';
import { SkeletonRow } from '../ui/Skeleton';

interface EmployeeTableProps {
  loading: boolean;
  employees: Employee[];
  isAdmin: boolean;
  searchQuery?: string;
  onSelect: (emp: Employee) => void;
  onEdit: (emp: Employee) => void;
}

export default function EmployeeTable({
  loading,
  employees,
  isAdmin,
  searchQuery,
  onSelect,
  onEdit,
}: EmployeeTableProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
      <div className="grid grid-cols-12 gap-3 px-6 py-3.5 bg-[#fafbfc] border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-wider items-center">
        <div className="col-span-1 min-w-[70px]">EMP ID</div>
        <div className="col-span-3 min-w-0">NAME</div>
        <div className="col-span-2 min-w-0">SYSTEM ROLE</div>
        <div className="col-span-2 min-w-0">EMAIL</div>
        <div className="col-span-2 min-w-0">PHONE</div>
        <div className="col-span-1 min-w-0">PROJECTS</div>
        <div className="col-span-1 min-w-0">LOGIN TIME</div>
      </div>

      <div className="divide-y divide-slate-100/80">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
        ) : employees.length === 0 ? (
          <div className="text-center py-8 text-[12px] text-studio-muted">
            {searchQuery ? `No team members matching "${searchQuery}"` : 'No team members matching filter.'}
          </div>
        ) : (
          employees.map((emp) => (
            <EmployeeTableRow
              key={emp.employeeId}
              emp={emp}
              isAdmin={isAdmin}
              onSelect={onSelect}
              onEdit={onEdit}
            />
          ))
        )}
      </div>
    </div>
  );
}
