interface MyLeavesKPICardsProps {
  balance: any;
}

export default function MyLeavesKPICards({ balance }: MyLeavesKPICardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <div className="bg-white border border-studio-border rounded-lg p-3.5 shadow-2xs">
        <span className="text-[10px] font-bold text-studio-muted uppercase tracking-wider block truncate">CASUAL (CL)</span>
        <div className="text-[20px] font-bold text-studio-text mt-1 font-mono">
          {balance?.casualRemaining ?? 12} <span className="text-[11px] text-studio-muted font-normal">/ {balance?.casualQuota ?? 12}d</span>
        </div>
      </div>
      <div className="bg-white border border-studio-border rounded-lg p-3.5 shadow-2xs">
        <span className="text-[10px] font-bold text-studio-muted uppercase tracking-wider block truncate">SICK (SL)</span>
        <div className="text-[20px] font-bold text-studio-text mt-1 font-mono">
          {balance?.sickRemaining ?? 12} <span className="text-[11px] text-studio-muted font-normal">/ {balance?.sickQuota ?? 12}d</span>
        </div>
      </div>
      <div className="bg-white border border-studio-border rounded-lg p-3.5 shadow-2xs">
        <span className="text-[10px] font-bold text-studio-muted uppercase tracking-wider block truncate">EARNED (EL)</span>
        <div className="text-[20px] font-bold text-studio-text mt-1 font-mono">
          {balance?.earnedRemaining ?? 15} <span className="text-[11px] text-studio-muted font-normal">/ {balance?.earnedQuota ?? 15}d</span>
        </div>
      </div>
      <div className="bg-white border border-studio-border rounded-lg p-3.5 shadow-2xs">
        <span className="text-[10px] font-bold text-brand-orange uppercase tracking-wider block truncate">COMP-OFF</span>
        <div className="text-[20px] font-bold text-brand-orange mt-1 font-mono">
          {balance?.compOffBalance ?? 0} <span className="text-[11px] text-studio-muted font-normal">days</span>
        </div>
      </div>
      <div className="bg-white border border-studio-border rounded-lg p-3.5 shadow-2xs">
        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block truncate">WFH (MONTHLY)</span>
        <div className="text-[20px] font-bold text-blue-600 mt-1 font-mono">
          {balance?.wfhRemainingThisMonth ?? 2} <span className="text-[11px] text-studio-muted font-normal">left</span>
        </div>
      </div>
      <div className="bg-white border border-studio-border rounded-lg p-3.5 shadow-2xs">
        <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block truncate">OPTIONAL (OH)</span>
        <div className="text-[20px] font-bold text-purple-600 mt-1 font-mono">
          {balance?.optionalHolidaysRemaining ?? 2} <span className="text-[11px] text-studio-muted font-normal">/ {balance?.optionalHolidaysQuota ?? 2}</span>
        </div>
      </div>
    </div>
  );
}
