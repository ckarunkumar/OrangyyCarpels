import { X, ChevronDown } from 'lucide-react';
import { Employee } from '../../types/registry';

interface ProjectFormBLSectionProps {
  selectedBLs: string[];
  setSelectedBLs: React.Dispatch<React.SetStateAction<string[]>>;
  blInventory: Array<{ id: number; name: string; services: Array<{ id: number; name: string }> }>;
  availableServices: Array<{ id: number; name: string }>;
  assignedEmployees: string[];
  addEmployee: (empId: string) => void;
  removeEmployee: (empId: string) => void;
  unassigned: Employee[];
  staffEmployees: Employee[];
}

export default function ProjectFormBLSection({
  selectedBLs, setSelectedBLs, blInventory, availableServices,
  assignedEmployees, addEmployee, removeEmployee, unassigned, staffEmployees
}: ProjectFormBLSectionProps) {
  const inputCls = "w-full px-3 py-2 border border-studio-border hover:border-studio-muted/60 rounded-md text-[12.5px] text-studio-text bg-white focus:outline-none focus:border-brand-orange transition-colors";
  const labelCls = "block text-[11px] font-medium text-studio-muted mb-1";
  const sectionTitleCls = "text-[13px] font-bold text-studio-text uppercase tracking-wider pb-1.5 border-b border-studio-border/70";

  return (
    <div className="space-y-4">
      <h3 className={sectionTitleCls}>2. BL & Resource</h3>
      
      {/* Line 1: Business Lines & Mapped Services */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
        <div>
          <label className={labelCls}>Business Lines ({selectedBLs.length})</label>
          <div className="relative">
            <select value="" onChange={(e) => { if (e.target.value && !selectedBLs.includes(e.target.value)) setSelectedBLs((p) => [...p, e.target.value]); }} className={`${inputCls} appearance-none pr-8`}>
              <option value="">+ Select Business Line...</option>
              {blInventory.filter((bl) => !selectedBLs.includes(bl.name)).map((bl) => (<option key={bl.id} value={bl.name}>{bl.name}</option>))}
            </select>
            <ChevronDown className="w-4 h-4 text-studio-muted pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>
          {selectedBLs.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5 max-h-16 overflow-y-auto">
              {selectedBLs.map((bl) => (<span key={bl} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-medium bg-orange-50 text-brand-orange border border-orange-200"><span>{bl}</span><button type="button" onClick={() => setSelectedBLs((p) => p.filter((x) => x !== bl))} className="hover:text-red-600 cursor-pointer"><X className="w-2.5 h-2.5" /></button></span>))}
            </div>
          )}
        </div>

        <div>
          <label className={labelCls}>Mapped Services ({availableServices.length})</label>
          <div className="p-2 border border-studio-border/70 rounded-md bg-studio-sidebar/30 min-h-[38px] max-h-24 overflow-y-auto flex flex-wrap gap-1">
            {availableServices.length > 0 ? (
              availableServices.map((svc) => (<span key={svc.id} className="inline-flex items-center px-2.5 py-0.5 rounded text-[10.5px] font-medium bg-blue-50 text-blue-700 border border-blue-200">{svc.name}</span>))
            ) : (<span className="text-[11.5px] text-studio-muted italic p-0.5">Select Business Line to auto-map services</span>)}
          </div>
        </div>
      </div>

      {/* Line 2: Select Team Member & Assigned Members */}
      <div className="space-y-3 pt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
          <div>
            <label className={labelCls}>Select Team Member ({assignedEmployees.length} assigned)</label>
            <div className="relative">
              <select value="" onChange={(e) => addEmployee(e.target.value)} className={`${inputCls} appearance-none pr-8`}>
                <option value="">+ Select Employee to Assign...</option>
                {unassigned.map((emp) => (<option key={emp.id} value={emp.employeeId || String(emp.id)}>{emp.fullName} ({emp.designation})</option>))}
              </select>
              <ChevronDown className="w-4 h-4 text-studio-muted pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>
        {assignedEmployees.length > 0 && (
          <div className="flex flex-wrap gap-1.5 p-3 bg-studio-sidebar/40 border border-studio-border rounded-lg">
            {assignedEmployees.map((empCode) => {
              const emp = staffEmployees.find((e) => (e.employeeId || String(e.id)) === empCode);
              return (<span key={empCode} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-medium bg-orange-50 text-brand-orange border border-brand-orange/30 shadow-2xs"><span>{emp ? emp.fullName : empCode}</span><button type="button" onClick={() => removeEmployee(empCode)} className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-brand-orange/20 cursor-pointer"><X className="w-3 h-3" /></button></span>);
            })}
          </div>
        )}
      </div>
    </div>
  );
}
