'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Save, Loader2, Plus, Trash2, Bot, Mic, MessageSquare, ListChecks,
  FlaskConical, PhoneForwarded, Clock, ToggleLeft, ToggleRight, Lightbulb,
  ArrowUpRight, CheckCircle2, BookOpen, AlertTriangle, X, Lock,
  ArrowLeft, ArrowRight, Zap, Pencil, ChevronUp, ChevronDown,
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import AgentTestPanel from '@/components/agent/AgentTestPanel'
import { useIsDemo } from '@/lib/demo-context'
import { useOrg } from '@/lib/org-context'
import { getWhatsappTemplates, getVoiceTemplates } from '@/lib/agent-templates'
import type { AgentTemplate } from '@/lib/agent-templates'
import KnowledgeClient from '../knowledge/KnowledgeClient'
import type { KnowledgeItem } from '@/lib/types'

// ─── Knowledge tab content ────────────────────────────────────────────────────

function KnowledgeTabSection({ orgId, readOnly }: { orgId: string; readOnly?: boolean }) {
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

  return <KnowledgeClient items={items} orgId={orgId} sector={sector} readOnly={readOnly} />
}

type Channel = 'voice' | 'whatsapp'
type EditorTab = 'settings' | 'modules' | 'routing' | 'test'

interface EditorView {
  channel: Channel
  templateId: string
  templateName: string
  scenario?: string
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

interface HandoffConfig {
  keywords: string[]
  frustration_keywords: string[]
  missing_required_after_turns: number
  kb_empty_consecutive: number
}

interface WorkflowStatus {
  id: string
  name: string
  channel: string
  is_active: boolean
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
  type: 'text' | 'phone' | 'email' | 'number' | 'select'
  priority: 'must' | 'should' | 'nice'
  voice_prompt?: string
  options?: string[]
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
]

const CHAT_MODEL_OPTIONS = [
  { value: 'gpt-4o-mini',              label: 'GPT-4o Mini (Önerilen)' },
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
  const isDemo = useIsDemo()
  const { orgId: ctxOrgId, isSuperAdmin } = useOrg()

  const [orgId, setOrgId] = useState('')
  const [loading, setLoading] = useState(true)

  // Phase state
  const [editorView, setEditorView] = useState<EditorView | null>(null)
  const [editorTab, setEditorTab] = useState<EditorTab>('settings')
  const [hasVoiceEntitlement, setHasVoiceEntitlement] = useState(true)

  const [voice, setVoice] = useState<PlaybookState>(EMPTY)
  const [whatsapp, setWhatsapp] = useState<PlaybookState>(EMPTY)
  const [scenarioPlaybooks, setScenarioPlaybooks] = useState<Record<string, PlaybookState>>({})

  const [voiceIntake, setVoiceIntake]       = useState<IntakeField[]>([])
  const [whatsappIntake, setWhatsappIntake] = useState<IntakeField[]>([])
  const [voiceIntakeId, setVoiceIntakeId]   = useState<string | null>(null)
  const [waIntakeId, setWaIntakeId]         = useState<string | null>(null)

  const [savingIntake, setSavingIntake]                 = useState<boolean>(false)
  const [intakeSaved, setIntakeSaved]                   = useState(false)
  const [expandedIntakeIdx, setExpandedIntakeIdx]       = useState<number | null>(null)
  const [addingIntake, setAddingIntake]                 = useState(false)

  const [kbCount, setKbCount]               = useState(0)
  const [activeTipIndex, setActiveTipIndex] = useState(0)
  const [saving, setSaving]                 = useState(false)
  const [savedChannel, setSavedChannel]     = useState<Channel | null>(null)
  const [orgName, setOrgName]               = useState('')
  const [clinicType, setClinicType]         = useState('other')
  const [voiceActive, setVoiceActive]       = useState(false)
  const [hasCalendar, setHasCalendar]       = useState(false)
  const [calendarWarning, setCalendarWarning] = useState(false)
  const [error, setError]                   = useState('')
  const [persona, setPersona]               = useState({ name: '', tone: 'warm-professional' })

  // Routing state
  const [routingConfig, setRoutingConfig] = useState<RoutingConfig>({ transfer_numbers: {}, rules: [] })
  const [handoffConfig, setHandoffConfig] = useState<HandoffConfig>({
    keywords: ['insan', 'danışman', 'müdür', 'temsilci', 'yönetici'],
    frustration_keywords: ['saçma', 'berbat', 'rezalet', 'şikayet'],
    missing_required_after_turns: 10,
    kb_empty_consecutive: 3,
  })
  const [workflows, setWorkflows] = useState<WorkflowStatus[]>([])
  const [workingHours, setWorkingHours]   = useState<WorkingHours>({
    weekdays: '09:30-19:00', saturday: '10:00-17:00', sunday: null, timezone: 'Europe/Istanbul',
  })
  const [savingRouting, setSavingRouting] = useState(false)
  const [routingSaved, setRoutingSaved]   = useState(false)

  // Computed
  const activeChannel: Channel = editorView?.channel ?? 'voice'
  const activeScenario = editorView?.scenario ?? null
  const current = activeScenario
    ? (scenarioPlaybooks[activeScenario] ?? EMPTY)
    : (activeChannel === 'voice' ? voice : whatsapp)
  const setCurrent = (fn: (prev: PlaybookState) => PlaybookState) => {
    if (activeScenario) {
      setScenarioPlaybooks(prev => ({ ...prev, [activeScenario]: fn(prev[activeScenario] ?? EMPTY) }))
    } else {
      activeChannel === 'voice' ? setVoice(fn) : setWhatsapp(fn)
    }
  }

  const currentIntake    = activeChannel === 'voice' ? voiceIntake : whatsappIntake
  const setCurrentIntake = activeChannel === 'voice' ? setVoiceIntake : setWhatsappIntake
  const currentIntakeId  = activeChannel === 'voice' ? voiceIntakeId : waIntakeId

  useEffect(() => {
    const supabase = createClient()
    ;(async () => {
      let resolvedOrgId = ctxOrgId ?? ''

      // Super admin without org — fall back to first active org
      if (!resolvedOrgId && isSuperAdmin) {
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

      // Tüm bağımsız sorguları paralel çalıştır
      const [
        { data: playbooks },
        { data: schemas },
        { count },
        { data: orgData },
        routingResult,
        billingResult,
        workflowsResult,
      ] = await Promise.all([
        // 1. Playbooks
        supabase
          .from('agent_playbooks')
          .select('id, channel, scenario, system_prompt_template, opening_message, hard_blocks, features, few_shot_examples, fallback_responses, handoff_triggers')
          .eq('organization_id', resolvedOrgId)
          .eq('is_active', true)
          .in('channel', ['voice', 'whatsapp', 'chat', 'all'])
          .order('version', { ascending: false }),
        // 2. Intake schemas
        supabase
          .from('intake_schemas')
          .select('id, channel, fields')
          .eq('organization_id', resolvedOrgId)
          .in('channel', ['voice', 'whatsapp']),
        // 3. KB count
        supabase
          .from('knowledge_items')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', resolvedOrgId)
          .eq('is_active', true),
        // 4. Organization data
        supabase
          .from('organizations')
          .select('name, channel_config, ai_persona')
          .eq('id', resolvedOrgId)
          .single(),
        // 5. Routing rules
        fetch('/api/agent/routing-rules').then(r => r.ok ? r.json() : null).catch(() => null),
        // 6. Billing limits
        fetch('/api/billing/limits').then(r => r.ok ? r.json() : null).catch(() => null),
        // 7. Workflows
        fetch('/api/workflows/templates').then(r => r.ok ? r.json() : null).catch(() => null),
      ])

      // Process playbooks
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
        const mainPlaybooks = playbooks.filter(p => !p.scenario)
        const scenarioPbs   = playbooks.filter(p => !!p.scenario)

        const voicePb    = mainPlaybooks.find(p => p.channel === 'voice')    || mainPlaybooks.find(p => p.channel === 'all')
        const whatsappPb = mainPlaybooks.find(p => p.channel === 'whatsapp') || mainPlaybooks.find(p => p.channel === 'chat') || mainPlaybooks.find(p => p.channel === 'all')
        if (voicePb)    setVoice(parsePlaybook(voicePb))
        if (whatsappPb) setWhatsapp(parsePlaybook(whatsappPb))

        const spMap: Record<string, PlaybookState> = {}
        for (const sp of scenarioPbs) {
          spMap[sp.scenario] = parsePlaybook(sp)
        }
        setScenarioPlaybooks(spMap)

        const activePb = voicePb || whatsappPb
        if (activePb) {
          const ht = (activePb as any).handoff_triggers as Record<string, any> | null
          if (ht) {
            setHandoffConfig({
              keywords: Array.isArray(ht.keywords) ? ht.keywords : ['insan', 'danışman', 'müdür', 'temsilci', 'yönetici'],
              frustration_keywords: Array.isArray(ht.frustration_keywords) ? ht.frustration_keywords : ['saçma', 'berbat', 'rezalet', 'şikayet'],
              missing_required_after_turns: ht.missing_required_after_turns ?? 10,
              kb_empty_consecutive: ht.kb_empty_consecutive ?? 3,
            })
          }
        }
      }

      // Process intake schemas
      if (schemas) {
        const vs = schemas.find(s => s.channel === 'voice')
        const ws = schemas.find(s => s.channel === 'whatsapp')
        if (vs) { setVoiceIntake(vs.fields ?? []); setVoiceIntakeId(vs.id) }
        if (ws) { setWhatsappIntake(ws.fields ?? []); setWaIntakeId(ws.id) }
      }

      // Process KB count
      setKbCount(count ?? 0)

      // Process org data
      const cc = (orgData?.channel_config ?? {}) as Record<string, any>
      setVoiceActive(cc?.voice_inbound?.active === true || cc?.voice_outbound?.active === true)
      setHasCalendar(cc?.calendar?.provider != null)
      const ap = (orgData?.ai_persona ?? {}) as Record<string, any>
      setPersona({ name: ap.persona_name || '', tone: ap.tone || 'warm-professional' })
      setOrgName(orgData?.name || '')
      setClinicType(ap.clinic_type || 'other')

      // Process routing config
      if (routingResult) {
        if (routingResult.routing_rules) setRoutingConfig(routingResult.routing_rules)
        if (routingResult.working_hours && Object.keys(routingResult.working_hours).length) setWorkingHours(routingResult.working_hours)
        if (routingResult.handoff_triggers) {
          const ht = routingResult.handoff_triggers
          setHandoffConfig({
            keywords: Array.isArray(ht.keywords) ? ht.keywords : ['insan', 'danışman', 'müdür', 'temsilci', 'yönetici'],
            frustration_keywords: Array.isArray(ht.frustration_keywords) ? ht.frustration_keywords : ['saçma', 'berbat', 'rezalet', 'şikayet'],
            missing_required_after_turns: ht.missing_required_after_turns ?? 10,
            kb_empty_consecutive: ht.kb_empty_consecutive ?? 3,
          })
        }
      }

      // Process billing entitlements
      if (billingResult) {
        setHasVoiceEntitlement(billingResult.entitlements?.voice_agent_inbound?.enabled ?? true)
      }

      // Process workflows
      if (Array.isArray(workflowsResult)) {
        setWorkflows(workflowsResult.map((w: any) => ({ id: w.id, name: w.name, channel: w.channel || 'multi', is_active: !!w.is_active })))
      }

      setLoading(false)
    })()
  }, [ctxOrgId, isSuperAdmin])


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

    // Persona (org-level) kaydet — sadece ana playbook'lar için
    if (!activeScenario) {
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
    }

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
      const playbookName = activeScenario
        ? (editorView?.templateName ?? activeScenario)
        : (activeChannel === 'voice' ? 'Sesli Asistan' : 'WhatsApp/Chat Asistanı')
      const { data: inserted, error: err } = await supabase
        .from('agent_playbooks')
        .insert({
          organization_id: orgId,
          channel: activeChannel,
          name: playbookName,
          scenario: activeScenario || null,
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


  function removeIntakeField(i: number) {
    setCurrentIntake(prev => prev.filter((_, idx) => idx !== i))
    if (expandedIntakeIdx === i) { setExpandedIntakeIdx(null); setAddingIntake(false) }
    else if (expandedIntakeIdx !== null && expandedIntakeIdx > i) setExpandedIntakeIdx(expandedIntakeIdx - 1)
  }

  function toSnakeKey(label: string): string {
    return label
      .toLowerCase()
      .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i')
      .replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
  }

  function updateIntakeField(i: number, partial: Partial<IntakeField>) {
    setCurrentIntake(prev => prev.map((f, idx) => idx === i ? { ...f, ...partial } : f))
  }

  function togglePriority(i: number) {
    setCurrentIntake(prev => prev.map((f, idx) => {
      if (idx !== i) return f
      return { ...f, priority: f.priority === 'must' ? 'should' : 'must' }
    }))
  }

  function addIntakeField() {
    const newField: IntakeField = { key: '', label: '', type: 'text', priority: 'should' }
    setCurrentIntake(prev => [...prev, newField])
    setExpandedIntakeIdx(currentIntake.length)
    setAddingIntake(true)
  }

  function collapseIntakeField() {
    if (addingIntake && expandedIntakeIdx !== null) {
      const field = currentIntake[expandedIntakeIdx]
      if (!field || !field.label.trim()) {
        setCurrentIntake(prev => prev.filter((_, idx) => idx !== expandedIntakeIdx))
      }
    }
    setExpandedIntakeIdx(null)
    setAddingIntake(false)
  }

  async function handleSaveIntake() {
    if (!orgId) return
    // Collapse any open accordion & remove empty fields
    collapseIntakeField()
    setSavingIntake(true)
    const supabase = createClient()
    const ch      = activeChannel
    const fields  = currentIntake.filter(f => f.label.trim())

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
        body: JSON.stringify({
          routing_rules: routingConfig,
          working_hours: workingHours,
          handoff_triggers: handoffConfig,
        }),
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

  async function quickActivate(channel: Channel, t: AgentTemplate) {
    if (!orgId) return
    setSaving(true)
    setError('')

    const data = { ...t.playbook }
    if (t.requiresCalendar && !hasCalendar) {
      data.features = { ...data.features, calendar_booking: false }
    }
    const sub = (s: string) =>
      s.replace(/\{PERSONA_ADI\}/g, persona.name || '{PERSONA_ADI}')
       .replace(/\{KLINIK_ADI\}/g,  orgName      || '{KLINIK_ADI}')
    data.systemPrompt   = sub(data.systemPrompt)
    data.openingMessage = sub(data.openingMessage)

    const hard_blocks = data.blocks
      .filter(b => b.keywords.trim())
      .map((b, i) => ({
        trigger_id: `block_${i}`,
        action: 'soft_block',
        keywords: b.keywords.split(',').map(k => k.trim()).filter(Boolean),
        response: b.response.trim(),
      }))

    const few_shot_examples = data.fewShots
      .filter(ex => ex.user.trim() && ex.assistant.trim())
      .map(ex => ({ user: ex.user.trim(), assistant: ex.assistant.trim() }))

    const supabase = createClient()
    const scenarioVal = t.scenario || null

    // Mevcut playbook var mı kontrol et
    const existingId = scenarioVal
      ? scenarioPlaybooks[scenarioVal]?.id
      : (channel === 'voice' ? voice.id : whatsapp.id)

    let resultId = existingId
    if (existingId) {
      // UPDATE — mevcut playbook'u template ile güncelle
      const { error: err } = await supabase
        .from('agent_playbooks')
        .update({
          name: t.name,
          system_prompt_template: data.systemPrompt,
          opening_message: data.openingMessage || null,
          hard_blocks,
          features: data.features,
          few_shot_examples,
          fallback_responses: { no_kb_match: data.noKbMatch.trim() || null },
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingId)
      if (err) { setError('Aktifleştirilemedi.'); setSaving(false); return }
    } else {
      // INSERT — yeni playbook
      const { data: inserted, error: err } = await supabase
        .from('agent_playbooks')
        .insert({
          organization_id: orgId,
          channel,
          name: t.name,
          scenario: scenarioVal,
          system_prompt_template: data.systemPrompt,
          opening_message: data.openingMessage || null,
          hard_blocks,
          features: data.features,
          few_shot_examples,
          fallback_responses: { no_kb_match: data.noKbMatch.trim() || null },
          version: 1,
          is_active: true,
        })
        .select('id')
        .single()
      if (err) { setError('Aktifleştirilemedi.'); setSaving(false); return }
      resultId = inserted?.id
    }

    const newState: PlaybookState = { ...EMPTY, ...data, id: resultId }
    if (scenarioVal) {
      setScenarioPlaybooks(prev => ({ ...prev, [scenarioVal]: newState }))
    } else {
      if (channel === 'voice') setVoice(newState)
      if (channel === 'whatsapp') setWhatsapp(newState)
    }

    setSaving(false)
    setSavedChannel(channel)
    setTimeout(() => setSavedChannel(null), 3000)
  }

  function openEditor(channel: Channel, t: AgentTemplate | 'custom') {
    if (t !== 'custom') {
      const tpl = t as AgentTemplate
      const tplScenario = tpl.scenario

      if (tplScenario) {
        // Senaryo şablonu — ana playbook'a dokunma
        if (scenarioPlaybooks[tplScenario]?.id) {
          // Zaten DB'de kayıtlı — mevcut veriyle aç (template uygulamadan)
        } else {
          // Henüz kayıtlı değil — template defaults'ı yaz
          const data = { ...tpl.playbook }
          if (tpl.requiresCalendar && !hasCalendar) {
            data.features = { ...data.features, calendar_booking: false }
            setCalendarWarning(true)
          }
          const sub = (s: string) =>
            s.replace(/\{PERSONA_ADI\}/g, persona.name || '{PERSONA_ADI}')
             .replace(/\{KLINIK_ADI\}/g,  orgName      || '{KLINIK_ADI}')
          data.systemPrompt   = sub(data.systemPrompt)
          data.openingMessage = sub(data.openingMessage)
          setScenarioPlaybooks(prev => ({ ...prev, [tplScenario]: { ...EMPTY, ...data } }))
        }
        setEditorView({ channel, templateId: tpl.id, templateName: tpl.name, scenario: tplScenario })
        setEditorTab('settings')
        return
      }

      // Ana şablon (receptionist vb.) — eski davranış
      const existingId = channel === 'voice' ? voice.id : whatsapp.id
      if (existingId) {
        const ok = window.confirm(
          'Dikkat: Mevcut asistan ayarlarınız bu şablonla değiştirilecek. Devam etmek istiyor musunuz?'
        )
        if (!ok) return
      }
      applyTemplate(tpl, channel)
    }
    const name = t === 'custom' ? 'Özelleştirilmiş' : (t as AgentTemplate).name
    const id   = t === 'custom' ? 'custom' : (t as AgentTemplate).id
    setEditorView({ channel, templateId: id, templateName: name })
    setEditorTab('settings')
  }

  function closeEditor() {
    setEditorView(null)
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
          <KnowledgeTabSection orgId={orgId} readOnly={isDemo} />
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

        {/* ── Ana Asistanlar ─────────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Bot size={16} className="text-brand-500" />
            <h2 className="text-sm font-bold text-slate-800">Ana Asistanlar</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {/* Sesli Resepsiyonist */}
            {!hasVoiceEntitlement
              ? <VoiceUpgradeCard />
              : voice.id ? (
                <ConfiguredCard
                  channel="voice"
                  label="Sesli Resepsiyonist"
                  subtitle="Gelen aramaları karşılar, lead niteler"
                  onEdit={() => openEditor('voice', 'custom')}
                  onTest={() => { openEditor('voice', 'custom'); setEditorTab('test') }}
                />
              ) : (
                <ConfiguredCard
                  channel="voice"
                  label="Sesli Resepsiyonist"
                  subtitle="Gelen aramaları karşılar, lead niteler"
                  unconfigured
                  onEdit={() => {
                    const tpl = getVoiceTemplates(clinicType, hasCalendar).find(t => !t.scenario)
                    if (tpl) openEditor('voice', tpl)
                    else openEditor('voice', 'custom')
                  }}
                  onTest={() => {}}
                />
              )
            }
            {/* Mesajlaşma Asistanı */}
            {whatsapp.id ? (
              <ConfiguredCard
                channel="whatsapp"
                label="Mesajlaşma Asistanı"
                subtitle="WhatsApp & Instagram mesajlarını yanıtlar"
                onEdit={() => openEditor('whatsapp', 'custom')}
                onTest={() => { openEditor('whatsapp', 'custom'); setEditorTab('test') }}
              />
            ) : (
              <ConfiguredCard
                channel="whatsapp"
                label="Mesajlaşma Asistanı"
                subtitle="WhatsApp & Instagram mesajlarını yanıtlar"
                unconfigured
                onEdit={() => {
                  const tpl = getWhatsappTemplates(clinicType, hasCalendar).find(t => !t.scenario)
                  if (tpl) openEditor('whatsapp', tpl)
                  else openEditor('whatsapp', 'custom')
                }}
                onTest={() => {}}
              />
            )}
          </div>
        </section>

        {/* ── Outbound Sesli Senaryolar ────────────────────────────────── */}
        <section className="space-y-4 relative">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-slate-100" />
            <p className="text-xs text-slate-400 font-medium shrink-0 flex items-center gap-1.5">
              <PhoneForwarded size={12} /> Outbound Sesli Senaryolar
            </p>
            <div className="h-px flex-1 bg-slate-100" />
          </div>
          <p className="text-xs text-slate-500">Giden aramalar için ek asistan senaryoları</p>

          {!hasVoiceEntitlement && (
            <div className="absolute inset-0 rounded-xl flex flex-col items-center justify-center gap-2 bg-white/80 backdrop-blur-[2px] z-10">
              <Lock size={16} className="text-slate-400" />
              <span className="text-xs text-slate-500 font-medium">Sesli asistan paketinize dahil değil</span>
              <a href="/dashboard/billing" className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1">
                Paketi Yükselt <ArrowUpRight size={11} />
              </a>
            </div>
          )}

          <div className="flex flex-wrap gap-4">
            {getVoiceTemplates(clinicType, hasCalendar)
              .filter(t => !!t.scenario)
              .map(t => (
                <ScenarioCard
                  key={t.id}
                  template={t}
                  isActive={!!scenarioPlaybooks[t.scenario!]?.id}
                  locked={!hasVoiceEntitlement}
                  onActivate={() => quickActivate('voice', t)}
                  onEdit={() => openEditor('voice', t)}
                  onTest={() => { openEditor('voice', t); setEditorTab('test') }}
                  activating={saving}
                />
              ))
            }
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
          {editorTab !== 'test' && !isDemo && (
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

            {/* Asistan Kimliği — senaryo playbook'larında gizle */}
            {!activeScenario && <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
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
            </div>}

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
                <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  <span className="text-xs font-medium text-emerald-700">23.000+ senaryoda test edildi</span>
                </div>
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

            {/* Veri Toplama Alanları — senaryo playbook'larında gizle */}
            {!activeScenario && <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
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
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    <span className="text-xs font-medium text-emerald-700">Optimize edilmiş</span>
                  </div>
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

              {currentIntake.length === 0 && !addingIntake ? (
                <p className="text-sm text-slate-400 py-1">Henüz alan eklenmemiş. Aşağıdan ekleyin veya AI Öner butonunu kullanın.</p>
              ) : (
                <div className="space-y-2">
                  {currentIntake.map((field, i) => {
                    const isExpanded = expandedIntakeIdx === i
                    return (
                      <div key={`${field.key || 'new'}-${i}`} className="border border-slate-100 rounded-lg bg-slate-50 overflow-hidden">
                        {/* Collapsed row */}
                        <div className="flex items-center gap-3 px-3 py-2.5">
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-slate-700">{field.label || <span className="italic text-slate-400">Yeni alan...</span>}</span>
                            {field.key && <span className="ml-2 text-xs text-slate-400 font-mono">{field.key}</span>}
                          </div>
                          <button
                            onClick={() => togglePriority(i)}
                            title="Önceliği değiştir"
                            className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 cursor-pointer transition-colors ${
                              field.priority === 'must'
                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                : field.priority === 'nice'
                                  ? 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                  : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                            }`}
                          >
                            {field.priority === 'must' ? 'Zorunlu' : field.priority === 'nice' ? 'Bonus' : 'Opsiyonel'}
                          </button>
                          <button
                            onClick={() => isExpanded ? collapseIntakeField() : (setExpandedIntakeIdx(i), setAddingIntake(false))}
                            className="text-slate-400 hover:text-brand-500 transition-colors flex-shrink-0"
                            title={isExpanded ? 'Kapat' : 'Düzenle'}
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <Pencil size={14} />}
                          </button>
                          <button onClick={() => removeIntakeField(i)} className="text-slate-300 hover:text-red-400 transition-colors flex-shrink-0">
                            <Trash2 size={14} />
                          </button>
                        </div>

                        {/* Expanded accordion */}
                        {isExpanded && (
                          <div className="border-t border-slate-100 px-4 py-3 space-y-3 bg-white">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs text-slate-500 mb-1">Etiket</label>
                                <input
                                  value={field.label}
                                  onChange={e => {
                                    const label = e.target.value
                                    const autoKey = toSnakeKey(label)
                                    updateIntakeField(i, { label, key: autoKey })
                                  }}
                                  placeholder="örn: Alerji Bilgisi"
                                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                  autoFocus={addingIntake}
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-slate-500 mb-1">Anahtar</label>
                                <div className="flex gap-1.5">
                                  <input
                                    value={field.key}
                                    onChange={e => updateIntakeField(i, { key: e.target.value })}
                                    placeholder="alerji_bilgisi"
                                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                                  />
                                  <button
                                    onClick={() => updateIntakeField(i, { key: toSnakeKey(field.label) })}
                                    title="Etiketten otomatik oluştur"
                                    className="px-2 py-2 text-xs bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-slate-500"
                                  >
                                    Auto
                                  </button>
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs text-slate-500 mb-1">Tip</label>
                                <select
                                  value={field.type}
                                  onChange={e => updateIntakeField(i, { type: e.target.value as IntakeField['type'] })}
                                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                                >
                                  <option value="text">Metin</option>
                                  <option value="phone">Telefon</option>
                                  <option value="email">E-posta</option>
                                  <option value="number">Sayı</option>
                                  <option value="select">Seçim listesi</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs text-slate-500 mb-1">Öncelik</label>
                                <select
                                  value={field.priority}
                                  onChange={e => updateIntakeField(i, { priority: e.target.value as IntakeField['priority'] })}
                                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                                >
                                  <option value="must">Zorunlu</option>
                                  <option value="should">Opsiyonel</option>
                                  <option value="nice">Bonus</option>
                                </select>
                              </div>
                            </div>
                            {editorView?.channel === 'voice' && (
                              <div>
                                <label className="block text-xs text-slate-500 mb-1">Soru (ses)</label>
                                <input
                                  value={field.voice_prompt || ''}
                                  onChange={e => updateIntakeField(i, { voice_prompt: e.target.value })}
                                  placeholder="örn: Herhangi bir alerjiniz var mı?"
                                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                />
                              </div>
                            )}
                            {field.type === 'select' && (
                              <div>
                                <label className="block text-xs text-slate-500 mb-1">Seçenekler <span className="text-slate-400">(virgülle ayır)</span></label>
                                <input
                                  value={(field.options || []).join(', ')}
                                  onChange={e => updateIntakeField(i, { options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                  placeholder="örn: Evet, Hayır, Bilmiyorum"
                                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              <button
                onClick={addIntakeField}
                className="flex items-center gap-1.5 text-sm text-brand-600 font-medium hover:text-brand-700"
              >
                <Plus size={15} /> Yeni Alan Ekle
              </button>

            </div>}

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

            {/* İlgili İş Akışları */}
            {workflows.length > 0 && (() => {
              const channelFilter = editorView.channel === 'voice' ? 'voice' : 'whatsapp'
              const relevant = workflows.filter(w => w.channel === channelFilter || w.channel === 'multi')
              if (relevant.length === 0) return null
              return (
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                      <Zap size={15} className="text-brand-500" /> İlgili İş Akışları
                    </h3>
                    <a
                      href="/dashboard/workflows"
                      className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
                    >
                      İş Akışlarını Yönet <ArrowUpRight size={11} />
                    </a>
                  </div>
                  <div className="space-y-2">
                    {relevant.map(w => (
                      <div key={w.id} className="flex items-center justify-between py-1.5">
                        <span className="text-sm text-slate-700">{w.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          w.is_active
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          {w.is_active ? 'Aktif' : 'Pasif'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{error}</p>
            )}
          </div>
        )}

        {/* ── ARAMA KURALLARI TAB ──────────────────────────────────────────── */}
        {editorTab === 'routing' && editorView.channel === 'voice' && (
          <div className="space-y-5">

            {/* Mesai Saatleri */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Clock size={15} className="text-brand-500" /> Mesai Saatleri
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Mesai dışında AI geri arama sözü verir ve not oluşturur.
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

            {/* Devir Anahtar Kelimeleri */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <PhoneForwarded size={15} className="text-brand-500" /> Devir Anahtar Kelimeleri
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Bu kelimeler algılandığında AI konuşmayı nazikçe kapatır ve danışmana devir oluşturur.
                </p>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Anahtar kelimeler <span className="text-slate-400">(virgülle ayır)</span></label>
                <input
                  value={handoffConfig.keywords.join(', ')}
                  onChange={e => setHandoffConfig(prev => ({
                    ...prev,
                    keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean),
                  }))}
                  placeholder="insan, danışman, müdür, temsilci, yönetici"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Frustrasyon Kelimeleri */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">Frustrasyon Kelimeleri</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Müşteri sinirli/kızgın olduğunda otomatik devir tetiklenir.
                </p>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Kelimeler <span className="text-slate-400">(virgülle ayır)</span></label>
                <input
                  value={handoffConfig.frustration_keywords.join(', ')}
                  onChange={e => setHandoffConfig(prev => ({
                    ...prev,
                    frustration_keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean),
                  }))}
                  placeholder="saçma, berbat, rezalet, şikayet"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Otomatik Devir Eşikleri */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">Otomatik Devir Eşikleri</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Belirli koşullar sağlandığında AI konuşmayı otomatik danışmana devreder.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Zorunlu bilgi toplanamadı (tur)</label>
                  <input
                    type="number"
                    min={3}
                    max={20}
                    value={handoffConfig.missing_required_after_turns}
                    onChange={e => setHandoffConfig(prev => ({
                      ...prev,
                      missing_required_after_turns: parseInt(e.target.value) || 10,
                    }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <p className="text-xs text-slate-400 mt-1">X turda zorunlu bilgi alınamazsa devret</p>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Art arda KB eşleşme yok</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={handoffConfig.kb_empty_consecutive}
                    onChange={e => setHandoffConfig(prev => ({
                      ...prev,
                      kb_empty_consecutive: parseInt(e.target.value) || 3,
                    }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <p className="text-xs text-slate-400 mt-1">Art arda X kez KB boş gelirse devret</p>
                </div>
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
              scenario={editorView?.scenario}
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

function ScenarioCard({
  template,
  isActive,
  locked,
  onActivate,
  onEdit,
  onTest,
  activating,
}: {
  template: AgentTemplate
  isActive: boolean
  locked: boolean
  onActivate: () => void
  onEdit: () => void
  onTest: () => void
  activating?: boolean
}) {
  const borderColor = isActive ? 'border-emerald-200' : 'border-slate-100'
  const bgColor = isActive ? 'bg-emerald-50/40' : 'bg-white'
  return (
    <div
      className={`relative flex-shrink-0 w-52 min-h-[200px] rounded-xl border-2 ${borderColor} ${bgColor} p-4
        text-left flex flex-col gap-2 transition-all hover:shadow-sm`}
    >
      {locked && (
        <div className="absolute inset-0 rounded-xl flex flex-col items-center justify-center gap-1.5 bg-white/80 backdrop-blur-[1px] z-10">
          <Lock size={14} className="text-slate-400" />
          <span className="text-xs text-slate-400">Paket gerekli</span>
        </div>
      )}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-800 leading-tight">{template.name}</p>
        {isActive && (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Aktif
          </span>
        )}
      </div>
      <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 flex-1">{template.description}</p>
      <div className="flex gap-1.5 mt-auto pt-1">
        {isActive ? (
          <>
            <button
              onClick={locked ? undefined : onTest}
              disabled={locked}
              className="flex-1 text-[11px] font-medium px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
            >
              <FlaskConical size={11} /> Test Et
            </button>
            <button
              onClick={locked ? undefined : onEdit}
              disabled={locked}
              className="flex-1 text-[11px] font-medium px-2 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
            >
              Düzenle <ArrowRight size={11} />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={locked ? undefined : onActivate}
              disabled={locked || activating}
              className="flex-1 text-[11px] font-semibold px-2 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
            >
              {activating ? <Loader2 size={11} className="animate-spin" /> : <Zap size={11} />}
              Aktifleştir
            </button>
            <button
              onClick={locked ? undefined : onEdit}
              disabled={locked}
              className="text-[11px] font-medium px-2 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors disabled:opacity-50"
            >
              Özelleştir
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function ConfiguredCard({
  channel,
  onEdit,
  onTest,
  label,
  subtitle,
  unconfigured,
}: {
  channel: 'voice' | 'whatsapp'
  onEdit: () => void
  onTest: () => void
  label?: string
  subtitle?: string
  unconfigured?: boolean
}) {
  const isVoice = channel === 'voice'
  const borderColor = unconfigured ? 'border-amber-200' : 'border-emerald-100'
  const bgColor = unconfigured ? 'bg-amber-50/40' : 'bg-emerald-50/40'
  const iconBg = unconfigured ? 'bg-amber-100' : 'bg-emerald-100'
  const iconColor = unconfigured ? 'text-amber-600' : 'text-emerald-600'
  return (
    <div className={`flex-1 min-w-[220px] rounded-2xl border-2 ${borderColor} ${bgColor} p-4 flex flex-col gap-3`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${iconBg}`}>
            {isVoice
              ? <Mic size={16} className={iconColor} />
              : <MessageSquare size={16} className={iconColor} />}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {label ?? (isVoice ? 'Sesli Resepsiyonist' : 'Mesajlaşma Asistanı')}
            </p>
            <p className="text-xs text-slate-500">
              {subtitle ?? (isVoice ? 'Gelen aramaları karşılar, lead niteler' : 'WhatsApp & Instagram mesajlarını yanıtlar')}
            </p>
          </div>
        </div>
        {unconfigured ? (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full shrink-0">
            Yapılandırılmadı
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Aktif
          </span>
        )}
      </div>
      <div className="flex gap-2 mt-1">
        {unconfigured ? (
          <button
            onClick={onEdit}
            className="flex-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors flex items-center justify-center gap-1"
          >
            Yapılandır <ArrowRight size={12} />
          </button>
        ) : (
          <>
            <button
              onClick={onTest}
              className="flex-1 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors flex items-center justify-center gap-1"
            >
              <FlaskConical size={12} /> Test Et
            </button>
            <button
              onClick={onEdit}
              className="flex-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white transition-colors flex items-center justify-center gap-1"
            >
              Düzenle <ArrowRight size={12} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function VoiceUpgradeCard() {
  return (
    <div className="flex-1 min-w-[220px] rounded-2xl border-2 border-amber-100 bg-amber-50/40 p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-amber-100">
            <Mic size={16} className="text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Sesli Asistan</p>
            <p className="text-xs text-slate-500">Gelen aramaları otomatik karşılar</p>
          </div>
        </div>
        <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full shrink-0">
          <Lock size={9} /> Kilitli
        </span>
      </div>
      <p className="text-xs text-slate-500 leading-relaxed">
        Mevcut paketinizde sesli asistan özelliği bulunmuyor. Aktif etmek için planınızı yükseltin.
      </p>
      <a
        href="/dashboard/billing"
        className="text-xs font-medium px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors flex items-center justify-center gap-1"
      >
        Paketi Yükselt <ArrowUpRight size={12} />
      </a>
    </div>
  )
}

export default function AgentPage() {
  return (
    <Suspense fallback={null}>
      <AgentPageInner />
    </Suspense>
  )
}
