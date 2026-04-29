// Workflow Engine — TypeScript interfaces

export type TriggerType =
  | 'lead_created'
  | 'appointment_created'
  | 'appointment_reminder'
  | 'appointment_noshow'
  | 'post_appointment'
  | 'no_answer'
  | 'no_reply'
  | 'contact_inactive'
  | 'manual'
  | 'payment_overdue'

export type WorkflowCategory =
  | 'outbound_voice'
  | 'chatbot'
  | 'sync'

export type WorkflowChannel =
  | 'voice'
  | 'whatsapp'
  | 'instagram'
  | 'sms'
  | 'email'
  | 'multi'

export interface ConfigFieldOption {
  value: string
  label: string
}

export interface ConfigField {
  key: string
  label: string
  type: 'number' | 'text' | 'time' | 'select' | 'boolean' | 'template_picker'
  default: string | number | boolean
  unit?: string
  options?: ConfigFieldOption[]
  description?: string
  template_purpose?: string  // followup | reengagement | appointment_reminder | satisfaction
}

export interface SequenceStep {
  step: number
  template: string
  param_count: number
  delay_days: number
}

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: WorkflowCategory
  channel: WorkflowChannel
  sector: 'all' | string[]
  trigger_type: TriggerType
  required_feature: string   // checkEntitlement ile kontrol
  config_fields: ConfigField[]
  n8n_workflow_id: string    // n8n webhook key
  steps_summary: string[]    // {{variable}} interpolasyonu
  comingSoon?: boolean       // n8n karşılığı henüz yok → UI'da devre dışı
  default_sequence?: SequenceStep[]  // drip sequence varsayılan adımları
}

// DB: org_workflows
export interface OrgWorkflow {
  id: string
  organization_id: string
  template_id: string
  is_active: boolean
  config: Record<string, any>
  created_at: string
  updated_at: string
}

// DB: workflow_runs
export interface WorkflowRun {
  id: string
  org_workflow_id: string
  organization_id: string
  contact_id: string | null
  contact_phone: string | null
  trigger_type: TriggerType
  trigger_ref_id: string | null
  status: 'pending' | 'running' | 'success' | 'failed' | 'no_answer' | 'cancelled'
  sequence_step: number  // drip sequence adımı (default: 1)
  result: {
    call_duration_seconds?: number
    score?: number
    next_action?: string
    notes?: string
    template?: string
    step?: number
  }
  n8n_execution_id: string | null
  started_at: string | null
  finished_at: string | null
  created_at: string
}

// DB: appointments
export interface Appointment {
  id: string
  organization_id: string
  contact_id: string | null
  lead_id: string | null
  conversation_id: string | null
  scheduled_at: string
  duration_minutes: number
  status: 'scheduled' | 'confirmed' | 'attended' | 'no_show' | 'cancelled' | 'rescheduled'
  confirmed_at: string | null
  attended_at: string | null
  no_show_at: string | null
  notes: string | null
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

// API response: templates list
export interface TemplateWithStatus extends WorkflowTemplate {
  plan_allowed: boolean          // checkEntitlement sonucu
  active_workflow_id: string | null  // org_workflows.id varsa
  is_active: boolean
  config: Record<string, any>
  channel_ready: boolean         // entegrasyon kurulu mu
  missing_channels: string[]     // eksik kanallar: ['WhatsApp', 'Ses (Giden)']
  today_runs?: number            // bugün çalıştırılan sayı
  success_rate?: number          // son 7 gün başarı oranı (0-100)
  last_run_at?: string | null    // en son çalışma zamanı
}

// n8n webhook payload (Dashboard → n8n)
export interface N8nDispatchPayload {
  run_id: string
  org_id: string
  phone: string
  config: Record<string, any>
  script_type: string
  contact_data: {
    name?: string
    lead_source?: string
    interest?: string
    [key: string]: any
  }
  callback_url: string
}

// n8n result callback (n8n → Dashboard)
export interface N8nResultPayload {
  run_id: string
  status: 'success' | 'failed' | 'no_answer'
  n8n_execution_id?: string
  result?: {
    call_duration_seconds?: number
    score?: number
    next_action?: 'retry' | 'whatsapp' | 'done' | null
    notes?: string
  }
}
