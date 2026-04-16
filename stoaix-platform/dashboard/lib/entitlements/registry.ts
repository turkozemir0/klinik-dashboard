// feature_key → usage_metric mapping
// null = boolean feature (no usage tracking)
export const FEATURE_METRIC_MAP: Record<string, string | null> = {
  whatsapp_inbound:           'whatsapp_inbound_msgs',
  whatsapp_outbound:          'whatsapp_outbound_msgs',
  whatsapp_templates:         'template_count',
  unified_inbox:              null,
  voice_agent_inbound:        'voice_minutes',
  voice_agent_outbound:       'voice_minutes',
  voice_appointment_reminder: 'voice_minutes',
  kb_read:                    null,
  kb_write:                   'kb_item_count',
  leads_manage:               null,
  leads_kanban:               null,
  leads_import_csv:           'import_row_count',
  proposals_manage:           null,
  proposals_payments:         null,
  calendar_manage:            null,
  followup_sequences:         null,
  followup_manual:            null,
  instagram_dm:               'instagram_messages',
  analytics_basic:            null,
  analytics_advanced:         null,
  analytics_export:           null,
  outbound_webhooks:          null,
  dentsoft_integration:       null,
  support_tickets:            null,
  multi_team:                 'team_member_count',
  // Workflow engine features (all boolean, no usage tracking)
  workflow_engine:            null,
  workflow_outbound_voice:    null,
  workflow_chatbot_auto:      null,
  workflow_sync_flows:        null,
  workflow_satisfaction:      null,
  workflow_reactivation:      null,
  workflow_payment_followup:  null,
}

export function featureKeyToMetric(featureKey: string): string | null {
  return FEATURE_METRIC_MAP[featureKey] ?? null
}
