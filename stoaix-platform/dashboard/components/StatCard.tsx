import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface Props {
  title: string
  value: string | number
  icon: LucideIcon
  color?: 'blue' | 'red' | 'amber' | 'green' | 'purple' | 'slate'
  subtitle?: string
  delta?: number
}

const colorMap = {
  blue: 'bg-blue-50 text-blue-600',
  red: 'bg-red-50 text-red-600',
  amber: 'bg-amber-50 text-amber-600',
  green: 'bg-green-50 text-green-600',
  purple: 'bg-purple-50 text-purple-600',
  slate: 'bg-slate-100 text-slate-600',
}

export default function StatCard({ title, value, icon: Icon, color = 'blue', subtitle, delta }: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
      <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 truncate">{title}</p>
        <div className="flex items-center gap-2">
          <p className="text-2xl font-bold text-slate-900 leading-tight">{value}</p>
          {delta != null && delta !== 0 && (
            <span className={`inline-flex items-center text-xs font-semibold ${delta > 0 ? 'text-green-600' : 'text-red-500'}`}>
              {delta > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {Math.abs(delta)}%
            </span>
          )}
        </div>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}
