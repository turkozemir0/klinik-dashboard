'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  CheckCircle2, ArrowRight, ArrowLeft, Phone, Mail, MapPin, Globe,
  Pencil, Check, Plus, X, ChevronDown, ChevronUp, Sparkles, ShieldCheck, Bot,
} from 'lucide-react'
import { FormInput } from '@/components/FormInput'
import { FormTextarea } from '@/components/FormTextarea'
import { FormSelect } from '@/components/FormSelect'
import { Button } from '@/components/Button'
import { StepIndicator } from '@/components/StepIndicator'
import { OnboardingSuccess } from '@/components/OnboardingSuccess'

type Step = 0 | 1 | 2 | 3

const CLINIC_TYPES = [
  { key: 'hair_transplant', label: 'Saç Ekimi', desc: 'FUE, DHI, sakal/kaş ekimi' },
  { key: 'dental', label: 'Diş Kliniği', desc: 'İmplant, ortodonti, estetik diş' },
  { key: 'medical_aesthetics', label: 'Medikal Estetik', desc: 'Botox, dolgu, lazer, cilt bakım' },
  { key: 'surgical_aesthetics', label: 'Cerrahi Estetik', desc: 'Rinoplasti, liposuction, vücut şekillendirme' },
  { key: 'physiotherapy', label: 'Fizyoterapi', desc: 'Spor yaralanmaları, rehabilitasyon' },
  { key: 'ophthalmology', label: 'Göz Hastalıkları', desc: 'LASIK, katarak, göz implantı' },
  { key: 'general_practice', label: 'Genel Pratisyen', desc: 'Aile hekimi, kronik hastalık yönetimi' },
  { key: 'other', label: 'Diğer', desc: 'Özel sağlık hizmeti' },
]

// ─── Per-clinic pre-fill data ─────────────────────────────────────────────────

