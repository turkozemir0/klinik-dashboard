import { classifyLead } from '@/lib/types'

interface Props {
  score: number
  showScore?: boolean
}

const colors = {
  HOT: 'bg-red-100 text-red-700 border border-red-200',
  WARM: 'bg-amber-100 text-amber-700 border border-amber-200',
  COLD: 'bg-blue-100 text-blue-700 border border-blue-200',
}

export default function LeadBadge({ score, showScore = true }: Props) {
  const label = classifyLead(score)
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${colors[label]}`}>
      {label}
      {showScore && <span className="opacity-70">({score})</span>}
    </span>
  )
}
