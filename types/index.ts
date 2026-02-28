// ─── Database Types ───────────────────────────────────────────────────────────

export interface Clinic {
  id: string;
  name: string;
  slug: string;
  clinic_type: string;
  status: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  district: string | null;
  city: string;
  lead_doctor_name: string | null;
  lead_doctor_title: string | null;
  lead_doctor_experience_years: number | null;
  working_hours: Record<string, string>;
  tone_profile: string;
  ghl_location_id: string | null;
}

export interface ClinicUser {
  id: string;
  user_id: string;
  clinic_id: string;
  role: 'admin' | 'viewer';
  clinic: Clinic;
}

export interface Conversation {
  id: string;
  clinic_id: string;
  ghl_contact_id: string;
  contact_name: string | null;
  contact_phone: string;
  status: 'active' | 'handed_off' | 'closed';
  current_stage: string;
  collected_data: {
    name: string | null;
    interested_service: string | null;
    interested_service_key: string | null;
    pain_point: string | null;
    timeline: string | null;
    preferred_consultation_type: string | null;
    preferred_day_time: string | null;
  };
  lead_signals: {
    urgency: string;
    engagement_level: string;
    buying_intent: string;
    objections_raised: string[];
    objections_resolved: string[];
  };
  lead_score: number;
  score_breakdown: Record<string, number>;
  human_takeover: boolean;
  handoff_triggered: boolean;
  handoff_at: string | null;
  handoff_summary: string | null;
  images_received: number;
  message_count: number;
  first_message_at: string;
  last_message_at: string;
  created_at: string;
}

export interface HandoffLog {
  id: string;
  clinic_id: string;
  conversation_id: string;
  ghl_contact_id: string;
  trigger_type: string;
  lead_score_at_handoff: number | null;
  salesperson_notified_at: string;
  salesperson_contacted_at: string | null;
  outcome: 'pending' | 'converted' | 'lost' | 'no_answer';
  outcome_notes: string | null;
  created_at: string;
  conversation?: Conversation;
}

export interface Service {
  id: string;
  clinic_id: string;
  service_key: string;
  display_name: string;
  category: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface DailyStat {
  id: string;
  clinic_id: string;
  date: string;
  new_conversations: number;
  hot_leads: number;
  warm_leads: number;
  cold_leads: number;
  handed_off_leads: number;
  avg_lead_score: number;
  service_breakdown: Record<string, number>;
  images_received: number;
}

// ─── View Types ───────────────────────────────────────────────────────────────

export interface ServicePerformanceRow {
  clinic_id: string;
  service: string;
  total_leads: number;
  avg_score: number;
  handoffs: number;
  conversion_rate_pct: number;
}

// ─── KB Change Request ────────────────────────────────────────────────────────

export interface KbChangeRequest {
  id: string;
  clinic_id: string;
  requested_by: string;
  table_name: 'clinics' | 'services' | 'faqs';
  record_id: string;
  record_label: string | null;
  field_name: string;
  field_label: string | null;
  old_value: string | null;
  new_value: string;
  change_note: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_note: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Dashboard Summary ────────────────────────────────────────────────────────

export interface DashboardStats {
  totalConversations: number;
  activeConversations: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  totalHandoffs: number;
  avgScore: number;
  todayNewConversations: number;
  todayHandoffs: number;
}
