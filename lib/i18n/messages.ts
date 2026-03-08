export type Lang = 'tr' | 'en';

export interface Messages {
  common: {
    all: string;
    active: string;
    closed: string;
    handoff: string;
    signOut: string;
    save: string;
    saved: string;
    saving: string;
    noData: string;
    seeAll: string;
    loading: string;
    back: string;
    skip: string;
    continue: string;
    submit: string;
    error: string;
    cancel: string;
  };
  sidebar: {
    overview: string;
    leadPipeline: string;
    handoffLogs: string;
    callLogs: string;
    serviceAnalytics: string;
    knowledgeBase: string;
    settings: string;
    systemActive: string;
    aiPanel: string;
  };
  calls: {
    title: string;
    callsShown: (n: number) => string;
    noCallLogs: string;
    caller: string;
    duration: string;
    date: string;
    transcript: string;
    viewTranscript: string;
    inbound: string;
    outbound: string;
  };
  overview: {
    title: string;
    liveData: string;
    totalConversations: string;
    activeCount: (n: number) => string;
    hotLead: string;
    warmLead: string;
    handoffsDone: string;
    avgLeadScore: string;
    newToday: string;
    handoffCount: (n: number) => string;
    dailyTrend: string;
    last14Days: string;
    leadDistribution: string;
    handoffRate: string;
    recentConversations: string;
    noConversations: string;
    noService: string;
    statusActive: string;
    statusHandedOff: string;
    statusClosed: string;
  };
  leads: {
    title: string;
    leadsShown: (n: number) => string;
    searchPlaceholder: string;
    patient: string;
    service: string;
    score: string;
    status: string;
    stage: string;
    lastMessage: string;
    noLeads: string;
    statusActive: string;
    statusHandedOff: string;
    statusClosed: string;
  };
  handoffs: {
    title: string;
    subtitle: string;
    pending: string;
    converted: string;
    lost: string;
    noAnswer: string;
    totalConversionRate: string;
    convertedCount: (n: number) => string;
    totalHandoffs: (n: number) => string;
    date: string;
    patient: string;
    service: string;
    score: string;
    trigger: string;
    result: string;
    note: string;
    noLogs: string;
  };
  services: {
    title: string;
    subtitle: string;
    serviceCategories: string;
    totalLeads: string;
    avgConversion: string;
    leadDistributionByService: string;
    leads: string;
    detailedPerformance: string;
    service: string;
    category: string;
    leadsCol: string;
    avgScore: string;
    handoffs: string;
    conversionPct: string;
    quality: string;
    noData: string;
    noTableData: string;
    high: string;
    medium: string;
    low: string;
  };
  knowledge: {
    title: string;
    subtitle: string;
    awaitingApproval: (n: number) => string;
    howItWorks: string;
    step1: string;
    step2: string;
    step3: string;
    clinicProfile: string;
    services: string;
    activeCount: (n: number) => string;
    faqs: string;
    recordCount: (n: number) => string;
    recentRequests: string;
    newQuestion: string;
    newService: string;
    statusPending: string;
    statusApproved: string;
    statusRejected: string;
    rejectionReason: string;
  };
  support: {
    title: string;
    subtitle: string;
    open: string;
    inProgress: string;
    resolved: string;
    technical: string;
    kbUrgent: string;
    general: string;
    yourRequest: string;
    supportReply: string;
    awaitingReply: string;
    noTickets: string;
    noTicketsHint: string;
  };
  settings: {
    title: string;
    languagePreference: string;
    languageHint: string;
    turkish: string;
    english: string;
    save: string;
    saved: string;
    saving: string;
  };
  onboarding: {
    setup: string;
    steps: {
      type: string;
      profile: string;
      services: string;
      faqs: string;
      done: string;
    };
    banner: {
      setupPct: (pct: number) => string;
      missing: string;
      complete: string;
    };
    done: {
      setupComplete: string;
      pctComplete: (pct: number) => string;
      setupCompleteDesc: string;
      partialDesc: string;
      pendingTitle: string;
      missingProfile: string;
      missingService: string;
      kbTitle: string;
      kbDesc: string;
      dashboardTitle: string;
      dashboardDesc: string;
      goToDashboard: string;
      goBack: string;
    };
    type: {
      title: string;
      subtitle: string;
      otherLabel: string;
      otherPlaceholder: string;
      selectedLabel: string;
      templateHint: string;
      continue: string;
    };
    profile: {
      title: string;
      subtitle: string;
      awaitingApproval: string;
      awaitingHint: string;
      approved: string;
      rejected: string;
      rejectedHint: string;
      rejectionNote: string;
      contactInfo: string;
      phone: string;
      email: string;
      address: string;
      parking: string;
      policies: string;
      consultationFee: string;
      cancellationPolicy: string;
      pricingPolicy: string;
      aiAssistant: string;
      greetingMessage: string;
      doctorInfo: string;
      doctorName: string;
      experience: string;
      title2: string;
      credentials: string;
      requiredError: string;
      back: string;
      skip: string;
      submitContinue: string;
      phonePlaceholder: string;
      emailPlaceholder: string;
      addressPlaceholder: string;
      parkingPlaceholder: string;
      consultationFeePlaceholder: string;
      cancellationPolicyPlaceholder: string;
      pricingPolicyPlaceholder: string;
      greetingPlaceholder: string;
      doctorNamePlaceholder: string;
      doctorTitlePlaceholder: string;
      doctorExpPlaceholder: string;
      doctorCredentialsPlaceholder: string;
    };
    services: {
      title: string;
      subtitle: string;
      templateSection: string;
      templateHint: string;
      templateCount: (n: number) => string;
      addedSection: (n: number) => string;
      unnamed: string;
      addEmpty: string;
      serviceName: string;
      category: string;
      aiDesc: string;
      duration: string;
      anesthesia: string;
      recovery: string;
      result: string;
      pricing: string;
      submit: string;
      back: string;
      skip: string;
      awaitingApproval: string;
      awaitingHint: string;
      approved: string;
      rejected: string;
      rejectionNote: string;
      minOneError: string;
    };
    faqs: {
      title: string;
      subtitle: string;
      templateSection: string;
      templateHint: string;
      addedSection: (n: number) => string;
      noQuestion: string;
      addEmpty: string;
      patternsLabel: string;
      addPattern: string;
      answerLabel: string;
      answerPlaceholder: string;
      categoryLabel: string;
      categoryPlaceholder: string;
      generalGroup: string;
      submit: string;
      back: string;
      skip: string;
      awaitingApproval: string;
      approved: string;
      rejected: string;
      rejectionNote: string;
    };
  };
  auth: {
    login: {
      title: string;
      subtitle: string;
      signIn: string;
      email: string;
      password: string;
      emailPlaceholder: string;
      error: string;
      signingIn: string;
      noAccount: string;
    };
    waiting: {
      title: string;
      description: string;
      timeframe: string;
      timeframeDesc: string;
      signOut: string;
    };
    register: {
      title: string;
      subtitle: string;
      inviteSubtitle: string;
      clinicName: string;
      clinicNamePlaceholder: string;
      fullName: string;
      fullNamePlaceholder: string;
      phone: string;
      phonePlaceholder: string;
      email: string;
      emailPlaceholder: string;
      password: string;
      passwordPlaceholder: string;
      city: string;
      cityPlaceholder: string;
      heardAbout: string;
      heardAboutPlaceholder: string;
      gdprText: string;
      gdprPrivacy: string;
      gdprTerms: string;
      submit: string;
      submitting: string;
      register: string;
      hasAccount: string;
      goToLogin: string;
      successTitle: string;
      successDesc: (clinicName: string, email: string) => string;
      successNote: string;
      goToLoginBtn: string;
      requiredError: string;
      passwordLengthError: string;
      emailExistsError: string;
      gdprError: string;
      invalidInviteTitle: string;
      invalidInviteDesc: string;
    };
  };
  clinicTypes: {
    estetik: string;
    dis: string;
    sac: string;
    lazer: string;
    goz: string;
    ortopedi: string;
    dermato: string;
    diyetisyen: string;
    psikoloji: string;
    diger: string;
    genel: string;
  };
  gdpr: {
    cookieBanner: string;
    accept: string;
    decline: string;
    learnMore: string;
  };
  legal: {
    privacyTitle: string;
    termsTitle: string;
    cookiesTitle: string;
  };
  clinicAccess: {
    noAccess: string;
    noAccessDesc: string;
  };
  editableField: {
    empty: string;
    pendingApproval: (preview: string) => string;
    changeApproved: string;
    rejected: (note: string) => string;
    suggest: string;
  };
  changeRequestModal: {
    title: string;
    currentValue: string;
    empty: string;
    newValue: string;
    changeReason: string;
    changeReasonPlaceholder: string;
    warning: string;
    success: string;
    noChange: string;
    submit: string;
  };
  supportButton: {
    myTickets: string;
    support: string;
  };
  supportTicketModal: {
    title: string;
    subtitle: string;
    categoryLabel: string;
    subject: string;
    subjectPlaceholderTechnical: string;
    subjectPlaceholderKbUrgent: string;
    subjectPlaceholderGeneral: string;
    descriptionLabel: string;
    descriptionPlaceholder: string;
    urgentNote: string;
    success: string;
    requiredError: string;
    submit: string;
  };
  knowledgeActions: {
    suggestService: string;
    suggestFaq: string;
  };
  newServiceModal: {
    title: string;
    subtitle: string;
    serviceName: string;
    serviceNamePlaceholder: string;
    serviceKey: string;
    category: string;
    aiDescription: string;
    aiDescriptionPlaceholder: string;
    procedureDuration: string;
    procedureDurationPlaceholder: string;
    anesthesiaType: string;
    anesthesiaTypePlaceholder: string;
    recoveryTime: string;
    recoveryTimePlaceholder: string;
    resultTimeline: string;
    resultTimelinePlaceholder: string;
    pricingResponse: string;
    pricingResponsePlaceholder: string;
    warning: string;
    success: string;
    requiredError: string;
    submit: string;
  };
  newFaqModal: {
    title: string;
    subtitle: string;
    questionPatterns: string;
    addPattern: string;
    patternsHint: string;
    answerLabel: string;
    answerPlaceholder: string;
    categoryLabel: string;
    categoryPlaceholder: string;
    warning: string;
    success: string;
    requiredError: string;
    submit: string;
  };
  handoffButton: {
    done: string;
    sending: string;
    send: string;
    confirm: string;
  };
}