const CLINIC_CONFIG: Record<string, {
  label: string
  defaultAbout: string
  defaultWorkingHours: string
  services: Array<{ name: string; preSelected?: boolean }>
  suggestedFaqs: Array<{ q: string; a: string; preSelected?: boolean }>
  pricingFields: Array<{ label: string; key: string; placeholder: string; suffix?: string }>
  pricingNote?: string
}> = {
  hair_transplant: {
    label: 'Saç Ekimi Kliniği',
    defaultAbout:
      'FUE, DHI ve sakal/kaş ekimi tekniklerimizle saç kaybı sorunlarına kalıcı çözümler sunuyoruz. Uzman doktor kadromuz ve modern ekipmanlarımızla Türkiye\'ye gelen uluslararası hastalara da hizmet veriyoruz.',
    defaultWorkingHours: 'Pazartesi – Cumartesi: 09:00 – 18:00\nPazar: Randevuya göre',
    services: [
      { name: 'FUE Saç Ekimi', preSelected: true },
      { name: 'DHI Saç Ekimi', preSelected: true },
      { name: 'Sakal Ekimi', preSelected: true },
      { name: 'Kaş Ekimi' },
      { name: 'Saç Analizi & Ücretsiz Danışma', preSelected: true },
      { name: 'PRP Tedavisi' },
      { name: 'Kadın Tipi Saç Ekimi' },
      { name: 'Afro Tip Saç Ekimi' },
    ],
    suggestedFaqs: [
      {
        q: 'Hangi teknikler kullanılıyor?',
        a: 'FUE (Follicular Unit Extraction) ve DHI (Direct Hair Implantation) tekniklerini kullanıyoruz. Doktorumuz ilk değerlendirmede hangi tekniğin size uygun olduğuna karar verir.',
        preSelected: true,
      },
      {
        q: 'Kaç greft gerekiyor?',
        a: 'Saç kaybının derecesine göre genellikle 2.000–4.500 greft arasında işlem yapılmaktadır. Ücretsiz analiz görüşmemizde fotoğraflarınızı inceleyerek size özel greft tahmini sunuyoruz.',
        preSelected: true,
      },
      {
        q: 'Operasyon ne kadar sürer?',
        a: 'Greft sayısına bağlı olarak operasyon 6–8 saat sürmektedir. İşlem boyunca lokal anestezi uygulanır ve hasta konforlu şekilde dinlenebilir.',
        preSelected: true,
      },
      {
        q: 'İşlem ağrılı mı?',
        a: 'İşlem lokal anestezi altında gerçekleştirildiği için operasyon sırasında ağrı hissedilmez. Sonrasında hafif hassasiyet olabilir; bu ağrı kesici ile kolayca kontrol altına alınır.',
        preSelected: true,
      },
      {
        q: 'İyileşme süreci nasıl?',
        a: 'İlk 10 günde kabuklanma ve hafif şişlik normaldir. 2–3 haftada günlük yaşama dönebilirsiniz. 2–3. ayda şok dökümü yaşanabilir — bu normaldir. Kalıcı sonuç 12–18 ayda tamamlanır.',
        preSelected: true,
      },
      {
        q: 'Sonuçlar ne zaman görünür?',
        a: '3. aydan itibaren yeni saçlar çıkmaya başlar. 6. ayda belirgin dolgunluk görülür. 12–18. ayda final sonuç ortaya çıkar.',
        preSelected: true,
      },
      {
        q: 'Ücretsiz danışma ve analiz yapıyor musunuz?',
        a: 'Evet, saç analizi ve greft tahmini tamamen ücretsizdir. Fotoğraflarınızı paylaşmanız yeterli; doktorumuz değerlendirme sonucunu iletir.',
        preSelected: true,
      },
      {
        q: 'Yurt dışından gelen hastalar için transfer ve konaklama hizmetiniz var mı?',
        a: 'Evet, uluslararası hastalarımız için havalimanı transferi ve konaklama organizasyonu sağlıyoruz. Türkiye\'ye gelmeden önce tüm süreç koordinasyonunu ekibimiz yönetir.',
      },
      {
        q: 'Sakal ve kaş ekimi de yapıyor musunuz?',
        a: 'Evet, sakal ve kaş ekimi de gerçekleştiriyoruz. Bu işlemler için de ücretsiz danışma yapılmaktadır.',
      },
      {
        q: 'Sonuç garantisi veriyor musunuz?',
        a: 'Doğru hasta seçimi ve operasyon tekniğiyle yüksek tutma oranları elde ediyoruz. Operasyon sonrası takip sürecimiz boyunca gelişiminizi izliyoruz ve gerektiğinde destek sağlıyoruz.',
      },
    ],
    pricingFields: [
      { label: 'FUE Saç Ekimi', key: 'fue', placeholder: 'ör. €2 / greft', suffix: '' },
      { label: 'DHI Saç Ekimi', key: 'dhi', placeholder: 'ör. €2.5 / greft' },
      { label: 'Sakal Ekimi', key: 'beard', placeholder: 'ör. €1.500 (1.500 greft)' },
      { label: 'Kaş Ekimi', key: 'eyebrow', placeholder: 'ör. €800 (500 greft)' },
      { label: 'PRP Tedavisi', key: 'prp', placeholder: 'ör. €200 / seans' },
      { label: 'Transfer & Konaklama', key: 'transfer', placeholder: 'ör. Pakete dahil' },
    ],
    pricingNote: 'Ücretsiz analiz görüşmesinde hastaya greft sayısına göre kesin fiyat verilmektedir.',
  },
  dental: {
    label: 'Diş Kliniği',
    defaultAbout:
      'Kaliteli ve güvenilir diş hekimliği hizmetleriyle ailenizin sağlığını koruyoruz. İmplant, ortodonti ve estetik diş tedavilerinde uzman kadromuzla hizmetinizdeyiz.',
    defaultWorkingHours: 'Pazartesi – Cuma: 09:00 – 18:00\nCumartesi: 10:00 – 15:00',
    services: [
      { name: 'Genel Diş Tedavisi', preSelected: true },
      { name: 'İmplant', preSelected: true },
      { name: 'Ortodonti', preSelected: true },
      { name: 'Estetik Diş Tedavisi', preSelected: true },
      { name: 'Protez' },
      { name: 'Endodonti (Kanal Tedavisi)' },
      { name: 'Diş Temizliği', preSelected: true },
      { name: 'Zirkonyum Kaplama' },
    ],
    suggestedFaqs: [
      { q: 'İmplant süreci nasıl işliyor?', a: 'İmplant yerleştirme işlemi yaklaşık 30–60 dakika sürer. Kemik entegrasyonu 3–6 ay sürer, ardından üst yapı (kron) takılır. Süreç boyunca doktorumuz sizi takip eder.', preSelected: true },
      { q: 'İşlemler ağrılı mı?', a: 'Tüm işlemler lokal anestezi altında yapılmaktadır. İşlem sonrası hafif ağrı ve şişlik birkaç günde geçer.', preSelected: true },
      { q: 'Garanti veriyor musunuz?', a: 'İmplant ve protez çalışmalarımızda malzemeye özel garanti sunmaktayız. Detaylar için kliniğimizle iletişime geçebilirsiniz.', preSelected: true },
      { q: 'Randevu almak için ne yapmalıyım?', a: 'WhatsApp veya telefon ile ulaşabilirsiniz. Randevunuzu genellikle 24 saat içinde ayarlıyoruz.', preSelected: true },
      { q: 'Sigorta kabul ediyor musunuz?', a: 'Bazı özel sigortalarla anlaşmamız bulunmaktadır. Sigorta şirketinizi paylaşırsanız bilgi verebiliriz.' },
    ],
    pricingFields: [
      { label: 'Diş İmplantı (tek)', key: 'implant', placeholder: 'ör. €500 (kron dahil)' },
      { label: 'Kanal Tedavisi', key: 'root_canal', placeholder: 'ör. ₺1.500' },
      { label: 'Zirkonyum Kaplama', key: 'zirconium', placeholder: 'ör. €200 / diş' },
      { label: 'Ortodonti (Braces)', key: 'braces', placeholder: 'ör. ₺25.000 (tüm tedavi)' },
      { label: 'Diş Temizliği', key: 'cleaning', placeholder: 'ör. ₺800' },
    ],
  },
  medical_aesthetics: {
    label: 'Medikal Estetik',
    defaultAbout:
      'Non-invasif estetik tedavilerle doğal ve genç bir görünüm kazanın. Botox, dolgu, lazer ve cilt bakım hizmetlerinde uzman kadromuzla hizmetinizdeyiz.',
    defaultWorkingHours: 'Pazartesi – Cumartesi: 10:00 – 19:00',
    services: [
      { name: 'Botox / Dysport', preSelected: true },
      { name: 'Dermal Filler (Dolgu)', preSelected: true },
      { name: 'Lazer Epilasyon' },
      { name: 'Chemical Peeling', preSelected: true },
      { name: 'Microneedling' },
      { name: 'Skin Booster', preSelected: true },
      { name: 'PRP Tedavisi' },
      { name: 'Leke Tedavisi' },
    ],
    suggestedFaqs: [
      { q: 'Botox ne kadar sürer?', a: 'Botox uygulaması 15–20 dakika sürer. Etki 4–6 ay devam eder. İşlem sonrası hemen günlük yaşamınıza dönebilirsiniz.', preSelected: true },
      { q: 'İşlem ağrılı mı?', a: 'Uygulamalar çok ince iğnelerle yapıldığı için ağrı minimumdur. Gerekirse topikal anestezi uygulanabilir.', preSelected: true },
      { q: 'Yan etki var mı?', a: 'Doğru uygulama ile yan etki riski çok düşüktür. İşlem sonrası hafif kızarıklık normaldir ve birkaç saatte geçer.', preSelected: true },
      { q: 'Sonuçlar ne zaman görünür?', a: 'Botox\'ta etki 3–7 gün içinde başlar. Dolgu işlemlerinde sonuç hemen görülür.', preSelected: true },
      { q: 'Ne sıklıkla tekrarlanmalı?', a: 'Botox genellikle 4–6 ayda bir, dolgu 6–12 ayda bir tekrarlanır. Kişiye özel plan oluşturulur.' },
    ],
    pricingFields: [
      { label: 'Botox (1 bölge)', key: 'botox', placeholder: 'ör. ₺3.000' },
      { label: 'Dolgu (1ml)', key: 'filler', placeholder: 'ör. ₺4.000' },
      { label: 'Lazer Epilasyon (1 bölge)', key: 'laser', placeholder: 'ör. ₺500 / seans' },
      { label: 'Chemical Peeling', key: 'peeling', placeholder: 'ör. ₺1.500 / seans' },
      { label: 'Paket (3 seans)', key: 'package', placeholder: 'ör. ₺4.000 (botox x3)' },
    ],
  },
  surgical_aesthetics: {
    label: 'Cerrahi Estetik',
    defaultAbout:
      'Uluslararası standartlarda cerrahi estetik hizmetleriyle hayalinizdeki görünüme kavuşun. Rinoplasti, liposuction ve vücut şekillendirmede uzman cerrahlarımız hizmetinizdedir.',
    defaultWorkingHours: 'Pazartesi – Cuma: 09:00 – 17:00\nCumartesi: 10:00 – 14:00 (danışma)',
    services: [
      { name: 'Rinoplasti (Burun Estetiği)', preSelected: true },
      { name: 'Liposuction', preSelected: true },
      { name: 'Abdominoplasti (Karın Germe)', preSelected: true },
      { name: 'Göğüs Büyütme İmplantı' },
      { name: 'Blefaroplasti (Göz Kapağı)' },
      { name: 'Yüz Germe (Facelift)' },
      { name: 'Meme Küçültme' },
    ],
    suggestedFaqs: [
      { q: 'Ameliyat öncesi hazırlık sürecim nasıl?', a: 'Ameliyattan 2–3 hafta önce tahliller ve doktor değerlendirmesi yapılır. Kan sulandırıcı ilaçlar, sigara ve alkol kesilir.', preSelected: true },
      { q: 'Hastanede kaç gün yatmam gerekiyor?', a: 'Operasyon türüne göre değişmekle birlikte çoğu işlemde 1–2 gece hastanede kalış önerilmektedir.', preSelected: true },
      { q: 'İyileşme ne kadar sürer?', a: 'Hafif günlük aktiviteye 1–2 haftada dönebilirsiniz. Tam iyileşme ve final sonuç 6–12 ay içinde gerçekleşir.', preSelected: true },
      { q: 'Genel anestezi mi uygulanıyor?', a: 'Evet, cerrahi işlemlerimizde genel anestezi uygulanmaktadır. Deneyimli anestezi ekibimiz süreç boyunca sizinle birlikte.', preSelected: true },
      { q: 'Yurt dışından gelen hastalara destek veriyor musunuz?', a: 'Evet, uluslararası hastalara özel transfer, konaklama ve tercümanlık desteği sağlıyoruz.' },
    ],
    pricingFields: [
      { label: 'Rinoplasti', key: 'rhinoplasty', placeholder: 'ör. €3.500 (anestezi dahil)' },
      { label: 'Liposuction (1 bölge)', key: 'lipo', placeholder: 'ör. €2.000' },
      { label: 'Abdominoplasti', key: 'abdominoplasty', placeholder: 'ör. €4.000' },
      { label: 'Göğüs İmplantı', key: 'breast', placeholder: 'ör. €3.000 (implant dahil)' },
    ],
    pricingNote: 'Fiyatlar ameliyathane ve anestezi ücreti dahildir. Kesin fiyat danışma sonrası verilmektedir.',
  },
  physiotherapy: {
    label: 'Fizyoterapist / Rehabilitasyon',
    defaultAbout:
      'Kişiselleştirilmiş fizyoterapi programlarıyla hareket yeteneğinizi geri kazanın. Spor yaralanmaları, kronik ağrı ve post-operatif rehabilitasyonda uzmanız.',
    defaultWorkingHours: 'Pazartesi – Cuma: 08:00 – 18:00\nCumartesi: 09:00 – 14:00',
    services: [
      { name: 'Spor Yaralanmaları Rehabilitasyonu', preSelected: true },
      { name: 'Post-Op Rehabilitasyon', preSelected: true },
      { name: 'Kronik Ağrı Yönetimi', preSelected: true },
      { name: 'Manuel Terapi' },
      { name: 'Egzersiz Terapisi', preSelected: true },
      { name: 'Pilates Tabanlı Rehabilitasyon' },
    ],
    suggestedFaqs: [
      { q: 'İlk seansta ne yapılıyor?', a: 'İlk seans değerlendirme seansıdır. Durumunuz analiz edilerek kişiye özel tedavi planı oluşturulur.', preSelected: true },
      { q: 'Kaç seans gerekiyor?', a: 'Rahatsızlığın türüne ve şiddetine göre değişmektedir. Genellikle 6–20 seans arasında plan yapılır.', preSelected: true },
      { q: 'Seans ne kadar sürer?', a: 'Her seans yaklaşık 45–60 dakika sürmektedir.', preSelected: true },
      { q: 'İşlem ağrılı mı?', a: 'Hedefimiz ağrıyı azaltmaktır. Bazı teknikler geçici hassasiyet yaratabilir; bunlar terapötik sürecin parçasıdır.', preSelected: true },
    ],
    pricingFields: [
      { label: 'Bireysel Seans', key: 'session', placeholder: 'ör. ₺800 / seans' },
      { label: '5 Seans Paketi', key: 'pkg5', placeholder: 'ör. ₺3.500' },
      { label: '10 Seans Paketi', key: 'pkg10', placeholder: 'ör. ₺6.000' },
      { label: 'İlk Değerlendirme Seansı', key: 'evaluation', placeholder: 'ör. ₺1.000 (60 dk)' },
    ],
  },
  ophthalmology: {
    label: 'Göz Hastalıkları Kliniği',
    defaultAbout:
      'Görme sağlığınız için uluslararası standartlarda cerrahi ve medikal hizmetler sunuyoruz. LASIK, katarak ve göz implantı operasyonlarında uzman ekibimizle hizmetinizdeyiz.',
    defaultWorkingHours: 'Pazartesi – Cuma: 09:00 – 17:00\nCumartesi: 09:00 – 13:00',
    services: [
      { name: 'LASIK Lazer Cerrahisi', preSelected: true },
      { name: 'PRK Lazer Cerrahisi' },
      { name: 'Katarak Ameliyatı', preSelected: true },
      { name: 'Göz İmplantı (ICL)', preSelected: true },
      { name: 'Göz Muayenesi', preSelected: true },
    ],
    suggestedFaqs: [
      { q: 'LASIK için uygun muyum?', a: 'Uygunluk değerlendirmesi için kapsamlı bir ön muayene gereklidir. Göz numaranız, kornea kalınlığınız ve genel göz sağlığınız değerlendirilir.', preSelected: true },
      { q: 'İşlem ağrılı mı?', a: 'LASIK ve PRK göz damlalarıyla uyuşturulduktan sonra yapılır. İşlem sırasında ağrı hissedilmez, yalnızca hafif bir baskı hissi olabilir.', preSelected: true },
      { q: 'Ne zaman normal görüşe kavuşurum?', a: 'LASIK\'ta çoğu hasta 24–48 saat içinde net görmeye başlar. PRK\'da iyileşme 1–2 haftaya yayılabilir.', preSelected: true },
      { q: 'İşlem ne kadar sürer?', a: 'Her göz için LASIK işlemi yaklaşık 5–10 dakika sürer. Klinikte toplam kalış süresi 2–3 saattir.', preSelected: true },
    ],
    pricingFields: [
      { label: 'LASIK (çift göz)', key: 'lasik', placeholder: 'ör. €2.000' },
      { label: 'PRK (çift göz)', key: 'prk', placeholder: 'ör. €1.800' },
      { label: 'Katarak (tek göz)', key: 'cataract', placeholder: 'ör. €1.500 (standart lens)' },
      { label: 'ICL Göz İmplantı (çift göz)', key: 'icl', placeholder: 'ör. €3.000' },
    ],
  },
  general_practice: {
    label: 'Genel Pratisyen / Aile Hekimi',
    defaultAbout:
      'Ailenizin sağlık bakımı için güvenilir ve ulaşılabilir bir partner olarak hizmetinizdeyiz. Kronik hastalık yönetimi, aşılar ve rutin kontrollerde yanınızdayız.',
    defaultWorkingHours: 'Pazartesi – Cuma: 09:00 – 18:00\nCumartesi: 09:00 – 13:00',
    services: [
      { name: 'Genel Konsültasyon', preSelected: true },
      { name: 'Kronik Hastalık Yönetimi', preSelected: true },
      { name: 'Aşılar & Önleyici Tıp', preSelected: true },
      { name: 'Tıbbi Testler & Tarama', preSelected: true },
    ],
    suggestedFaqs: [
      { q: 'Randevu nasıl alabilirim?', a: 'WhatsApp veya telefon ile ulaşabilirsiniz. Randevunuzu genellikle 24 saat içinde ayarlıyoruz.', preSelected: true },
      { q: 'Kronik hastalık takibi yapıyor musunuz?', a: 'Evet, diyabet, hipertansiyon ve diğer kronik rahatsızlıklar için düzenli takip programları sunuyoruz.', preSelected: true },
      { q: 'Kan testi ve tahlil yapılıyor mu?', a: 'Evet, kliniğimizde temel kan tahlilleri yapılmaktadır. Sonuçlar genellikle aynı gün veya 24 saat içinde hazır olur.', preSelected: true },
    ],
    pricingFields: [
      { label: 'Genel Konsültasyon', key: 'consult', placeholder: 'ör. ₺500' },
      { label: 'Yıllık Kontrol Paketi', key: 'annual', placeholder: 'ör. ₺2.500 (tahlil dahil)' },
      { label: 'Aşı Uygulaması', key: 'vaccine', placeholder: 'ör. ₺200 + malzeme' },
    ],
  },
  other: {
    label: 'Diğer Sağlık Hizmeti',
    defaultAbout: 'Sağlık hizmetlerimizi STOAIX platformunda yönetin ve otomatik takip sistemleri kurun.',
    defaultWorkingHours: 'Pazartesi – Cuma: 09:00 – 18:00',
    services: [],
    suggestedFaqs: [],
    pricingFields: [{ label: 'Hizmet Fiyatı', key: 'base', placeholder: 'Fiyatlandırmanızı girin' }],
  },
}

