'use client'

import { useState, useEffect } from 'react'
import { Activity, RefreshCw, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'

interface HealthResult {
  status: 'ok' | 'degraded' | 'down' | 'unknown'
  latency_ms?: number
  error?: string
}

const statusConfig = {
  ok: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', dot: 'bg-green-500', label: 'Çalışıyor' },
  degraded: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', dot: 'bg-amber-500', label: 'Yavaş' },
  down: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', dot: 'bg-red-500', label: 'Kapalı' },
  unknown: { icon: Activity, color: 'text-slate-500', bg: 'bg-slate-50', dot: 'bg-slate-400', label: 'Bilinmiyor' },
}

export default function N8nStatusWidget() {
  const [health, setHealth] = useState<HealthResult>({ status: 'unknown' })
  const [loading, setLoading] = useState(true)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  function check() {
    setLoading(true)
    fetch('/api/health/n8n')
      .then(r => r.json())
      .then(d => {
        setHealth(d)
        setLastChecked(new Date())
        setLoading(false)
      })
      .catch(() => {
        setHealth({ status: 'down', error: 'API erişilemiyor' })
        setLoading(false)
      })
  }

  useEffect(() => {
    check()
    // Her 60 saniyede bir otomatik kontrol
    const interval = setInterval(check, 60_000)
    return () => clearInterval(interval)
  }, [])

  const cfg = statusConfig[health.status]
  const Icon = cfg.icon

  return (
    <div className={`rounded-xl border p-4 flex items-center justify-between ${cfg.bg} border-slate-200`}>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Activity className={`w-5 h-5 ${cfg.color}`} />
          <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${cfg.dot} ${health.status === 'ok' ? 'animate-pulse' : ''}`} />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-slate-700">n8n Otomasyon</span>
            <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            {loading ? 'Kontrol ediliyor...' : (
              <>
                {health.latency_ms !== undefined && `${health.latency_ms}ms`}
                {health.error && ` — ${health.error}`}
                {lastChecked && ` · ${lastChecked.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`}
              </>
            )}
          </div>
        </div>
      </div>
      <button
        onClick={check}
        disabled={loading}
        className="p-1.5 rounded-lg hover:bg-white/60 transition-colors text-slate-500 disabled:opacity-40"
        title="Yenile"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
      </button>
    </div>
  )
}
