'use client'

import { useState, useEffect } from 'react'
import { Rocket, ChevronDown } from 'lucide-react'
import SetupStep from './SetupStep'

interface SetupStatus {
  business_info_complete: boolean
  has_kb_items: boolean
  has_channel: boolean
  has_playbook: boolean
  has_conversation: boolean
  kb_count: number
}

const STORAGE_KEY = 'setup_banner_v1'
const CONTENT_ID = 'dashboard-main-content'

export default function SetupBanner() {
  const [status, setStatus] = useState<SetupStatus | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const completedCount = status
    ? [status.business_info_complete, status.has_kb_items, status.has_channel, status.has_playbook, status.has_conversation].filter(Boolean).length
    : 0
  const isIncomplete = completedCount < 5

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === 'collapsed') setCollapsed(true)

    fetch('/api/setup-status')
      .then(r => (r.ok ? r.json() : null))
      .then(d => { setStatus(d); setLoaded(true) })
      .catch(() => setLoaded(true))
  }, [])

  // Apply/remove blur on dashboard content
  useEffect(() => {
    if (!loaded || !status) return
    const el = document.getElementById(CONTENT_ID)
    if (!el) return

    const shouldBlur = isIncomplete && !collapsed
    el.classList.toggle('blur-sm', shouldBlur)
    el.classList.toggle('opacity-60', shouldBlur)
    el.classList.toggle('pointer-events-none', shouldBlur)
    el.classList.toggle('select-none', shouldBlur)

    return () => {
      el.classList.remove('blur-sm', 'opacity-60', 'pointer-events-none', 'select-none')
    }
  }, [loaded, isIncomplete, collapsed, status])

  if (!loaded || !status || !isIncomplete) return null

  const handleCollapse = () => {
    setCollapsed(true)
    localStorage.setItem(STORAGE_KEY, 'collapsed')
  }

  const handleExpand = () => {
    setCollapsed(false)
    localStorage.removeItem(STORAGE_KEY)
  }

  if (collapsed) {
    return (
      <div className="mx-6 mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Rocket className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-medium text-amber-800">
            Kurulum Rehberi — {completedCount}/5 adım tamamlandı
          </span>
        </div>
        <button
          onClick={handleExpand}
          className="text-xs text-amber-600 hover:text-amber-800 flex items-center gap-1 transition-colors"
        >
          <ChevronDown className="w-3.5 h-3.5" />
          Göster
        </button>
      </div>
    )
  }

  return (
    <div className="mx-6 mt-4 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
            <Rocket className="w-4 h-4 text-brand-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Kurulum Rehberi</h3>
            <p className="text-xs text-slate-500">
              {completedCount === 0
                ? 'AI asistanınız henüz aktif değil. Aşağıdaki adımları tamamlayın.'
                : `${completedCount}/5 adım tamamlandı — neredeyse hazırsınız!`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Progress dots */}
          <div className="hidden sm:flex items-center gap-1.5">
            {[0, 1, 2, 3, 4].map(i => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${i < completedCount ? 'bg-brand-500' : 'bg-slate-200'}`}
              />
            ))}
          </div>
          <button
            onClick={handleCollapse}
            className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded hover:bg-slate-50 transition-colors"
          >
            Daha Sonra
          </button>
        </div>
      </div>

      {/* Steps */}
      <div className="px-5 divide-y divide-slate-50">
        <SetupStep
          step={1}
          done={status.business_info_complete}
          title="İşletme Profilini Tamamla"
          description="Telefon, e-posta ve şehir bilgilerini ekle"
          cta={{ label: 'Ayarlara Git', href: '/dashboard/settings' }}
        />
        <SetupStep
          step={2}
          done={status.has_kb_items}
          title="Bilgi Bankası Oluştur"
          description={
            status.has_kb_items
              ? `${status.kb_count} içerik eklendi`
              : 'Web siteni tara veya bilgileri manuel ekle'
          }
          cta={{ label: 'KB Oluştur', href: '/dashboard/knowledge' }}
        />
        <SetupStep
          step={3}
          done={status.has_channel}
          title="Kanal Bağla"
          description="WhatsApp, Instagram veya ses kanalını aktif et"
          cta={{ label: 'Entegrasyonlar', href: '/dashboard/integrations' }}
        />
        <SetupStep
          step={4}
          done={status.has_playbook}
          title="AI Asistanını Kur"
          description="Şablon seç, asistan adını ve davranışını belirle"
          cta={{ label: 'AI Asistanı', href: '/dashboard/agent' }}
        />
        <SetupStep
          step={5}
          done={status.has_conversation}
          title="İlk Konuşmayı Bekle"
          description="Kanal bağlandığında AI asistanınız otomatik olarak konuşmalara başlayacak"
        />
      </div>
    </div>
  )
}
