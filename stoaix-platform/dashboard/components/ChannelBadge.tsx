import { MessageSquare, Phone, Instagram, RefreshCw, Globe } from 'lucide-react'

const CONFIG: Record<string, { icon: typeof MessageSquare; colors: string; label: string }> = {
  whatsapp:     { icon: MessageSquare, colors: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'WhatsApp' },
  voice:        { icon: Phone,         colors: 'bg-violet-50 text-violet-700 border-violet-200',    label: 'Voice' },
  instagram:    { icon: Instagram,     colors: 'bg-pink-50 text-pink-700 border-pink-200',          label: 'Instagram' },
  web:          { icon: Globe,         colors: 'bg-sky-50 text-sky-700 border-sky-200',              label: 'Web' },
  reactivation: { icon: RefreshCw,     colors: 'bg-orange-50 text-orange-700 border-orange-200',    label: 'Reactivation' },
}

interface Props {
  channel: string
  showLabel?: boolean
  size?: 'sm' | 'md'
}

export default function ChannelBadge({ channel, showLabel = true, size = 'sm' }: Props) {
  const cfg = CONFIG[channel] ?? { icon: MessageSquare, colors: 'bg-slate-100 text-slate-600 border-slate-200', label: channel }
  const Icon = cfg.icon
  const iconSize = size === 'sm' ? 10 : 13
  const textCls = size === 'sm' ? 'text-[10px]' : 'text-xs'
  const padCls = size === 'sm' ? 'px-1.5 py-0.5' : 'px-2 py-1'

  return (
    <span className={`inline-flex items-center gap-1 ${padCls} rounded border font-medium ${cfg.colors} ${textCls}`}>
      <Icon size={iconSize} />
      {showLabel && cfg.label}
    </span>
  )
}
