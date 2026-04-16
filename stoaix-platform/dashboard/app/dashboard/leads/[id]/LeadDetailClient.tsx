'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bot, User, AlertCircle } from 'lucide-react'

interface Props {
  conversationId: string
  initialMode: string
  initialTakenOverBy: string | null
  currentUserId: string
  userRole: string | null
}

export default function LeadDetailClient({
  conversationId,
  initialMode,
  initialTakenOverBy,
  currentUserId,
  userRole,
}: Props) {
  const [mode, setMode] = useState(initialMode)
  const [takenOverBy, setTakenOverBy] = useState(initialTakenOverBy)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`conv-mode-${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'conversations', filter: `id=eq.${conversationId}` },
        (payload) => {
          const row = payload.new as any
          setMode(row.mode)
          setTakenOverBy(row.taken_over_by)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversationId])

  const canTakeover = ['admin', 'yönetici', 'satisci'].includes(userRole ?? '')
  const canRelease =
    takenOverBy === currentUserId || ['admin', 'yönetici'].includes(userRole ?? '')

  async function handleTakeover() {
    setLoading(true)
    const res = await fetch(`/api/conversations/${conversationId}/takeover`, { method: 'POST' })
    if (res.ok) {
      setMode('human')
      setTakenOverBy(currentUserId)
    }
    setLoading(false)
  }

  async function handleRelease() {
    setLoading(true)
    const res = await fetch(`/api/conversations/${conversationId}/release`, { method: 'POST' })
    if (res.ok) {
      setMode('ai')
      setTakenOverBy(null)
    }
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Mode badge */}
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
        mode === 'human'
          ? 'bg-orange-100 text-orange-700'
          : 'bg-blue-100 text-blue-700'
      }`}>
        {mode === 'human' ? <User size={12} /> : <Bot size={12} />}
        {mode === 'human' ? 'İnsan Modu' : 'AI Modu'}
      </span>

      {mode === 'human' && takenOverBy && takenOverBy !== currentUserId && (
        <span className="text-xs text-orange-600 flex items-center gap-1">
          <AlertCircle size={12} />
          Başka bir temsilci tarafından devralındı
        </span>
      )}

      {/* Action buttons */}
      {mode === 'ai' && canTakeover && (
        <button
          onClick={handleTakeover}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-xs font-medium rounded-lg transition-colors"
        >
          <User size={12} />
          {loading ? 'İşleniyor...' : 'Devral'}
        </button>
      )}

      {mode === 'human' && canRelease && (
        <button
          onClick={handleRelease}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white text-xs font-medium rounded-lg transition-colors"
        >
          <Bot size={12} />
          {loading ? 'İşleniyor...' : "AI'a Bırak"}
        </button>
      )}
    </div>
  )
}
