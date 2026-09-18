import { SkeletonRow } from '../../ui/Skeleton';

export interface PmClientRowData {
  clientId: string;
  clientName: string;
  billingMethod: string;
  totalProjects: number;
  assignedProjects: number;
  totalLoggedHours: number;
}

interface PmStudioClientTableProps {
  clients: PmClientRowData[];
  loading?: boolean;
  onSelectClient: (client: PmClientRowData) => void;
}

export default function PmStudioClientTable({
  clients,
  loading = false,
  onSelectClient,
}: PmStudioClientTableProps) {
  const getBillingPill = (method: string) => {
    const isTM = method.includes('T&M') || method.includes('T & M') || method.includes('Hourly');
    const isPC = method.includes('PC') || method.includes('Project');

    if (isTM) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#f0f9ff] text-[#0284c7] border border-[#bae6fd]">
          T &amp; M
        </span>
      );
    }
    if (isPC) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#faf5ff] text-[#9333ea] border border-[#e9d5ff]">
          Project Cost (Fix)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#ecfdf5] text-[#10b981] border border-[#a7f3d0]">
        Resources Cost (Fix)
      </span>
    );
  };

  const formatHours = (hrs: number) => {
    if (hrs === 0) return '00hrs';
    return `${hrs}hrs`;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
      <div className="grid grid-cols-12 gap-4 px-6 py-3.5 bg-[#fafbfc] border-b border-slate-100 text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider">
        <div className="col-span-4 sm:col-span-3">Client Name</div>
        <div className="col-span-3 sm:col-span-2">Billing Method</div>
        <div className="col-span-2 sm:col-span-3 text-left">Total Projects</div>
        <div className="col-span-1 sm:col-span-2 text-left">Assigned Projects</div>
        <div className="col-span-2 text-right">Total Logged Hours</div>
      </div>

      <div className="divide-y divide-slate-100/80">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
        ) : clients.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-[13px]">
            No clients with assigned projects found for this period.
          </div>
        ) : (
          clients.map((c) => (
            <div
              key={c.clientId}
              onClick={() => onSelectClient(c)}
              className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50/70 transition-colors cursor-pointer group"
            >
              <div className="col-span-4 sm:col-span-3">
                <span className="text-[13px] font-medium text-slate-800 group-hover:text-orange-600 transition-colors">
                  {c.clientName}
                </span>
              </div>
              <div className="col-span-3 sm:col-span-2">
                {getBillingPill(c.billingMethod)}
              </div>
              <div className="col-span-2 sm:col-span-3 text-[13px] text-slate-700">
                {c.totalProjects}
              </div>
              <div className="col-span-1 sm:col-span-2 text-[13px] text-slate-700">
                {c.assignedProjects}
              </div>
              <div className="col-span-2 text-right text-[13px] font-medium text-slate-900">
                {formatHours(c.totalLoggedHours)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