const tr: Messages = {
  common: {
    all: 'Tümü',
    active: 'Aktif',
    closed: 'Kapalı',
    handoff: 'Handoff',
    signOut: 'Çıkış Yap',
    save: 'Kaydet',
    saved: 'Kaydedildi',
    saving: 'Kaydediliyor...',
    noData: 'Henüz veri yok',
    seeAll: 'Tümünü gör →',
    loading: 'Yükleniyor...',
    back: '← Geri',
    skip: 'Atla →',
    continue: 'Devam Et',
    submit: 'Gönder',
    error: 'Bir hata oluştu',
    cancel: 'İptal',
  },
  sidebar: {
    overview: 'Genel Bakış',
    leadPipeline: 'Lead Pipeline',
    handoffLogs: 'Handoff Logları',
    callLogs: 'Çağrı Logları',
    serviceAnalytics: 'Hizmet Analitik',
    knowledgeBase: 'Knowledge Base',
    settings: 'Ayarlar',
    systemActive: 'Sistem Aktif',
    aiPanel: 'AI Panel',
  },
  calls: {
    title: 'Çağrı Logları',
    callsShown: (n) => `${n} çağrı`,
    noCallLogs: 'Henüz çağrı kaydı yok.',
    caller: 'Arayan',
    duration: 'Süre',
    date: 'Tarih',
    transcript: 'Transkript',
    viewTranscript: 'Transkripti Gör',
    inbound: 'Gelen',
    outbound: 'Giden',
  },
  overview: {
    title: 'Genel Bakış',
    liveData: 'Canlı Veriler',
    totalConversations: 'Toplam Konuşma',
    activeCount: (n) => `${n} aktif`,
    hotLead: 'Hot Lead (≥70)',
    warmLead: 'Warm Lead (40-69)',
    handoffsDone: 'Handoff Yapılan',
    avgLeadScore: 'Ort. Lead Skoru',
    newToday: 'Bugün Yeni',
    handoffCount: (n) => `${n} handoff`,
    dailyTrend: 'Günlük Trend',
    last14Days: 'Son 14 gün',
    leadDistribution: 'Lead Dağılımı',
    handoffRate: 'Handoff Oranı',
    recentConversations: 'Son Konuşmalar',
    noConversations: 'Henüz konuşma yok',
    noService: 'Hizmet belirtilmedi',
    statusActive: 'Aktif',
    statusHandedOff: 'Handoff',
    statusClosed: 'Kapalı',
  },
  leads: {
    title: 'Lead Pipeline',
    leadsShown: (n) => `${n} lead gösteriliyor`,
    searchPlaceholder: 'İsim, telefon veya hizmet ara…',
    patient: 'Hasta',
    service: 'Hizmet',
    score: 'Skor',
    status: 'Durum',
    stage: 'Aşama',
    lastMessage: 'Son Mesaj',
    noLeads: 'Filtrelerle eşleşen lead bulunamadı',
    statusActive: 'Aktif',
    statusHandedOff: 'Handoff',
    statusClosed: 'Kapalı',
  },
  handoffs: {
    title: 'Handoff Logları',
    subtitle: 'Satış ekibine iletilen leadlerin takibi',
    pending: 'Beklemede',
    converted: 'Dönüştü',
    lost: 'Kaybedildi',
    noAnswer: 'Cevap Yok',
    totalConversionRate: 'Toplam Dönüşüm Oranı',
    convertedCount: (n) => `${n} dönüştü`,
    totalHandoffs: (n) => `${n} toplam handoff`,
    date: 'Tarih',
    patient: 'Hasta',
    service: 'Hizmet',
    score: 'Skor',
    trigger: 'Tetikleyici',
    result: 'Sonuç',
    note: 'Not',
    noLogs: 'Henüz handoff logu yok',
  },
  services: {
    title: 'Hizmet Analitikleri',
    subtitle: 'Her hizmet için lead kalitesi ve dönüşüm takibi',
    serviceCategories: 'Hizmet Kategorisi',
    totalLeads: 'Toplam Lead',
    avgConversion: 'Ort. Dönüşüm',
    leadDistributionByService: 'Lead Dağılımı (Hizmet Bazlı)',
    leads: 'lead',
    detailedPerformance: 'Detaylı Performans',
    service: 'Hizmet',
    category: 'Kategori',
    leadsCol: 'Lead',
    avgScore: 'Ort. Skor',
    handoffs: 'Handoff',
    conversionPct: 'Dönüşüm %',
    quality: 'Kalite',
    noData: 'Henüz veri yok',
    noTableData: 'Hizmet verisi henüz bulunmuyor',
    high: 'Yüksek',
    medium: 'Orta',
    low: 'Düşük',
  },
  knowledge: {
    title: 'Knowledge Base',
    subtitle: 'Bilgileri görüntüle ve değişiklik öner — onaylandıktan sonra sisteme yansır',
    awaitingApproval: (n) => `${n} onay bekliyor`,
    howItWorks: 'Nasıl Çalışır?',
    step1: 'Alanın üzerine gel → Öner butonuna tıkla',
    step2: 'Yeni değeri yaz → Gönder',
    step3: 'Yönetici onaylayınca sisteme yansır',
    clinicProfile: 'Klinik Profili',
    services: 'Hizmetler',
    activeCount: (n) => `(${n} aktif)`,
    faqs: 'Sık Sorulan Sorular',
    recordCount: (n) => `(${n} kayıt)`,
    recentRequests: 'Son Değişiklik İsteklerim',
    newQuestion: 'Soru:',
    newService: 'Yeni hizmet:',
    statusPending: 'Bekliyor',
    statusApproved: 'Onaylandı',
    statusRejected: 'Reddedildi',
    rejectionReason: 'Red sebebi:',
  },
  support: {
    title: 'Destek Taleplerim',
    subtitle: 'Gönderdiğiniz talepler ve yönetici yanıtları',
    open: 'Açık',
    inProgress: 'İşlemde',
    resolved: 'Çözüldü',
    technical: 'Teknik Sorun',
    kbUrgent: 'KB Güncelleme (Acil)',
    general: 'Genel / Öneri',
    yourRequest: 'Talebiniz',
    supportReply: 'Destek Ekibi Yanıtı',
    awaitingReply: 'Talebiniz alındı, en kısa sürede yanıt verilecek',
    noTickets: 'Henüz destek talebi yok',
    noTicketsHint: 'Sorun veya öneriniz için yukarıdan yeni talep oluşturabilirsiniz',
  },
  settings: {
    title: 'Ayarlar',
    languagePreference: 'Dil Tercihi',
    languageHint: 'Paneli hangi dilde kullanmak istediğinizi seçin.',
    turkish: 'Türkçe',
    english: 'English (UK)',
    save: 'Kaydet',
    saved: 'Kaydedildi!',
    saving: 'Kaydediliyor...',
  },
  onboarding: {
    setup: 'Klinik Kurulumu',
    steps: {
      type: 'Klinik Tipi',
      profile: 'Profil',
      services: 'Hizmetler',
      faqs: 'SSS',
      done: 'Tamamlandı',
    },
    banner: {
      setupPct: (pct) => `Kurulum %${pct} tamamlandı`,
      missing: 'Eksik:',
      complete: 'Kurulumu Tamamla',
    },
    done: {
      setupComplete: 'Kurulum Tamamlandı!',
      pctComplete: (pct) => `%${pct} Tamamlandı`,
      setupCompleteDesc: 'AI asistanınız artık kliniğinizi tanıyor ve hastalara doğru bilgi verebilir.',
      partialDesc: 'Harika bir başlangıç! Eksik alanları istediğiniz zaman tamamlayabilirsiniz.',
      pendingTitle: 'Tamamlanmayı bekleyenler:',
      missingProfile: 'Klinik profili (telefon, karşılama mesajı)',
      missingService: 'En az 1 hizmet',
      kbTitle: 'Knowledge Base',
      kbDesc: 'Bilgileri istediğiniz zaman güncelleyebilir, değişiklik önerebilirsiniz.',
      dashboardTitle: 'Dashboard',
      dashboardDesc: 'Lead skorlarını, konuşmaları ve handoff loglarını takip edin.',
      goToDashboard: 'Panele Git',
      goBack: '← Geri dön, eksikleri tamamla',
    },
    type: {
      title: 'Kliniğiniz ne tür hizmet veriyor?',
      subtitle: 'Birden fazla seçebilirsiniz. Seçiminize göre size özel şablonlar önerilecek.',
      otherLabel: 'Klinik türünüzü belirtin',
      otherPlaceholder: 'ör: Fizik Tedavi ve Rehabilitasyon',
      selectedLabel: 'Seçilen:',
      templateHint: 'Bir sonraki adımda bu türlere uygun hizmet şablonları önerilecek ✨',
      continue: 'Devam Et',
    },
    profile: {
      title: 'Klinik Profili',
      subtitle: 'Girdiğiniz bilgiler admin onayından sonra sisteme işlenecek.',
      awaitingApproval: 'Onay Bekleniyor',
      awaitingHint: 'Değiştirmek için formu güncelleyip tekrar gönderin.',
      approved: 'Onaylandı ✓',
      rejected: 'Reddedildi — Düzenleyip tekrar gönderin.',
      rejectedHint: 'Not:',
      rejectionNote: 'Red notu',
      contactInfo: 'İletişim Bilgileri',
      phone: 'Telefon',
      email: 'E-posta',
      address: 'Adres',
      parking: 'Otopark',
      policies: 'Politikalar',
      consultationFee: 'Görüşme Ücreti',
      cancellationPolicy: 'İptal Politikası',
      pricingPolicy: 'Fiyatlandırma Politikası',
      aiAssistant: 'AI Asistan',
      greetingMessage: 'Karşılama Mesajı',
      doctorInfo: 'Doktor Bilgileri',
      doctorName: 'Doktor Adı',
      experience: 'Deneyim (yıl)',
      title2: 'Unvan',
      credentials: 'Eğitim & Sertifikalar',
      requiredError: 'Zorunlu alanları doldurun',
      back: '← Geri',
      skip: 'Atla →',
      submitContinue: 'Gönder & Devam Et',
      phonePlaceholder: '+90 212 555 00 00',
      emailPlaceholder: 'info@kliniginiz.com',
      addressPlaceholder: 'Bağdat Caddesi No: 42 Kat: 3, Kadıköy, İstanbul',
      parkingPlaceholder: 'Binamızın karşısında ücretsiz otopark mevcuttur.',
      consultationFeePlaceholder: 'İlk görüşmemiz ücretsizdir.',
      cancellationPolicyPlaceholder: 'Randevunuzu en az 24 saat öncesinden iptal edebilirsiniz.',
      pricingPolicyPlaceholder: 'Fiyatlarımız kişisel muayene sonrası belirlenmektedir.',
      greetingPlaceholder: 'Merhaba! 👋 Kliniğimize hoş geldiniz. Size nasıl yardımcı olabilirim?',
      doctorNamePlaceholder: 'Op. Dr. Adı Soyadı',
      doctorTitlePlaceholder: 'Plastik ve Rekonstrüktif Cerrahi Uzmanı',
      doctorExpPlaceholder: '10',
      doctorCredentialsPlaceholder: 'İstanbul Üniversitesi Tıp Fakültesi mezunu.',
    },
    services: {
      title: 'Hizmetlerinizi Ekleyin',
      subtitle: 'Şablondan ekle veya sıfırdan oluştur. Admin onayından sonra sisteme işlenir.',
      templateSection: 'Klinik Tipinize Göre Önerilen Şablonlar',
      templateHint: '— tıklayarak ekle',
      templateCount: (n) => `${n} şablon`,
      addedSection: (n) => `Eklenen Hizmetler (${n})`,
      unnamed: 'İsimsiz',
      addEmpty: 'Boş Hizmet Ekle',
      serviceName: 'Hizmet Adı *',
      category: 'Kategori',
      aiDesc: 'AI Açıklaması',
      duration: 'İşlem Süresi',
      anesthesia: 'Anestezi',
      recovery: 'İyileşme',
      result: 'Sonuç',
      pricing: 'Fiyat Yanıtı',
      submit: 'Gönder & Devam',
      back: '← Geri',
      skip: 'Atla →',
      awaitingApproval: 'Onay Bekleniyor — Admin inceliyor.',
      awaitingHint: 'Değiştirmek için formu güncelleyip tekrar gönderin.',
      approved: 'Onaylandı ✓',
      rejected: 'Reddedildi — Düzenleyip tekrar gönderin.',
      rejectionNote: 'Not:',
      minOneError: 'En az 1 hizmet ekleyin',
    },
    faqs: {
      title: 'Sık Sorulan Sorular',
      subtitle: 'Şablondan ekle veya kendi SSS\'lerinizi oluşturun. Admin onayından sonra işlenir.',
      templateSection: 'Önerilen SSS Şablonları',
      templateHint: '— tıklayarak ekle',
      addedSection: (n) => `Eklenen SSS'ler (${n})`,
      noQuestion: 'Soru girilmedi',
      addEmpty: 'Boş SSS Ekle',
      patternsLabel: 'Soru Kalıpları',
      addPattern: '+ Ekle',
      answerLabel: 'Cevap *',
      answerPlaceholder: 'AI asistanının vereceği yanıt…',
      categoryLabel: 'Kategori',
      categoryPlaceholder: 'fiyat / medikal / genel',
      generalGroup: 'Genel',
      submit: 'Gönder & Tamamla',
      back: '← Geri',
      skip: 'Atla →',
      awaitingApproval: 'Onay Bekleniyor',
      approved: 'Onaylandı ✓',
      rejected: 'Reddedildi — Düzenleyip tekrar gönderin.',
      rejectionNote: 'Not:',
    },
  },
  auth: {
    login: {
      title: 'Klinik Panel',
      subtitle: 'AI Asistan & Lead Takip Sistemi',
      signIn: 'Giriş Yap',
      email: 'E-posta',
      password: 'Şifre',
      emailPlaceholder: 'klinik@ornek.com',
      error: 'E-posta veya şifre hatalı. Lütfen tekrar deneyin.',
      signingIn: 'Giriş yapılıyor…',
      noAccount: 'Hesabınız yok mu? Yöneticinizle iletişime geçin.',
    },
    waiting: {
      title: 'Başvurunuz İnceleniyor',
      description: 'Başvurunuz ekibimiz tarafından inceleniyor. Onaylandığında panel erişiminiz aktif olacak. Genellikle',
      timeframe: '1 iş günü',
      timeframeDesc: 'içinde dönüş yapılır.',
      signOut: 'Çıkış Yap',
    },
    register: {
      title: 'Kliniğinizi Kaydedin',
      subtitle: 'Başvurunuz onaylandıktan sonra panele erişim sağlayabilirsiniz',
      inviteSubtitle: 'Davetiye ile özel erişim',
      clinicName: 'Klinik Adı',
      clinicNamePlaceholder: 'ör: İstanbul Estetik Klinik',
      fullName: 'Ad Soyad',
      fullNamePlaceholder: 'Dr. Adı Soyadı',
      phone: 'Telefon',
      phonePlaceholder: '+90 5xx xxx xx xx',
      email: 'Email',
      emailPlaceholder: 'doktor@klinik.com',
      password: 'Şifre',
      passwordPlaceholder: 'Min. 8 karakter',
      city: 'Şehir',
      cityPlaceholder: 'İstanbul',
      heardAbout: 'Bizi Nasıl Duydunuz? (isteğe bağlı)',
      heardAboutPlaceholder: 'ör: Referans, sosyal medya, arama…',
      gdprText: 'adresini okudum ve kabul ediyorum.',
      gdprPrivacy: 'Gizlilik Politikası',
      gdprTerms: 'Kullanım Şartları',
      submit: 'Başvuru Gönder',
      submitting: 'Gönderiliyor…',
      register: 'Kayıt Ol',
      hasAccount: 'Zaten hesabınız var mı?',
      goToLogin: 'Giriş yapın',
      successTitle: 'Başvurunuz Alındı!',
      successDesc: (clinicName, email) =>
        `${clinicName} için başvurunuz incelemeye alındı. Onaylandığında ${email} adresinize bildirim gönderilecek. Genellikle 1 iş günü içinde dönüş yapılır.`,
      successNote: 'Email\'inizi onaylamanız gerekebilir, lütfen gelen kutunuzu kontrol edin.',
      goToLoginBtn: 'Giriş Sayfasına Git',
      requiredError: 'Zorunlu alanları doldurunuz',
      passwordLengthError: 'Şifre en az 8 karakter olmalı',
      emailExistsError: 'Bu email ile zaten kayıt var. Giriş yapmayı deneyin.',
      gdprError: 'Devam etmek için gizlilik politikasını ve kullanım şartlarını kabul etmeniz gerekiyor.',
      invalidInviteTitle: 'Geçersiz Davetiye',
      invalidInviteDesc: 'Bu davetiye linki kullanılmış veya süresi dolmuş. Lütfen yetkili kişiyle iletişime geçin.',
    },
  },
  clinicTypes: {
    estetik: 'Estetik Cerrahi',
    dis: 'Diş Kliniği',
    sac: 'Saç Kliniği',
    lazer: 'Lazer & Güzellik',
    goz: 'Göz Kliniği',
    ortopedi: 'Ortopedi',
    dermato: 'Dermatoloji',
    diyetisyen: 'Diyet & Beslenme',
    psikoloji: 'Psikoloji',
    diger: 'Diğer',
    genel: 'Genel',
  },
  gdpr: {
    cookieBanner: 'Deneyiminizi iyileştirmek için çerezler kullanıyoruz.',
    accept: 'Kabul Et',
    decline: 'Reddet',
    learnMore: 'Daha Fazla',
  },
  legal: {
    privacyTitle: 'Gizlilik Politikası',
    termsTitle: 'Kullanım Şartları',
    cookiesTitle: 'Çerez Politikası',
  },
  clinicAccess: {
    noAccess: 'Klinik Erişimi Yok',
    noAccessDesc: 'Bu hesaba henüz bir klinik bağlanmamış. Lütfen sistem yöneticinizle iletişime geçin.',
  },
  editableField: {
    empty: 'Boş',
    pendingApproval: (preview) => `Onay bekliyor → "${preview}"`,
    changeApproved: 'Değişiklik onaylandı',
    rejected: (note) => `Reddedildi${note ? `: ${note}` : ''}`,
    suggest: 'Öner',
  },
  changeRequestModal: {
    title: 'Değişiklik Öner',
    currentValue: 'Mevcut Değer',
    empty: 'Boş',
    newValue: 'Yeni Değer',
    changeReason: 'Değişiklik Nedeni (isteğe bağlı)',
    changeReasonPlaceholder: 'ör: Fiyatlarımız güncellendi, yeni sezon tarifesi…',
    warning: '⚠️ Bu değişiklik onay sürecine gönderilecek. Yönetici onayladıktan sonra sisteme yansır.',
    success: '✓ İstek başarıyla gönderildi!',
    noChange: 'Değer değiştirilmedi',
    submit: 'Değişiklik Öner',
  },
  supportButton: {
    myTickets: 'Taleplerim',
    support: 'Destek',
  },
  supportTicketModal: {
    title: 'Destek Talebi',
    subtitle: 'Size en kısa sürede dönüş yapacağız',
    categoryLabel: 'Kategori',
    subject: 'Konu',
    subjectPlaceholderTechnical: 'ör: Dashboard açılmıyor',
    subjectPlaceholderKbUrgent: 'ör: Fiyat bilgisi acil güncellenmeli',
    subjectPlaceholderGeneral: 'ör: Yeni özellik önerisi',
    descriptionLabel: 'Açıklama',
    descriptionPlaceholder: 'Sorununuzu veya önerinizi detaylı açıklayın…',
    urgentNote: '🚨 Acil KB güncelleme talepleri öncelikli işleme alınır.',
    success: '✓ Talebiniz alındı! En kısa sürede dönüş yapılacak.',
    requiredError: 'Konu ve açıklama zorunludur',
    submit: 'Gönder',
  },
  knowledgeActions: {
    suggestService: 'Yeni Hizmet Öner',
    suggestFaq: 'Yeni SSS Öner',
  },
  newServiceModal: {
    title: 'Yeni Hizmet Talebi',
    subtitle: 'Onaylandıktan sonra sisteme eklenecek',
    serviceName: 'Hizmet Adı',
    serviceNamePlaceholder: 'ör: Saç Ekimi',
    serviceKey: 'Hizmet Anahtarı',
    category: 'Kategori',
    aiDescription: 'AI Açıklaması',
    aiDescriptionPlaceholder: 'AI asistanın hastaya bu hizmet hakkında anlatabileceği detaylı açıklama…',
    procedureDuration: 'İşlem Süresi',
    procedureDurationPlaceholder: 'ör: 3-5 saat',
    anesthesiaType: 'Anestezi Tipi',
    anesthesiaTypePlaceholder: 'ör: Lokal anestezi',
    recoveryTime: 'İyileşme Süreci',
    recoveryTimePlaceholder: 'ör: 1 hafta dinlenme',
    resultTimeline: 'Sonuç Görülme Süresi',
    resultTimelinePlaceholder: 'ör: 6-12 ay',
    pricingResponse: 'Fiyat Yanıtı',
    pricingResponsePlaceholder: "AI'ın fiyat sorulduğunda vereceği yanıt…",
    warning: '⚠️ Bu talep onay sürecine gönderilecek. Yönetici onayladıktan sonra sisteme eklenecek.',
    success: '✓ Talebiniz gönderildi! Onay sonrası eklenecek.',
    requiredError: 'Hizmet adı ve açıklama zorunludur',
    submit: 'Talep Gönder',
  },
  newFaqModal: {
    title: 'Yeni SSS Talebi',
    subtitle: 'Onaylandıktan sonra sisteme eklenecek',
    questionPatterns: 'Soru Kalıpları',
    addPattern: 'Ekle',
    patternsHint: 'Hastanın bu soruyu nasıl sorabileceğine dair farklı ifadeler yazın.',
    answerLabel: 'Cevap',
    answerPlaceholder: 'AI asistanın bu soruya vereceği cevap…',
    categoryLabel: 'Kategori',
    categoryPlaceholder: 'ör: fiyat, medikal, genel',
    warning: '⚠️ Bu talep onay sürecine gönderilecek. Yönetici onayladıktan sonra sisteme eklenecek.',
    success: '✓ Talebiniz gönderildi! Onay sonrası eklenecek.',
    requiredError: 'En az bir soru kalıbı ve cevap zorunludur',
    submit: 'Talep Gönder',
  },
  handoffButton: {
    done: '✓ Devredildi',
    sending: 'Gönderiliyor…',
    send: "Handoff'a Gönder",
    confirm: 'Bu leadı satış ekibine devretmek istiyor musunuz?',
  },
};

