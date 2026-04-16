const tr = {
  // Nav
  overview: 'Genel Bakış',
  conversations: 'Konuşmalar',
  calls: 'Çağrı Logları',
  knowledge: 'Bilgi Bankası',
  admin: 'Admin',
  tickets: 'Destek Talepleri',
  logout: 'Çıkış',

  // Stats
  totalLeads: 'Toplam Lead',
  hotLeads: 'Hot Lead',
  warmLeads: 'Warm Lead',
  handoffs: 'Handoff',
  avgScore: 'Ort. Skor',
  todayNew: 'Bugün Yeni',

  // Lead status
  new: 'Yeni',
  in_progress: 'Devam Ediyor',
  qualified: 'Nitelikli',
  handed_off: 'Devredildi',
  lost: 'Kayıp',
  converted: 'Dönüştü',

  // Ticket status
  open: 'Açık',
  resolved: 'Çözüldü',

  // Channels
  voice_inbound: 'Gelen Çağrı',
  voice_outbound: 'Giden Çağrı',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  web: 'Web',

  // KB types
  faq: 'SSS',
  program: 'Program',
  service: 'Hizmet',
  country: 'Ülke',
  policy: 'Politika',
  team_member: 'Ekip Üyesi',
  pricing: 'Fiyat',
  general: 'Genel Bilgi',
  office_location: 'Ofis / Temsilcilik',
  country_overview: 'Ülke Genel Bakış',
  university_programs: 'Üniversite Programları',
  treatment: 'Tedavi',
  doctor: 'Doktor',
  property: 'Mülk İlanı',
  neighborhood: 'Mahalle Analizi',
  service_package: 'Hizmet Paketi',
  case_study: 'Vaka Çalışması',

  // Actions
  save: 'Kaydet',
  cancel: 'İptal',
  edit: 'Düzenle',
  delete: 'Sil',
  add: 'Ekle',
  search: 'Ara',
  filter: 'Filtrele',
  loading: 'Yükleniyor...',
  saving: 'Kaydediliyor...',
  cooldown: (secs: number) => `${secs}s bekle`,

  // Pages
  dashboardTitle: 'Dashboard',
  conversationsTitle: 'Konuşmalar & Leadler',
  callsTitle: 'Çağrı Logları',
  knowledgeTitle: 'Bilgi Bankası',
  adminTitle: 'Admin Paneli',
  ticketsTitle: 'Destek Talepleri',

  // Misc
  noData: 'Veri yok',
  last14Days: 'Son 14 Gün',
  leadDistribution: 'Lead Dağılımı',
  recentConversations: 'Son Konuşmalar',
  recentCalls: 'Son Çağrılar',
  handoffRate: 'Handoff Oranı',
  transcript: 'Transkript',
  noTranscript: 'Transkript bulunamadı',
  addNew: 'Yeni Ekle',
  newKbItem: 'Yeni KB Kalemi',
  editKbItem: 'KB Kalemi Düzenle',
  title: 'Başlık',
  description: 'AI Bağlamı',
  tags: 'Etiketler (virgülle ayır)',
  type: 'Tür',
  allOrgs: 'Tüm Organizasyonlar',
  orgOverview: 'Organizasyon Genel Bakış',
  sector: 'Sektör',
  status: 'Durum',
  leadsCount: 'Lead Sayısı',
  lastActivity: 'Son Aktivite',
  loginTitle: 'stoaix Giriş',
  email: 'E-posta',
  password: 'Şifre',
  loginBtn: 'Giriş Yap',
  loginError: 'Giriş başarısız. E-posta veya şifrenizi kontrol edin.',
  contactInfo: 'İletişim',
  collectedData: 'Toplanan Veriler',
  handoffInfo: 'Handoff Bilgisi',
  messagesHistory: 'Mesaj Geçmişi',
  back: 'Geri',
  inbound: 'Gelen',
  outbound: 'Giden',
  duration: 'Süre',
  date: 'Tarih',
  phone: 'Telefon',
  direction: 'Yön',
  score: 'Skor',
  priority: 'Öncelik',
  subject: 'Konu',
  message: 'Mesaj',
  adminNotes: 'Admin Notları',
  updateStatus: 'Durumu Güncelle',
}

export type I18nKeys    = keyof typeof tr
export type Translations = typeof tr
export type Lang         = 'tr' | 'en'

export const t = tr

// EN translations not yet implemented — falls back to TR
export function getT(_lang: Lang): Translations {
  return tr
}
