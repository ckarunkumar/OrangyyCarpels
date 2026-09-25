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
    <div className="border border-studio-border rounded-lg bg-white overflow-hidden shadow-sm">
      <div className="bg-studio-sidebar border-b border-studio-border px-5 py-2.5 text-[10px] font-bold text-studio-muted uppercase tracking-wider grid grid-cols-12 gap-3 items-center">
        <div className="col-span-1">EMP ID</div>
        <div className="col-span-3">NAME</div>
        <div className="col-span-2">SYSTEM ROLE</div>
        <div className="col-span-2">EMAIL</div>
        <div className="col-span-1">PHONE</div>
        <div className="col-span-1">PROJECTS</div>
        <div className="col-span-1">STATUS</div>
        <div className="col-span-1 text-right">ACTION</div>
      </div>

      <div className="divide-y divide-studio-border bg-white">
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
