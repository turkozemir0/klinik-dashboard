import clsx from 'clsx';

interface LeadScoreBadgeProps {
  score: number;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export function getLeadCategory(score: number) {
  if (score >= 70) return { label: 'HOT', class: 'badge-hot', ring: 'ring-red-200', bar: 'bg-red-500' };
  if (score >= 40) return { label: 'WARM', class: 'badge-warm', ring: 'ring-amber-200', bar: 'bg-amber-500' };
  return { label: 'COLD', class: 'badge-cold', ring: 'ring-blue-200', bar: 'bg-blue-400' };
}

export default function LeadScoreBadge({ score, showLabel = true, size = 'md' }: LeadScoreBadgeProps) {
  const cat = getLeadCategory(score);

  return (
    <div className="flex items-center gap-2">
      {showLabel && (
        <span className={cat.class}>{cat.label}</span>
      )}
      <div className="flex items-center gap-1.5">
        <div className={clsx('bg-slate-100 rounded-full overflow-hidden', size === 'sm' ? 'w-16 h-1.5' : 'w-20 h-2')}>
          <div
            className={clsx('h-full rounded-full transition-all', cat.bar)}
            style={{ width: `${Math.min(score, 100)}%` }}
          />
        </div>
        <span className={clsx('tabular-nums font-semibold text-slate-700', size === 'sm' ? 'text-xs' : 'text-sm')}>
          {score}
        </span>
      </div>
    </div>
  );
}
