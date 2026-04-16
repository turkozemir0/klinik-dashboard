'use client'

import { useState } from 'react'
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
  const [loading, setLoading] = useState(false)

  if (!['grace_period', 'past_due', 'suspended'].includes(status)) return null

  async function handlePortal() {
    setLoading(true)
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        if (data.url) {
          window.location.href = data.url
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const configs: Record<string, BannerConfig> = {
    grace_period: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      textColor: 'text-amber-800',
      icon: <AlertTriangle size={16} className="shrink-0 text-amber-500" />,
      message: 'Odeme alinamadi. Lutfen odeme yönteminizi guncelleyin.',
      buttonBg: 'bg-amber-500',
      buttonText: 'text-white',
      buttonHover: 'hover:bg-amber-600',
    },
    past_due: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      textColor: 'text-red-800',
      icon: <AlertCircle size={16} className="shrink-0 text-red-500" />,
      message: 'Odeme gecikmiş. Bazi ozellikler kisitlanmistir.',
      buttonBg: 'bg-red-500',
      buttonText: 'text-white',
      buttonHover: 'hover:bg-red-600',
    },
    suspended: {
      bg: 'bg-red-100',
      border: 'border-red-300',
      textColor: 'text-red-900',
      icon: <ShieldOff size={16} className="shrink-0 text-red-700" />,
      message: 'Hesabiniz askıya alındı. Verileriniz korunuyor.',
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
      <button
        onClick={handlePortal}
        disabled={loading}
        className={`shrink-0 rounded-lg ${cfg.buttonBg} ${cfg.buttonText} ${cfg.buttonHover} px-4 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60`}
      >
        {loading ? 'Yükleniyor...' : 'Odeme Yönetimi'}
      </button>
    </div>
  )
}
