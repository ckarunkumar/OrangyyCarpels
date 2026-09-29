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
    <div className="border border-studio-border rounded-lg bg-white overflow-hidden shadow-sm">
      <div className="bg-studio-sidebar border-b border-studio-border px-5 py-2.5 text-[10px] font-bold text-studio-muted uppercase tracking-wider grid grid-cols-12 gap-3 items-center shrink-0">
        <div className="col-span-3">CLIENT NAME</div>
        <div className="col-span-2">BILLING METHOD</div>
        <div className="col-span-3 text-left">TOTAL PROJECTS</div>
        <div className="col-span-2 text-left">ASSIGNED PROJECTS</div>
        <div className="col-span-2 text-right">TOTAL LOGGED HOURS</div>
      </div>

      <div className="divide-y divide-studio-border bg-white">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
        ) : clients.length === 0 ? (
          <div className="text-center py-12 text-studio-muted text-[12.5px]">
            No clients with assigned projects found for this period.
          </div>
        ) : (
          clients.map((c) => (
            <div
              key={c.clientId}
              onClick={() => onSelectClient(c)}
              className="grid grid-cols-12 gap-3 px-5 py-3.5 items-center hover:bg-studio-hover/40 transition-colors cursor-pointer group text-[12.5px]"
            >
              <div className="col-span-3">
                <span className="font-semibold text-slate-800 group-hover:text-brand-orange transition-colors">
                  {c.clientName}
                </span>
              </div>
              <div className="col-span-2">
                {getBillingPill(c.billingMethod)}
              </div>
              <div className="col-span-3 text-slate-700 font-medium">
                {c.totalProjects}
              </div>
              <div className="col-span-2 text-slate-700 font-medium">
                {c.assignedProjects}
              </div>
              <div className="col-span-2 text-right font-medium text-slate-900">
                {formatHours(c.totalLoggedHours)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
