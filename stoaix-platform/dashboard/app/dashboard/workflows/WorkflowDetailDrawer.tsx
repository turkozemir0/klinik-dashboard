'use client'

import { useState } from 'react'
import {
  X, Zap, Play, Phone, RefreshCw,
  Clock, StopCircle, Settings2, ArrowLeftRight,
} from 'lucide-react'
import Link from 'next/link'
import type { TemplateWithStatus, TriggerType } from '@/lib/workflow-types'
import WhatsAppIcon from '@/components/icons/WhatsAppIcon'
import RunHistoryDrawer from './RunHistoryDrawer'

// ── Types ─────────────────────────────────────────────────────────────────────

type FlowNodeType = 'trigger' | 'action' | 'loop' | 'condition' | 'stop'

interface FlowNode {
  type: FlowNodeType
  label: string
  detail: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TRIGGER_LABELS: Partial<Record<TriggerType, string>> = {
  lead_created:         'Yeni lead oluşturulunca',
  appointment_created:  'Randevu oluşturulunca',
  appointment_reminder: 'Randevu hatırlatması gelince',
  appointment_noshow:   'Randevuya gelinmeyince',
  post_appointment:     'Randevu sonrasında',
  no_answer:            'Arama yanıtsız kalınca',
  no_reply:             'Yanıt alınamayınca',
  contact_inactive:     'Lead hareketsiz kalınca',
  manual:               'Manuel tetiklenince',
  payment_overdue:      'Ödeme gecikmesinde',
}

const CHANNEL_BADGE: Record<string, string> = {
  voice:     'bg-blue-50 text-blue-700 border border-blue-200',
  whatsapp:  'bg-emerald-50 text-emerald-700 border border-emerald-200',
  instagram: 'bg-pink-50 text-pink-700 border border-pink-200',
  sms:       'bg-sky-50 text-sky-700 border border-sky-200',
  email:     'bg-violet-50 text-violet-700 border border-violet-200',
  multi:     'bg-purple-50 text-purple-700 border border-purple-200',
}

const CHANNEL_LABELS: Record<string, string> = {
  voice:     '📞 Sesli Giden',
  whatsapp:  '💬 WhatsApp',
  instagram: '📷 Instagram',
  sms:       '💬 SMS',
  email:     '📧 E-posta',
  multi:     '🔄 Çoklu Kanal',
}

const SETTINGS_PAGE_TEMPLATES = [
  'lead_first_contact_voice',
  'lead_first_contact_chat',
  'chatbot_followup',
  'reactivation_chat',
]

const LOOP_KEYWORDS      = ['kez', 'deneme', 'retry', 'dener', 'tekrar']
const CONDITION_KEYWORDS = ['saat', 'mesai', 'çalışma', 'arasında', 'sabah', 'akşam']

// ── Helpers ───────────────────────────────────────────────────────────────────

function classifyStep(text: string): Exclude<FlowNodeType, 'trigger' | 'stop'> {
  const lower = text.toLowerCase()
  if (LOOP_KEYWORDS.some(k => lower.includes(k)))      return 'loop'
  if (CONDITION_KEYWORDS.some(k => lower.includes(k))) return 'condition'
  return 'action'
}

function interpolateStep(step: string, config: Record<string, any>, template: TemplateWithStatus): string {
  return step.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val   = config[key] ?? template.config_fields.find(f => f.key === key)?.default ?? key
    const field = template.config_fields.find(f => f.key === key)
    if (field?.options) {
      const opt = field.options.find(o => String(o.value) === String(val))
      if (opt) return opt.label
    }
    return String(val)
  })
}

