'use client'

import Link from 'next/link'
import { AlertTriangle, AlertCircle, ShieldOff } from 'lucide-react'

interface Props {
  status: string
}

type BannerConfig = {
  bg: string
  border: string
  textColor: string
  icon: React.ReactNode
  message: string
  buttonBg: string
  buttonText: string
  buttonHover: string
}

export default function DunningBanner({ status }: Props) {
  if (!['grace_period', 'past_due', 'suspended'].includes(status)) return null

  const configs: Record<string, BannerConfig> = {
    grace_period: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      textColor: 'text-amber-800',
      icon: <AlertTriangle size={16} className="shrink-0 text-amber-500" />,
      message: 'Ödeme alınamadı. Lütfen ödeme yönteminizi güncelleyin.',
      buttonBg: 'bg-amber-500',
      buttonText: 'text-white',
      buttonHover: 'hover:bg-amber-600',
    },
    past_due: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      textColor: 'text-red-800',
      icon: <AlertCircle size={16} className="shrink-0 text-red-500" />,
      message: 'Ödeme gecikmiş. Bazı özellikler kısıtlanmıştır.',
      buttonBg: 'bg-red-500',
      buttonText: 'text-white',
      buttonHover: 'hover:bg-red-600',
    },
    suspended: {
      bg: 'bg-red-100',
      border: 'border-red-300',
      textColor: 'text-red-900',
      icon: <ShieldOff size={16} className="shrink-0 text-red-700" />,
      message: 'Hesabınız askıya alındı. Verileriniz korunuyor.',
      buttonBg: 'bg-red-700',
      buttonText: 'text-white',
      buttonHover: 'hover:bg-red-800',
    },
  }

  const cfg = configs[status]

  return (
    <div className={`flex items-center justify-between gap-4 rounded-xl border ${cfg.border} ${cfg.bg} px-4 py-3`}>
      <div className="flex items-center gap-2.5 min-w-0">
        {cfg.icon}
        <p className={`text-sm font-medium ${cfg.textColor} truncate`}>
          {cfg.message}
        </p>
      </div>
      <Link
        href="/dashboard/settings?tab=billing"
        className={`shrink-0 rounded-lg ${cfg.buttonBg} ${cfg.buttonText} ${cfg.buttonHover} px-4 py-1.5 text-xs font-semibold transition-colors`}
      >
        Ödeme Yönetimi
      </Link>
    </div>
  )
}
