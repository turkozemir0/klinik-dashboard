export type OrgSector = 'education' | 'clinic' | 'real_estate' | 'tech_service' | 'other'
export type OrgStatus = 'onboarding' | 'active' | 'inactive'
export type LeadStatus = 'new' | 'in_progress' | 'qualified' | 'handed_off' | 'lost' | 'converted'
export type ContactStatus = 'anonymous' | 'new' | 'known' | 'qualified' | 'customer'
export type TicketStatus = 'open' | 'in_progress' | 'resolved'
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface Organization {
  id: string
  name: string
  slug: string
  sector: OrgSector
  status: OrgStatus
  onboarding_status: string
  phone: string | null
  email: string | null
  city: string | null
  country: string
  ai_persona: {
    persona_name: string
    language: string
    tone: string
  }
  channel_config: Record<string, { active: boolean }>
  crm_config: { provider: string }
  created_at: string
  updated_at: string
}

export interface OrgUser {
  id: string
  user_id: string
  organization_id: string
  role: 'admin' | 'viewer'
  created_at: string
  organization?: Organization
}

export interface Contact {
  id: string
  organization_id: string
  phone: string | null
  email: string | null
  full_name: string | null
  channel_identifiers: Record<string, string>
  status: ContactStatus
  source_channel: string | null
  tags: string[]
  created_at: string
  updated_at: string
}

export interface Lead {
  id: string
  organization_id: string
  contact_id: string
  status: LeadStatus
  source_channel: string
  collected_data: Record<string, any>
  data_completeness: Record<string, string>
  missing_required_fields: string[]
  qualification_score: number
  notes: string | null
  created_at: string
  updated_at: string
  contact?: Contact
}

export interface Conversation {
  id: string
  organization_id: string
  contact_id: string
  lead_id: string | null
  channel: string
  status: string
  started_at: string
  ended_at: string | null
  contact?: Contact
  lead?: Lead
}

export interface Message {
  id: string
  conversation_id: string
  organization_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  channel: string
  created_at: string
}

export interface VoiceCall {
  id: string
  organization_id: string
  contact_id: string | null
  conversation_id: string | null
  lead_id: string | null
  direction: 'inbound' | 'outbound'
  status: 'completed' | 'missed' | 'dropped' | 'in_progress'
  phone_from: string | null
  phone_to: string | null
  duration_seconds: number
  transcript: string | null
  livekit_room_name: string | null
  started_at: string
  ended_at: string | null
  contact?: Contact
}

export interface KnowledgeItem {
  id: string
  organization_id: string
  item_type: string
  title: string
  description_for_ai: string
  data: Record<string, any>
  tags: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface HandoffLog {
  id: string
  organization_id: string
  lead_id: string | null
  conversation_id: string | null
  trigger_reason: string
  summary: string | null
  collected_data_snapshot: Record<string, any>
  missing_at_handoff: string[]
  routing_target: string | null
  status: 'pending' | 'accepted' | 'resolved'
  created_at: string
  lead?: Lead
}

export interface SupportTicket {
  id: string
  organization_id: string
  subject: string
  message: string
  status: TicketStatus
  priority: TicketPriority
  created_by: string | null
  admin_notes: string | null
  created_at: string
  organization?: Organization
}

export interface MetaAdAccount {
  id: string
  organization_id: string
  account_name: string | null
  meta_ad_account_id: string
  meta_business_id: string | null
  meta_business_name: string | null
  access_token_ref: string | null
  currency: string | null
  account_status: string | null
  timezone_name: string | null
  report_timezone: string
  is_active: boolean
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface AdReportConfig {
  id: string
  organization_id: string
  meta_ad_account_id: string
  is_enabled: boolean
  schedule_type: 'daily' | 'weekly'
  send_time_local: string
  report_timezone: string
  period_type: 'yesterday' | 'last_24h'
  from_email: string | null
  from_name: string | null
  subject_template: string
  recipient_emails: string[]
  include_campaign_breakdown: boolean
  include_ai_summary: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AdReportRun {
  id: string
  organization_id: string
  meta_ad_account_id: string
  config_id: string | null
  provider: 'meta_ads'
  period_start: string
  period_end: string
  period_label: string | null
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'skipped'
  email_provider: string | null
  email_id: string | null
  metrics: Record<string, any>
  summary: Record<string, any>
  report_html: string | null
  error_message: string | null
  sent_at: string | null
  created_at: string
  updated_at: string
}

export interface Pipeline {
  id: string
  organization_id: string
  name: string
  description: string | null
  is_default: boolean
  color: string
  position: number
  created_at: string
  stages?: PipelineStage[]
}

export interface PipelineStage {
  id: string
  pipeline_id: string
  name: string
  color: string
  position: number
  maps_to_status: string | null
  is_system: boolean
}

// Aggregated types for dashboard
export interface DashboardStats {
  totalLeads: number
  hotLeads: number
  warmLeads: number
  coldLeads: number
  totalHandoffs: number
  avgScore: number
  todayNew: number
}

export interface DailyTrend {
  date: string
  conversations: number
  hot_leads: number
  handoffs: number
}

// Lead classification
export function classifyLead(score: number): 'HOT' | 'WARM' | 'COLD' {
  if (score >= 70) return 'HOT'
  if (score >= 40) return 'WARM'
  return 'COLD'
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins < 60) return secs > 0 ? `${mins}d ${secs}s` : `${mins}d`
  const hours = Math.floor(mins / 60)
  const remainMins = mins % 60
  return remainMins > 0 ? `${hours}s ${remainMins}d` : `${hours}s`
}
