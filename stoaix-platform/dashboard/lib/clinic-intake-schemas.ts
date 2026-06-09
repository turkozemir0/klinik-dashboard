export type IntakeField = {
  key: string
  label: string
  type: 'text' | 'phone' | 'email' | 'number' | 'select'
  priority: 'must' | 'should' | 'nice'
  sort_order: number
  voice_prompt?: string
  wa_prompt?: string
}

export const CLINIC_INTAKE_SCHEMAS: Record<string, IntakeField[]> = {
  hair_transplant: [
    { key: 'full_name',        label: 'Ad Soyad',           type: 'text',  priority: 'must',   sort_order: 10, voice_prompt: 'Adınızı ve soyadınızı öğrenebilir miyim?', wa_prompt: 'Adınızı öğrenebilir miyim?' },
    { key: 'phone',            label: 'Telefon',            type: 'phone', priority: 'must',   sort_order: 20, voice_prompt: 'Telefon numaranızı alabilir miyim?' },
    { key: 'service_interest', label: 'İlgilenilen Yöntem', type: 'text',  priority: 'must',   sort_order: 30, voice_prompt: 'FUE mi DHI mi, yoksa henüz karar vermediniz mi?', wa_prompt: 'FUE mi DHI mi düşünüyorsunuz, yoksa henüz karar vermediniz mi?' },
    { key: 'greft_estimate',   label: 'Greft Tahmini',      type: 'text',  priority: 'should', sort_order: 40, voice_prompt: 'Daha önce bir analiz yaptırdınız mı, greft sayısı hakkında fikriniz var mı?', wa_prompt: 'Daha önce saç analizi yaptırdınız mı?' },
    { key: 'budget_range',     label: 'Bütçe',              type: 'text',  priority: 'should', sort_order: 50, voice_prompt: 'Yaklaşık bir bütçe aralığınız var mı?' },
    { key: 'is_foreign',       label: 'Yurt Dışı Hasta',    type: 'text',  priority: 'should', sort_order: 60, voice_prompt: 'Yurt dışından mı teşrif edeceksiniz?', wa_prompt: 'Yurt dışından mı geliyorsunuz?' },
  ],
  dental: [
    { key: 'full_name',          label: 'Ad Soyad',        type: 'text',  priority: 'must',   sort_order: 10, voice_prompt: 'Adınızı öğrenebilir miyim?', wa_prompt: 'Adınızı öğrenebilir miyim?' },
    { key: 'phone',              label: 'Telefon',         type: 'phone', priority: 'must',   sort_order: 20, voice_prompt: 'Telefon numaranızı alabilir miyim?', wa_prompt: 'Telefon numaranızı alabilir miyim?' },
    { key: 'service_interest',   label: 'Hizmet',          type: 'text',  priority: 'must',   sort_order: 30, voice_prompt: 'İmplant mı, ortodonti mi, estetik diş mi ilgileniyorsunuz?', wa_prompt: 'İmplant mı, ortodonti mi, estetik diş mi, yoksa başka bir şikayetiniz mi var?' },
    { key: 'tooth_concern',      label: 'Diş Şikayeti',    type: 'text',  priority: 'should', sort_order: 40, voice_prompt: 'Mevcut bir şikayetiniz var mı, yoksa estetik amaçlı mı?' },
    { key: 'previous_treatment', label: 'Önceki Tedavi',   type: 'text',  priority: 'should', sort_order: 50, voice_prompt: 'Bu konuda daha önce tedavi aldınız mı?' },
    { key: 'budget_range',       label: 'Bütçe',           type: 'text',  priority: 'should', sort_order: 60, voice_prompt: 'Yaklaşık bir bütçe düşünüyor musunuz?' },
  ],
  medical_aesthetics: [
    { key: 'full_name',          label: 'Ad Soyad',         type: 'text',  priority: 'must',   sort_order: 10, voice_prompt: 'Adınızı ve soyadınızı öğrenebilir miyim?', wa_prompt: 'Adınızı öğrenebilir miyim?' },
    { key: 'phone',              label: 'Telefon',          type: 'phone', priority: 'must',   sort_order: 20, voice_prompt: 'Telefon numaranızı alabilir miyim?' },
    { key: 'service_interest',   label: 'Hizmet',           type: 'text',  priority: 'must',   sort_order: 30, voice_prompt: 'Botoks mu, dolgu mu, yoksa başka bir uygulama mı düşünüyorsunuz?', wa_prompt: 'Botoks mu, dolgu mu, lazer mi, başka bir uygulama mı düşünüyorsunuz?' },
    { key: 'treatment_area',     label: 'Uygulama Bölgesi', type: 'text',  priority: 'should', sort_order: 40, voice_prompt: 'Hangi bölge için düşünüyorsunuz, yüz mü, vücut mu?', wa_prompt: 'Hangi bölge için düşünüyorsunuz?' },
    { key: 'skin_concern',       label: 'Cilt Şikayeti',    type: 'text',  priority: 'should', sort_order: 50, voice_prompt: 'Çözüm aradığınız belirli bir cilt sorununuz var mı?' },
    { key: 'budget_range',       label: 'Bütçe',            type: 'text',  priority: 'should', sort_order: 60, voice_prompt: 'Yaklaşık bir bütçe aralığınız var mı?', wa_prompt: 'Yaklaşık bir bütçe aralığınız var mı?' },
  ],
  surgical_aesthetics: [
    { key: 'full_name',           label: 'Ad Soyad',          type: 'text',  priority: 'must',   sort_order: 10, voice_prompt: 'Adınızı ve soyadınızı öğrenebilir miyim?', wa_prompt: 'Adınızı öğrenebilir miyim?' },
    { key: 'phone',               label: 'Telefon',           type: 'phone', priority: 'must',   sort_order: 20, voice_prompt: 'Telefon numaranızı alabilir miyim?' },
    { key: 'service_interest',    label: 'Operasyon',         type: 'text',  priority: 'must',   sort_order: 30, voice_prompt: 'Rinoplasti mi, liposuction mu, başka bir operasyon mu düşünüyorsunuz?', wa_prompt: 'Hangi operasyonu düşünüyorsunuz?' },
    { key: 'procedure_interest',  label: 'Prosedür Detay',    type: 'text',  priority: 'should', sort_order: 40, voice_prompt: 'Bu operasyonu daha önce düşünüyor muydunuz, ilk kez mi araştırıyorsunuz?', wa_prompt: 'Ne zamandır araştırıyorsunuz?' },
    { key: 'recovery_timeline',   label: 'İyileşme Süreci',   type: 'text',  priority: 'should', sort_order: 50, voice_prompt: 'İyileşme süreci için ne kadar zaman ayırabilirsiniz?', wa_prompt: 'İyileşme süreci için ne kadar zaman ayırabilirsiniz?' },
    { key: 'is_foreign',          label: 'Yurt Dışı Hasta',   type: 'text',  priority: 'should', sort_order: 60, voice_prompt: 'Yurt dışından mı teşrif edeceksiniz?', wa_prompt: 'Yurt dışından mı geliyorsunuz?' },
  ],
  physiotherapy: [
    { key: 'full_name',       label: 'Ad Soyad',        type: 'text',  priority: 'must',   sort_order: 10, voice_prompt: 'Adınızı ve soyadınızı öğrenebilir miyim?', wa_prompt: 'Adınızı öğrenebilir miyim?' },
    { key: 'phone',           label: 'Telefon',         type: 'phone', priority: 'must',   sort_order: 20, voice_prompt: 'Telefon numaranızı alabilir miyim?' },
    { key: 'service_interest',label: 'Hizmet',          type: 'text',  priority: 'must',   sort_order: 30, voice_prompt: 'Hangi bölge için fizyoterapi almak istiyorsunuz?', wa_prompt: 'Hangi bölgede şikayetiniz var (bel, diz, omuz, boyun)?' },
    { key: 'complaint_area',  label: 'Şikayet Bölgesi', type: 'text',  priority: 'should', sort_order: 40, voice_prompt: 'Bel mi, diz mi, omuz mu, hangi bölgede şikayetiniz var?', wa_prompt: 'Tam olarak hangi bölgede ağrınız var?' },
    { key: 'pain_duration',   label: 'Şikayet Süresi',  type: 'text',  priority: 'should', sort_order: 50, voice_prompt: 'Bu şikayet ne zamandır devam ediyor?', wa_prompt: 'Bu şikayet ne zamandır devam ediyor?' },
    { key: 'injury_type',     label: 'Yaralanma Tipi',  type: 'text',  priority: 'should', sort_order: 60, voice_prompt: 'Spor sakatlığı mı, ameliyat sonrası rehabilitasyon mu, kronik ağrı mı?', wa_prompt: 'Spor sakatlığı mı, ameliyat sonrası mı, kronik ağrı mı?' },
  ],
  ophthalmology: [
    { key: 'full_name',        label: 'Ad Soyad',          type: 'text',  priority: 'must',   sort_order: 10, voice_prompt: 'Adınızı ve soyadınızı öğrenebilir miyim?', wa_prompt: 'Adınızı öğrenebilir miyim?' },
    { key: 'phone',            label: 'Telefon',           type: 'phone', priority: 'must',   sort_order: 20, voice_prompt: 'Telefon numaranızı alabilir miyim?' },
    { key: 'service_interest', label: 'Hizmet',            type: 'text',  priority: 'must',   sort_order: 30, voice_prompt: 'Lazer tedavisi mi, katarakt ameliyatı mı, yoksa kontrol muayenesi mi?', wa_prompt: 'Lazer göz tedavisi mi, katarakt mı, yoksa genel kontrol mü düşünüyorsunuz?' },
    { key: 'vision_problem',   label: 'Görme Sorunu',      type: 'text',  priority: 'should', sort_order: 40, voice_prompt: 'Miyop mu, hipermetrop mu, astigmat mı, hangisi sizin durumunuz?', wa_prompt: 'Gözlük veya lens kullanıyor musunuz?' },
    { key: 'glasses_user',     label: 'Gözlük/Lens',       type: 'text',  priority: 'should', sort_order: 50, voice_prompt: 'Gözlük veya lens kullanıyor musunuz, ne zamandır?', wa_prompt: 'Ne zamandır gözlük/lens kullanıyorsunuz?' },
    { key: 'prior_surgery',    label: 'Önceki Operasyon',  type: 'text',  priority: 'should', sort_order: 60, voice_prompt: 'Daha önce göz operasyonu geçirdiniz mi?', wa_prompt: 'Daha önce göz ameliyatı geçirdiniz mi?' },
  ],
  general_practice: [
    { key: 'full_name',           label: 'Ad Soyad',        type: 'text',  priority: 'must',   sort_order: 10, voice_prompt: 'Adınızı ve soyadınızı öğrenebilir miyim?', wa_prompt: 'Adınızı öğrenebilir miyim?' },
    { key: 'phone',               label: 'Telefon',         type: 'phone', priority: 'must',   sort_order: 20, voice_prompt: 'Telefon numaranızı alabilir miyim?' },
    { key: 'service_interest',    label: 'Hizmet',          type: 'text',  priority: 'must',   sort_order: 30, voice_prompt: 'Muayene mi, kronik takip mi, aşı mı, ne için randevu almak istiyorsunuz?', wa_prompt: 'Muayene mi, kronik takip mi, check-up mu, yoksa başka bir konu mu?' },
    { key: 'chief_complaint',     label: 'Ana Şikayet',     type: 'text',  priority: 'should', sort_order: 40, voice_prompt: 'Kısaca şikayetinizi anlatabilir misiniz?', wa_prompt: 'Şikayetinizi kısaca anlatır mısınız?' },
    { key: 'age_group',           label: 'Yaş Grubu',       type: 'text',  priority: 'should', sort_order: 50, voice_prompt: 'Yaklaşık yaşınızı öğrenebilir miyim?', wa_prompt: 'Yaklaşık yaşınızı öğrenebilir miyim?' },
    { key: 'chronic_conditions',  label: 'Kronik Hastalık', type: 'text',  priority: 'should', sort_order: 60, voice_prompt: 'Bilinen kronik bir hastalığınız var mı, ilaç kullanıyor musunuz?', wa_prompt: 'Bilinen kronik bir hastalığınız var mı?' },
  ],
  other: [
    { key: 'full_name',        label: 'Ad Soyad',           type: 'text',  priority: 'must',   sort_order: 10, voice_prompt: 'Adınızı ve soyadınızı öğrenebilir miyim?', wa_prompt: 'Adınızı öğrenebilir miyim?' },
    { key: 'phone',            label: 'Telefon',            type: 'phone', priority: 'must',   sort_order: 20, voice_prompt: 'Telefon numaranızı alabilir miyim?', wa_prompt: 'Telefon numaranızı alabilir miyim?' },
    { key: 'service_interest', label: 'İlgilenilen Hizmet', type: 'text',  priority: 'must',   sort_order: 30, voice_prompt: 'Hangi hizmetimiz hakkında bilgi almak istiyorsunuz?', wa_prompt: 'Hangi hizmetimizle ilgileniyorsunuz?' },
    { key: 'timeline',         label: 'Zaman Çizelgesi',    type: 'text',  priority: 'should', sort_order: 40, voice_prompt: 'Ne zaman başlamayı düşünüyorsunuz?', wa_prompt: 'Ne zaman başlamayı düşünüyorsunuz?' },
    { key: 'budget_range',     label: 'Bütçe',              type: 'text',  priority: 'should', sort_order: 50, voice_prompt: 'Yaklaşık bir bütçe aralığınız var mı?', wa_prompt: 'Yaklaşık bir bütçe aralığınız var mı?' },
    { key: 'notes',            label: 'Notlar',             type: 'text',  priority: 'should', sort_order: 60, voice_prompt: 'Eklemek istediğiniz başka bir bilgi var mı?', wa_prompt: 'Eklemek istediğiniz başka bir bilgi var mı?' },
  ],
}

/**
 * Chat kanalları için intake alanlarını döndür.
 * - WhatsApp: phone hariç (payload'dan otomatik gelir)
 * - Instagram: phone dahil (IG DM'de numara yok, açıkça sorulmalı)
 * - Sadece must alanları
 */
export function getChatIntakeFields(
  clinicType: string,
  channel: 'whatsapp' | 'instagram' | 'web' = 'whatsapp'
): IntakeField[] {
  const voiceFields = CLINIC_INTAKE_SCHEMAS[clinicType] ?? CLINIC_INTAKE_SCHEMAS['other']
  return voiceFields
    .filter(f => channel === 'whatsapp' ? f.key !== 'phone' : true)
    .filter(f => f.priority === 'must')
    .map((f, i) => ({ ...f, sort_order: (i + 1) * 10 }))
}
