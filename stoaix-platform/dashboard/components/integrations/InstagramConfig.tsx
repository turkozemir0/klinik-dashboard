'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2, Instagram, ExternalLink, X, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  onStatusChange?: (connected: boolean, username?: string) => void
}

export function InstagramConfig({ onStatusChange }: Props) {
  const searchParams = useSearchParams()
  const [igState, setIgState] = useState<{ connected: boolean; username?: string } | null>(null)
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
      const ig = (org?.channel_config as any)?.instagram
      const creds = ig?.credentials
      const connected = !!(ig?.active && creds?.page_id)
      setIgState({ connected, username: creds?.username })
      onStatusChange?.(connected, creds?.username)
      setLoading(false)
    })
  }, [searchParams.get('instagram')])

  const justConnected = searchParams.get('instagram') === 'connected'
  const error = searchParams.get('instagram_error')
  const connected = justConnected || igState?.connected

  async function disconnect() {
    setDisconnecting(true)
    try {
      await fetch('/api/instagram/disconnect', { method: 'DELETE' })
      setIgState({ connected: false })
      onStatusChange?.(false)
      window.history.replaceState({}, '', '/dashboard/integrations')
    } finally {
      setDisconnecting(false)
    }
  }

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
          <span className="font-medium">
            Bagli{igState?.username ? ` — @${igState.username}` : ''}
          </span>
        </div>
        <div className="pt-4 border-t border-slate-100">
          <button
            onClick={disconnect}
            disabled={disconnecting}
            className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
          >
            {disconnecting ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
            Baglantiyi Kes
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-500">Baglanti basarisiz: {error}</p>}
      <button
        onClick={() => { window.location.href = '/api/instagram/auth' }}
        className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
      >
        <Instagram size={14} />
        Instagram&apos;i Bagla
        <ExternalLink size={13} className="opacity-70" />
      </button>
    </div>
  )
}