function buildFlowNodes(template: TemplateWithStatus): FlowNode[] {
  const config = template.config ?? {}
  const nodes: FlowNode[] = []

  nodes.push({
    type:   'trigger',
    label:  'Tetikleyici',
    detail: TRIGGER_LABELS[template.trigger_type] ?? template.trigger_type,
  })

  const STEP_LABELS: Record<string, string> = { action: 'Eylem', loop: 'Döngü', condition: 'Koşul' }
  for (const step of template.steps_summary) {
    const detail = interpolateStep(step, config, template)
    const type   = classifyStep(detail)
    nodes.push({ type, label: STEP_LABELS[type] ?? 'Adım', detail })
  }

  const hasStop = template.config_fields.some(
    f => f.key === 'stop_on_reply' || f.key === 'stop_on_appointment'
  )
  if (hasStop) {
    nodes.push({
      type:   'stop',
      label:  'Durdurma',
      detail: 'Yanıt alınınca veya randevu oluşunca durur',
    })
  }

  return nodes
}

// ── Node visual config ────────────────────────────────────────────────────────

const NODE_STYLES: Record<FlowNodeType, {
  iconBg: string; iconBorder: string; iconColor: string
  accentBorder: string; labelBg: string; labelText: string
}> = {
  trigger:   { iconBg: 'bg-amber-100',  iconBorder: 'border-amber-300',  iconColor: 'text-amber-600',  accentBorder: 'border-l-amber-400',  labelBg: 'bg-amber-100',  labelText: 'text-amber-700'  },
  action:    { iconBg: 'bg-blue-100',   iconBorder: 'border-blue-300',   iconColor: 'text-blue-600',   accentBorder: 'border-l-blue-400',   labelBg: 'bg-blue-100',   labelText: 'text-blue-700'   },
  loop:      { iconBg: 'bg-violet-100', iconBorder: 'border-violet-300', iconColor: 'text-violet-600', accentBorder: 'border-l-violet-400', labelBg: 'bg-violet-100', labelText: 'text-violet-700' },
  condition: { iconBg: 'bg-slate-200',  iconBorder: 'border-slate-300',  iconColor: 'text-slate-600',  accentBorder: 'border-l-slate-400',  labelBg: 'bg-slate-200',  labelText: 'text-slate-700'  },
  stop:      { iconBg: 'bg-red-100',    iconBorder: 'border-red-300',    iconColor: 'text-red-600',    accentBorder: 'border-l-red-400',    labelBg: 'bg-red-100',    labelText: 'text-red-700'    },
}

const NODE_ICONS: Record<FlowNodeType, React.FC<any>> = {
  trigger:   Zap,
  action:    Play,
  loop:      RefreshCw,
  condition: Clock,
  stop:      StopCircle,
}

const CATEGORY_ICONS: Record<string, React.FC<any>> = {
  outbound_voice: Phone,
  chatbot:        WhatsAppIcon,
  sync:           ArrowLeftRight,
}

const CATEGORY_BG: Record<string, string> = {
  outbound_voice: 'bg-blue-100',
  chatbot:        'bg-emerald-100',
  sync:           'bg-violet-100',
}

const CATEGORY_COLOR: Record<string, string> = {
  outbound_voice: 'text-blue-600',
  chatbot:        'text-emerald-600',
  sync:           'text-violet-600',
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  template: TemplateWithStatus
  onClose: () => void
}

