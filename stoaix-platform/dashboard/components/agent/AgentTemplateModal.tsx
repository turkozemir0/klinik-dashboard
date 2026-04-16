'use client'

import { X, Mic, MessageSquare, Star, Info, CheckCircle2 } from 'lucide-react'
import { AgentTemplate, VOICE_TEMPLATES, WHATSAPP_TEMPLATES } from '@/lib/agent-templates'

interface Props {
  open: boolean
  channel: 'voice' | 'whatsapp'
  hasCalendar: boolean
  onClose: () => void
  onApply: (template: AgentTemplate) => void
}

export default function AgentTemplateModal({ open, channel, hasCalendar, onClose, onApply }: Props) {
  if (!open) return null

  const templates = channel === 'voice' ? VOICE_TEMPLATES : WHATSAPP_TEMPLATES
  const recommended = templates.find(t => t.recommended)
  const others = templates.filter(t => !t.recommended)

  const isVoice = channel === 'voice'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            {isVoice
              ? <Mic size={17} className="text-brand-500" />
              : <MessageSquare size={17} className="text-brand-500" />}
            {isVoice ? 'Ses Şablonu Seç' : 'WhatsApp Şablonu Seç'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Önerilen kart */}
          {recommended && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Star size={12} className="text-amber-400 fill-amber-400" />
                <span className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Önerilen</span>
              </div>
              <TemplateCard
                template={recommended}
                hasCalendar={hasCalendar}
                featured
                onApply={onApply}
              />
            </div>
          )}

          {/* Diğer şablonlar */}
          {others.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Diğer Şablonlar</p>
              <div className="space-y-2">
                {others.map(t => (
                  <TemplateCard
                    key={t.id}
                    template={t}
                    hasCalendar={hasCalendar}
                    onApply={onApply}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TemplateCard({
  template,
  hasCalendar,
  featured,
  onApply,
}: {
  template: AgentTemplate
  hasCalendar: boolean
  featured?: boolean
  onApply: (t: AgentTemplate) => void
}) {
  const needsCalendar = template.requiresCalendar && !hasCalendar

  return (
    <div
      className={`rounded-xl border p-4 space-y-3 ${
        featured
          ? 'border-brand-200 bg-brand-50/40'
          : 'border-slate-100 bg-white hover:border-slate-200'
      }`}
    >
      <div>
        <p className={`text-sm font-semibold ${featured ? 'text-brand-700' : 'text-slate-800'}`}>
          {template.name}
        </p>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{template.description}</p>
      </div>

      {/* Takvim uyarısı */}
      {needsCalendar && (
        <div className="flex items-start gap-1.5 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          <Info size={12} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700">
            Randevu alma özelliği için takvim bağlantısı gerekir.
          </p>
        </div>
      )}

      <button
        onClick={() => onApply(template)}
        className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${
          featured
            ? 'bg-brand-500 hover:bg-brand-600 text-white'
            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
        }`}
      >
        <CheckCircle2 size={13} />
        Bu Şablonu Seç
      </button>
    </div>
  )
}
