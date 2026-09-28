import { Employee } from '../../types/registry';
import { SkeletonRow } from '../ui/Skeleton';
import EmployeeLoginsInfoRow from './EmployeeLoginsInfoRow';

interface EmployeeLoginsInfoTableProps {
  employees: Employee[];
  loading: boolean;
  isAdmin: boolean;
  searchQuery?: string;
  onEdit?: (emp: Employee) => void;
}

export default function EmployeeLoginsInfoTable({
  employees,
  loading,
  isAdmin,
  searchQuery,
  onEdit,
}: EmployeeLoginsInfoTableProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-[#fafbfc] border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-3.5 px-4">EMP ID</th>
              <th className="py-3.5 px-4">NAME</th>
              <th className="py-3.5 px-4">SYSTEM ROLE</th>
              <th className="py-3.5 px-4">EMAIL ID</th>
              <th className="py-3.5 px-4">PHONE NUMBER</th>
              <th className="py-3.5 px-3 text-center">NO. OF PROJECTS</th>
              <th className="py-3.5 px-4">LOCATION</th>
              <th className="py-3.5 px-4">DATE OF JOINING</th>
              <th className="py-3.5 px-4">PROJECTS WORKING</th>
              {isAdmin && <th className="py-3.5 px-3 w-10 text-right"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80 text-[12px]">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={isAdmin ? 10 : 9} className="p-0">
                    <SkeletonRow />
                  </td>
                </tr>
              ))
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 10 : 9} className="py-12 text-center text-slate-400 text-[13px]">
                  {searchQuery ? `No team members matching "${searchQuery}"` : 'No employee records found.'}
                </td>
              </tr>
            ) : (
              employees.map((emp) => (
                <EmployeeLoginsInfoRow
                  key={emp.employeeId}
                  emp={emp}
                  isAdmin={isAdmin}
                  onEdit={onEdit}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