const en: Messages = {
  common: {
    all: 'All',
    active: 'Active',
    closed: 'Closed',
    handoff: 'Handoff',
    signOut: 'Sign Out',
    save: 'Save',
    saved: 'Saved',
    saving: 'Saving...',
    noData: 'No data yet',
    seeAll: 'See all →',
    loading: 'Loading...',
    back: '← Back',
    skip: 'Skip →',
    continue: 'Continue',
    submit: 'Submit',
    error: 'An error occurred',
    cancel: 'Cancel',
  },
  sidebar: {
    overview: 'Overview',
    leadPipeline: 'Lead Pipeline',
    handoffLogs: 'Handoff Logs',
    callLogs: 'Call Logs',
    serviceAnalytics: 'Service Analytics',
    knowledgeBase: 'Knowledge Base',
    settings: 'Settings',
    systemActive: 'System Active',
    aiPanel: 'AI Panel',
  },
  calls: {
    title: 'Call Logs',
    callsShown: (n) => `${n} calls`,
    noCallLogs: 'No call records yet.',
    caller: 'Caller',
    duration: 'Duration',
    date: 'Date',
    transcript: 'Transcript',
    viewTranscript: 'View Transcript',
    inbound: 'Inbound',
    outbound: 'Outbound',
  },
  overview: {
    title: 'Overview',
    liveData: 'Live Data',
    totalConversations: 'Total Conversations',
    activeCount: (n) => `${n} active`,
    hotLead: 'Hot Lead (≥70)',
    warmLead: 'Warm Lead (40-69)',
    handoffsDone: 'Handoffs',
    avgLeadScore: 'Avg. Lead Score',
    newToday: 'New Today',
    handoffCount: (n) => `${n} handoff`,
    dailyTrend: 'Daily Trend',
    last14Days: 'Last 14 days',
    leadDistribution: 'Lead Distribution',
    handoffRate: 'Handoff Rate',
    recentConversations: 'Recent Conversations',
    noConversations: 'No conversations yet',
    noService: 'No service specified',
    statusActive: 'Active',
    statusHandedOff: 'Handoff',
    statusClosed: 'Closed',
  },
  leads: {
    title: 'Lead Pipeline',
    leadsShown: (n) => `${n} leads shown`,
    searchPlaceholder: 'Search by name, phone or service…',
    patient: 'Patient',
    service: 'Service',
    score: 'Score',
    status: 'Status',
    stage: 'Stage',
    lastMessage: 'Last Message',
    noLeads: 'No leads match the filters',
    statusActive: 'Active',
    statusHandedOff: 'Handoff',
    statusClosed: 'Closed',
  },
  handoffs: {
    title: 'Handoff Logs',
    subtitle: 'Tracking leads forwarded to the sales team',
    pending: 'Pending',
    converted: 'Converted',
    lost: 'Lost',
    noAnswer: 'No Answer',
    totalConversionRate: 'Total Conversion Rate',
    convertedCount: (n) => `${n} converted`,
    totalHandoffs: (n) => `${n} total handoffs`,
    date: 'Date',
    patient: 'Patient',
    service: 'Service',
    score: 'Score',
    trigger: 'Trigger',
    result: 'Result',
    note: 'Note',
    noLogs: 'No handoff logs yet',
  },
  services: {
    title: 'Service Analytics',
    subtitle: 'Lead quality and conversion tracking per service',
    serviceCategories: 'Service Categories',
    totalLeads: 'Total Leads',
    avgConversion: 'Avg. Conversion',
    leadDistributionByService: 'Lead Distribution (By Service)',
    leads: 'leads',
    detailedPerformance: 'Detailed Performance',
    service: 'Service',
    category: 'Category',
    leadsCol: 'Leads',
    avgScore: 'Avg. Score',
    handoffs: 'Handoffs',
    conversionPct: 'Conversion %',
    quality: 'Quality',
    noData: 'No data yet',
    noTableData: 'No service data yet',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  },
  knowledge: {
    title: 'Knowledge Base',
    subtitle: 'View information and suggest changes — reflected in the system after approval',
    awaitingApproval: (n) => `${n} awaiting approval`,
    howItWorks: 'How Does It Work?',
    step1: 'Hover over the field → Click Suggest',
    step2: 'Enter new value → Submit',
    step3: 'Reflected in system once admin approves',
    clinicProfile: 'Clinic Profile',
    services: 'Services',
    activeCount: (n) => `(${n} active)`,
    faqs: 'Frequently Asked Questions',
    recordCount: (n) => `(${n} records)`,
    recentRequests: 'My Recent Change Requests',
    newQuestion: 'Question:',
    newService: 'New service:',
    statusPending: 'Pending',
    statusApproved: 'Approved',
    statusRejected: 'Rejected',
    rejectionReason: 'Rejection reason:',
  },
  support: {
    title: 'My Support Tickets',
    subtitle: 'Submitted tickets and admin responses',
    open: 'Open',
    inProgress: 'In Progress',
    resolved: 'Resolved',
    technical: 'Technical Issue',
    kbUrgent: 'KB Update (Urgent)',
    general: 'General / Suggestion',
    yourRequest: 'Your Request',
    supportReply: 'Support Team Response',
    awaitingReply: "Your request has been received, we'll respond as soon as possible",
    noTickets: 'No support tickets yet',
    noTicketsHint: 'You can create a new request above for issues or suggestions',
  },
  settings: {
    title: 'Settings',
    languagePreference: 'Language Preference',
    languageHint: 'Select the language you would like to use the panel in.',
    turkish: 'Turkish',
    english: 'English (UK)',
    save: 'Save',
    saved: 'Saved!',
    saving: 'Saving...',
  },
  onboarding: {
    setup: 'Clinic Setup',
    steps: {
      type: 'Clinic Type',
      profile: 'Profile',
      services: 'Services',
      faqs: 'FAQ',
      done: 'Completed',
    },
    banner: {
      setupPct: (pct) => `Setup ${pct}% complete`,
      missing: 'Missing:',
      complete: 'Complete Setup',
    },
    done: {
      setupComplete: 'Setup Complete!',
      pctComplete: (pct) => `${pct}% Complete`,
      setupCompleteDesc: 'Your AI assistant now knows your clinic and can provide accurate information to patients.',
      partialDesc: 'Great start! You can complete the missing fields at any time.',
      pendingTitle: 'Pending completion:',
      missingProfile: 'Clinic profile (phone, greeting message)',
      missingService: 'At least 1 service',
      kbTitle: 'Knowledge Base',
      kbDesc: 'You can update information anytime and suggest changes.',
      dashboardTitle: 'Dashboard',
      dashboardDesc: 'Track lead scores, conversations and handoff logs.',
      goToDashboard: 'Go to Dashboard',
      goBack: '← Go back, complete missing items',
    },
    type: {
      title: 'What type of services does your clinic offer?',
      subtitle: 'You can select multiple. Templates will be suggested based on your selection.',
      otherLabel: 'Specify your clinic type',
      otherPlaceholder: 'e.g. Physiotherapy and Rehabilitation',
      selectedLabel: 'Selected:',
      templateHint: 'Service templates suitable for these types will be suggested in the next step ✨',
      continue: 'Continue',
    },
    profile: {
      title: 'Clinic Profile',
      subtitle: 'The information you enter will be processed into the system after admin approval.',
      awaitingApproval: 'Awaiting Approval',
      awaitingHint: 'To make changes, update the form and resubmit.',
      approved: 'Approved ✓',
      rejected: 'Rejected — Please edit and resubmit.',
      rejectedHint: 'Note:',
      rejectionNote: 'Rejection note',
      contactInfo: 'Contact Information',
      phone: 'Phone',
      email: 'Email',
      address: 'Address',
      parking: 'Parking',
      policies: 'Policies',
      consultationFee: 'Consultation Fee',
      cancellationPolicy: 'Cancellation Policy',
      pricingPolicy: 'Pricing Policy',
      aiAssistant: 'AI Assistant',
      greetingMessage: 'Greeting Message',
      doctorInfo: 'Doctor Information',
      doctorName: 'Doctor Name',
      experience: 'Experience (years)',
      title2: 'Title',
      credentials: 'Education & Certifications',
      requiredError: 'Please fill in the required fields',
      back: '← Back',
      skip: 'Skip →',
      submitContinue: 'Submit & Continue',
      phonePlaceholder: '+44 7700 900000',
      emailPlaceholder: 'info@yourclinic.co.uk',
      addressPlaceholder: '123 Harley Street, London, W1G 7JD',
      parkingPlaceholder: 'Pay & Display parking available nearby on Devonshire Street.',
      consultationFeePlaceholder: 'Initial consultation is complimentary.',
      cancellationPolicyPlaceholder: 'Please give at least 24 hours notice to cancel or rearrange your appointment.',
      pricingPolicyPlaceholder: 'Prices are personalised following a thorough consultation.',
      greetingPlaceholder: 'Hello! 👋 Welcome to our clinic. How can I help you today?',
      doctorNamePlaceholder: 'Mr / Dr First Last',
      doctorTitlePlaceholder: 'Consultant Plastic Surgeon',
      doctorExpPlaceholder: '10',
      doctorCredentialsPlaceholder: 'FRCS (Plast), Member of BAAPS. Trained at Imperial College London.',
    },
    services: {
      title: 'Add Your Services',
      subtitle: 'Add from templates or create from scratch. Processed after admin approval.',
      templateSection: 'Recommended Templates for Your Clinic Type',
      templateHint: '— click to add',
      templateCount: (n) => `${n} templates`,
      addedSection: (n) => `Added Services (${n})`,
      unnamed: 'Unnamed',
      addEmpty: 'Add Empty Service',
      serviceName: 'Service Name *',
      category: 'Category',
      aiDesc: 'AI Description',
      duration: 'Procedure Duration',
      anesthesia: 'Anaesthesia',
      recovery: 'Recovery',
      result: 'Results Timeline',
      pricing: 'Pricing Response',
      submit: 'Submit & Continue',
      back: '← Back',
      skip: 'Skip →',
      awaitingApproval: 'Awaiting Approval — Admin is reviewing.',
      awaitingHint: 'To make changes, update the form and resubmit.',
      approved: 'Approved ✓',
      rejected: 'Rejected — Please edit and resubmit.',
      rejectionNote: 'Note:',
      minOneError: 'Please add at least 1 service',
    },
    faqs: {
      title: 'Frequently Asked Questions',
      subtitle: 'Add from templates or create your own FAQs. Processed after admin approval.',
      templateSection: 'Suggested FAQ Templates',
      templateHint: '— click to add',
      addedSection: (n) => `Added FAQs (${n})`,
      noQuestion: 'No question entered',
      addEmpty: 'Add Empty FAQ',
      patternsLabel: 'Question Patterns',
      addPattern: '+ Add',
      answerLabel: 'Answer *',
      answerPlaceholder: 'The answer the AI assistant will give…',
      categoryLabel: 'Category',
      categoryPlaceholder: 'pricing / medical / general',
      generalGroup: 'General',
      submit: 'Submit & Complete',
      back: '← Back',
      skip: 'Skip →',
      awaitingApproval: 'Awaiting Approval',
      approved: 'Approved ✓',
      rejected: 'Rejected — Please edit and resubmit.',
      rejectionNote: 'Note:',
    },
  },
  auth: {
    login: {
      title: 'Clinic Panel',
      subtitle: 'AI Assistant & Lead Tracking System',
      signIn: 'Sign In',
      email: 'Email',
      password: 'Password',
      emailPlaceholder: 'clinic@example.com',
      error: 'Incorrect email or password. Please try again.',
      signingIn: 'Signing in…',
      noAccount: 'No account? Contact your administrator.',
    },
    waiting: {
      title: 'Application Under Review',
      description: 'Your application is being reviewed by our team. Your panel access will be activated once approved. Usually within',
      timeframe: '1 business day',
      timeframeDesc: 'for a response.',
      signOut: 'Sign Out',
    },
    register: {
      title: 'Register Your Clinic',
      subtitle: 'You can access the panel once your application is approved',
      inviteSubtitle: 'Invite-only access',
      clinicName: 'Clinic Name',
      clinicNamePlaceholder: 'e.g. London Aesthetic Clinic',
      fullName: 'Full Name',
      fullNamePlaceholder: 'Mr / Dr First Last',
      phone: 'Phone',
      phonePlaceholder: '+44 7700 900000',
      email: 'Email',
      emailPlaceholder: 'doctor@clinic.co.uk',
      password: 'Password',
      passwordPlaceholder: 'Min. 8 characters',
      city: 'City',
      cityPlaceholder: 'London',
      heardAbout: 'How did you hear about us? (optional)',
      heardAboutPlaceholder: 'e.g. Referral, social media, search…',
      gdprText: 'I have read and agree to the',
      gdprPrivacy: 'Privacy Policy',
      gdprTerms: 'Terms of Service',
      submit: 'Submit Application',
      submitting: 'Submitting…',
      register: 'Register',
      hasAccount: 'Already have an account?',
      goToLogin: 'Sign in',
      successTitle: 'Application Received!',
      successDesc: (clinicName, email) =>
        `Your application for ${clinicName} has been received. You will be notified at ${email} once approved. We typically respond within 1 business day.`,
      successNote: 'You may need to verify your email — please check your inbox.',
      goToLoginBtn: 'Go to Login',
      requiredError: 'Please fill in all required fields',
      passwordLengthError: 'Password must be at least 8 characters',
      emailExistsError: 'An account with this email already exists. Try signing in.',
      gdprError: 'You must accept the Privacy Policy and Terms of Service to continue.',
      invalidInviteTitle: 'Invalid Invite',
      invalidInviteDesc: 'This invite link has been used or has expired. Please contact the authorised person.',
    },
  },
  clinicTypes: {
    estetik: 'Aesthetic Surgery',
    dis: 'Dental Clinic',
    sac: 'Hair Clinic',
    lazer: 'Laser & Beauty',
    goz: 'Eye Clinic',
    ortopedi: 'Orthopaedics',
    dermato: 'Dermatology',
    diyetisyen: 'Dietetics & Nutrition',
    psikoloji: 'Psychology',
    diger: 'Other',
    genel: 'General',
  },
  gdpr: {
    cookieBanner: 'We use cookies to improve your experience on this site.',
    accept: 'Accept',
    decline: 'Decline',
    learnMore: 'Learn more',
  },
  legal: {
    privacyTitle: 'Privacy Policy',
    termsTitle: 'Terms of Service',
    cookiesTitle: 'Cookie Policy',
  },
  clinicAccess: {
    noAccess: 'No Clinic Access',
    noAccessDesc: 'No clinic has been linked to this account yet. Please contact your system administrator.',
  },
  editableField: {
    empty: 'Empty',
    pendingApproval: (preview) => `Pending approval → "${preview}"`,
    changeApproved: 'Change approved',
    rejected: (note) => `Rejected${note ? `: ${note}` : ''}`,
    suggest: 'Suggest',
  },
  changeRequestModal: {
    title: 'Suggest Change',
    currentValue: 'Current Value',
    empty: 'Empty',
    newValue: 'New Value',
    changeReason: 'Reason for Change (optional)',
    changeReasonPlaceholder: 'e.g. Our prices have been updated…',
    warning: '⚠️ This change will be submitted for approval. It will be reflected in the system after admin approval.',
    success: '✓ Request submitted successfully!',
    noChange: 'Value was not changed',
    submit: 'Suggest Change',
  },
  supportButton: {
    myTickets: 'My Tickets',
    support: 'Support',
  },
  supportTicketModal: {
    title: 'Support Request',
    subtitle: "We'll get back to you as soon as possible",
    categoryLabel: 'Category',
    subject: 'Subject',
    subjectPlaceholderTechnical: 'e.g. Dashboard not loading',
    subjectPlaceholderKbUrgent: 'e.g. Price info needs urgent update',
    subjectPlaceholderGeneral: 'e.g. New feature suggestion',
    descriptionLabel: 'Description',
    descriptionPlaceholder: 'Describe your issue or suggestion in detail…',
    urgentNote: '🚨 Urgent KB update requests are processed with priority.',
    success: "✓ Your request has been received! We'll get back to you shortly.",
    requiredError: 'Subject and description are required',
    submit: 'Submit',
  },
  knowledgeActions: {
    suggestService: 'Suggest New Service',
    suggestFaq: 'Suggest New FAQ',
  },
  newServiceModal: {
    title: 'New Service Request',
    subtitle: 'Will be added to the system after approval',
    serviceName: 'Service Name',
    serviceNamePlaceholder: 'e.g. Hair Transplant',
    serviceKey: 'Service Key',
    category: 'Category',
    aiDescription: 'AI Description',
    aiDescriptionPlaceholder: 'Detailed description the AI assistant can share with patients about this service…',
    procedureDuration: 'Procedure Duration',
    procedureDurationPlaceholder: 'e.g. 3-5 hours',
    anesthesiaType: 'Anaesthesia Type',
    anesthesiaTypePlaceholder: 'e.g. Local anaesthesia',
    recoveryTime: 'Recovery Process',
    recoveryTimePlaceholder: 'e.g. 1 week rest',
    resultTimeline: 'Result Timeline',
    resultTimelinePlaceholder: 'e.g. 6-12 months',
    pricingResponse: 'Pricing Response',
    pricingResponsePlaceholder: 'The response the AI gives when asked about pricing…',
    warning: '⚠️ This request will be submitted for approval. It will be added after admin approval.',
    success: '✓ Your request has been submitted! Will be added after approval.',
    requiredError: 'Service name and description are required',
    submit: 'Submit Request',
  },
  newFaqModal: {
    title: 'New FAQ Request',
    subtitle: 'Will be added to the system after approval',
    questionPatterns: 'Question Patterns',
    addPattern: 'Add',
    patternsHint: 'Write different ways the patient might ask this question.',
    answerLabel: 'Answer',
    answerPlaceholder: 'The answer the AI assistant will give to this question…',
    categoryLabel: 'Category',
    categoryPlaceholder: 'e.g. pricing, medical, general',
    warning: '⚠️ This request will be submitted for approval. It will be added after admin approval.',
    success: '✓ Your request has been submitted! Will be added after approval.',
    requiredError: 'At least one question pattern and answer are required',
    submit: 'Submit Request',
  },
  handoffButton: {
    done: '✓ Handed Off',
    sending: 'Sending…',
    send: 'Send to Handoff',
    confirm: 'Do you want to forward this lead to the sales team?',
  },
};

export const messages: Record<Lang, Messages> = { tr, en };

export function getT(lang: Lang): Messages {
  return messages[lang];
}
