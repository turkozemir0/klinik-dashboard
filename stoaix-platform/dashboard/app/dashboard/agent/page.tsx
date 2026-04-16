'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Save, Loader2, Plus, Trash2, Bot, Sparkles, Mic, MessageSquare, ListChecks,
  FlaskConical, PhoneForwarded, Clock, ToggleLeft, ToggleRight, Lightbulb,
  ArrowUpRight, CheckCircle2, BookOpen, AlertTriangle, X, Lock, Star,
  ArrowLeft, ArrowRight, Info,
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import AgentTestPanel from '@/components/agent/AgentTestPanel'
import { VOICE_TEMPLATES, WHATSAPP_TEMPLATES } from '@/lib/agent-templates'
import type { AgentTemplate } from '@/lib/agent-templates'
import KnowledgeClient from '../knowledge/KnowledgeClient'
import type { KnowledgeItem } from '@/lib/types'

// ─── Knowledge tab content ────────────────────────────────────────────────────

function KnowledgeTabSection({ orgId }: { orgId: string }) {
  const [items, setItems] = useState<KnowledgeItem[]>([])
  const [sector, setSector] = useState('other')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [itemsRes, orgRes] = await Promise.all([
        supabase
          .from('knowledge_items')
          .select('id, organization_id, item_type, title, description_for_ai, data, tags, is_active, created_at, updated_at')
          .eq('organization_id', orgId)
          .order('updated_at', { ascending: false }),
        supabase.from('organizations').select('sector').eq('id', orgId).single(),
      ])
      setItems((itemsRes.data ?? []) as KnowledgeItem[])
      setSector(orgRes.data?.sector ?? 'other')
      setLoading(false)
    }
    load()
  }, [orgId])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-400 py-12 justify-center">
        <Loader2 size={16} className="animate-spin" /> Yükleniyor...
      </div>
    )
  }

  return <KnowledgeClient items={items} orgId={orgId} sector={sector} />
}

type Channel = 'voice' | 'whatsapp'
type EditorTab = 'settings' | 'modules' | 'routing' | 'test'

interface EditorView {
  channel: Channel
  templateId: string
  templateName: string
}

interface RoutingRule {
  id: string
  type: 'kb_fallback' | 'intent' | 'topic_note' | 'sentiment_note'
  tier: 1 | 2
  active: boolean
  priority: number
  keywords?: string[]
  transition_message?: string
  after_hours_message?: string
  note_message?: string
}

interface RoutingConfig {
  transfer_numbers: { primary?: string; voice_agent?: string }
  rules: RoutingRule[]
}

interface WorkingHours {
  weekdays?: string
  saturday?: string
  sunday?: string | null
  timezone?: string
}

interface PlaybookState {
  id?: string
  systemPrompt: string
  openingMessage: string
  blocks: { keywords: string; response: string }[]
  features: { calendar_booking: boolean; voice_language?: string; tts_voice_id?: string; model?: string }
  fewShots: { user: string; assistant: string }[]
  noKbMatch: string
}

const TONE_OPTIONS = [
  { value: 'warm-professional', label: 'Sıcak & Profesyonel' },
  { value: 'formal',            label: 'Resmi' },
  { value: 'friendly',          label: 'Samimi & Arkadaşça' },
  { value: 'energetic',         label: 'Enerjik' },
]

interface IntakeField {
  key: string
  label: string
  type: string
  priority: 'must' | 'should'
  voice_prompt?: string
}

const EMPTY: PlaybookState = {
  systemPrompt: '',
  openingMessage: '',
  blocks: [],
  features: { calendar_booking: false, voice_language: '', tts_voice_id: '' },
  fewShots: [],
  noKbMatch: '',
}

const VOICE_LANGUAGES = [
  { value: '',   label: 'Varsayılan (ai_persona dilinden alınır)' },
  { value: 'tr', label: '🇹🇷 Türkçe' },
  { value: 'en', label: '🇬🇧 English' },
  { value: 'de', label: '🇩🇪 Deutsch' },
  { value: 'fr', label: '🇫🇷 Français' },
  { value: 'es', label: '🇪🇸 Español' },
  { value: 'ar', label: '🇸🇦 العربية' },
  { value: 'nl', label: '🇳🇱 Nederlands' },
  { value: 'it', label: '🇮🇹 Italiano' },
  { value: 'pt', label: '🇵🇹 Português' },
  { value: 'pl', label: '🇵🇱 Polski' },
]

