export type IntakeField = {
  key: string
  label: string
  type: 'text' | 'phone' | 'email' | 'number' | 'select'
  priority: 'must' | 'should' | 'nice'
  voice_prompt?: string
}

export const CLINIC_INTAKE_SCHEMAS: Record<string, IntakeField[]> = {
  hair_transplant: [
    { key: 'full_name',        label: 'Ad Soyad',           type: 'text',  priority: 'must',   voice_prompt: 'Adınızı ve soyadınızı öğrenebilir miyim?' },
    { key: 'phone',            label: 'Telefon',            type: 'phone', priority: 'must',   voice_prompt: 'Telefon numaranızı alabilir miyim?' },
    { key: 'service_interest', label: 'İlgilenilen Yöntem', type: 'text',  priority: 'must',   voice_prompt: 'FUE mi DHI mi, yoksa henüz karar vermediniz mi?' },
    { key: 'greft_estimate',   label: 'Greft Tahmini',      type: 'text',  priority: 'should', voice_prompt: 'Daha önce bir analiz yaptırdınız mı, greft sayısı hakkında fikriniz var mı?' },
    { key: 'budget_range',     label: 'Bütçe',              type: 'text',  priority: 'should', voice_prompt: 'Yaklaşık bir bütçe aralığınız var mı?' },
    { key: 'is_foreign',       label: 'Yurt Dışı Hasta',    type: 'text',  priority: 'should', voice_prompt: 'Yurt dışından mı teşrif edeceksiniz?' },
  ],
  dental: [
    { key: 'full_name',          label: 'Ad Soyad',        type: 'text',  priority: 'must',   voice_prompt: 'Adınızı öğrenebilir miyim?' },
    { key: 'phone',              label: 'Telefon',         type: 'phone', priority: 'must',   voice_prompt: 'Telefon numaranızı alabilir miyim?' },
    { key: 'service_interest',   label: 'Hizmet',          type: 'text',  priority: 'must',   voice_prompt: 'İmplant mı, ortodonti mi, estetik diş mi ilgileniyorsunuz?' },
    { key: 'tooth_concern',      label: 'Diş Şikayeti',    type: 'text',  priority: 'should', voice_prompt: 'Mevcut bir şikayetiniz var mı, yoksa estetik amaçlı mı?' },
    { key: 'previous_treatment', label: 'Önceki Tedavi',   type: 'text',  priority: 'should', voice_prompt: 'Bu konuda daha önce tedavi aldınız mı?' },
    { key: 'budget_range',       label: 'Bütçe',           type: 'text',  priority: 'should', voice_prompt: 'Yaklaşık bir bütçe düşünüyor musunuz?' },
  ],
  medical_aesthetics: [
    { key: 'full_name',          label: 'Ad Soyad',         type: 'text',  priority: 'must' },
    { key: 'phone',              label: 'Telefon',          type: 'phone', priority: 'must' },
    { key: 'service_interest',   label: 'Hizmet',           type: 'text',  priority: 'must',   voice_prompt: 'Botoks mu, dolgu mu, yoksa başka bir uygulama mı düşünüyorsunuz?' },
    { key: 'treatment_area',     label: 'Uygulama Bölgesi', type: 'text',  priority: 'should', voice_prompt: 'Hangi bölge için düşünüyorsunuz, yüz mü, vücut mu?' },
    { key: 'skin_concern',       label: 'Cilt Şikayeti',    type: 'text',  priority: 'should', voice_prompt: 'Çözüm aradığınız belirli bir cilt sorununuz var mı?' },
    { key: 'budget_range',       label: 'Bütçe',            type: 'text',  priority: 'should' },
  ],
  surgical_aesthetics: [
    { key: 'full_name',           label: 'Ad Soyad',          type: 'text',  priority: 'must' },
    { key: 'phone',               label: 'Telefon',           type: 'phone', priority: 'must' },
    { key: 'service_interest',    label: 'Operasyon',         type: 'text',  priority: 'must',   voice_prompt: 'Rinoplasti mi, liposuction mu, başka bir operasyon mu düşünüyorsunuz?' },
    { key: 'procedure_interest',  label: 'Prosedür Detay',    type: 'text',  priority: 'should', voice_prompt: 'Bu operasyonu daha önce düşünüyor muydunuz, ilk kez mi araştırıyorsunuz?' },
    { key: 'recovery_timeline',   label: 'İyileşme Süreci',   type: 'text',  priority: 'should', voice_prompt: 'İyileşme süreci için ne kadar zaman ayırabilirsiniz?' },
    { key: 'is_foreign',          label: 'Yurt Dışı Hasta',   type: 'text',  priority: 'should' },
  ],
  physiotherapy: [
    { key: 'full_name',       label: 'Ad Soyad',        type: 'text',  priority: 'must' },
    { key: 'phone',           label: 'Telefon',         type: 'phone', priority: 'must' },
    { key: 'service_interest',label: 'Hizmet',          type: 'text',  priority: 'must',   voice_prompt: 'Hangi bölge için fizyoterapi almak istiyorsunuz?' },
    { key: 'complaint_area',  label: 'Şikayet Bölgesi', type: 'text',  priority: 'should', voice_prompt: 'Bel mi, diz mi, omuz mu, hangi bölgede şikayetiniz var?' },
    { key: 'pain_duration',   label: 'Şikayet Süresi',  type: 'text',  priority: 'should', voice_prompt: 'Bu şikayet ne zamandır devam ediyor?' },
    { key: 'injury_type',     label: 'Yaralanma Tipi',  type: 'text',  priority: 'should', voice_prompt: 'Spor sakatlığı mı, ameliyat sonrası rehabilitasyon mu, kronik ağrı mı?' },
  ],
  ophthalmology: [
    { key: 'full_name',        label: 'Ad Soyad',          type: 'text',  priority: 'must' },
    { key: 'phone',            label: 'Telefon',           type: 'phone', priority: 'must' },
    { key: 'service_interest', label: 'Hizmet',            type: 'text',  priority: 'must',   voice_prompt: 'Lazer tedavisi mi, katarakt ameliyatı mı, yoksa kontrol muayenesi mi?' },
    { key: 'vision_problem',   label: 'Görme Sorunu',      type: 'text',  priority: 'should', voice_prompt: 'Miyop mu, hipermetrop mu, astigmat mı, hangisi sizin durumunuz?' },
    { key: 'glasses_user',     label: 'Gözlük/Lens',       type: 'text',  priority: 'should', voice_prompt: 'Gözlük veya lens kullanıyor musunuz, ne zamandır?' },
    { key: 'prior_surgery',    label: 'Önceki Operasyon',  type: 'text',  priority: 'should', voice_prompt: 'Daha önce göz operasyonu geçirdiniz mi?' },
  ],
  general_practice: [
    { key: 'full_name',           label: 'Ad Soyad',        type: 'text',  priority: 'must' },
    { key: 'phone',               label: 'Telefon',         type: 'phone', priority: 'must' },
    { key: 'service_interest',    label: 'Hizmet',          type: 'text',  priority: 'must',   voice_prompt: 'Muayene mi, kronik takip mi, aşı mı, ne için randevu almak istiyorsunuz?' },
    { key: 'chief_complaint',     label: 'Ana Şikayet',     type: 'text',  priority: 'should', voice_prompt: 'Kısaca şikayetinizi anlatabilir misiniz?' },
    { key: 'age_group',           label: 'Yaş Grubu',       type: 'text',  priority: 'should', voice_prompt: 'Yaklaşık yaşınızı öğrenebilir miyim?' },
    { key: 'chronic_conditions',  label: 'Kronik Hastalık', type: 'text',  priority: 'should', voice_prompt: 'Bilinen kronik bir hastalığınız var mı, ilaç kullanıyor musunuz?' },
  ],
  other: [
    { key: 'full_name',        label: 'Ad Soyad',           type: 'text',  priority: 'must',   voice_prompt: 'Adınızı ve soyadınızı öğrenebilir miyim?' },
    { key: 'phone',            label: 'Telefon',            type: 'phone', priority: 'must',   voice_prompt: 'Telefon numaranızı alabilir miyim?' },
    { key: 'service_interest', label: 'İlgilenilen Hizmet', type: 'text',  priority: 'must',   voice_prompt: 'Hangi hizmetimiz hakkında bilgi almak istiyorsunuz?' },
    { key: 'timeline',         label: 'Zaman Çizelgesi',    type: 'text',  priority: 'should', voice_prompt: 'Ne zaman başlamayı düşünüyorsunuz?' },
    { key: 'budget_range',     label: 'Bütçe',              type: 'text',  priority: 'should' },
    { key: 'notes',            label: 'Notlar',             type: 'text',  priority: 'should' },
  ],
}
