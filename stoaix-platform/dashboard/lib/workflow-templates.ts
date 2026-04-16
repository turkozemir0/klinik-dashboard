import type { WorkflowTemplate } from './workflow-types'

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  // ─── OUTBOUND VOICE ────────────────────────────────────────────────────────

  // V3: Lead İlk Temas Araması
  {
    id: 'lead_first_contact_voice',
    name: 'Lead İlk Temas Araması',
    description: 'Yeni lead oluşunca otomatik outbound arama başlatır. Cevap alınamazsa retry yapar.',
    category: 'outbound_voice',
    channel: 'voice',
    sector: 'all',
    trigger_type: 'lead_created',
    required_feature: 'workflow_outbound_voice',
    n8n_workflow_id: 'lead-first-contact-voice',
    config_fields: [
      { key: 'delay_minutes',       label: 'Kaç dakika sonra arasın?',  type: 'number', default: 5,          unit: 'dakika' },
      { key: 'max_retries',         label: 'Maks deneme sayısı',         type: 'number', default: 3 },
      { key: 'retry_interval_hours', label: 'Denemeler arası süre',      type: 'number', default: 2,          unit: 'saat' },
      { key: 'working_hours_start', label: 'Çalışma saati başlangıcı',  type: 'time',   default: '09:00' },
      { key: 'working_hours_end',   label: 'Çalışma saati bitişi',      type: 'time',   default: '19:00' },
      {
        key: 'no_answer_fallback', label: 'Ulaşılamazsa ne yapılsın?',  type: 'select', default: 'whatsapp',
        options: [
          { value: 'whatsapp', label: 'WhatsApp mesajı gönder' },
          { value: 'none',     label: 'Hiçbir şey yapma' },
        ],
      },
    ],
    steps_summary: [
      'Lead oluşunca {{delay_minutes}} dk bekle, ara',
      '{{working_hours_start}}–{{working_hours_end}} saatleri arasında çalışır',
      'Açmazsa {{retry_interval_hours}}s bekleyip {{max_retries}} kez dener',
      'Yine ulaşılamazsa: {{no_answer_fallback}}',
    ],
  },

  // V4: Sesli Follow-up (Cevapsız Retry)
  {
    id: 'voice_no_answer_retry',
    name: 'Sesli Follow-up (Cevapsız Retry)',
    description: 'İlk temas araması cevaplanmadığında ek deneme akışı.',
    category: 'outbound_voice',
    channel: 'voice',
    sector: 'all',
    trigger_type: 'no_answer',
    required_feature: 'workflow_outbound_voice',
    n8n_workflow_id: 'voice-no-answer-retry',
    config_fields: [
      { key: 'retry_count',         label: 'Ek deneme sayısı',     type: 'number', default: 2 },
      { key: 'retry_interval_hours', label: 'Denemeler arası süre', type: 'number', default: 3, unit: 'saat' },
    ],
    steps_summary: [
      'Cevapsız aramadan {{retry_interval_hours}}s sonra tekrar dener',
      'Toplam {{retry_count}} ek deneme',
    ],
  },

  // V5: Randevu Teyit Araması
  {
    id: 'appointment_confirm_voice',
    name: 'Randevu Teyit Araması',
    description: 'Randevu oluşturulunca 24 saat önce teyit araması yapar.',
    category: 'outbound_voice',
    channel: 'voice',
    sector: 'all',
    trigger_type: 'appointment_created',
    required_feature: 'workflow_outbound_voice',
    n8n_workflow_id: 'appointment-confirm-voice',
    config_fields: [
      { key: 'hours_before',        label: 'Randevudan kaç saat önce?', type: 'number', default: 24, unit: 'saat' },
      { key: 'working_hours_start', label: 'Çalışma saati başlangıcı',  type: 'time',   default: '09:00' },
      { key: 'working_hours_end',   label: 'Çalışma saati bitişi',      type: 'time',   default: '19:00' },
    ],
    steps_summary: [
      'Randevudan {{hours_before}} saat önce teyit araması',
      '{{working_hours_start}}–{{working_hours_end}} aralığında çalışır',
    ],
  },

  // V6: Randevu Hatırlatma
  {
    id: 'appointment_reminder_voice',
    name: 'Randevu Hatırlatma Araması',
    description: 'Randevudan 2 saat önce kısa hatırlatma araması.',
    category: 'outbound_voice',
    channel: 'voice',
    sector: 'all',
    trigger_type: 'appointment_reminder',
    required_feature: 'workflow_outbound_voice',
    n8n_workflow_id: 'appointment-reminder-voice',
    config_fields: [
      { key: 'hours_before', label: 'Randevudan kaç saat önce?', type: 'number', default: 2, unit: 'saat' },
    ],
    steps_summary: [
      'Randevudan {{hours_before}} saat önce hatırlatma araması',
      'Kısa (2-3 tur), sadece teyit al',
    ],
  },

  // V7: No-Show Takibi
  {
    id: 'noshow_followup_voice',
    name: 'No-Show Takip Araması',
    description: 'Randevuya gelmeyen müşteriyi 30 dk sonra arar, yeni randevu önerir.',
    category: 'outbound_voice',
    channel: 'voice',
    sector: 'all',
    trigger_type: 'appointment_noshow',
    required_feature: 'workflow_outbound_voice',
    n8n_workflow_id: 'noshow-followup-voice',
    config_fields: [
      { key: 'delay_minutes', label: 'Gelmemesinin üzerinden kaç dk geçince arasın?', type: 'number', default: 30, unit: 'dakika' },
    ],
    steps_summary: [
      'No-show kaydından {{delay_minutes}} dk sonra arar',
      'Anlayışlı, nazik — yeni randevu önerir',
    ],
  },

  // V8: Memnuniyet Anketi
  {
    id: 'satisfaction_survey_voice',
    name: 'Memnuniyet Anketi Araması',
    description: 'Randevu gerçekleştikten 24 saat sonra kısa memnuniyet anketi araması.',
    category: 'outbound_voice',
    channel: 'voice',
    sector: 'all',
    trigger_type: 'post_appointment',
    required_feature: 'workflow_satisfaction',
    n8n_workflow_id: 'satisfaction-survey-voice',
    config_fields: [
      { key: 'hours_after', label: 'Randevudan kaç saat sonra?', type: 'number', default: 24, unit: 'saat' },
    ],
    steps_summary: [
      'Randevudan {{hours_after}} saat sonra memnuniyet araması',
      '1–5 puan + yorum alır, DB\'ye kaydeder',
    ],
  },

  // V9: Periyodik Tedavi Hatırlatma
  {
    id: 'treatment_reminder_voice',
    name: 'Periyodik Tedavi Hatırlatma',
    description: 'Son ziyaretten belirli gün geçince randevu hatırlatma araması (örn. 90 günlük kontrol).',
    category: 'outbound_voice',
    channel: 'voice',
    sector: 'all',
    trigger_type: 'contact_inactive',
    required_feature: 'workflow_reactivation',
    n8n_workflow_id: 'treatment-reminder-voice',
    config_fields: [
      { key: 'interval_days', label: 'Son ziyaretten kaç gün sonra?', type: 'number', default: 90, unit: 'gün' },
      { key: 'working_hours_start', label: 'Çalışma saati başlangıcı', type: 'time', default: '09:00' },
      { key: 'working_hours_end',   label: 'Çalışma saati bitişi',     type: 'time', default: '19:00' },
    ],
    steps_summary: [
      'Son ziyaretten {{interval_days}} gün geçince arar',
      'Kısa kontrol randevusu teklifi',
    ],
  },

  // V10: Uyuyan Lead Aktivasyonu
  {
    id: 'reactivation_voice',
    name: 'Uyuyan Lead Aktivasyonu',
    description: 'Son etkileşimden 90 gün geçen leadleri yeniden aktive etmek için arar.',
    category: 'outbound_voice',
    channel: 'voice',
    sector: 'all',
    trigger_type: 'contact_inactive',
    required_feature: 'workflow_reactivation',
    n8n_workflow_id: 'reactivation-voice',
    config_fields: [
      { key: 'inactive_days', label: 'Son etkileşimden kaç gün geçmişse?', type: 'number', default: 90, unit: 'gün' },
      { key: 'offer_text',    label: 'Özel teklif metni (isteğe bağlı)',   type: 'text',   default: '' },
    ],
    steps_summary: [
      '{{inactive_days}} gün hareketsiz leadleri arar',
      'Nazik, kısa — varsa özel teklif iletir',
    ],
  },

  // V11: Tahsilat Follow-up
  {
    id: 'payment_followup_voice',
    name: 'Tahsilat Follow-up Araması',
    description: 'Ödeme gecikince müşteriyi nazikçe arar, ödeme planı sunar.',
    category: 'outbound_voice',
    channel: 'voice',
    sector: 'all',
    trigger_type: 'payment_overdue',
    required_feature: 'workflow_payment_followup',
    n8n_workflow_id: 'payment-followup-voice',
    config_fields: [
      { key: 'delay_days',  label: 'Gecikme gününden kaç gün sonra?', type: 'number', default: 3,  unit: 'gün' },
      { key: 'max_retries', label: 'Maks deneme',                     type: 'number', default: 2 },
    ],
    steps_summary: [
      'Ödeme tarihinden {{delay_days}} gün sonra arar',
      '{{max_retries}} denemeye kadar devam eder',
    ],
  },

  // ─── CHATBOT ────────────────────────────────────────────────────────────────

  // C1: Lead İlk Temas (WA/IG)
  {
    id: 'lead_first_contact_chat',
    name: 'Lead İlk Temas Mesajı',
    description: 'Yeni lead oluşunca WhatsApp veya Instagram ile proaktif mesaj gönderir.',
    category: 'chatbot',
    channel: 'whatsapp',
    sector: 'all',
    trigger_type: 'lead_created',
    required_feature: 'workflow_chatbot_auto',
    n8n_workflow_id: 'lead-first-contact-chat',
    config_fields: [
      { key: 'delay_minutes', label: 'Kaç dakika sonra gönderilsin?', type: 'number', default: 2, unit: 'dakika' },
      { key: 'message_template', label: 'WhatsApp Template', type: 'template_picker', default: '',
        description: 'Meta\'da onaylı template seçin' },
    ],
    steps_summary: [
      'Lead oluşunca {{delay_minutes}} dk sonra WA mesajı gönderir',
      'Template: {{message_template}}',
    ],
  },

  // C2: Chatbot Follow-up
  {
    id: 'chatbot_followup',
    name: 'Chatbot Follow-up',
    description: 'X saat yanıt alınamazsa hatırlatma mesajı gönderir.',
    category: 'chatbot',
    channel: 'whatsapp',
    sector: 'all',
    trigger_type: 'no_reply',
    required_feature: 'workflow_chatbot_auto',
    n8n_workflow_id: 'chatbot-followup',
    config_fields: [
      { key: 'no_reply_hours', label: 'Kaç saat yanıt yoksa?', type: 'number', default: 4, unit: 'saat' },
      { key: 'max_followups',  label: 'Maks follow-up sayısı', type: 'number', default: 2 },
    ],
    steps_summary: [
      '{{no_reply_hours}} saat yanıt yoksa hatırlatma gönderir',
      'Toplam {{max_followups}} kez tekrar eder',
    ],
  },

  // C3: Randevu Teyit Mesajı
  {
    id: 'appointment_confirm_chat',
    name: 'Randevu Teyit Mesajı',
    description: 'Randevudan 24 saat önce WhatsApp teyit mesajı.',
    category: 'chatbot',
    channel: 'whatsapp',
    sector: 'all',
    trigger_type: 'appointment_created',
    required_feature: 'workflow_chatbot_auto',
    n8n_workflow_id: 'appointment-confirm-chat',
    config_fields: [
      { key: 'hours_before', label: 'Randevudan kaç saat önce?', type: 'number', default: 24, unit: 'saat' },
      { key: 'message_template', label: 'WhatsApp Template', type: 'template_picker', default: '', description: 'Meta\'da onaylı template seçin' },
    ],
    steps_summary: [
      'Randevudan {{hours_before}} saat önce WA teyit mesajı',
    ],
  },

  // C4: Randevu Hatırlatma Mesajı
  {
    id: 'appointment_reminder_chat',
    name: 'Randevu Hatırlatma Mesajı',
    description: 'Randevudan 2 saat önce WhatsApp hatırlatma.',
    category: 'chatbot',
    channel: 'whatsapp',
    sector: 'all',
    trigger_type: 'appointment_reminder',
    required_feature: 'workflow_chatbot_auto',
    n8n_workflow_id: 'appointment-reminder-chat',
    config_fields: [
      { key: 'hours_before', label: 'Randevudan kaç saat önce?', type: 'number', default: 2, unit: 'saat' },
      { key: 'message_template', label: 'WhatsApp Template', type: 'template_picker', default: '', description: 'Meta\'da onaylı template seçin' },
    ],
    steps_summary: [
      'Randevudan {{hours_before}} saat önce WA hatırlatma',
    ],
  },

  // C5: Memnuniyet Anketi (Mesaj)
  {
    id: 'satisfaction_survey_chat',
    name: 'Memnuniyet Anketi (Mesaj)',
    description: 'Randevu gerçekleştikten sonra WA üzerinden kısa anket.',
    category: 'chatbot',
    channel: 'whatsapp',
    sector: 'all',
    trigger_type: 'post_appointment',
    required_feature: 'workflow_satisfaction',
    n8n_workflow_id: 'satisfaction-survey-chat',
    config_fields: [
      { key: 'hours_after', label: 'Randevudan kaç saat sonra?', type: 'number', default: 24, unit: 'saat' },
      { key: 'message_template', label: 'WhatsApp Template', type: 'template_picker', default: '', description: 'Meta\'da onaylı template seçin' },
    ],
    steps_summary: [
      'Randevudan {{hours_after}} saat sonra WA anket mesajı',
    ],
  },

  // C7: Eski Lead Aktivasyonu (WA)
  {
    id: 'reactivation_chat',
    name: 'Eski Lead Aktivasyonu (WA)',
    description: 'Uzun süredir hareketsiz leadleri WA mesajıyla yeniden aktive eder.',
    category: 'chatbot',
    channel: 'whatsapp',
    sector: 'all',
    trigger_type: 'contact_inactive',
    required_feature: 'workflow_reactivation',
    n8n_workflow_id: 'reactivation-chat',
    config_fields: [
      { key: 'inactive_days',    label: 'Son etkileşimden kaç gün geçmişse?', type: 'number', default: 90, unit: 'gün' },
      { key: 'offer_text',       label: 'Özel teklif metni (isteğe bağlı)',   type: 'text',   default: '' },
      { key: 'message_template', label: 'WhatsApp Template', type: 'template_picker', default: '', description: 'Meta\'da onaylı template seçin' },
    ],
    steps_summary: [
      '{{inactive_days}} gün hareketsiz leadlere WA mesajı',
      'Template: {{message_template}}',
    ],
  },

  // C8: Tahsilat Follow-up (WA)
  {
    id: 'payment_followup_chat',
    name: 'Tahsilat Follow-up (WA)',
    description: 'Geciken ödeme için nazik WA hatırlatması.',
    category: 'chatbot',
    channel: 'whatsapp',
    sector: 'all',
    trigger_type: 'payment_overdue',
    required_feature: 'workflow_payment_followup',
    n8n_workflow_id: 'payment-followup-chat',
    config_fields: [
      { key: 'delay_days',  label: 'Ödeme tarihinden kaç gün sonra?', type: 'number', default: 3, unit: 'gün' },
      { key: 'message_template', label: 'WhatsApp Template', type: 'template_picker', default: '', description: 'Meta\'da onaylı template seçin' },
    ],
    steps_summary: [
      'Ödeme tarihinden {{delay_days}} gün sonra WA hatırlatması',
    ],
  },

  // ─── SYNC (Voice + Chatbot) ─────────────────────────────────────────────────

  // S1: Arama → WhatsApp
  {
    id: 'call_then_whatsapp',
    name: 'Arama → WhatsApp',
    description: '3 deneme açmadı → WhatsApp devralır. Omnichannel erişim.',
    category: 'sync',
    channel: 'multi',
    sector: 'all',
    trigger_type: 'lead_created',
    required_feature: 'workflow_sync_flows',
    n8n_workflow_id: 'call-then-whatsapp',
    config_fields: [
      { key: 'voice_attempts',     label: 'Sesli deneme sayısı',    type: 'number', default: 3 },
      { key: 'voice_delay_minutes', label: 'İlk aramaya gecikme',   type: 'number', default: 5,  unit: 'dakika' },
      { key: 'wa_template', label: 'WhatsApp Template', type: 'template_picker', default: '', description: 'Meta\'da onaylı template seçin' },
    ],
    steps_summary: [
      '{{voice_attempts}} sesli deneme başarısız olursa',
      'WhatsApp template mesajı gönderilir',
    ],
  },

  // S2: WhatsApp → Arama
  {
    id: 'chat_then_call',
    name: 'WhatsApp → Arama',
    description: 'Chatbot yüksek ilgi tespit etti → outbound sesli kapama.',
    category: 'sync',
    channel: 'multi',
    sector: 'all',
    trigger_type: 'lead_created',
    required_feature: 'workflow_sync_flows',
    n8n_workflow_id: 'chat-then-call',
    config_fields: [
      { key: 'interest_score_threshold', label: 'Minimum ilgi skoru', type: 'number', default: 60 },
      { key: 'call_delay_minutes',       label: 'İlgi tespit edilince kaç dk sonra arasın?', type: 'number', default: 2, unit: 'dakika' },
    ],
    steps_summary: [
      'Chatbot skor {{interest_score_threshold}}+ ise',
      '{{call_delay_minutes}} dk sonra outbound arama başlatılır',
    ],
  },

  // S3: Eski Lead Canlandırma
  {
    id: 'reactivation_sync',
    name: 'Eski Lead Canlandırma',
    description: 'WA ile ilk temas → ilgi varsa sesli kapama çağrısı.',
    category: 'sync',
    channel: 'multi',
    sector: 'all',
    trigger_type: 'contact_inactive',
    required_feature: 'workflow_sync_flows',
    n8n_workflow_id: 'reactivation-sync',
    config_fields: [
      { key: 'inactive_days', label: 'Son etkileşimden kaç gün geçmişse?', type: 'number', default: 90, unit: 'gün' },
      { key: 'offer_text',    label: 'Özel teklif metni (isteğe bağlı)',   type: 'text',   default: '' },
    ],
    steps_summary: [
      '{{inactive_days}} gün hareketsiz: WA mesajı',
      'İlgi varsa sesli kapama araması',
    ],
  },

  // S4: Omnichannel Follow-up
  {
    id: 'omnichannel_followup',
    name: 'Omnichannel Follow-up',
    description: 'WA → Arama → SMS → Email sıralı erişim. Cevap alınınca durur.',
    category: 'sync',
    channel: 'multi',
    sector: 'all',
    trigger_type: 'lead_created',
    required_feature: 'workflow_sync_flows',
    n8n_workflow_id: 'omnichannel-followup',
    config_fields: [
      { key: 'step_delay_hours', label: 'Adımlar arası bekleme süresi', type: 'number', default: 2, unit: 'saat' },
    ],
    steps_summary: [
      'WA → {{step_delay_hours}}s → Sesli Arama → {{step_delay_hours}}s → ...',
      'Yanıt alınca akış durur',
    ],
  },
]

// Template id → template objesi lookup
export const TEMPLATE_MAP: Record<string, WorkflowTemplate> = Object.fromEntries(
  WORKFLOW_TEMPLATES.map(t => [t.id, t])
)

export function getTemplate(templateId: string): WorkflowTemplate | undefined {
  return TEMPLATE_MAP[templateId]
}
