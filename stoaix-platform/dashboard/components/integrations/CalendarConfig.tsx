'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2, Calendar, ExternalLink, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  onStatusChange?: (connected: boolean) => void
}

export function CalendarConfig({ onStatusChange }: Props) {
  const searchParams = useSearchParams()
  const [calConnected, setCalConnected] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: orgUser } = await supabase
        .from('org_users')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle()
      if (!orgUser) { setLoading(false); return }
      const { data: org } = await supabase
        .from('organizations')
        .select('channel_config')
        .eq('id', orgUser.organization_id)
        .single()
      const cal = (org?.channel_config as any)?.calendar
      const connected = !!(cal?.access_token)
      setCalConnected(connected)
      onStatusChange?.(connected)
      setLoading(false)
    })
  }, [searchParams.get('calendar_connected')])

  const connected = calConnected || !!searchParams.get('calendar_connected')
  const error = searchParams.get('calendar_error')

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-400 text-sm py-8">
        <Loader2 size={14} className="animate-spin" /> Yukleniyor...
      </div>
    )
  }

  if (connected) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm">
          <CheckCircle2 size={16} />
          <span className="font-medium">Google Takvim bagli</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.location.href = '/api/calendar/auth'}
            className="text-xs text-slate-500 hover:text-slate-700 underline"
          >
            Yeniden bagla
          </button>
          <button
            disabled={disconnecting}
            onClick={async () => {
              if (!confirm('Google Takvim baglantisini kesmek istediginize emin misiniz?')) return
              setDisconnecting(true)
              const res = await fetch('/api/calendar/disconnect', { method: 'DELETE' })
              if (res.ok) {
                setCalConnected(false)
                onStatusChange?.(false)
              } else {
                alert('Baglanti kesilirken bir hata olustu.')
              }
              setDisconnecting(false)
            }}
            className="text-xs text-red-500 hover:text-red-700 underline disabled:opacity-50"
          >
            {disconnecting ? 'Kesiliyor...' : 'Baglantiyi kes'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-500">Baglanti basarisiz: {error}</p>}
      <button
        onClick={() => window.location.href = '/api/calendar/auth'}
        className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
      >
        <Calendar size={14} />
        Google Takvim Bagla
        <ExternalLink size={13} className="opacity-70" />
      </button>
    </div>
  )
}