// ─── Main component ──────────────────────────────────────────────────────────

function OnboardingForm() {
  const router = useRouter()
  const params = useSearchParams()
  const urlType = params.get('type')
  const [selectedType, setSelectedType] = useState<string>(urlType ?? 'other')
  const clinicType = selectedType
  const config = CLINIC_CONFIG[clinicType] ?? CLINIC_CONFIG.other

  const [step, setStep] = useState<Step>(urlType ? 1 : 0)
  const [orgId, setOrgId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isCompleted, setIsCompleted] = useState(false)

  // ── Step 1 ──
  const [clinicName, setClinicName] = useState('')
  const [phone, setPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('TR')

  // ── Step 2 ──
  const [about, setAbout] = useState(config.defaultAbout)
  const [editingAbout, setEditingAbout] = useState(false)
  const [workingHours, setWorkingHours] = useState(config.defaultWorkingHours)
  const [editingHours, setEditingHours] = useState(false)
  const [selectedServices, setSelectedServices] = useState<string[]>(
    config.services.filter(s => s.preSelected).map(s => s.name)
  )
  const [customService, setCustomService] = useState('')

  // ── Step 3 ──
  const [selectedFaqIndices, setSelectedFaqIndices] = useState<number[]>(
    config.suggestedFaqs.map((f, i) => (f.preSelected ? i : -1)).filter(i => i >= 0)
  )
  const [customFaqs, setCustomFaqs] = useState<Array<{ q: string; a: string }>>([])
  const [newFaqQ, setNewFaqQ] = useState('')
  const [newFaqA, setNewFaqA] = useState('')
  const [pricingValues, setPricingValues] = useState<Record<string, string>>({})
  const [pricingExpanded, setPricingExpanded] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      supabase
        .from('org_users')
        .select('organization_id, organizations(id, name)')
        .eq('user_id', data.user.id)
        .order('created_at', { ascending: false })
        .maybeSingle()
        .then(({ data: ou }) => {
          if (ou) {
            const org = ou.organizations as unknown as { id: string; name: string } | null
            if (org) { setOrgId(org.id); setClinicName(org.name) }
          }
        })
    })
  }, [router])

  function handleClinicTypeSelect(type: string) {
    setSelectedType(type)
    const c = CLINIC_CONFIG[type] ?? CLINIC_CONFIG.other
    setAbout(c.defaultAbout)
    setWorkingHours(c.defaultWorkingHours)
    setSelectedServices(c.services.filter(s => s.preSelected).map(s => s.name))
    setSelectedFaqIndices(c.suggestedFaqs.map((f, i) => (f.preSelected ? i : -1)).filter(i => i >= 0))
    setPricingValues({})
    setStep(1)
  }

  // ── Step 1 submit ──
  async function handleStep1(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/onboarding/business-info', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: clinicName, phone, email: contactEmail, city, country, clinic_type: clinicType }),
      })
      if (res.ok) setStep(2)
      else { const d = await res.json(); setError(d.error || 'Hata oluştu') }
    } catch { setError('Bağlantı hatası') }
    finally { setLoading(false) }
  }

  // ── Step 2 submit ──
  async function handleStep2() {
    setLoading(true); setError('')
    try {
      const kbCalls = []

      if (about.trim()) {
        kbCalls.push(fetch('/api/knowledge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'Hakkımızda',
            data: { title: 'Hakkımızda', content: about.trim() },
            item_type: 'general',
            organization_id: orgId,
          }),
        }))
      }

      if (workingHours.trim()) {
        kbCalls.push(fetch('/api/knowledge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'Çalışma Saatleri & İletişim',
            data: { title: 'Çalışma Saatleri & İletişim', content: workingHours.trim() },
            item_type: 'general',
            organization_id: orgId,
          }),
        }))
      }

      const allServices = [
        ...selectedServices,
        ...(customService.trim() ? [customService.trim()] : []),
      ]
      for (const svc of allServices) {
        kbCalls.push(fetch('/api/knowledge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: svc,
            data: { name: svc, description: svc },
            item_type: 'service',
            organization_id: orgId,
          }),
        }))
      }

      await Promise.all(kbCalls)
      setStep(3)
    } catch { setError('Hata oluştu') }
    finally { setLoading(false) }
  }

  // ── Step 3 / complete ──
  async function handleComplete() {
    setLoading(true); setError('')
    try {
      const kbCalls = []

      // Selected FAQs
      for (const idx of selectedFaqIndices) {
        const faq = config.suggestedFaqs[idx]
        if (!faq) continue
        kbCalls.push(fetch('/api/knowledge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: faq.q,
            data: { question: faq.q, answer: faq.a },
            item_type: 'faq',
            organization_id: orgId,
          }),
        }))
      }

      // Custom FAQs
      for (const faq of customFaqs) {
        kbCalls.push(fetch('/api/knowledge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: faq.q,
            data: { question: faq.q, answer: faq.a },
            item_type: 'faq',
            organization_id: orgId,
          }),
        }))
      }

      // Pricing fields → assemble to text
      const pricingLines = config.pricingFields
        .filter(f => pricingValues[f.key]?.trim())
        .map(f => `${f.label}: ${pricingValues[f.key].trim()}`)
      if (pricingLines.length > 0) {
        const pricingText = pricingLines.join('\n') +
          (config.pricingNote ? `\n\nNot: ${config.pricingNote}` : '')
        kbCalls.push(fetch('/api/knowledge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'Fiyatlandırma',
            data: { title: 'Fiyatlandırma', content: pricingText },
            item_type: 'pricing',
            organization_id: orgId,
          }),
        }))
      }

      await Promise.all(kbCalls)

      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinic_type: clinicType }),
      })

      if (res.ok) setIsCompleted(true)
      else { const d = await res.json(); setError(d.error || 'Tamamlama hatası') }
    } catch { setError('Bağlantı hatası') }
    finally { setLoading(false) }
  }

  function toggleFaq(idx: number) {
    setSelectedFaqIndices(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    )
  }

  function toggleService(name: string) {
    setSelectedServices(prev =>
      prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]
    )
  }

  // ── Step renders ─────────────────────────────────────────────────────────

  const renderStep1 = () => (
    <form onSubmit={handleStep1} className="space-y-5">
      <FormInput
        label="Klinik Adı"
        type="text"
        icon={<Globe className="w-4 h-4" />}
        value={clinicName}
        onChange={e => setClinicName(e.target.value)}
        placeholder="Kliniğinizin adı"
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FormInput
          label="Telefon"
          type="tel"
          icon={<Phone className="w-4 h-4" />}
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="+90 212 123 4567"
          required
        />
        <FormInput
          label="İletişim E-postası"
          type="email"
          icon={<Mail className="w-4 h-4" />}
          value={contactEmail}
          onChange={e => setContactEmail(e.target.value)}
          placeholder="info@klinik.com"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FormInput
          label="Şehir"
          type="text"
          icon={<MapPin className="w-4 h-4" />}
          value={city}
          onChange={e => setCity(e.target.value)}
          placeholder="İstanbul"
        />
        <FormSelect
          label="Ülke"
          value={country}
          onChange={e => setCountry(e.target.value)}
          options={[
            { value: 'TR', label: 'Türkiye 🇹🇷' },
            { value: 'GB', label: 'İngiltere 🇬🇧' },
            { value: 'US', label: 'ABD 🇺🇸' },
            { value: 'DE', label: 'Almanya 🇩🇪' },
            { value: 'FR', label: 'Fransa 🇫🇷' },
            { value: 'OTHER', label: 'Diğer' },
          ]}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" fullWidth onClick={() => setStep(0)}
          icon={<ArrowLeft className="w-4 h-4" />}>
          Geri
        </Button>
        <Button type="submit" variant="primary" fullWidth isLoading={loading}
          icon={<ArrowRight className="w-4 h-4" />} iconPosition="right">
          Devam Et
        </Button>
      </div>
    </form>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      {/* Hakkımızda */}
      <div className="rounded-[24px] border border-slate-200/80 bg-slate-50/70 p-5">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-slate-700">Klinik Açıklaması (Hakkımızda)</label>
          <button
            type="button"
            onClick={() => setEditingAbout(e => !e)}
            className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
          >
            <Pencil className="w-3 h-3" />
            {editingAbout ? 'Tamam' : 'Düzenle'}
          </button>
        </div>
        {editingAbout ? (
          <FormTextarea
            label=""
            value={about}
            onChange={e => setAbout(e.target.value)}
            charLimit={500}
            showCharCount
          />
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 leading-relaxed">
            {about}
          </div>
        )}
        <p className="text-xs text-slate-400 mt-1.5">Hazır metin size göre oluşturuldu — beğenmezseniz düzenleyebilirsiniz</p>
      </div>

      {/* Çalışma Saatleri */}
      <div className="rounded-[24px] border border-slate-200/80 bg-slate-50/70 p-5">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-slate-700">Çalışma Saatleri</label>
          <button
            type="button"
            onClick={() => setEditingHours(e => !e)}
            className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
          >
            <Pencil className="w-3 h-3" />
            {editingHours ? 'Tamam' : 'Düzenle'}
          </button>
        </div>
        {editingHours ? (
          <FormTextarea
            label=""
            value={workingHours}
            onChange={e => setWorkingHours(e.target.value)}
            charLimit={300}
            showCharCount
          />
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 whitespace-pre-line leading-relaxed">
            {workingHours}
          </div>
        )}
      </div>

      {/* Hizmetler */}
      <div className="rounded-[24px] border border-slate-200/80 bg-slate-50/70 p-5">
        <label className="text-sm font-semibold text-slate-700 block mb-1">Sunduğunuz Hizmetler</label>
        <p className="text-xs text-slate-400 mb-3">Branşınıza özel hizmetler işaretli geldi — değiştirebilirsiniz</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {config.services.map(svc => {
            const checked = selectedServices.includes(svc.name)
            return (
              <button
                key={svc.name}
                type="button"
                onClick={() => toggleService(svc.name)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all duration-150 ${
                  checked
                    ? 'border-brand-400 bg-brand-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-colors ${
                  checked ? 'bg-brand-500 border-brand-500' : 'border-slate-300'
                }`}>
                  {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </div>
                <span className="text-sm font-medium text-slate-800">{svc.name}</span>
              </button>
            )
          })}
        </div>

        {/* Custom service */}
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={customService}
            onChange={e => setCustomService(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && customService.trim()) {
                e.preventDefault()
                if (!selectedServices.includes(customService.trim())) {
                  setSelectedServices(prev => [...prev, customService.trim()])
                }
                setCustomService('')
              }
            }}
            placeholder="Başka hizmet ekle ve Enter'a bas..."
            className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <button
            type="button"
            onClick={() => {
              if (customService.trim() && !selectedServices.includes(customService.trim())) {
                setSelectedServices(prev => [...prev, customService.trim()])
                setCustomService('')
              }
            }}
            className="px-3 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Custom services shown as removable tags */}
        {selectedServices.filter(s => !config.services.find(c => c.name === s)).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedServices
              .filter(s => !config.services.find(c => c.name === s))
              .map(s => (
                <span key={s} className="flex items-center gap-1 px-3 py-1 bg-accent-100 text-accent-700 text-xs rounded-full font-medium">
                  {s}
                  <button type="button" onClick={() => toggleService(s)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" fullWidth onClick={() => setStep(1)}
          icon={<ArrowLeft className="w-4 h-4" />}>
          Geri
        </Button>
        <Button type="button" variant="primary" fullWidth isLoading={loading}
          onClick={handleStep2}
          icon={<ArrowRight className="w-4 h-4" />} iconPosition="right">
          Devam Et
        </Button>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      {/* SSS */}
      <div className="rounded-[24px] border border-slate-200/80 bg-slate-50/70 p-5">
        <label className="text-sm font-semibold text-slate-700 block mb-1">
          Sıkça Sorulan Sorular
        </label>
        <p className="text-xs text-slate-400 mb-3">
          AI asistanınız bu sorulara hazır cevap verecek — seçmediğiniz soruları sonradan ekleyebilirsiniz
        </p>

        <div className="space-y-2">
          {config.suggestedFaqs.map((faq, idx) => {
            const checked = selectedFaqIndices.includes(idx)
            return (
              <button
                key={idx}
                type="button"
                onClick={() => toggleFaq(idx)}
                className={`w-full flex items-start gap-3 px-4 py-3.5 rounded-xl border-2 text-left transition-all duration-150 ${
                  checked
                    ? 'border-brand-400 bg-brand-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 border-2 transition-colors ${
                  checked ? 'bg-brand-500 border-brand-500' : 'border-slate-300'
                }`}>
                  {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{faq.q}</p>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{faq.a}</p>
                </div>
              </button>
            )
          })}
        </div>

        <p className="text-xs text-slate-400 mt-2">
          {selectedFaqIndices.length + customFaqs.length} / {config.suggestedFaqs.length + customFaqs.length} soru seçildi
        </p>

        {/* Custom FAQ entry */}
        <div className="mt-4 border-t border-slate-200 pt-4">
          <p className="text-xs font-semibold text-slate-600 mb-2">Kendi sorunuzu ekleyin</p>
          <div className="space-y-2">
            <input
              type="text"
              value={newFaqQ}
              onChange={e => setNewFaqQ(e.target.value)}
              placeholder="Soru (ör. Randevumu nasıl iptal ederim?)"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={newFaqA}
                onChange={e => setNewFaqA(e.target.value)}
                placeholder="Cevap"
                className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
              <button
                type="button"
                onClick={() => {
                  if (newFaqQ.trim() && newFaqA.trim()) {
                    setCustomFaqs(prev => [...prev, { q: newFaqQ.trim(), a: newFaqA.trim() }])
                    setNewFaqQ('')
                    setNewFaqA('')
                  }
                }}
                className="px-3 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          {customFaqs.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {customFaqs.map((faq, i) => (
                <div key={i} className="flex items-start gap-2 px-3 py-2 bg-brand-50 border border-brand-200 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{faq.q}</p>
                    <p className="text-xs text-slate-500 line-clamp-1">{faq.a}</p>
                  </div>
                  <button type="button" onClick={() => setCustomFaqs(prev => prev.filter((_, idx) => idx !== i))}>
                    <X className="w-3.5 h-3.5 text-slate-400 hover:text-red-500 flex-shrink-0 mt-0.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fiyatlandırma */}
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <button
          type="button"
          onClick={() => setPricingExpanded(e => !e)}
          className="w-full flex items-center justify-between px-4 py-3.5 bg-slate-50 hover:bg-slate-100 transition-colors"
        >
          <div className="text-left">
            <p className="text-sm font-semibold text-slate-700">Fiyatlandırma</p>
            <p className="text-xs text-slate-400">Opsiyonel — doldurduğunuz alanlar AI\'ya aktarılır</p>
          </div>
          {pricingExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {pricingExpanded && (
          <div className="p-4 space-y-3">
            {config.pricingFields.map(field => (
              <div key={field.key}>
                <label className="text-xs font-medium text-slate-600 block mb-1">{field.label}</label>
                <input
                  type="text"
                  value={pricingValues[field.key] ?? ''}
                  onChange={e => setPricingValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400 placeholder:text-slate-300"
                />
              </div>
            ))}
            {config.pricingNote && (
              <p className="text-xs text-slate-400 pt-1 italic">{config.pricingNote}</p>
            )}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <p className="text-sm font-semibold text-emerald-800 mb-2">Kurulum Özeti</p>
        <div className="space-y-1 text-xs text-emerald-700">
          <p>✓ Klinik adı: <strong>{clinicName}</strong></p>
          <p>✓ Hizmetler: <strong>{selectedServices.length} adet</strong></p>
          <p>✓ SSS: <strong>{selectedFaqIndices.length} soru</strong></p>
          <p>✓ Fiyat girişi: <strong>{Object.values(pricingValues).filter(v => v.trim()).length} alan</strong></p>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" fullWidth onClick={() => setStep(2)}
          icon={<ArrowLeft className="w-4 h-4" />}>
          Geri
        </Button>
        <Button type="button" variant="success" fullWidth isLoading={loading}
          onClick={handleComplete}
          icon={<CheckCircle2 className="w-4 h-4" />} iconPosition="right">
          Kurulumu Tamamla
        </Button>
      </div>
    </div>
  )

  if (isCompleted) return <OnboardingSuccess clinicName={clinicName} />

  if (step === 0) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.12),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(20,184,166,0.10),_transparent_22%),linear-gradient(180deg,_#f9fbff_0%,_#f3f6fb_100%)]">
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="mx-auto max-w-3xl px-4 py-16 md:px-6">
          <div className="text-center mb-10">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-700 sm:text-[11px]">
              <Sparkles size={12} />
              Kurulum başlıyor
            </div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Klinik Tipinizi Seçin</h1>
            <p className="text-sm text-slate-500 mt-2 max-w-lg mx-auto">
              AI asistanınız seçtiğiniz klinik tipine göre özelleştirilmiş bilgi bankası, prompt yapısı ve hizmet şablonlarıyla hazırlanacak.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CLINIC_TYPES.map(ct => (
              <button
                key={ct.key}
                type="button"
                onClick={() => handleClinicTypeSelect(ct.key)}
                className="flex items-start gap-4 p-5 rounded-2xl border-2 border-slate-200 bg-white/90 text-left transition-all duration-150 hover:border-brand-400 hover:shadow-md hover:bg-brand-50/50 backdrop-blur"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{ct.label}</p>
                  <p className="text-xs text-slate-500 mt-1">{ct.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const stepLabels = ['Bilgiler', 'Hizmetler', 'AI Kurulumu']

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.12),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(20,184,166,0.10),_transparent_22%),linear-gradient(180deg,_#f9fbff_0%,_#f3f6fb_100%)]">
      {/* Decorative blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-slate-200/50 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-5 md:px-6 md:py-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-700 sm:text-[11px]">
                <Sparkles size={12} />
                Premium onboarding studio
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-950/10 sm:h-11 sm:w-11">
                  <span className="font-bold">S</span>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">STOAIX Kurulum</p>
                  <h1 className="font-display text-xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-2xl">{config.label}</h1>
                </div>
              </div>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Bu kurulumdan sonra AI asistanınız bilgi bankası, hizmetler ve temel işletme bilgileriyle canlıya hazır hale gelir.
              </p>
            </div>

            <div className="hidden rounded-[28px] border border-slate-200/80 bg-white/85 p-4 shadow-sm backdrop-blur lg:block">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Kurulum kalitesi önemli</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Buradaki bilgiler Supabase’deki onboarding ve knowledge akışlarına yazılır. Ne kadar net girerseniz AI o kadar iyi yanıt verir.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <StepIndicator currentStep={step} totalSteps={3} steps={stepLabels} />
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="rounded-[32px] border border-slate-200/80 bg-white/92 p-6 shadow-[0_22px_55px_rgba(15,23,42,0.06)] backdrop-blur md:p-8">
          {/* Step title */}
          <div className="mb-5">
            {step === 1 && (
              <>
                <h2 className="text-xl font-bold text-slate-900">İletişim Bilgileri</h2>
                <p className="text-sm text-slate-500 mt-1">Müşterilerinizin size ulaşabileceği bilgiler</p>
              </>
            )}
            {step === 2 && (
              <>
                <h2 className="text-xl font-bold text-slate-900">Klinik Profili & Hizmetler</h2>
                <p className="text-sm text-slate-500 mt-1">Branşınıza göre hazırladık — kontrol edip devam edin</p>
              </>
            )}
            {step === 3 && (
              <>
                <h2 className="text-xl font-bold text-slate-900">AI Bilgi Bankası</h2>
                <p className="text-sm text-slate-500 mt-1">Asistanınızın kullanacağı soru-cevapları ve fiyatları onaylayın</p>
              </>
            )}
          </div>

          {/* Info banner */}
          <div className="mb-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
            <div className="rounded-xl bg-white/70 p-2 text-amber-600">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-800">Bilgilerinizin doğru olduğundan emin olun</p>
              <p className="text-xs text-amber-700 mt-0.5">
                AI asistanınız bu bilgilere dayanarak hastalara yanıt verecek. Kurulum sonrasında dilediğiniz zaman
                {' '}<span className="font-medium">Dashboard → Bilgi Bankası</span> bölümünden güncelleyebilirsiniz.
              </p>
            </div>
          </div>

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-[28px] border border-slate-200/80 bg-white/88 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)] backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Step insight</p>
              <h3 className="mt-2 text-lg font-semibold text-slate-950">
                {step === 1 && 'Temel iletişim bilgileri'}
                {step === 2 && 'Klinik profili ve hizmetler'}
                {step === 3 && 'AI bilgi bankası hazırlığı'}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {step === 1 && 'Bu bölüm telefon, e-posta ve lokasyon bilgisini Supabase onboarding akışına taşır.'}
                {step === 2 && 'Bu bölümde seçtikleriniz knowledge item olarak oluşturulacak içeriklerin temelini hazırlar.'}
                {step === 3 && 'Bu adımda seçilen SSS ve fiyatlar AI asistanının cevap kalitesini doğrudan etkiler.'}
              </p>
            </div>

            <div className="rounded-[28px] border border-emerald-100 bg-emerald-50/90 p-5 shadow-sm">
              <p className="text-sm font-semibold text-emerald-900">Neden önemli?</p>
              <p className="mt-2 text-sm leading-6 text-emerald-800">
                Bu kurulum hem onboarding completion akışına hem de Supabase knowledge tablosuna veri sağlar. Yani satış hissi ile operasyonel doğruluk burada birleşiyor.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-white">
        <p className="text-slate-500 text-sm">Yükleniyor...</p>
      </div>
    }>
      <OnboardingForm />
    </Suspense>
  )
}