export default function WorkflowDetailDrawer({ template, onClose }: Props) {
  const [showHistory, setShowHistory] = useState(false)

  if (showHistory && template.active_workflow_id) {
    return (
      <RunHistoryDrawer
        workflowId={template.active_workflow_id}
        workflowName={template.name}
        onClose={() => setShowHistory(false)}
      />
    )
  }

  const nodes        = buildFlowNodes(template)
  const hasSettings  = SETTINGS_PAGE_TEMPLATES.includes(template.id)
  const hasConfig    = !!template.active_workflow_id && Object.keys(template.config ?? {}).length > 0
  const CategoryIcon = CATEGORY_ICONS[template.category] ?? Zap
  const iconBg       = CATEGORY_BG[template.category] ?? 'bg-slate-100'
  const iconColor    = CATEGORY_COLOR[template.category] ?? 'text-slate-500'
  const channelLabel = CHANNEL_LABELS[template.channel] ?? template.channel
  const channelBadge = CHANNEL_BADGE[template.channel] ?? 'bg-slate-100 text-slate-600'
  const triggerLabel = TRIGGER_LABELS[template.trigger_type] ?? template.trigger_type

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Accent top bar */}
        <div className="h-1 w-full bg-gradient-to-r from-brand-400 via-brand-500 to-violet-500 shrink-0" />

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${iconBg}`}>
              <CategoryIcon size={22} className={iconColor} />
            </div>
            <div className="min-w-0 pt-0.5">
              <h3 className="font-semibold text-slate-800 text-base leading-tight">{template.name}</h3>
              <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                <span className={`text-[10px] font-medium rounded-full px-2 py-0.5 ${channelBadge}`}>
                  {channelLabel}
                </span>
                <span className="text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5">
                  ⚡ {triggerLabel}
                </span>
                {template.is_active ? (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5 font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Aktif
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 bg-slate-50 border border-slate-200 rounded-full px-2 py-0.5">
                    Pasif
                  </span>
                )}
              </div>
              {template.description && (
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">{template.description}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg p-1 transition-colors shrink-0 ml-2"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-5 space-y-6">

          {/* Flow diagram */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-0.5 h-4 bg-brand-400 rounded-full" />
              <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Akış Diyagramı
              </h4>
            </div>
            <div>
              {nodes.map((node, idx) => {
                const style    = NODE_STYLES[node.type]
                const NodeIcon = NODE_ICONS[node.type]
                return (
                  <div key={idx} className="flex items-start gap-3">
                    {/* Timeline column */}
                    <div className="flex flex-col items-center shrink-0 w-9">
                      <div className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center ${style.iconBg} ${style.iconBorder}`}>
                        <NodeIcon size={15} className={style.iconColor} />
                      </div>
                      {idx < nodes.length - 1 && (
                        <div className="w-px h-6 bg-gradient-to-b from-slate-300 to-slate-100 mt-0.5" />
                      )}
                    </div>
                    {/* Card */}
                    <div className={`flex-1 bg-white rounded-xl border border-slate-100 border-l-[3px] px-3.5 py-2.5 mb-2 shadow-sm ${style.accentBorder}`}>
                      <span className={`inline-flex items-center text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${style.labelBg} ${style.labelText}`}>
                        {node.label}
                      </span>
                      <p className="text-xs text-slate-700 mt-1 leading-relaxed">{node.detail}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Config summary — only for active workflows */}
          {hasConfig && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-0.5 h-4 bg-slate-300 rounded-full" />
                <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Mevcut Ayarlar
                </h4>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(template.config).slice(0, 8).map(([key, val]) => {
                  const field = template.config_fields.find(f => f.key === key)
                  if (!field) return null
                  let display = String(val)
                  if (field.options) {
                    const opt = field.options.find(o => String(o.value) === String(val))
                    if (opt) display = opt.label
                  }
                  if (field.unit) display = `${display} ${field.unit}`
                  return (
                    <div key={key} className="bg-white border border-slate-100 rounded-xl px-3.5 py-2.5 shadow-sm">
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">{field.label}</p>
                      <p className="text-sm text-slate-800 font-semibold mt-0.5 truncate">{display}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 py-3.5 border-t border-slate-100 bg-slate-50/60 flex items-center gap-2">
          {template.active_workflow_id && (
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 transition-colors shadow-sm"
            >
              <Clock size={12} />
              Geçmiş
            </button>
          )}
          {hasSettings && template.active_workflow_id && (
            <Link
              href={`/dashboard/workflows/${template.id}/settings`}
              className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-lg px-3 py-2 transition-colors font-medium shadow-sm"
            >
              <Settings2 size={12} />
              Ayarlar →
            </Link>
          )}
          <button
            onClick={onClose}
            className="ml-auto text-xs text-slate-500 hover:text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 transition-colors"
          >
            Kapat
          </button>
        </div>

      </div>
    </div>
  )
}
