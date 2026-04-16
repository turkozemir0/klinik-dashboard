import Link from 'next/link'
import { Check } from 'lucide-react'

interface SetupStepProps {
  step: number
  done: boolean
  title: string
  description: string
  cta?: { label: string; href: string }
}

export default function SetupStep({ step, done, title, description, cta }: SetupStepProps) {
  return (
    <div className="flex items-center gap-4 py-3">
      <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold
        ${done ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
        {done ? <Check className="w-4 h-4" /> : step}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`text-sm font-semibold ${done ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
            {title}
          </p>
          {done && (
            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
              Tamamlandı
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
      </div>

      {!done && cta && (
        <Link
          href={cta.href}
          className="flex-shrink-0 text-xs font-medium px-3 py-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors whitespace-nowrap"
        >
          {cta.label}
        </Link>
      )}
      {!done && !cta && (
        <span className="flex-shrink-0 text-xs text-slate-400 italic whitespace-nowrap">
          Kanal bağlandıktan sonra
        </span>
      )}
    </div>
  )
}
