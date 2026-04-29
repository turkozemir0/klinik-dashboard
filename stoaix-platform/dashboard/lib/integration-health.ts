import { createClient as sbAdmin } from '@supabase/supabase-js'
import type { WorkflowChannel } from './workflow-types'
import { getTemplate } from './workflow-templates'

function getServiceClient() {
  return sbAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export type ChannelStatus = 'connected' | 'missing_config' | 'not_configured' | 'token_expired'

export interface ChannelHealth {
  status: ChannelStatus
  detail: string | null
}

export interface ChannelReadyResult {
  ready: boolean
  missing: string[]  // human-readable labels: 'WhatsApp', 'Ses (Giden)', etc.
}

export interface IntegrationHealthResult {
  channels: Record<string, ChannelHealth>
  active_workflow_count: number
  blocked_workflow_count: number
  blocked_workflows: Array<{ name: string; missing: string[] }>
}

// ── Channel config helpers ─────────────────────────────────────────────────────

function checkWhatsApp(cc: any): ChannelHealth {
  if (!cc?.whatsapp) return { status: 'not_configured', detail: null }
  const wa = cc.whatsapp
  const creds = wa.credentials ?? {}
  // manual-connect saves inside credentials; embedded signup may save at top level
  const wabaId = wa.waba_id || creds.waba_id
  const phoneNumId = wa.phone_number_id || creds.phone_number_id
  const accessToken = wa.access_token || creds.access_token
  const displayPhone = wa.display_phone_number || creds.phone_number || phoneNumId

  if (wa.active && wabaId && phoneNumId) {
    return { status: 'connected', detail: displayPhone }
  }
  if (wabaId || phoneNumId || accessToken) {
    return { status: 'missing_config', detail: 'Eksik yapılandırma' }
  }
  return { status: 'not_configured', detail: null }
}

function checkInstagram(cc: any): ChannelHealth {
  if (!cc?.instagram) return { status: 'not_configured', detail: null }
  const ig = cc.instagram
  if (ig.active && ig.page_id && ig.access_token) {
    return { status: 'connected', detail: ig.instagram_username ? `@${ig.instagram_username}` : ig.page_id }
  }
  if (ig.page_id || ig.access_token) {
    return { status: 'missing_config', detail: 'Eksik yapılandırma' }
  }
  return { status: 'not_configured', detail: null }
}

function checkVoiceInbound(cc: any): ChannelHealth {
  if (!cc?.voice_inbound) return { status: 'not_configured', detail: null }
  const vi = cc.voice_inbound
  if (vi.active) {
    return { status: 'connected', detail: vi.provider || 'LiveKit' }
  }
  return { status: 'not_configured', detail: null }
}

function checkVoiceOutbound(cc: any): ChannelHealth {
  if (!cc?.voice_outbound) return { status: 'not_configured', detail: null }
  const vo = cc.voice_outbound
  if (vo.active && vo.livekit_sip_outbound_trunk_id) {
    return { status: 'connected', detail: vo.provider || 'LiveKit SIP' }
  }
  if (vo.active || vo.livekit_sip_outbound_trunk_id) {
    return { status: 'missing_config', detail: 'SIP trunk gerekli' }
  }
  return { status: 'not_configured', detail: null }
}

function checkCalendar(cc: any): ChannelHealth {
  if (!cc?.google_calendar) return { status: 'not_configured', detail: null }
  const gc = cc.google_calendar
  if (gc.access_token && gc.calendar_id) {
    return { status: 'connected', detail: 'Google Calendar' }
  }
  if (gc.access_token) {
    return { status: 'missing_config', detail: 'Takvim seçilmemiş' }
  }
  return { status: 'not_configured', detail: null }
}

// ── Public API ──────────────────────────────────────────────────────────────────

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  voice: 'Ses (Giden)',
  voice_outbound: 'Ses (Giden)',
  voice_inbound: 'Ses (Gelen)',
  calendar: 'Takvim',
}

/**
 * Check if the required channels for a workflow template are configured.
 */
export async function checkChannelReady(
  orgId: string,
  channel: WorkflowChannel
): Promise<ChannelReadyResult> {
  const service = getServiceClient()
  const { data: org } = await service
    .from('organizations')
    .select('channel_config')
    .eq('id', orgId)
    .maybeSingle()

  const cc = org?.channel_config as any
  return checkChannelReadyFromConfig(cc, channel)
}

/**
 * Pure function — check channel readiness from an already-fetched channel_config.
 * Used when we already have the config (avoids extra DB call).
 */
export function checkChannelReadyFromConfig(
  cc: any,
  channel: WorkflowChannel
): ChannelReadyResult {
  const missing: string[] = []

  if (channel === 'voice' || channel === 'multi') {
    const vo = checkVoiceOutbound(cc)
    if (vo.status !== 'connected') missing.push(CHANNEL_LABELS.voice_outbound)
  }

  if (channel === 'whatsapp' || channel === 'multi') {
    const wa = checkWhatsApp(cc)
    if (wa.status !== 'connected') missing.push(CHANNEL_LABELS.whatsapp)
  }

  if (channel === 'instagram') {
    const ig = checkInstagram(cc)
    if (ig.status !== 'connected') missing.push(CHANNEL_LABELS.instagram)
  }

  return { ready: missing.length === 0, missing }
}

/**
 * Full integration health check for an org — used by the dashboard widget.
 */
export async function getIntegrationHealth(orgId: string): Promise<IntegrationHealthResult> {
  const service = getServiceClient()

  const [orgResult, workflowsResult] = await Promise.all([
    service
      .from('organizations')
      .select('channel_config')
      .eq('id', orgId)
      .maybeSingle(),
    service
      .from('org_workflows')
      .select('id, template_id, is_active')
      .eq('organization_id', orgId),
  ])

  const cc = orgResult.data?.channel_config as any
  const workflows = workflowsResult.data ?? []

  const channels: Record<string, ChannelHealth> = {
    whatsapp: checkWhatsApp(cc),
    instagram: checkInstagram(cc),
    voice_inbound: checkVoiceInbound(cc),
    voice_outbound: checkVoiceOutbound(cc),
    calendar: checkCalendar(cc),
  }

  // Check active workflows for channel readiness issues
  const activeWorkflows = workflows.filter(w => w.is_active)
  const blockedWorkflows: Array<{ name: string; missing: string[] }> = []

  for (const wf of activeWorkflows) {
    const template = getTemplate(wf.template_id)
    if (!template) continue
    const { ready, missing } = checkChannelReadyFromConfig(cc, template.channel)
    if (!ready) {
      blockedWorkflows.push({ name: template.name, missing })
    }
  }

  return {
    channels,
    active_workflow_count: activeWorkflows.length,
    blocked_workflow_count: blockedWorkflows.length,
    blocked_workflows: blockedWorkflows,
  }
}
