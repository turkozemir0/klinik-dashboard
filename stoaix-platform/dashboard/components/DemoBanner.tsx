'use client'

import { useIsDemo } from '@/lib/demo-context'
import { useLang } from '@/lib/lang-context'
import { useEffect, useState } from 'react'
import { Phone, MessageSquare } from 'lucide-react'

interface DemoMetric {
  key: string
  label: string
  limit: number
  used: number
  remaining: number
}

export default function DemoBanner() {
  const isDemo = useIsDemo()
  const { lang } = useLang()
  const [metrics, setMetrics] = useState<DemoMetric[]>([])

  useEffect(() => {
    if (!isDemo) return
    fetch('/api/demo/limits')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.metrics) setMetrics(d.metrics) })
      .catch(() => {})
  }, [isDemo])

  if (!isDemo) return null

  const voice = metrics.find(m => m.key === 'voice_minutes')
  const chat = metrics.find(m => m.key === 'chatbot_messages')
  const anyExhausted = metrics.some(m => m.remaining === 0)

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-sm font-medium text-amber-800">
      <div className="flex items-center justify-between max-w-screen-xl mx-auto">
        <span>
          {lang === 'tr'
            ? 'Demo Hesap — Ses ve chatbot testini deneyebilirsiniz (günlük limit)'
            : 'Demo Account — You can try voice and chatbot testing (daily limit)'}
        </span>

        {metrics.length > 0 && (
          <div className="flex items-center gap-4 text-xs">
            {voice && (
              <LimitPill
                icon={<Phone size={12} />}
                label={lang === 'tr' ? 'Ses' : 'Voice'}
                used={voice.used}
                limit={voice.limit}
                unit={lang === 'tr' ? 'dk' : 'min'}
              />
            )}
            {chat && (
              <LimitPill
                icon={<MessageSquare size={12} />}
                label={lang === 'tr' ? 'Chat' : 'Chat'}
                used={chat.used}
                limit={chat.limit}
                unit={lang === 'tr' ? 'msj' : 'msg'}
              />
            )}
          </div>
        )}
      </div>

      {anyExhausted && (
        <p className="text-center text-xs mt-1.5 text-red-600 font-medium">
          {lang === 'tr'
            ? 'Günlük demo kullanım limitiniz doldu. Limitler her gün sıfırlanır.'
            : 'Your daily demo usage limit has been reached. Limits reset every day.'}
        </p>
      )}
    </div>
  )
}

function LimitPill({
  icon,
  label,
  used,
  limit,
  unit,
}: {
  icon: React.ReactNode
  label: string
  used: number
  limit: number
  unit: string
}) {
  const remaining = Math.max(0, limit - used)
  const pct = limit > 0 ? (used / limit) * 100 : 0
  const isLow = pct >= 80
  const isExhausted = remaining === 0

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
      isExhausted
        ? 'bg-red-50 border-red-200 text-red-700'
        : isLow
          ? 'bg-amber-100 border-amber-300 text-amber-800'
          : 'bg-white/60 border-amber-200 text-amber-700'
    }`}>
      {icon}
      <span className="font-medium">{label}:</span>
      <span>{used}/{limit} {unit}</span>
    </div>
  )
}
