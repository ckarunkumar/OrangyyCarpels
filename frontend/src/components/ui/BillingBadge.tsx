interface BillingBadgeProps {
  type: string;
  className?: string;
}

export default function BillingBadge({ type, className = '' }: BillingBadgeProps) {
  const b = type || 'T&M';
  const isTM = b === 'T&M' || b.includes('Hourly');
  const isFixedPC = b === 'Fixed PC' || b.includes('Project');

  const label = isTM ? 'T&M' : isFixedPC ? 'Project Cost (Fix)' : 'Resources Cost (Fix)';
  const color = isTM
    ? 'bg-blue-50 text-blue-700 border-blue-200'
    : isFixedPC
    ? 'bg-orange-50 text-orange-700 border-orange-200'
    : 'bg-purple-50 text-purple-700 border-purple-200';

  return (
    <span className={`inline-flex items-center text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${color} ${className}`}>
      {label}
    </span>
  );
}