const VOICE_MODEL_OPTIONS = [
  { value: 'claude-sonnet-4-6',        label: 'Claude Sonnet 4.6 (Önerilen)' },
  { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 (Hızlı)' },
  { value: 'gpt-4o-mini',              label: 'GPT-4o Mini' },
  { value: 'gpt-4o',                   label: 'GPT-4o' },
]

const CHAT_MODEL_OPTIONS = [
  { value: 'gpt-4o-mini',              label: 'GPT-4o Mini (Önerilen)' },
  { value: 'gpt-4o',                   label: 'GPT-4o' },
  { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
  { value: 'claude-sonnet-4-6',        label: 'Claude Sonnet 4.6' },
]

interface ImprovementTip {
  id: string
  title: string
  body: string
  badge: string
  tone: 'info' | 'success' | 'warning'
  action?: { label: string; onClick: () => void }
}

const tipToneStyles: Record<ImprovementTip['tone'], string> = {
  info: 'border-sky-200 bg-sky-50/80 text-sky-700',
  success: 'border-emerald-200 bg-emerald-50/80 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50/80 text-amber-700',
}

function AgentPageInner() {
  const searchParams = useSearchParams()
  const initialPageTab = searchParams.get('tab') === 'knowledge' ? 'knowledge' : 'agent'
  const [pageTab, setPageTab] = useState<'agent' | 'knowledge'>(initialPageTab as 'agent' | 'knowledge')

  const [orgId, setOrgId] = useState('')
  const [loading, setLoading] = useState(true)

  // Phase state
  const [editorView, setEditorView] = useState<EditorView | null>(null)
  const [editorTab, setEditorTab] = useState<EditorTab>('settings')
  const [hasVoiceEntitlement, setHasVoiceEntitlement] = useState(true)

  const [voice, setVoice] = useState<PlaybookState>(EMPTY)
  const [whatsapp, setWhatsapp] = useState<PlaybookState>(EMPTY)

  const [voiceIntake, setVoiceIntake]       = useState<IntakeField[]>([])
  const [whatsappIntake, setWhatsappIntake] = useState<IntakeField[]>([])
  const [voiceIntakeId, setVoiceIntakeId]   = useState<string | null>(null)
  const [waIntakeId, setWaIntakeId]         = useState<string | null>(null)

  const [suggestions, setSuggestions]                   = useState<IntakeField[]>([])
  const [selectedSuggestions, setSelectedSuggestions]   = useState<Set<string>>(new Set())
  const [suggesting, setSuggesting]                     = useState(false)
  const [savingIntake, setSavingIntake]                 = useState<boolean>(false)
  const [intakeSaved, setIntakeSaved]                   = useState(false)

  const [kbCount, setKbCount]               = useState(0)
  const [activeTipIndex, setActiveTipIndex] = useState(0)
  const [generating, setGenerating]         = useState(false)
  const [saving, setSaving]                 = useState(false)
  const [savedChannel, setSavedChannel]     = useState<Channel | null>(null)
  const [orgName, setOrgName]               = useState('')
  const [voiceActive, setVoiceActive]       = useState(false)
  const [hasCalendar, setHasCalendar]       = useState(false)
  const [calendarWarning, setCalendarWarning] = useState(false)
  const [error, setError]                   = useState('')
  const [persona, setPersona]               = useState({ name: '', tone: 'warm-professional' })

  // Routing state
  const [routingConfig, setRoutingConfig] = useState<RoutingConfig>({ transfer_numbers: {}, rules: [] })
  const [workingHours, setWorkingHours]   = useState<WorkingHours>({
    weekdays: '09:30-19:00', saturday: '10:00-17:00', sunday: null, timezone: 'Europe/Istanbul',
  })
  const [savingRouting, setSavingRouting] = useState(false)
  const [routingSaved, setRoutingSaved]   = useState(false)

  // Computed
  const activeChannel: Channel = editorView?.channel ?? 'voice'
  const current    = activeChannel === 'voice' ? voice : whatsapp
  const setCurrent = (fn: (prev: PlaybookState) => PlaybookState) =>
    activeChannel === 'voice' ? setVoice(fn) : setWhatsapp(fn)

  const currentIntake    = activeChannel === 'voice' ? voiceIntake : whatsappIntake
  const setCurrentIntake = activeChannel === 'voice' ? setVoiceIntake : setWhatsappIntake
  const currentIntakeId  = activeChannel === 'voice' ? voiceIntakeId : waIntakeId

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return

      let resolvedOrgId = ''
      const { data: ou } = await supabase
        .from('org_users')
        .select('organization_id')
        .eq('user_id', data.user.id)
        .maybeSingle()

      if (ou) {
        resolvedOrgId = ou.organization_id
      } else {
        const { data: firstOrg } = await supabase
          .from('organizations')
          .select('id')
          .eq('status', 'active')
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle()
        if (firstOrg) resolvedOrgId = firstOrg.id
      }

      if (!resolvedOrgId) { setLoading(false); return }
      setOrgId(resolvedOrgId)

      // Her iki kanalı da yükle
      const { data: playbooks } = await supabase
        .from('agent_playbooks')
        .select('id, channel, system_prompt_template, opening_message, hard_blocks, features, few_shot_examples, fallback_responses')
        .eq('organization_id', resolvedOrgId)
        .eq('is_active', true)
        .in('channel', ['voice', 'whatsapp', 'chat', 'all'])
        .order('version', { ascending: false })

      const parsePlaybook = (pb: any): PlaybookState => ({
        id: pb.id,
        systemPrompt: pb.system_prompt_template || '',
        openingMessage: pb.opening_message || '',
        blocks: (Array.isArray(pb.hard_blocks) ? pb.hard_blocks : []).map((b: any) => ({
          keywords: Array.isArray(b.keywords) ? b.keywords.join(', ') : '',
          response: b.response || '',
        })),
        features: pb.features ?? { calendar_booking: false },
        fewShots: (Array.isArray(pb.few_shot_examples) ? pb.few_shot_examples : []).map((ex: any) => ({
          user: ex.user || '',
          assistant: ex.assistant || '',
        })),
        noKbMatch: (pb.fallback_responses as any)?.no_kb_match || '',
      })

      if (playbooks) {
        const voicePb    = playbooks.find(p => p.channel === 'voice')    || playbooks.find(p => p.channel === 'all')
        const whatsappPb = playbooks.find(p => p.channel === 'whatsapp') || playbooks.find(p => p.channel === 'chat') || playbooks.find(p => p.channel === 'all')
        if (voicePb)    setVoice(parsePlaybook(voicePb))
        if (whatsappPb) setWhatsapp(parsePlaybook(whatsappPb))
      }

      // Intake schema yükle
      const { data: schemas } = await supabase
        .from('intake_schemas')
        .select('id, channel, fields')
        .eq('organization_id', resolvedOrgId)
        .in('channel', ['voice', 'whatsapp'])

      if (schemas) {
        const vs = schemas.find(s => s.channel === 'voice')
        const ws = schemas.find(s => s.channel === 'whatsapp')
        if (vs) { setVoiceIntake(vs.fields ?? []); setVoiceIntakeId(vs.id) }
        if (ws) { setWhatsappIntake(ws.fields ?? []); setWaIntakeId(ws.id) }
      }

      // KB item sayısını çek
      const { count } = await supabase
        .from('knowledge_items')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', resolvedOrgId)
        .eq('is_active', true)
      setKbCount(count ?? 0)

      // Voice aktif mi? + ai_persona yükle
      const { data: orgData } = await supabase
        .from('organizations')
        .select('name, channel_config, ai_persona')
        .eq('id', resolvedOrgId)
        .single()
      const cc = (orgData?.channel_config ?? {}) as Record<string, any>
      setVoiceActive(cc?.voice_inbound?.active === true || cc?.voice_outbound?.active === true)
      setHasCalendar(cc?.calendar?.provider != null)
      const ap = (orgData?.ai_persona ?? {}) as Record<string, any>
      setPersona({ name: ap.persona_name || '', tone: ap.tone || 'warm-professional' })
      setOrgName(orgData?.name || '')

      // Routing config yükle
      try {
        const rRes = await fetch('/api/agent/routing-rules')
        if (rRes.ok) {
          const rData = await rRes.json()
          if (rData.routing_rules) setRoutingConfig(rData.routing_rules)
          if (rData.working_hours && Object.keys(rData.working_hours).length) setWorkingHours(rData.working_hours)
        }
      } catch {}

      // Billing entitlements
      try {
        const limRes = await fetch('/api/billing/limits')
        if (limRes.ok) {
          const limData = await limRes.json()
          setHasVoiceEntitlement(limData.entitlements?.voice_agent_inbound?.enabled ?? true)
        }
      } catch {}

      setLoading(false)
    })
  }, [])

  async function handleGenerate() {
    setGenerating(true)
    setError('')
    try {
      const res = await fetch('/api/agent/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: activeChannel }),
      })
      if (!res.ok) throw new Error('Üretim başarısız')
      const { system_prompt } = await res.json()
      setCurrent(prev => ({ ...prev, systemPrompt: system_prompt }))
    } catch {
      setError('Prompt üretilemedi. Lütfen tekrar deneyin.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleSave() {
    if (!orgId) return
    setSaving(true)
    setError('')

    const hard_blocks = current.blocks
      .filter(b => b.keywords.trim())
      .map((b, i) => ({
        trigger_id: `block_${i}`,
        action: 'soft_block',
        keywords: b.keywords.split(',').map(k => k.trim()).filter(Boolean),
        response: b.response.trim(),
      }))

    const few_shot_examples = current.fewShots
      .filter(ex => ex.user.trim() && ex.assistant.trim())
      .map(ex => ({ user: ex.user.trim(), assistant: ex.assistant.trim() }))

    const fallback_responses = { no_kb_match: current.noKbMatch.trim() || null }

    const supabase = createClient()

    // Persona (org-level) kaydet
    const { data: orgRow } = await supabase
      .from('organizations')
      .select('ai_persona')
      .eq('id', orgId)
      .single()
    const existingPersona = (orgRow?.ai_persona ?? {}) as Record<string, any>
    await supabase
      .from('organizations')
      .update({ ai_persona: { ...existingPersona, persona_name: persona.name, tone: persona.tone } })
      .eq('id', orgId)

    if (current.id) {
      const { error: err } = await supabase
        .from('agent_playbooks')
        .update({
          system_prompt_template: current.systemPrompt,
          opening_message: current.openingMessage || null,
          hard_blocks,
          features: current.features,
          few_shot_examples,
          fallback_responses,
          updated_at: new Date().toISOString(),
        })
        .eq('id', current.id)
      if (err) { setError('Kaydedilemedi.'); setSaving(false); return }
    } else {
      const { data: inserted, error: err } = await supabase
        .from('agent_playbooks')
        .insert({
          organization_id: orgId,
          channel: activeChannel,
          name: activeChannel === 'voice' ? 'Sesli Asistan' : 'WhatsApp/Chat Asistanı',
          system_prompt_template: current.systemPrompt,
          opening_message: current.openingMessage || null,
          hard_blocks,
          features: current.features,
          few_shot_examples,
          fallback_responses,
          version: 1,
          is_active: true,
        })
        .select('id')
        .single()
      if (err) { setError('Kaydedilemedi.'); setSaving(false); return }
      if (inserted) setCurrent(prev => ({ ...prev, id: inserted.id }))
    }

    setSaving(false)
    setSavedChannel(activeChannel)
    setTimeout(() => setSavedChannel(null), 3000)
  }

  async function handleSuggestIntake() {
    setSuggesting(true)
    setSuggestions([])
    setSelectedSuggestions(new Set())
    try {
      const res = await fetch('/api/agent/suggest-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: activeChannel }),
      })
      if (!res.ok) throw new Error()
      const { fields } = await res.json()
      setSuggestions(fields ?? [])
      setSelectedSuggestions(new Set((fields ?? []).map((f: IntakeField) => f.key)))
    } catch {
      setError('Öneri üretilemedi. Lütfen tekrar deneyin.')
    } finally {
      setSuggesting(false)
    }
  }

  function addSelectedSuggestions() {
    const existingKeys = new Set(currentIntake.map(f => f.key))
    const toAdd = suggestions.filter(f => selectedSuggestions.has(f.key) && !existingKeys.has(f.key))
    setCurrentIntake(prev => [...prev, ...toAdd])
    setSuggestions([])
    setSelectedSuggestions(new Set())
  }

  function removeIntakeField(i: number) {
    setCurrentIntake(prev => prev.filter((_, idx) => idx !== i))
  }

  async function handleSaveIntake() {
    if (!orgId) return
    setSavingIntake(true)
    const supabase = createClient()
    const ch      = activeChannel
    const fields  = currentIntake

    if (currentIntakeId) {
      await supabase
        .from('intake_schemas')
        .update({ fields, updated_at: new Date().toISOString() })
        .eq('id', currentIntakeId)
    } else {
      const { data: inserted } = await supabase
        .from('intake_schemas')
        .insert({
          organization_id: orgId,
          channel: ch,
          name: `${ch === 'voice' ? 'Sesli' : 'WhatsApp'} Başvuru Formu`,
          fields,
        })
        .select('id')
        .single()
      if (inserted) {
        ch === 'voice' ? setVoiceIntakeId(inserted.id) : setWaIntakeId(inserted.id)
      }
    }
    setSavingIntake(false)
    setIntakeSaved(true)
    setTimeout(() => setIntakeSaved(false), 3000)
  }

  async function handleSaveRouting() {
    setSavingRouting(true)
    try {
      const res = await fetch('/api/agent/routing-rules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routing_rules: routingConfig, working_hours: workingHours }),
      })
      if (!res.ok) throw new Error()
      setRoutingSaved(true)
      setTimeout(() => setRoutingSaved(false), 3000)
    } catch {
      setError('Kaydedilemedi.')
    } finally {
      setSavingRouting(false)
    }
  }

  function applyTemplate(t: AgentTemplate, channel?: Channel) {
    const ch = channel ?? activeChannel
    const data = { ...t.playbook }
    if (t.requiresCalendar && !hasCalendar) {
      data.features = { ...data.features, calendar_booking: false }
      setCalendarWarning(true)
    }
    // Placeholder substitution — persona.name ve orgName henüz boşsa placeholder kalır
    const sub = (s: string) =>
      s.replace(/\{PERSONA_ADI\}/g, persona.name || '{PERSONA_ADI}')
       .replace(/\{KLINIK_ADI\}/g,  orgName      || '{KLINIK_ADI}')
    data.systemPrompt   = sub(data.systemPrompt)
    data.openingMessage = sub(data.openingMessage)
    if (ch === 'voice')    setVoice(prev    => ({ ...prev, ...data }))
    if (ch === 'whatsapp') setWhatsapp(prev => ({ ...prev, ...data }))
  }

  function openEditor(channel: Channel, t: AgentTemplate | 'custom') {
    if (t !== 'custom') {
      applyTemplate(t as AgentTemplate, channel)
    }
    const name = t === 'custom' ? 'Özelleştirilmiş' : (t as AgentTemplate).name
    const id   = t === 'custom' ? 'custom' : (t as AgentTemplate).id
    setEditorView({ channel, templateId: id, templateName: name })
    setEditorTab('settings')
  }

  function closeEditor() {
    setEditorView(null)
  }

  function updateRule(idx: number, patch: Partial<RoutingRule>) {
    setRoutingConfig(prev => ({
      ...prev,
      rules: prev.rules.map((r, i) => i === idx ? { ...r, ...patch } : r),
    }))
  }

  function addBlock() {
    setCurrent(prev => ({ ...prev, blocks: [...prev.blocks, { keywords: '', response: '' }] }))
  }

  function removeBlock(i: number) {
    setCurrent(prev => ({ ...prev, blocks: prev.blocks.filter((_, idx) => idx !== i) }))
  }

  function updateBlock(i: number, field: 'keywords' | 'response', val: string) {
    setCurrent(prev => ({
      ...prev,
      blocks: prev.blocks.map((b, idx) => idx === i ? { ...b, [field]: val } : b),
    }))
  }

  const fewShotMax = activeChannel === 'voice' ? 3 : 5

  function addFewShot() {
    if (current.fewShots.length >= fewShotMax) return
    setCurrent(prev => ({ ...prev, fewShots: [...prev.fewShots, { user: '', assistant: '' }] }))
  }

  function removeFewShot(i: number) {
    setCurrent(prev => ({ ...prev, fewShots: prev.fewShots.filter((_, idx) => idx !== i) }))
  }

  function updateFewShot(i: number, field: 'user' | 'assistant', val: string) {
    setCurrent(prev => ({
      ...prev,
      fewShots: prev.fewShots.map((ex, idx) => idx === i ? { ...ex, [field]: val } : ex),
    }))
  }

  // Computed values — before loading check so hooks are always called in same order
  const promptLength    = current.systemPrompt.trim().length
  const intakeMustCount = currentIntake.filter(f => f.priority === 'must').length

  const improvementTips: ImprovementTip[] = [
    ...(kbCount < 12 ? [{
      id: 'kb-depth',
      title: 'Bilgi bankasını derinleştir',
      body: 'Asistanın güven veren cevaplar vermesi için hizmet, fiyat, süreç ve sık sorulan sorular tarafında daha fazla bilgi ekleyin. Az veriyle iyi görünür; çok veriyle etkileyici çalışır.',
      badge: 'Knowledge base',
      tone: 'warning' as const,
      action: { label: 'Knowledge base\'e geç', onClick: () => window.location.assign('/dashboard/knowledge') },
    }] : [{
      id: 'kb-healthy',
      title: 'Bilgi bankası iyi durumda',
      body: `${kbCount} aktif kayıt mevcut. Tekrar eden soruları knowledge base başlıklarına dönüştürmek kaliteyi daha da artırır.`,
      badge: `${kbCount} aktif kayıt`,
      tone: 'success' as const,
    }]),
    ...(promptLength < 500 ? [{
      id: 'prompt-depth',
      title: 'Talimatları biraz daha netleştir',
      body: 'Kısa promptlar çalışır ama "premium" his veren cevaplar için hedef, sınır, ton ve handoff kurallarını daha görünür yazmak fark yaratır.',
      badge: 'Prompt kalitesi',
      tone: 'warning' as const,
    }] : [{
      id: 'prompt-strong',
      title: 'Talimat katmanı güçlü',
      body: 'Talimat uzunluğu yeterli tarafta. Bir sonraki kalite artışı gerçek müşteri mesajlarından örnek konuşmalar eklemekten gelir.',
      badge: 'Prompt olgunluğu',
      tone: 'success' as const,
    }]),
    ...(currentIntake.length < 4 ? [{
      id: 'intake-missing',
      title: 'Veri toplama alanları eksik',
      body: 'Asistan ne kadar doğru veri toplarsa handoff o kadar kaliteli görünür. İsim, telefon, ihtiyaç gibi çekirdek alanlar tanımlı olsun.',
      badge: 'Intake schema',
      tone: 'warning' as const,
    }] : [{
      id: 'intake-strong',
      title: 'Veri toplama akışı kurulmuş',
      body: 'Alan sayısı iyi. Zorunlu alanları gözden geçirip kritik bilgileri "must" yapmanız kaliteyi yükseltir.',
      badge: `${currentIntake.length} alan`,
      tone: 'success' as const,
    }]),
    ...(current.blocks.length === 0 ? [{
      id: 'guardrails',
      title: 'Kırmızı çizgileri tanımla',
      body: 'Rakip, hukuki konu, net fiyat garantisi veya iade gibi hassas başlıklarda hazır sınırlar tanımlamak asistanı daha güvenli ve profesyonel gösterir.',
      badge: 'Risk kontrolü',
      tone: 'info' as const,
    }] : [{
      id: 'guardrails-ready',
      title: 'Kırmızı çizgiler tanımlı',
      body: 'Sınır blokları mevcut. Yeni kanallar veya güncel mevzuat değiştikçe bu listeyi güncel tutmak yeterli.',
      badge: `${current.blocks.length} blok`,
      tone: 'success' as const,
    }]),
  ]

  const quickWins = [
    { label: 'Knowledge base kapsamı', value: kbCount < 12 ? 'Geliştirilmeli' : 'İyi', icon: BookOpen },
    { label: 'Zorunlu intake alanı',   value: `${intakeMustCount}`,                    icon: ListChecks },
    { label: 'Prompt uzunluğu',        value: promptLength < 500 ? 'Geliştirilmeli' : 'İyi', icon: MessageSquare },
  ]

  // useEffect MUST be before early return (Rules of Hooks)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (improvementTips.length <= 1) { setActiveTipIndex(0); return }
    const id = window.setInterval(() => setActiveTipIndex(p => (p + 1) % improvementTips.length), 6500)
    return () => window.clearInterval(id)
  }, [improvementTips.length])

  const activeTip = improvementTips[activeTipIndex] || improvementTips[0]

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-2 text-slate-400 text-sm">
        <Loader2 size={16} className="animate-spin" /> Yükleniyor...
      </div>
    )
  }

  const isSaved = savedChannel === activeChannel

  // ─── Tab nav helper ───────────────────────────────────────────────────────
  const pageTabs = [
    { key: 'agent',     label: 'AI Asistan',    icon: Bot },
    { key: 'knowledge', label: 'Bilgi Bankası',  icon: BookOpen },
  ] as const

  // ─── PHASE 1 ──────────────────────────────────────────────────────────────
  if (!editorView) {
    if (pageTab === 'knowledge') {
      return (
        <div className="p-6 space-y-6">
          {/* Header + Tab nav */}
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Bot size={20} className="text-brand-500" /> AI Asistan
            </h1>
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
              {pageTabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setPageTab(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pageTab === tab.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <tab.icon size={14} /> {tab.label}
                </button>
              ))}
            </div>
          </div>
          <KnowledgeTabSection orgId={orgId} />
        </div>
      )
    }

    return (
      <div className="p-6 space-y-8">
        {/* Header + Tab nav */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Bot size={20} className="text-brand-500" /> AI Asistan
          </h1>
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
            {pageTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setPageTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pageTab === tab.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <tab.icon size={14} /> {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Yapılandırılmış asistanlar */}
        {(voice.id || whatsapp.id) && (
          <section className="space-y-3">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Yapılandırılmış Asistanlar
            </h2>
            <div className="flex flex-wrap gap-4">
              {voice.id && (
                <ConfiguredCard channel="voice" onClick={() => openEditor('voice', 'custom')} />
              )}
              {whatsapp.id && (
                <ConfiguredCard channel="whatsapp" onClick={() => openEditor('whatsapp', 'custom')} />
              )}
            </div>
          </section>
        )}

        {/* Sesli şablonlar */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Sesli Görüşme</h2>
            {!hasVoiceEntitlement && (
              <a
                href="/dashboard/billing"
                className="text-xs text-brand-600 font-medium flex items-center gap-1 hover:text-brand-700"
              >
                <Lock size={11} /> Paketi Yükselt
              </a>
            )}
          </div>
          <div className="flex flex-wrap gap-4">
            {VOICE_TEMPLATES.map(t => (
              <Phase1Card
                key={t.id}
                template={t}
                locked={!hasVoiceEntitlement}
                hasCalendar={hasCalendar}
                onClick={() => openEditor('voice', t)}
              />
            ))}
          </div>
        </section>

        {/* WA şablonlar */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">Mesajlaşma (WhatsApp)</h2>
          <div className="flex flex-wrap gap-4">
            {WHATSAPP_TEMPLATES.map(t => (
              <Phase1Card
                key={t.id}
                template={t}
                locked={false}
                hasCalendar={hasCalendar}
                onClick={() => openEditor('whatsapp', t)}
              />
            ))}
          </div>
        </section>
      </div>
    )
  }

  // ─── PHASE 2 ──────────────────────────────────────────────────────────────
  const tabClass = (tab: EditorTab) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      editorTab === tab
        ? 'bg-white text-slate-900 shadow-sm'
        : 'text-slate-500 hover:text-slate-700'
    }`

  const saveBusy   = editorTab === 'routing' ? savingRouting : saving
  const saveOk     = editorTab === 'routing' ? routingSaved  : isSaved
  const onSaveClick = editorTab === 'routing' ? handleSaveRouting : handleSave

  return (
    <div className="p-6 xl:grid xl:grid-cols-[1fr_300px] xl:gap-8 xl:items-start">
      <div className="space-y-6">

        {/* Back nav + header + save */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={closeEditor}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft size={15} /> Asistanlar
            </button>
            <span className="text-slate-200">|</span>
            <h1 className="text-base font-semibold text-slate-900">
              {editorView.templateName}
              <span className="text-slate-400 font-normal ml-1.5">
                · {editorView.channel === 'voice' ? 'Sesli Görüşme' : 'Mesajlaşma'}
              </span>
            </h1>
          </div>
          {editorTab !== 'test' && (
            <button
              onClick={onSaveClick}
              disabled={saveBusy}
              className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
            >
              {saveBusy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saveOk ? 'Kaydedildi ✓' : 'Kaydet'}
            </button>
          )}
        </div>

        {/* Editor tabs */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
          <button onClick={() => setEditorTab('settings')} className={tabClass('settings')}>
            <Bot size={15} /> Ayarlar
          </button>
          <button onClick={() => setEditorTab('modules')} className={tabClass('modules')}>
            <ToggleRight size={15} /> Modüller
          </button>
          {editorView.channel === 'voice' && voiceActive && (
            <button onClick={() => setEditorTab('routing')} className={tabClass('routing')}>
              <PhoneForwarded size={15} /> Arama Kuralları
            </button>
          )}
          <button onClick={() => setEditorTab('test')} className={tabClass('test')}>
            <FlaskConical size={15} /> Test Et
          </button>
        </div>

        {/* ── AYARLAR TAB ───────────────────────────────────────────────── */}
        {editorTab === 'settings' && (
          <>
            {/* Takvim bağlantısı uyarısı */}
            {calendarWarning && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle size={15} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800">Takvim bağlantısı gerekiyor</p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    Randevu alma özelliği devre dışı bırakıldı. Aktifleştirmek için takvim bağlayın.{' '}
                    <a href="/dashboard/settings" className="underline font-medium">Ayarlar → Takvim</a>
                  </p>
                </div>
                <button onClick={() => setCalendarWarning(false)} className="text-amber-400 hover:text-amber-600 transition-colors">
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Asistan Kimliği */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Bot size={15} className="text-brand-500" /> Asistan Kimliği
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tüm kanallar için geçerli. Sesli ve mesajlaşma asistanı aynı kimliği kullanır.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Asistan adı</label>
                  <input
                    value={persona.name}
                    onChange={e => setPersona(p => ({ ...p, name: e.target.value }))}
                    placeholder="örn: Elif, Arda, AI Asistan"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Konuşma tonu</label>
                  <select
                    value={persona.tone}
                    onChange={e => setPersona(p => ({ ...p, tone: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  >
                    {TONE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* İlk Karşılama Mesajı — sadece voice */}
            {editorView.channel === 'voice' && (
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-800">İlk Karşılama Mesajı</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Çağrı bağlandığında asistanın söyleyeceği ilk cümle. Boş bırakılırsa varsayılan mesaj kullanılır.
                  </p>
                </div>
                <input
                  type="text"
                  value={current.openingMessage}
                  onChange={e => setCurrent(prev => ({ ...prev, openingMessage: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Merhaba! Şirketinizi aradınız, ben Asistan. Nasıl yardımcı olabilirim?"
                />
              </div>
            )}

            {/* Asistan Talimatları */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-800">Asistan Talimatları</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {editorView.channel === 'voice'
                      ? 'Asistanın kimliğini, görevini ve sesli konuşma davranışını tanımlar.'
                      : 'Asistanın kimliğini, görevini ve mesajlaşma davranışını tanımlar.'}
                  </p>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 border border-brand-200 bg-brand-50 hover:bg-brand-100 text-brand-600 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {generating ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                  {generating ? 'Üretiliyor...' : 'AI ile Oluştur'}
                </button>
              </div>
              <textarea
                value={current.systemPrompt}
                onChange={e => setCurrent(prev => ({ ...prev, systemPrompt: e.target.value }))}
                rows={14}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none font-mono leading-relaxed"
                placeholder={
                  editorView.channel === 'voice'
                    ? 'Asistanın kim olduğunu, ne yapacağını ve sesli konuşma kurallarını yazın...'
                    : 'Asistanın kim olduğunu, ne yapacağını ve mesajlaşma davranışını yazın...'
                }
              />
              {editorView.channel === 'voice' && (
                <p className="text-xs text-slate-400">
                  💡 Sayı okuma kuralları, bilgi bankası ve veri toplama talimatları runtime&apos;da otomatik eklenir — buraya yazmanıza gerek yok.
                </p>
              )}
            </div>

            {/* Veri Toplama Alanları */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <ListChecks size={15} className="text-brand-500" />
                    Veri Toplama Alanları
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Asistanın konuşma sırasında müşteriden topladığı bilgiler.
                    {editorView.channel === 'whatsapp' && ' Telefon numarası WhatsApp\'tan otomatik alınır.'}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={handleSuggestIntake}
                    disabled={suggesting}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-brand-200 bg-brand-50 hover:bg-brand-100 text-brand-600 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    {suggesting ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                    {suggesting ? 'Üretiliyor...' : 'AI Öner'}
                  </button>
                  <button
                    onClick={handleSaveIntake}
                    disabled={savingIntake}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    {savingIntake ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                    {intakeSaved ? 'Kaydedildi ✓' : 'Kaydet'}
                  </button>
                </div>
              </div>

              {currentIntake.length === 0 ? (
                <p className="text-sm text-slate-400 py-1">Henüz alan eklenmemiş. AI Öner butonunu kullanın.</p>
              ) : (
                <div className="space-y-2">
                  {currentIntake.map((field, i) => (
                    <div key={field.key} className="flex items-center gap-3 px-3 py-2.5 border border-slate-100 rounded-lg bg-slate-50">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-slate-700">{field.label}</span>
                        <span className="ml-2 text-xs text-slate-400">{field.key}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                        field.priority === 'must' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {field.priority === 'must' ? 'Zorunlu' : 'Opsiyonel'}
                      </span>
                      <button onClick={() => removeIntakeField(i)} className="text-slate-300 hover:text-red-400 transition-colors flex-shrink-0">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {suggestions.length > 0 && (
                <div className="border border-brand-100 rounded-xl p-4 bg-brand-50 space-y-3">
                  <p className="text-xs font-semibold text-brand-700">
                    AI Önerileri — eklemek istediklerini seç:
                  </p>
                  <div className="space-y-2">
                    {suggestions.map(f => (
                      <label key={f.key} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedSuggestions.has(f.key)}
                          onChange={e => {
                            const next = new Set(selectedSuggestions)
                            e.target.checked ? next.add(f.key) : next.delete(f.key)
                            setSelectedSuggestions(next)
                          }}
                          className="rounded border-brand-300 text-brand-600"
                        />
                        <span className="text-sm text-slate-700 flex-1">{f.label}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          f.priority === 'must' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {f.priority === 'must' ? 'Zorunlu' : 'Opsiyonel'}
                        </span>
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={addSelectedSuggestions}
                      disabled={selectedSuggestions.size === 0}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
                    >
                      <Plus size={13} />
                      Seçilenleri Ekle ({selectedSuggestions.size})
                    </button>
                    <button
                      onClick={() => { setSuggestions([]); setSelectedSuggestions(new Set()) }}
                      className="px-3 py-1.5 text-slate-500 hover:text-slate-700 text-xs font-medium"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Koruma Blokları */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">Konuşulmaması Gereken Konular</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Bu anahtar kelimeler geçtiğinde asistan otomatik olarak belirlenen yanıtı verir.
                </p>
              </div>

              {current.blocks.length === 0 && (
                <p className="text-sm text-slate-400 py-2">Henüz kural eklenmemiş.</p>
              )}

              <div className="space-y-3">
                {current.blocks.map((b, i) => (
                  <div key={i} className="border border-slate-100 rounded-xl p-4 space-y-3 bg-slate-50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-2">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">
                            Tetikleyen kelimeler <span className="text-slate-400">(virgülle ayır)</span>
                          </label>
                          <input
                            value={b.keywords}
                            onChange={e => updateBlock(i, 'keywords', e.target.value)}
                            placeholder="örn: rakip firma, iade, hukuk"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Verilecek yanıt</label>
                          <input
                            value={b.response}
                            onChange={e => updateBlock(i, 'response', e.target.value)}
                            placeholder="Bu konuda yardımcı olamıyorum, danışmanımıza bağlayayım."
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => removeBlock(i)}
                        className="text-slate-300 hover:text-red-400 transition-colors mt-1 flex-shrink-0"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={addBlock}
                className="flex items-center gap-1.5 text-sm text-brand-600 font-medium hover:text-brand-700"
              >
                <Plus size={15} /> Kural Ekle
              </button>
            </div>

            {/* KB Boş Yanıtı */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">Bilgi Bulunamadığında Yanıt</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Bilgi tabanında eşleşme bulunamazsa asistanın söyleyeceği mesaj. Boş bırakılırsa varsayılan kullanılır.
                </p>
              </div>
              <textarea
                value={current.noKbMatch}
                onChange={e => setCurrent(prev => ({ ...prev, noKbMatch: e.target.value }))}
                placeholder="örn: Bu konuda elimde net bilgi yok. Uzman ekibimiz en kısa sürede sizinle iletişime geçecek."
                rows={2}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>

            {/* Örnek Diyaloglar */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">Örnek Diyaloglar</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  AI&apos;ın taklit edeceği ideal konuşma örnekleri — maks {fewShotMax} örnek ({editorView.channel === 'voice' ? 'sesli' : 'chat'} için).
                </p>
              </div>

              {current.fewShots.length === 0 && (
                <p className="text-sm text-slate-400 py-2">Henüz örnek eklenmemiş.</p>
              )}

              <div className="space-y-3">
                {current.fewShots.map((ex, i) => (
                  <div key={i} className="border border-slate-100 rounded-xl p-4 space-y-3 bg-slate-50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-2">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Kullanıcı</label>
                          <input
                            value={ex.user}
                            onChange={e => updateFewShot(i, 'user', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Asistan</label>
                          <textarea
                            value={ex.assistant}
                            onChange={e => updateFewShot(i, 'assistant', e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => removeFewShot(i)}
                        className="text-slate-300 hover:text-red-400 transition-colors mt-1 flex-shrink-0"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={addFewShot}
                disabled={current.fewShots.length >= fewShotMax}
                className="flex items-center gap-1.5 text-sm text-brand-600 font-medium hover:text-brand-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus size={15} />
                Örnek Ekle {current.fewShots.length > 0 && `(${current.fewShots.length}/${fewShotMax})`}
              </button>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{error}</p>
            )}
          </>
        )}

        {/* ── MODÜLLER TAB ─────────────────────────────────────────────────── */}
        {editorTab === 'modules' && (
          <div className="space-y-4">
            {/* Randevu Alma */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex items-start gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800">Randevu Alma</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Müşteri randevu talep edince takvimden uygun saatleri gösterir ve randevu oluşturur.
                </p>
                {!hasCalendar && current.features.calendar_booking && (
                  <p className="text-xs text-amber-500 mt-1 flex items-center gap-1">
                    <AlertTriangle size={11} /> Takvim bağlı değil ·{' '}
                    <a href="/dashboard/settings" className="underline">Ayarlar → Takvim</a>
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setCurrent(prev => ({
                  ...prev,
                  features: { ...prev.features, calendar_booking: !prev.features.calendar_booking },
                }))}
                className="flex-shrink-0 mt-0.5"
              >
                {current.features.calendar_booking
                  ? <ToggleRight size={24} className="text-brand-500" />
                  : <ToggleLeft size={24} className="text-slate-300" />}
              </button>
            </div>

            {/* Sesli Dil — voice only */}
            {editorView.channel === 'voice' && (
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex items-start gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">Sesli Dil</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Deepgram STT ve Cartesia TTS bu dili kullanır.
                  </p>
                </div>
                <select
                  value={current.features.voice_language ?? ''}
                  onChange={e => setCurrent(prev => ({
                    ...prev,
                    features: { ...prev.features, voice_language: e.target.value },
                  }))}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {VOICE_LANGUAGES.map(l => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* TTS Ses Tonu — voice only */}
            {editorView.channel === 'voice' && (
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex items-start gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">TTS Ses Tonu</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Cartesia Voice ID.{' '}
                    <a href="https://play.cartesia.ai" target="_blank" rel="noreferrer" className="text-brand-500 hover:underline">
                      play.cartesia.ai
                    </a>{' '}
                    üzerinden kopyalayın.
                  </p>
                </div>
                <input
                  value={current.features.tts_voice_id ?? ''}
                  onChange={e => setCurrent(prev => ({
                    ...prev,
                    features: { ...prev.features, tts_voice_id: e.target.value },
                  }))}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm w-52 font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                />
              </div>
            )}

            {/* AI Modeli */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex items-start gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800">AI Modeli</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Bu kanal için kullanılacak yapay zeka modeli.
                </p>
              </div>
              <select
                value={current.features.model ?? (editorView.channel === 'voice' ? 'claude-sonnet-4-6' : 'gpt-4o-mini')}
                onChange={e => setCurrent(prev => ({
                  ...prev,
                  features: { ...prev.features, model: e.target.value },
                }))}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {editorView.channel === 'voice'
                  ? VOICE_MODEL_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)
                  : CHAT_MODEL_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)
                }
              </select>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{error}</p>
            )}
          </div>
        )}

        {/* ── ARAMA KURALLARI TAB ──────────────────────────────────────────── */}
        {editorTab === 'routing' && editorView.channel === 'voice' && (
          <div className="space-y-5">

            {/* Transfer Numaraları */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <PhoneForwarded size={15} className="text-brand-500" /> Transfer Numaraları
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tier 1 kurallar tetiklendiğinde arama bu numaraya aktarılır.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Call Center (Transfer)</label>
                  <input
                    value={routingConfig.transfer_numbers.primary ?? ''}
                    onChange={e => setRoutingConfig(prev => ({
                      ...prev,
                      transfer_numbers: { ...prev.transfer_numbers, primary: e.target.value },
                    }))}
                    placeholder="02122446600"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Voice Agent Hattı</label>
                  <input
                    value={routingConfig.transfer_numbers.voice_agent ?? ''}
                    onChange={e => setRoutingConfig(prev => ({
                      ...prev,
                      transfer_numbers: { ...prev.transfer_numbers, voice_agent: e.target.value },
                    }))}
                    placeholder="02127098709"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>

            {/* Mesai Saatleri */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Clock size={15} className="text-brand-500" /> Mesai Saatleri
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Mesai içinde Tier 1 kurallar transfere, mesai dışında callback vaadiyle notlara yönlenir.
                </p>
              </div>
              <div className="space-y-3">
                {[
                  { key: 'weekdays', label: 'Hafta içi (Pzt–Cum)' },
                  { key: 'saturday', label: 'Cumartesi' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-4">
                    <label className="text-xs text-slate-600 w-40 flex-shrink-0">{label}</label>
                    <input
                      type="text"
                      value={(workingHours as any)[key] ?? ''}
                      onChange={e => setWorkingHours(prev => ({ ...prev, [key]: e.target.value || null }))}
                      placeholder="09:30-19:00"
                      className="w-36 px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <span className="text-xs text-slate-400">format: SS:DD-SS:DD</span>
                  </div>
                ))}
                <div className="flex items-center gap-4">
                  <label className="text-xs text-slate-600 w-40 flex-shrink-0">Pazar</label>
                  <button
                    onClick={() => setWorkingHours(prev => ({ ...prev, sunday: prev.sunday ? null : '10:00-16:00' }))}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                      workingHours.sunday
                        ? 'border-brand-200 bg-brand-50 text-brand-600'
                        : 'border-slate-200 bg-slate-50 text-slate-400'
                    }`}
                  >
                    {workingHours.sunday ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                    {workingHours.sunday ? workingHours.sunday : 'Kapalı'}
                  </button>
                  {workingHours.sunday && (
                    <input
                      type="text"
                      value={workingHours.sunday}
                      onChange={e => setWorkingHours(prev => ({ ...prev, sunday: e.target.value }))}
                      className="w-36 px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Yönlendirme Kuralları */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">Yönlendirme Kuralları</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tier 1 kurallar çağrıyı aktarır, Tier 2 kurallar not alıp geri arama yapar.
                </p>
              </div>

              {routingConfig.rules.length === 0 && (
                <p className="text-sm text-slate-400 py-2">Henüz yönlendirme kuralı eklenmemiş.</p>
              )}

              <div className="space-y-3">
                {routingConfig.rules.map((rule, idx) => {
                  const tierLabel = rule.tier === 1 ? 'Transfer' : 'Not Al'
                  const tierColor = rule.tier === 1 ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                  const typeLabels: Record<string, string> = {
                    kb_fallback:    'KB Fallback',
                    intent:         'Niyet',
                    topic_note:     'Konu',
                    sentiment_note: 'Duygu',
                  }
                  const isTier1 = rule.tier === 1

                  return (
                    <div key={rule.id} className={`border rounded-xl p-4 space-y-3 transition-colors ${rule.active ? 'border-slate-100 bg-slate-50' : 'border-slate-100 bg-white opacity-50'}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateRule(idx, { active: !rule.active })}
                            className={`relative inline-flex h-5 w-9 rounded-full transition-colors flex-shrink-0 ${rule.active ? 'bg-brand-500' : 'bg-slate-200'}`}
                          >
                            <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${rule.active ? 'translate-x-4' : ''}`} />
                          </button>
                          <span className="text-sm font-medium text-slate-800">
                            {typeLabels[rule.type] ?? rule.type}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">{rule.id}</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${tierColor}`}>
                          Tier {rule.tier} — {tierLabel}
                        </span>
                      </div>

                      {rule.keywords && rule.keywords.length > 0 && (
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Anahtar kelimeler <span className="text-slate-400">(virgülle ayır)</span></label>
                          <input
                            value={rule.keywords.join(', ')}
                            onChange={e => updateRule(idx, {
                              keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean),
                            })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                          />
                        </div>
                      )}

                      {isTier1 ? (
                        <>
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">Mesai içi mesajı</label>
                            <textarea
                              value={rule.transition_message ?? ''}
                              onChange={e => updateRule(idx, { transition_message: e.target.value })}
                              rows={2}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">Mesai dışı mesajı</label>
                            <textarea
                              value={rule.after_hours_message ?? ''}
                              onChange={e => updateRule(idx, { after_hours_message: e.target.value })}
                              rows={2}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                            />
                          </div>
                        </>
                      ) : (
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Geri arama mesajı</label>
                          <textarea
                            value={rule.note_message ?? ''}
                            onChange={e => updateRule(idx, { note_message: e.target.value })}
                            rows={2}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{error}</p>
            )}
          </div>
        )}

        {/* ── TEST ET TAB ──────────────────────────────────────────────────── */}
        {editorTab === 'test' && orgId && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-slate-800">Asistan Playground</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Mevcut bilgi bankası ve promptunuzla gerçek zamanlı test yapın. Hiçbir veri kaydedilmez.
              </p>
            </div>
            <AgentTestPanel
              orgId={orgId}
              activeChannel={activeChannel}
              hasVoice={!!voice.id || !!voice.systemPrompt}
              hasChat={!!whatsapp.id || !!whatsapp.systemPrompt}
              kbCount={kbCount}
              promptLength={
                activeChannel === 'voice'
                  ? voice.systemPrompt.length
                  : whatsapp.systemPrompt.length
              }
            />
          </div>
        )}

      </div>{/* end main column */}

      {/* Improvement tips sidebar */}
      <aside className="hidden xl:block sticky top-6 space-y-4">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 text-white shadow-lg">
          <div className="border-b border-white/10 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-widest text-sky-200">Canlı öneri</p>
                <h2 className="mt-2 text-base font-semibold">Asistanı daha iyi yap</h2>
              </div>
              <div className="rounded-xl bg-white/10 p-2.5">
                <Lightbulb size={16} className="text-sky-200" />
              </div>
            </div>
          </div>

          {activeTip && (
            <div className="p-5">
              <div className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${tipToneStyles[activeTip.tone]}`}>
                {activeTip.badge}
              </div>
              <h3 className="mt-3 text-sm font-semibold text-white">{activeTip.title}</h3>
              <p className="mt-2 text-xs leading-5 text-slate-300">{activeTip.body}</p>
              {activeTip.action && (
                <button
                  onClick={activeTip.action.onClick}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 hover:-translate-y-0.5 transition-transform"
                >
                  {activeTip.action.label}
                  <ArrowUpRight size={12} />
                </button>
              )}
              <div className="mt-4 flex gap-1.5">
                {improvementTips.map((tip, index) => (
                  <button
                    key={tip.id}
                    onClick={() => setActiveTipIndex(index)}
                    aria-label={tip.title}
                    className={`h-1 rounded-full transition-all ${index === activeTipIndex ? 'w-6 bg-white' : 'w-2.5 bg-white/30 hover:bg-white/50'}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 size={15} className="text-emerald-500" />
            <h3 className="text-sm font-semibold text-slate-900">Hızlı kalite özeti</h3>
          </div>
          <div className="space-y-3">
            {quickWins.map(item => {
              const Icon = item.icon
              return (
                <div key={item.label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Icon size={13} />
                    {item.label}
                  </div>
                  <span className={`font-semibold ${item.value === 'Geliştirilmeli' ? 'text-amber-600' : 'text-slate-800'}`}>
                    {item.value}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </aside>
    </div>
  )
}

// ─── HELPER COMPONENTS ────────────────────────────────────────────────────────

function Phase1Card({
  template,
  locked,
  hasCalendar,
  onClick,
}: {
  template: AgentTemplate
  locked: boolean
  hasCalendar: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={locked ? undefined : onClick}
      disabled={locked}
      className="relative flex-shrink-0 w-40 min-h-[190px] rounded-xl border-2 border-slate-100 bg-white p-4
        text-left flex flex-col gap-2 transition-all
        hover:border-brand-200 hover:shadow-sm disabled:cursor-not-allowed"
    >
      {locked && (
        <div className="absolute inset-0 rounded-xl flex flex-col items-center justify-center gap-1.5 bg-white/80 backdrop-blur-[1px]">
          <Lock size={14} className="text-slate-400" />
          <span className="text-xs text-slate-400">Paket gerekli</span>
        </div>
      )}
      {template.recommended && (
        <span className="text-[10px] font-semibold text-amber-600 flex items-center gap-0.5">
          <Star size={10} className="fill-amber-400 text-amber-400" /> Önerilen
        </span>
      )}
      <p className="text-sm font-semibold text-slate-800 leading-tight">{template.name}</p>
      <p className="text-xs text-slate-400 leading-relaxed line-clamp-4 flex-1">{template.description}</p>
      {template.requiresCalendar && !hasCalendar && (
        <p className="text-[10px] text-amber-500 flex items-center gap-0.5 mt-auto">
          <Info size={9} /> Takvim gerekir
        </p>
      )}
    </button>
  )
}

function ConfiguredCard({
  channel,
  onClick,
}: {
  channel: 'voice' | 'whatsapp'
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl border-2 border-brand-100 bg-brand-50/40 hover:border-brand-300 transition-all w-64"
    >
      <div className="flex items-center gap-2">
        {channel === 'voice'
          ? <Mic size={15} className="text-brand-500" />
          : <MessageSquare size={15} className="text-brand-500" />}
        <div className="text-left">
          <p className="text-sm font-medium text-slate-800">
            {channel === 'voice' ? 'Sesli Görüşme' : 'Mesajlaşma'}
          </p>
          <p className="text-xs text-slate-400">Özelleştirilmiş yapılandırma</p>
        </div>
      </div>
      <ArrowRight size={14} className="text-slate-400 flex-shrink-0" />
    </button>
  )
}

export default function AgentPage() {
  return (
    <Suspense fallback={null}>
      <AgentPageInner />
    </Suspense>
  )
}
