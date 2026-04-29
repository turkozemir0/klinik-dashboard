'use client'

import { type ReactNode } from 'react'
import { Settings, ChevronRight, Clock } from 'lucide-react'
import { useLang } from '@/lib/lang-context'

const CATEGORY_COLORS: Record<string, string> = {
  channels: 'bg-sky-100 text-sky-700',
  calendar: 'bg-violet-100 text-violet-700',
  crm: 'bg-amber-100 text-amber-700',
  automation: 'bg-emerald-100 text-emerald-700',
  clinic_pms: 'bg-purple-100 text-purple-700',
  other: 'bg-slate-100 text-slate-600',
}

const CATEGORY_LABELS: Record<string, { tr: string; en: string }> = {
  channels: { tr: 'Kanallar', en: 'Channels' },
  calendar: { tr: 'Takvim', en: 'Calendar' },
  crm: { tr: 'CRM', en: 'CRM' },
  automation: { tr: 'Otomasyon', en: 'Automation' },
  clinic_pms: { tr: 'Klinik PMS', en: 'Clinic PMS' },
  other: { tr: 'Diğer', en: 'Other' },
}

export interface IntegrationCardProps {
  icon: ReactNode
  name: string
  description: string
  status: 'connected' | 'disconnected' | 'loading' | 'coming_soon' | 'action_needed'
  statusLabel?: string
  badge?: string
  helperText?: string
  category?: string
  onClick?: () => void
  onDisconnect?: () => void
}

export function IntegrationCard({
  icon,
  name,
  description,
  status,
  statusLabel,
  badge,
  helperText,
  category,
  onClick,
  onDisconnect,
}: IntegrationCardProps) {
  const { lang } = useLang()
  const isDisabled = status === 'coming_soon'
  const isTr = lang === 'tr'

  const catLabel = category ? CATEGORY_LABELS[category]?.[lang] ?? category : undefined
  const catColor = category ? CATEGORY_COLORS[category] ?? CATEGORY_COLORS.other : undefined

  return (
    <div
      className={`rounded-2xl border text-left transition-all group w-full flex flex-col ${
        isDisabled
          ? 'bg-slate-50/80 border-slate-200 opacity-75'
          : status === 'connected'
            ? 'bg-white border-green-200 hover:border-green-300 hover:shadow-md'
            : 'bg-white border-slate-200 hover:border-sky-200 hover:shadow-md'
      }`}
    >
      {/* Header */}
      <div className="p-5 pb-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
            {icon}
          </div>
          <div className="min-w-0 pt-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-slate-800 text-sm">{name}</h3>
              {badge && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700 border border-amber-200">
                  <Clock size={9} />
                  {badge}
                </span>
              )}
            </div>
            {catLabel && catColor && (
              <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${catColor}`}>
                {catLabel}
              </span>
            )}
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{description}</p>
          </div>
        </div>

        {/* Status pill */}
        <div className="flex-shrink-0">
          {status === 'connected' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-green-50 text-green-700 border border-green-200">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              {isTr ? 'Bağlı' : 'Connected'}
            </span>
          ) : status === 'coming_soon' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-600 border border-amber-200">
              {isTr ? 'Yakında' : 'Coming Soon'}
            </span>
          ) : status === 'action_needed' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-600 border border-amber-200">
              {statusLabel ?? (isTr ? 'Eylem gerekli' : 'Action needed')}
            </span>
          ) : status === 'loading' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-50 text-slate-400 border border-slate-200">
              ...
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-50 text-slate-500 border border-slate-200">
              {isTr ? 'Mevcut' : 'Available'}
            </span>
          )}
        </div>
      </div>

      {helperText && (
        <p className="px-5 text-[11px] text-slate-400 leading-relaxed">{helperText}</p>
      )}

      {/* Footer */}
      <div className="mt-auto border-t border-slate-100 px-5 py-3 flex items-center justify-between">
        {status === 'loading' ? (
          <span className="text-xs text-slate-400">{isTr ? 'Yükleniyor...' : 'Loading...'}</span>
        ) : status === 'coming_soon' ? (
          <span className="text-xs text-slate-400">{isTr ? 'Yakında kullanılabilir' : 'Coming soon'}</span>
        ) : status === 'connected' ? (
          <div className="flex items-center gap-3">
            <button
              onClick={onClick}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              <Settings size={13} />
              {isTr ? 'Ayarlar' : 'Configure'}
            </button>
            {onDisconnect && (
              <button
                onClick={onDisconnect}
                className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors"
              >
                {isTr ? 'Bağlantıyı Kes' : 'Disconnect'}
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={isDisabled ? undefined : onClick}
            disabled={isDisabled}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-colors ${
              isDisabled
                ? 'text-slate-300 cursor-default'
                : 'text-brand-600 hover:text-brand-700'
            }`}
          >
            {isTr ? 'Bağla' : 'Connect'}
            {!isDisabled && <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />}
          </button>
        )}
      </div>
    </div>
  )
}
