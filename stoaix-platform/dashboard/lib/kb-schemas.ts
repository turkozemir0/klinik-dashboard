// KB Schema Registry
// Each item_type defines: label, supported sectors, form fields, and LLM prompt generator.

export type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'tags' | 'array' | 'table'

export interface FieldDef {
  name: string
  label: string
  type: FieldType
  required?: boolean
  placeholder?: string
  options?: string[]       // for select fields
  // For 'table' type: columns definition
  columns?: { name: string; label: string; type: 'text' | 'number' | 'select'; options?: string[] }[]
}

export interface KBSchema {
  label: string                         // UI display name
  sectors: 'all' | string[]            // which sectors this type applies to
  fields: FieldDef[]
  llmPrompt: (data: Record<string, any>) => string
}

export const KB_SCHEMAS: Record<string, KBSchema> = {

  // ─── Universal ────────────────────────────────────────────────────────────

  faq: {
    label: 'SSS',
    sectors: 'all',
    fields: [
      { name: 'question', label: 'Soru', type: 'textarea', required: true, placeholder: 'Sık sorulan soru...' },
      { name: 'answer', label: 'Cevap', type: 'textarea', required: true, placeholder: 'Detaylı cevap...' },
    ],
    llmPrompt: (d) => `Aşağıdaki SSS kaydını AI asistanı için doğal, açıklayıcı bir metin haline getir. Türkçe yaz.

Soru: ${d.question}
Cevap: ${d.answer}

Sadece metin çıktısı ver, başlık veya açıklama ekleme.`,
  },

  policy: {
    label: 'Politika',
    sectors: 'all',
    fields: [
      { name: 'title', label: 'Başlık', type: 'text', required: true },
      { name: 'content', label: 'İçerik', type: 'textarea', required: true },
      { name: 'applies_to', label: 'Kapsam (virgülle ayır)', type: 'tags', placeholder: 'tıp, hukuk, eczacılık...' },
    ],
    llmPrompt: (d) => `Aşağıdaki politika/kural bilgisini AI asistanı için açıklayıcı metin yap. Türkçe.

Başlık: ${d.title}
İçerik: ${d.content}
${d.applies_to?.length ? `Kapsam: ${d.applies_to.join(', ')}` : ''}

Sadece metin çıktısı ver.`,
  },

  pricing: {
    label: 'Fiyat',
    sectors: 'all',
    fields: [
      { name: 'service_name', label: 'Hizmet Adı', type: 'text', required: true },
      { name: 'price', label: 'Fiyat', type: 'number', placeholder: '1500' },
      { name: 'currency', label: 'Para Birimi', type: 'select', options: ['EUR', 'USD', 'TRY', 'GBP'], placeholder: 'EUR' },
      { name: 'price_range', label: 'Fiyat Aralığı', type: 'text', placeholder: '1000-2000 EUR (opsiyonel)' },
      { name: 'conditions', label: 'Koşullar', type: 'textarea', placeholder: 'Ödeme koşulları...' },
      { name: 'includes', label: 'Dahil Olanlar (virgülle ayır)', type: 'tags' },
      { name: 'excludes', label: 'Dahil Olmayanlar (virgülle ayır)', type: 'tags' },
    ],
    llmPrompt: (d) => `Aşağıdaki fiyatlandırma bilgisini AI asistanı için açıklayıcı metin yap. Türkçe.

Hizmet: ${d.service_name}
Fiyat: ${d.price ? `${d.price} ${d.currency || ''}` : d.price_range || 'Belirtilmedi'}
${d.conditions ? `Koşullar: ${d.conditions}` : ''}
${d.includes?.length ? `Dahil: ${d.includes.join(', ')}` : ''}
${d.excludes?.length ? `Dahil değil: ${d.excludes.join(', ')}` : ''}

Sadece metin çıktısı ver.`,
  },

  office_location: {
    label: 'Ofis / Temsilcilik',
    sectors: 'all',
    fields: [
      { name: 'city', label: 'Şehir', type: 'text', required: true },
      { name: 'address', label: 'Adres', type: 'textarea', required: true },
      { name: 'phones', label: 'Telefon Numaraları (virgülle ayır)', type: 'tags' },
      { name: 'whatsapp', label: 'WhatsApp Numaraları (virgülle ayır)', type: 'tags' },
      { name: 'contact_person', label: 'Yetkili Kişi', type: 'text', placeholder: 'Ayşe Hanım' },
    ],
    llmPrompt: (d) => `Aşağıdaki ofis/temsilcilik bilgisini AI asistanı için açıklayıcı metin yap. Türkçe.

Şehir: ${d.city}
Adres: ${d.address}
${d.phones?.length ? `Telefon: ${d.phones.join(', ')}` : ''}
${d.whatsapp?.length ? `WhatsApp: ${d.whatsapp.join(', ')}` : ''}
${d.contact_person ? `Yetkili: ${d.contact_person}` : ''}

Sadece metin çıktısı ver.`,
  },

  general: {
    label: 'Genel Bilgi',
    sectors: 'all',
    fields: [
      { name: 'title', label: 'Başlık', type: 'text', required: true },
      { name: 'content', label: 'İçerik', type: 'textarea', required: true },
    ],
    llmPrompt: (d) => `Aşağıdaki genel bilgiyi AI asistanı için açıklayıcı metin yap. Türkçe.

Başlık: ${d.title}
İçerik: ${d.content}

Sadece metin çıktısı ver.`,
  },

  // ─── Education ────────────────────────────────────────────────────────────

  country_overview: {
    label: 'Ülke Genel Bakış',
    sectors: ['education'],
    fields: [
      { name: 'country', label: 'Ülke', type: 'text', required: true, placeholder: 'Polonya' },
      { name: 'visa_required', label: 'Vize Gerekli mi?', type: 'select', options: ['Evet', 'Hayır', 'Yeşil Pasaport Muaf'] },
      { name: 'visa_cost', label: 'Vize Ücreti', type: 'text', placeholder: '500 EUR' },
      { name: 'visa_notes', label: 'Vize Notları', type: 'textarea', placeholder: 'Bankada 3000 EUR teminat...' },
      { name: 'diploma_min_score', label: 'Min. Diploma Puanı', type: 'text', placeholder: '70 ve üzeri' },
      { name: 'special_requirements', label: 'Özel Koşullar (virgülle ayır)', type: 'tags' },
      {
        name: 'package_pricing',
        label: 'Paket Fiyatları',
        type: 'table',
        columns: [
          { name: 'language', label: 'Dil', type: 'text' },
          { name: 'price', label: 'Fiyat (€)', type: 'number' },
          { name: 'currency', label: 'Döviz', type: 'select', options: ['EUR', 'USD', 'TRY'] },
        ],
      },
    ],
    llmPrompt: (d) => {
      const pricing = d.package_pricing?.length
        ? d.package_pricing.map((p: any) => `${p.language}: ${p.price} ${p.currency || 'EUR'}`).join(', ')
        : ''
      const reqs = d.special_requirements?.length ? d.special_requirements.join('; ') : ''
      return `Aşağıdaki ülke genel bilgisini AI asistanı için açıklayıcı Türkçe metin yap.

Ülke: ${d.country}
Vize: ${d.visa_required || 'Belirtilmedi'}${d.visa_cost ? ` - ${d.visa_cost}` : ''}
${d.visa_notes ? `Vize Notları: ${d.visa_notes}` : ''}
${d.diploma_min_score ? `Diploma Puanı: ${d.diploma_min_score}` : ''}
${reqs ? `Özel Koşullar: ${reqs}` : ''}
${pricing ? `Kayıt Danışmanlık Ücretleri: ${pricing}` : ''}

Sadece metin çıktısı ver.`
    },
  },

  university_programs: {
    label: 'Üniversite Programları',
    sectors: ['education'],
    fields: [
      { name: 'country', label: 'Ülke', type: 'text', required: true },
      { name: 'university_name', label: 'Üniversite Adı', type: 'text', required: true },
      { name: 'city', label: 'Şehir', type: 'text' },
      { name: 'rankings_qs', label: 'QS Sıralaması', type: 'text', placeholder: '304' },
      { name: 'rankings_the', label: 'THE Sıralaması', type: 'text', placeholder: '601-800' },
      { name: 'rankings_cwts', label: 'CWTS Sıralaması', type: 'text', placeholder: '688' },
      { name: 'rankings_arwu', label: 'ARWU (Shanghai)', type: 'text', placeholder: 'İlk binde' },
      {
        name: 'programs',
        label: 'Programlar',
        type: 'table',
        columns: [
          { name: 'name', label: 'Program Adı', type: 'text' },
          { name: 'level', label: 'Seviye', type: 'select', options: ['Lisans', 'Yüksek Lisans', 'Doktora'] },
          { name: 'fee', label: 'Yıllık Ücret', type: 'text' },
          { name: 'language', label: 'Dil', type: 'text' },
          { name: 'notes', label: 'Notlar', type: 'text' },
        ],
      },
      { name: 'extra_costs_dorm', label: 'Yurt Ücreti (aylık)', type: 'text', placeholder: '100€-150€' },
      { name: 'extra_costs_rent', label: 'Kira (aylık)', type: 'text', placeholder: '200€-300€' },
      { name: 'extra_costs_prep', label: 'Hazırlık Ücreti', type: 'text', placeholder: '3200€' },
      { name: 'extra_costs_registration', label: 'Kayıt Ücreti', type: 'text' },
    ],
    llmPrompt: (d) => {
      const programs = d.programs?.length
        ? d.programs.map((p: any) =>
            `${p.name} (${p.level || 'Lisans'}): ${p.fee || p.annual_fee || ''}${p.language ? ' - ' + p.language : ''}${p.notes ? ' - ' + p.notes : ''}`
          ).join('\n')
        : ''
      const rankings = [
        d.rankings_qs && `QS: ${d.rankings_qs}`,
        d.rankings_the && `THE: ${d.rankings_the}`,
        d.rankings_cwts && `CWTS: ${d.rankings_cwts}`,
        d.rankings_arwu && `ARWU: ${d.rankings_arwu}`,
      ].filter(Boolean).join(', ')

      return `Aşağıdaki üniversite ve program bilgisini AI asistanı için açıklayıcı Türkçe metin yap.

Ülke: ${d.country}
Üniversite: ${d.university_name}${d.city ? ` (${d.city})` : ''}
${rankings ? `Sıralamalar: ${rankings}` : ''}
${programs ? `Programlar:\n${programs}` : ''}
${d.extra_costs_dorm ? `Yurt: ${d.extra_costs_dorm}/ay` : ''}
${d.extra_costs_rent ? `Kira: ${d.extra_costs_rent}/ay` : ''}
${d.extra_costs_prep ? `Hazırlık: ${d.extra_costs_prep}` : ''}
${d.extra_costs_registration ? `Kayıt: ${d.extra_costs_registration}` : ''}

Sadece metin çıktısı ver.`
    },
  },

  // ─── Clinic ───────────────────────────────────────────────────────────────

  treatment: {
    label: 'Tedavi / Hizmet',
    sectors: ['clinic'],
    fields: [
      { name: 'name', label: 'Tedavi Adı', type: 'text', required: true },
      { name: 'description', label: 'Açıklama', type: 'textarea' },
      { name: 'duration', label: 'Süre', type: 'text', placeholder: '45 dakika' },
      { name: 'price', label: 'Fiyat', type: 'number' },
      { name: 'currency', label: 'Para Birimi', type: 'select', options: ['TRY', 'EUR', 'USD'] },
      { name: 'preparation', label: 'Hazırlık', type: 'textarea' },
      { name: 'recovery', label: 'İyileşme Süreci', type: 'textarea' },
      { name: 'contraindications', label: 'Kontrendikasyonlar (virgülle ayır)', type: 'tags' },
    ],
    llmPrompt: (d) => `Aşağıdaki tedavi/hizmet bilgisini AI asistanı için açıklayıcı Türkçe metin yap.

Tedavi: ${d.name}
${d.description ? `Açıklama: ${d.description}` : ''}
${d.duration ? `Süre: ${d.duration}` : ''}
${d.price ? `Fiyat: ${d.price} ${d.currency || 'TRY'}` : ''}
${d.preparation ? `Hazırlık: ${d.preparation}` : ''}
${d.recovery ? `İyileşme: ${d.recovery}` : ''}
${d.contraindications?.length ? `Kontrendikasyonlar: ${d.contraindications.join(', ')}` : ''}

Sadece metin çıktısı ver.`,
  },

  doctor: {
    label: 'Doktor / Uzman',
    sectors: ['clinic'],
    fields: [
      { name: 'name', label: 'Ad Soyad', type: 'text', required: true },
      { name: 'specialty', label: 'Uzmanlık', type: 'text', required: true },
      { name: 'experience_years', label: 'Deneyim (yıl)', type: 'number' },
      { name: 'languages', label: 'Diller (virgülle ayır)', type: 'tags' },
      { name: 'bio', label: 'Biyografi', type: 'textarea' },
    ],
    llmPrompt: (d) => `Aşağıdaki doktor bilgisini AI asistanı için açıklayıcı Türkçe metin yap.

Ad: ${d.name}
Uzmanlık: ${d.specialty}
${d.experience_years ? `Deneyim: ${d.experience_years} yıl` : ''}
${d.languages?.length ? `Diller: ${d.languages.join(', ')}` : ''}
${d.bio ? `Biyografi: ${d.bio}` : ''}

Sadece metin çıktısı ver.`,
  },

  // ─── Real Estate ──────────────────────────────────────────────────────────

  property: {
    label: 'Mülk İlanı',
    sectors: ['real_estate'],
    fields: [
      { name: 'title', label: 'İlan Başlığı', type: 'text', required: true },
      { name: 'city', label: 'Şehir', type: 'text', required: true },
      { name: 'location', label: 'Konum / Semt', type: 'text' },
      { name: 'price', label: 'Fiyat', type: 'number', required: true },
      { name: 'currency', label: 'Para Birimi', type: 'select', options: ['TRY', 'EUR', 'USD'] },
      { name: 'area_m2', label: 'Alan (m²)', type: 'number' },
      { name: 'rooms', label: 'Oda Sayısı', type: 'text', placeholder: '3+1' },
      { name: 'features', label: 'Özellikler (virgülle ayır)', type: 'tags' },
      { name: 'description', label: 'Açıklama', type: 'textarea' },
    ],
    llmPrompt: (d) => `Aşağıdaki mülk ilanını AI asistanı için açıklayıcı Türkçe metin yap.

${d.title}
Konum: ${d.city}${d.location ? ', ' + d.location : ''}
Fiyat: ${d.price} ${d.currency || 'TRY'}
${d.area_m2 ? `Alan: ${d.area_m2} m²` : ''}
${d.rooms ? `Oda: ${d.rooms}` : ''}
${d.features?.length ? `Özellikler: ${d.features.join(', ')}` : ''}
${d.description ? `Açıklama: ${d.description}` : ''}

Sadece metin çıktısı ver.`,
  },

  neighborhood: {
    label: 'Mahalle / Semt Analizi',
    sectors: ['real_estate'],
    fields: [
      { name: 'name', label: 'Mahalle / Semt Adı', type: 'text', required: true },
      { name: 'city', label: 'Şehir', type: 'text', required: true },
      { name: 'description', label: 'Genel Açıklama', type: 'textarea' },
      { name: 'advantages', label: 'Avantajlar (virgülle ayır)', type: 'tags' },
      { name: 'transport', label: 'Ulaşım', type: 'text' },
      { name: 'avg_price', label: 'Ortalama m² Fiyatı', type: 'text', placeholder: '15.000 TRY/m²' },
    ],
    llmPrompt: (d) => `Aşağıdaki mahalle/semt bilgisini AI asistanı için açıklayıcı Türkçe metin yap.

${d.name}, ${d.city}
${d.description ? `Açıklama: ${d.description}` : ''}
${d.advantages?.length ? `Avantajlar: ${d.advantages.join(', ')}` : ''}
${d.transport ? `Ulaşım: ${d.transport}` : ''}
${d.avg_price ? `Ortalama fiyat: ${d.avg_price}` : ''}

Sadece metin çıktısı ver.`,
  },

  // ─── Tech Service ─────────────────────────────────────────────────────────

  service_package: {
    label: 'Hizmet Paketi',
    sectors: ['tech_service'],
    fields: [
      { name: 'name', label: 'Paket Adı', type: 'text', required: true },
      { name: 'description', label: 'Açıklama', type: 'textarea' },
      { name: 'price', label: 'Fiyat', type: 'number' },
      { name: 'currency', label: 'Para Birimi', type: 'select', options: ['TRY', 'EUR', 'USD'] },
      { name: 'duration', label: 'Süre / Teslimat', type: 'text', placeholder: '4 hafta' },
      { name: 'deliverables', label: 'Teslim Edilecekler (virgülle ayır)', type: 'tags' },
      { name: 'suitable_for', label: 'Kime Uygun (virgülle ayır)', type: 'tags' },
    ],
    llmPrompt: (d) => `Aşağıdaki hizmet paketi bilgisini AI asistanı için açıklayıcı Türkçe metin yap.

Paket: ${d.name}
${d.description ? `Açıklama: ${d.description}` : ''}
${d.price ? `Fiyat: ${d.price} ${d.currency || 'TRY'}` : ''}
${d.duration ? `Süre: ${d.duration}` : ''}
${d.deliverables?.length ? `Teslim Edilecekler: ${d.deliverables.join(', ')}` : ''}
${d.suitable_for?.length ? `Hedef Kitle: ${d.suitable_for.join(', ')}` : ''}

Sadece metin çıktısı ver.`,
  },

  case_study: {
    label: 'Vaka Çalışması',
    sectors: ['tech_service'],
    fields: [
      { name: 'client_sector', label: 'Müşteri Sektörü', type: 'text', required: true },
      { name: 'challenge', label: 'Problem / Zorluk', type: 'textarea', required: true },
      { name: 'solution', label: 'Çözüm', type: 'textarea', required: true },
      { name: 'results', label: 'Sonuçlar (virgülle ayır)', type: 'tags' },
      { name: 'technologies', label: 'Kullanılan Teknolojiler (virgülle ayır)', type: 'tags' },
    ],
    llmPrompt: (d) => `Aşağıdaki vaka çalışmasını AI asistanı için açıklayıcı Türkçe metin yap.

Sektör: ${d.client_sector}
Problem: ${d.challenge}
Çözüm: ${d.solution}
${d.results?.length ? `Sonuçlar: ${d.results.join(', ')}` : ''}
${d.technologies?.length ? `Teknolojiler: ${d.technologies.join(', ')}` : ''}

Sadece metin çıktısı ver.`,
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getSchema(itemType: string): KBSchema | null {
  return KB_SCHEMAS[itemType] ?? null
}

export function getSchemasForSector(sector: string): Array<{ type: string; schema: KBSchema }> {
  return Object.entries(KB_SCHEMAS)
    .filter(([, s]) => s.sectors === 'all' || (s.sectors as string[]).includes(sector))
    .map(([type, schema]) => ({ type, schema }))
}

export const ALL_ITEM_TYPES = Object.keys(KB_SCHEMAS)
