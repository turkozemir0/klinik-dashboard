import type { WorkflowTemplate, ConfigFieldGroup } from './workflow-types'

export const CONFIG_FIELD_GROUPS: ConfigFieldGroup[] = [
  { key: 'channel',         label_tr: 'Kanal & Zamanlama',   label_en: 'Channel & Timing',   icon: 'Phone' },
  { key: 'followup',        label_tr: 'Follow-up Kuralları', label_en: 'Follow-up Rules',    icon: 'RefreshCw' },
  { key: 'stop_conditions', label_tr: 'Durdurma Koşulları',  label_en: 'Stop Conditions',    icon: 'StopCircle' },
  { key: 'working_hours',   label_tr: 'Mesai Saatleri',      label_en: 'Working Hours',      icon: 'Clock' },
]

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
      // Kanal & Zamanlama
      {
        key: 'first_channel', label: 'İlk temas kanalı', type: 'select', default: 'voice',
        group: 'channel',
        options: [
          { value: 'voice',    label: 'Sesli Arama' },
          { value: 'whatsapp', label: 'WhatsApp Mesajı' },
        ],
      },
      {
        key: 'delay_minutes', label: 'Kaç dakika sonra başlasın?', type: 'select', default: 5,
        group: 'channel', unit: 'dakika',
        preset_values: [0, 5, 10, 60, 1440],
        options: [
          { value: '0',    label: 'Hemen' },
          { value: '5',    label: '5 dakika' },
          { value: '10',   label: '10 dakika' },
          { value: '60',   label: '1 saat' },
          { value: '1440', label: '24 saat' },
        ],
        danger_combo: [{
          when: { delay_minutes: 0, first_channel: 'voice' },
          message_tr: 'Hemen arama: Lead formu doldurur doldurmaz telefon çalar. Müşteri hazır olmayabilir.',
          message_en: 'Immediate call: Phone rings as soon as lead submits form. Customer may not be ready.',
        }],
      },
      // Follow-up Kuralları
      {
        key: 'max_retries', label: 'Maks deneme sayısı', type: 'number', default: 3,
        group: 'followup', min: 1, max: 5,
        warning_threshold: { above: 4, message_tr: 'Fazla deneme müşteriyi rahatsız edebilir.', message_en: 'Too many retries may annoy the customer.' },
        danger_combo: [{
          when: { max_retries: 5, retry_interval_hours: 1 },
          message_tr: 'Agresif ayar: 5 deneme × 1 saat = 5 saat içinde 5 arama. Spam algılanabilir.',
          message_en: 'Aggressive setting: 5 retries × 1 hour = 5 calls in 5 hours. May be flagged as spam.',
        }],
      },
      {
        key: 'retry_interval_hours', label: 'Denemeler arası süre', type: 'select', default: 2,
        group: 'followup', unit: 'saat', min: 1,
        preset_values: [1, 2, 4, 6, 12, 24],
        options: [
          { value: '1',  label: '1 saat' },
          { value: '2',  label: '2 saat' },
          { value: '4',  label: '4 saat' },
          { value: '6',  label: '6 saat' },
          { value: '12', label: '12 saat' },
          { value: '24', label: '24 saat' },
        ],
      },
      {
        key: 'no_answer_fallback', label: 'Ulaşılamazsa ne yapılsın?', type: 'select', default: 'whatsapp',
        group: 'followup',
        options: [
          { value: 'whatsapp', label: 'WhatsApp mesajı gönder' },
          { value: 'none',     label: 'Hiçbir şey yapma' },
        ],
      },
      {
        key: 'handoff_after_all_attempts', label: 'Tüm denemeler bitince insana devret', type: 'boolean', default: false,
        group: 'followup',
      },
      // Durdurma Koşulları
      {
        key: 'stop_on_reply', label: 'Yanıt gelince dur', type: 'boolean', default: true,
        group: 'stop_conditions',
      },
      {
        key: 'stop_on_appointment', label: 'Randevu alınca dur', type: 'boolean', default: true,
        group: 'stop_conditions',
      },
      // Mesai Saatleri
      {
        key: 'working_hours_start', label: 'Çalışma saati başlangıcı', type: 'time', default: '09:00',
        group: 'working_hours',
      },
      {
        key: 'working_hours_end', label: 'Çalışma saati bitişi', type: 'time', default: '19:00',
        group: 'working_hours',
      },
      {
        key: 'after_hours_action', label: 'Mesai dışında ne yapılsın?', type: 'select', default: 'wait',
        group: 'working_hours',
        options: [
          { value: 'wait',     label: 'Mesai saatini bekle' },
          { value: 'whatsapp', label: 'WhatsApp gönder' },
          { value: 'none',     label: 'Hiçbir şey yapma' },
        ],
      },
    ],
    steps_summary: [
      'Lead oluşunca {{delay_minutes}} dk bekle → {{first_channel}}',
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

  // C1: Otomatik İlk Temas (Form Leadleri)
  {
    id: 'lead_first_contact_chat',
    name: 'Otomatik İlk Temas (Form Leadleri)',
    description: 'Form kanallarından (Meta Lead Ads, website, CRM import) gelen leadlere otomatik WhatsApp ile ilk temas mesajı gönderir. WA/IG üzerinden gelen leadler zaten chatbot ile konuştuğu için otomatik hariç tutulur.',
    category: 'chatbot',
    channel: 'whatsapp',
    sector: 'all',
    trigger_type: 'lead_created',
    required_feature: 'workflow_chatbot_auto',
    n8n_workflow_id: 'lead-first-contact-chat',
    n8n_workflow_id_wasender: 'lead-first-contact-chat-wa',
    config_fields: [
      {
        key: 'trigger_sources', label: 'Hangi kaynaklardan gelen leadler tetiklesin?', type: 'select', default: 'all_forms',
        group: 'channel',
        options: [
          { value: 'all_forms',    label: 'Tüm form kanalları (Meta + Website + Import + Manuel)' },
          { value: 'meta_form',    label: 'Sadece Meta Lead Ads' },
          { value: 'web_form',     label: 'Sadece Website Formları' },
          { value: 'meta_and_web', label: 'Meta + Website (import/manuel hariç)' },
        ],
      },
      {
        key: 'delay_minutes', label: 'Kaç dakika sonra gönderilsin?', type: 'select', default: 2,
        group: 'channel', unit: 'dakika',
        options: [
          { value: '0',  label: 'Hemen' },
          { value: '2',  label: '2 dakika' },
          { value: '5',  label: '5 dakika' },
          { value: '10', label: '10 dakika' },
        ],
      },
      {
        key: 'message_template', label: 'WhatsApp Template', type: 'template_picker', default: '',
        group: 'channel',
        description: 'Meta\'da onaylı template seçin', template_purpose: 'first_contact',
      },
      {
        key: 'stop_on_reply', label: 'Yanıt gelince follow-up durdur', type: 'boolean', default: true,
        group: 'stop_conditions',
      },
      {
        key: 'working_hours_start', label: 'Çalışma saati başlangıcı', type: 'time', default: '09:00',
        group: 'working_hours',
      },
      {
        key: 'working_hours_end', label: 'Çalışma saati bitişi', type: 'time', default: '19:00',
        group: 'working_hours',
      },
      {
        key: 'after_hours_action', label: 'Mesai dışında ne yapılsın?', type: 'select', default: 'wait',
        group: 'working_hours',
        options: [
          { value: 'wait', label: 'Mesai saatini bekle' },
          { value: 'send', label: 'Hemen gönder' },
        ],
      },
    ],
    steps_summary: [
      'Form lead oluşunca {{delay_minutes}} dk sonra WA mesajı gönderir',
      'Kaynak filtresi: {{trigger_sources}}',
      '{{working_hours_start}}–{{working_hours_end}} saatleri arasında çalışır',
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
    n8n_workflow_id_wasender: 'chatbot-followup-wa',
    config_fields: [
      {
        key: 'no_reply_hours', label: 'Kaç saat yanıt yoksa?', type: 'select', default: 4,
        group: 'followup', unit: 'saat',
        options: [
          { value: '2',  label: '2 saat' },
          { value: '4',  label: '4 saat' },
          { value: '6',  label: '6 saat' },
          { value: '12', label: '12 saat' },
          { value: '24', label: '24 saat' },
        ],
      },
      {
        key: 'max_followups', label: 'Maks follow-up sayısı', type: 'number', default: 2,
        group: 'followup', min: 1, max: 5,
      },
      {
        key: 'message_template', label: 'WhatsApp Template', type: 'template_picker', default: '',
        group: 'followup',
        description: 'Meta\'da onaylı template seçin', template_purpose: 'followup',
      },
      {
        key: 'stop_on_reply', label: 'Yanıt gelince dur', type: 'boolean', default: true,
        group: 'stop_conditions',
      },
      {
        key: 'stop_on_appointment', label: 'Randevu alınca dur', type: 'boolean', default: true,
        group: 'stop_conditions',
      },
      {
        key: 'working_hours_start', label: 'Çalışma saati başlangıcı', type: 'time', default: '09:00',
        group: 'working_hours',
      },
      {
        key: 'working_hours_end', label: 'Çalışma saati bitişi', type: 'time', default: '19:00',
        group: 'working_hours',
      },
    ],
    steps_summary: [
      '{{no_reply_hours}} saat yanıt yoksa hatırlatma gönderir',
      'Toplam {{max_followups}} kez tekrar eder',
      '{{working_hours_start}}–{{working_hours_end}} saatleri arasında çalışır',
      'Template: {{message_template}}',
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
    n8n_workflow_id_wasender: 'appointment-confirm-chat-wa',
    config_fields: [
      { key: 'hours_before', label: 'Randevudan kaç saat önce?', type: 'number', default: 24, unit: 'saat' },
      { key: 'message_template', label: 'WhatsApp Template', type: 'template_picker', default: '', description: 'Meta\'da onaylı template seçin', template_purpose: 'appointment_reminder' },
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
    n8n_workflow_id_wasender: 'appointment-reminder-chat-wa',
    config_fields: [
      { key: 'hours_before', label: 'Randevudan kaç saat önce?', type: 'number', default: 2, unit: 'saat' },
      { key: 'message_template', label: 'WhatsApp Template', type: 'template_picker', default: '', description: 'Meta\'da onaylı template seçin', template_purpose: 'appointment_reminder' },
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
    n8n_workflow_id_wasender: 'satisfaction-survey-chat-wa',
    config_fields: [
      { key: 'hours_after', label: 'Randevudan kaç saat sonra?', type: 'number', default: 24, unit: 'saat' },
      { key: 'message_template', label: 'WhatsApp Template', type: 'template_picker', default: '', description: 'Meta\'da onaylı template seçin', template_purpose: 'satisfaction' },
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
    n8n_workflow_id_wasender: 'reactivation-chat-wa',
    supports_manual_trigger: false,
    config_fields: [
      { key: 'inactive_days',    label: 'Hareketsizlik süresi (min 30)',       type: 'number', default: 30, unit: 'gün', min: 30,
        group: 'channel', clinic_editable: false,
        description: 'Son etkileşimden bu kadar gün geçmişse mesaj gönderilir. İmport edilen ve hiç iletişim kurulmamış lead\'ler otomatik dahil edilir.' },
      { key: 'target_statuses',  label: 'Hedef lead durumları', type: 'select', default: 'lost,new,in_progress',
        group: 'channel', clinic_editable: false,
        options: [
          { value: 'lost,new,in_progress', label: 'Kayıp + Yeni + Devam Eden' },
          { value: 'lost',                 label: 'Sadece Kayıp' },
          { value: 'lost,new',             label: 'Kayıp + Yeni' },
          { value: 'lost,new,in_progress,qualified', label: 'Tümü (converted hariç)' },
        ],
      },
      { key: 'offer_text',       label: 'Özel teklif metni (isteğe bağlı)',   type: 'text',   default: '',
        group: 'channel' },
      { key: 'cooldown_days',    label: 'Tekrar gönderme bekleme süresi',     type: 'number', default: 30, unit: 'gün', min: 7,
        group: 'followup' },
      { key: 'daily_limit',      label: 'Günlük maksimum gönderim',           type: 'number', default: 50, min: 1, max: 200,
        group: 'followup', clinic_editable: false },
      { key: 'working_hours_start', label: 'Çalışma saati başlangıcı',        type: 'time',   default: '09:00',
        group: 'working_hours' },
      { key: 'working_hours_end',   label: 'Çalışma saati bitişi',            type: 'time',   default: '17:00',
        group: 'working_hours' },
      { key: 'timezone',         label: 'Saat dilimi',                         type: 'select', default: 'Europe/Istanbul',
        group: 'working_hours',
        options: [
          { value: 'Europe/Istanbul', label: 'Türkiye (GMT+3)' },
          { value: 'Europe/London',   label: 'İngiltere (GMT+0/+1)' },
          { value: 'Europe/Berlin',   label: 'Almanya (GMT+1/+2)' },
          { value: 'America/New_York', label: 'ABD Doğu (GMT-5/-4)' },
          { value: 'Asia/Dubai',      label: 'BAE (GMT+4)' },
        ],
      },
      { key: 'sequence',         label: 'Mesaj Sırası',                        type: 'sequence_editor', default: [],
        group: 'channel' },
    ],
    steps_summary: [
      '{{inactive_days}} gün hareketsiz + import edilen lead\'lere WA mesajı',
      '{{working_hours_start}}–{{working_hours_end}} saatleri arasında çalışır',
      'Günlük maks {{daily_limit}}, gün içine dengeli dağıtılır',
      'Cooldown: {{cooldown_days}} gün — aynı kişiye tekrar gönderilmez',
      'Mesaj sırası: her adımda farklı template, cevap gelince durur',
    ],
    default_sequence: [
      { step: 1, template: '', param_count: 1, delay_days: 0 },
      { step: 2, template: '', param_count: 1, delay_days: 3 },
      { step: 3, template: '', param_count: 1, delay_days: 7 },
      { step: 4, template: '', param_count: 1, delay_days: 14 },
      { step: 5, template: '', param_count: 1, delay_days: 30 },
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
    n8n_workflow_id_wasender: 'payment-followup-chat-wa',
    config_fields: [
      { key: 'delay_days',  label: 'Ödeme tarihinden kaç gün sonra?', type: 'number', default: 3, unit: 'gün' },
      { key: 'message_template', label: 'WhatsApp Template', type: 'template_picker', default: '', description: 'Meta\'da onaylı template seçin', template_purpose: 'payment_followup' },
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
    n8n_workflow_id_wasender: 'call-then-whatsapp-wa',
    config_fields: [
      { key: 'voice_attempts',     label: 'Sesli deneme sayısı',    type: 'number', default: 3 },
      { key: 'voice_delay_minutes', label: 'İlk aramaya gecikme',   type: 'number', default: 5,  unit: 'dakika' },
      { key: 'wa_template', label: 'WhatsApp Template', type: 'template_picker', default: '', description: 'Meta\'da onaylı template seçin', template_purpose: 'followup' },
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
    comingSoon: true,
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
    comingSoon: true,
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
    comingSoon: true,
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
