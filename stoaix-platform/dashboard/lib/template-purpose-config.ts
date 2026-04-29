export const TEMPLATE_PURPOSES = [
  'first_contact', 'followup', 'appointment_reminder',
  'satisfaction', 'reengagement', 'payment_followup', 'unsubscribe', 'other',
] as const

export type TemplatePurpose = typeof TEMPLATE_PURPOSES[number]

export const PURPOSE_LABELS: Record<string, string> = {
  first_contact:        'İlk Temas',
  followup:             'Takip Mesajı',
  appointment_reminder: 'Randevu Hatırlatma',
  satisfaction:         'Memnuniyet Anketi',
  reengagement:         'Yeniden Aktivasyon',
  payment_followup:     'Ödeme Takibi',
  unsubscribe:          'Listeden Çıkma',
  other:                'Diğer',
}

// Purpose → hangi workflow kullanır (UI badge için)
export const PURPOSE_WORKFLOW_NAMES: Record<string, string[]> = {
  first_contact:        ['C1 Lead İlk Temas (WA)'],
  followup:             ['C2 Chatbot Takip', 'S1 Ara Sonra WA'],
  reengagement:         ['C7 Eski Lead Aktivasyonu'],
  payment_followup:     ['C8 Tahsilat Follow-up'],
  appointment_reminder: ['C3 Randevu Onay', 'C4 Randevu Hatırlatma'],
  satisfaction:         ['C5 Memnuniyet Anketi'],
  unsubscribe:          [],
  other:                [],
}

export const LANGUAGE_LABELS: Record<string, string> = {
  tr: 'Türkçe',
  en: 'English',
  de: 'Deutsch',
}

export const SECTOR_LABELS: Record<string, string> = {
  dental:     'Diş Kliniği',
  hair:       'Saç Ekimi',
  aesthetics: 'Estetik',
  general:    'Genel',
}

export const SECTOR_GROUPS = ['dental', 'hair', 'aesthetics', 'general'] as const
