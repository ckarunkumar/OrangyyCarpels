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
    <div className="border border-studio-border rounded-lg bg-white overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-studio-sidebar border-b border-studio-border text-[10px] font-bold text-studio-muted uppercase tracking-wider">
              <th className="py-2.5 px-5 font-bold">EMP ID</th>
              <th className="py-2.5 px-5 font-bold">NAME</th>
              <th className="py-2.5 px-5 font-bold">SYSTEM ROLE</th>
              <th className="py-2.5 px-5 font-bold">EMAIL ID</th>
              <th className="py-2.5 px-5 font-bold">PHONE NUMBER</th>
              <th className="py-2.5 px-5 text-center font-bold">NO. OF PROJECTS</th>
              <th className="py-2.5 px-5 font-bold">LOCATION</th>
              <th className="py-2.5 px-5 font-bold">DATE OF JOINING</th>
              <th className="py-2.5 px-5 font-bold">PROJECTS WORKING</th>
              {isAdmin && <th className="py-2.5 px-5 w-10 text-right font-bold"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-studio-border bg-white text-[12.5px]">
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
