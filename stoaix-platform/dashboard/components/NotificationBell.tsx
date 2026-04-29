'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, X, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface OrgNotification {
  id: string
  type: string
  title: string
  body: string | null
  user_id: string | null
  lead_id: string | null
  conversation_id: string | null
  read_at: string | null
  created_at: string
}

interface Props {
  userId: string
  orgId: string
}

export default function NotificationBell({ userId, orgId }: Props) {
  const [notifications, setNotifications] = useState<OrgNotification[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const router = useRouter()

  const unreadCount = notifications.filter(n => !n.read_at).length

  const DROPDOWN_W = 320

  const calcPosition = useCallback(() => {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const vw = window.innerWidth
    const left = Math.min(rect.left, vw - DROPDOWN_W - 8)
    setDropdownStyle({ top: rect.bottom + 8, left: Math.max(8, left) })
  }, [])

  useEffect(() => {
    fetchNotifications()

    // Realtime subscription
    const channel = supabase
      .channel(`notifications-${orgId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `organization_id=eq.${orgId}`,
        },
        (payload) => {
          const notif = payload.new as OrgNotification
          // Only show if broadcast or targeted at me
          if (notif.user_id === null || notif.user_id === userId) {
            setNotifications(prev => [notif, ...prev].slice(0, 20))
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [orgId, userId])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (
        dropdownRef.current && !dropdownRef.current.contains(target) &&
        buttonRef.current && !buttonRef.current.contains(target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function fetchNotifications() {
    const { data } = await supabase
      .from('notifications')
      .select('id, type, title, body, user_id, lead_id, conversation_id, read_at, created_at')
      .eq('organization_id', orgId)
      .or(`user_id.is.null,user_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(20)
    if (data) setNotifications(data)
  }

  async function markAllRead() {
    setLoading(true)
    await fetch('/api/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true, org_id: orgId }),
    })
    setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })))
    setLoading(false)
  }

  async function markRead(id: string) {
    await fetch('/api/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
  }

  function handleNotifClick(notif: OrgNotification) {
    if (!notif.read_at) markRead(notif.id)
    if (notif.lead_id) {
      router.push(`/dashboard/leads/${notif.lead_id}`)
    }
    setOpen(false)
  }

  const typeColors: Record<string, string> = {
    hot_lead: 'text-orange-500',
    handoff: 'text-amber-500',
    handoff_reminder: 'text-red-500',
    new_message: 'text-blue-500',
    takeover: 'text-purple-500',
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => { calcPosition(); setOpen(o => !o) }}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition-all hover:border-white/15 hover:text-white"
        aria-label="Bildirimler"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={dropdownRef}
          className="fixed z-[200] w-80 rounded-2xl border border-slate-200 bg-white shadow-xl"
          style={{ top: dropdownStyle.top, left: dropdownStyle.left, maxWidth: 'calc(100vw - 16px)' }}
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-800">Bildirimler</p>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  disabled={loading}
                  className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
                >
                  <Check size={12} />
                  Tümünü okundu say
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-400">Bildirim yok</p>
            ) : (
              notifications.map(notif => (
                <button
                  key={notif.id}
                  onClick={() => handleNotifClick(notif)}
                  className={`w-full text-left px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors ${
                    !notif.read_at ? 'bg-blue-50/40' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className={`mt-0.5 text-base ${typeColors[notif.type] ?? 'text-slate-400'}`}>
                      {notif.type === 'hot_lead' ? '🔥' :
                       notif.type === 'handoff' ? '🤝' :
                       notif.type === 'handoff_reminder' ? '⏰' :
                       notif.type === 'new_message' ? '💬' : '👤'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-800">{notif.title}</p>
                      {notif.body && <p className="text-xs text-slate-500 mt-0.5 truncate">{notif.body}</p>}
                      <p className="text-[10px] text-slate-400 mt-1">
                        {new Date(notif.created_at).toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    {!notif.read_at && (
                      <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
