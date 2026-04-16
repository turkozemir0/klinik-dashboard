const fs = require('fs')
const path = require('path')
const { createClient } = require('../dashboard/node_modules/@supabase/supabase-js')

const ORG_ID = 'f9b28ede-ff26-4951-ba94-e020140e9d8d'

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env')
  const raw = fs.readFileSync(envPath, 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.slice(0, idx)
    const value = trimmed.slice(idx + 1)
    process.env[key] = value
  }
}

async function embed(text) {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
      dimensions: 1536,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Embedding failed: ${res.status} ${body}`)
  }

  const json = await res.json()
  return json.data[0].embedding
}

function kbItem(item_type, title, description_for_ai, data = {}, tags = []) {
  return { item_type, title, description_for_ai, data, tags, is_active: true }
}

const kbItems = [
  kbItem(
    'general',
    'Hakkımızda',
    'Yapı Prefabrik, 2007 yılından beri prefabrik ev, prefabrik villa, şantiye yapıları, konteyner ve kabin çözümleri sunan bir üretici ve satış firmasıdır. Firma Türkiye geneline ve yurt dışına üretim yaptığını, kişiye özel çözümler sunduğunu ve üretim, montaj ile müşteri ilişkileri süreçlerinde profesyonel ekip ile hizmet verdiğini belirtir.',
    {
      title: 'Hakkımızda',
      content:
        "Firma 2007'den beri prefabrik sektöründe faaliyet gösterir. Prefabrik ev, villa, şantiye yapıları, konteyner ve kabin üretimi yapar. Türkiye geneline ve yurt dışına ürün gönderdiğini, kişiye özel çözümler sunduğunu belirtir.",
    },
    ['kurumsal', 'tanitim', 'prefabrik']
  ),
  kbItem(
    'general',
    'Neden Yapı Prefabrik',
    "Firmanın öne çıkardığı başlıklar çevre dostu malzemeler, hızlı teslimat, 2 yıl üretici garantisi ve ihracat tecrübesidir. Site üzerinde siparişin metrekaresine bağlı olarak 7 ile 14 gün arasında teslim edilebildiği, üretim kaynaklı sorunlarda parça temininin ücretsiz olduğu ve 20'den fazla ülkeye ihracat yapıldığı belirtilir.",
    {
      title: 'Neden Yapı Prefabrik',
      content:
        "Çevre dostu geri dönüştürülebilir malzemeler, 7-14 gün arası hızlı teslimat, 2 yıl üretici garantisi ve 20'den fazla ülkeye ihracat deneyimi vurgulanır.",
    },
    ['avantajlar', 'garanti', 'teslimat']
  ),
  kbItem(
    'general',
    'Referans ve Deneyim',
    'Yapı Prefabrik referans sayfasında çok sayıda kurumsal ve kamu müşterisi listeler. Referanslar arasında Arçelik, Coca-Cola, Danone, Enka İnşaat, Koç grubu şirketleri, Mercedes-Benz, Siemens, Tofaş, Tüpraş, TÜBİTAK, Kalyon İnşaat ve çeşitli belediyeler ile kamu kurumları yer alır. Bu kayıtlar firmanın büyük ölçekli projelerde deneyimi olduğunu gösterir.',
    {
      title: 'Referans ve Deneyim',
      content:
        'Site üzerindeki referans listesi, firmanın büyük kurumsal müşteriler ve kamu kurumlarıyla çalıştığını gösterir. Bu durum, konut dışında şantiye ve kurumsal yapılar tarafında da deneyimi olduğunu destekler.',
    },
    ['referans', 'kurumsal', 'tecrube']
  ),
  kbItem(
    'office_location',
    'Pendik Showroom ve Satış',
    'Showroom ve satış noktası İstanbul Pendik Güzelyalı Mahallesi İbrahim Hakkı Caddesi No:40 adresindedir. Ana telefon numarası 0530 732 33 24, sabit hatlar 0216 374 33 13 ve 0216 374 33 24, e-posta info@yapiprefabrik.net olarak paylaşılır.',
    {
      city: 'İstanbul',
      address: 'Güzelyalı Mah. İbrahim Hakkı Cad. No:40 Pendik / İstanbul',
      phones: ['0530 732 33 24', '0216 374 33 13', '0216 374 33 24'],
      whatsapp: ['0530 732 33 24'],
      contact_person: 'Satış ekibi',
    },
    ['iletisim', 'showroom', 'pendik']
  ),
  kbItem(
    'office_location',
    'Fabrika',
    'Firmanın fabrika adresi İstanbul Pendik Orhanlı Mevkii Akcan Mahallesi No:20 olarak belirtilir.',
    {
      city: 'İstanbul',
      address: 'Orhanlı Mevkii Akcan Mah. No:20 Pendik / İstanbul',
      phones: ['0530 732 33 24'],
      whatsapp: ['0530 732 33 24'],
      contact_person: 'Üretim ve planlama ekibi',
    },
    ['fabrika', 'uretim', 'pendik']
  ),
  kbItem(
    'office_location',
    'Sevkiyat ve Depo',
    'Sevkiyat ve depo lokasyonu İstanbul Pendik Sanayi Mahallesi Bosna Sokak 13 olarak belirtilir.',
    {
      city: 'İstanbul',
      address: 'Sanayi Mah. Bosna Sok. 13 Pendik / İstanbul',
      phones: ['0530 732 33 24'],
      whatsapp: ['0530 732 33 24'],
      contact_person: 'Lojistik ekibi',
    },
    ['depo', 'sevkiyat', 'lojistik']
  ),
  kbItem(
    'service',
    'Tek Katlı Prefabrik Evler',
    'Yapı Prefabrik tek katlı prefabrik ev çözümlerinde müşteriye göre plan ve metrekare değişikliği sunar. Site üzerinde tek katlı prefabrik evlerin güvenli, depreme dayanıklı ve bütçeye göre özelleştirilebilir olduğu vurgulanır. Bu kategoride örnek ürünler arasında 2+1 80 m2 ve 2+1 85 m2 evler bulunur.',
    {
      name: 'Tek Katlı Prefabrik Evler',
      description:
        'Tek katlı prefabrik konut çözümleri. İhtiyaca göre oda planı ve metrekare düzenlenebilir. Müşteri taleplerine göre özelleştirme yapılabildiği belirtilir.',
      duration: 'Proje ve metrekaresine göre değişir',
    },
    ['tek-katli', 'konut', 'prefabrik-ev']
  ),
  kbItem(
    'service',
    'Çift Katlı Prefabrik Evler',
    'Yapı Prefabrik çift katlı prefabrik villa ve konut çözümleri de sunar. Site üzerinde çift katlı prefabrik villalarda oda, banyo ve metrekare ölçülerinin projeye göre değişebildiği belirtilir. Bu kategori daha geniş yaşam alanı isteyen müşteriler için uygundur.',
    {
      name: 'Çift Katlı Prefabrik Evler',
      description:
        'Çift katlı prefabrik villa ve konut projeleri. Oda planı, banyo sayısı ve metrekare müşterinin ihtiyacına göre değişebilir.',
      duration: 'Proje kapsamına göre değişir',
    },
    ['cift-katli', 'villa', 'konut']
  ),
  kbItem(
    'service',
    'Şantiye ve Sosyal Tesis Yapıları',
    'Firma yalnızca konut satmaz; acil afet yapıları, prefabrik ofisler, sosyal tesisler, WC-duş üniteleri, yatakhane ve yemekhane çözümleri de sunar. Bu ürünler özellikle şantiye, kamp ve kurumsal kullanım senaryolarına uygundur.',
    {
      name: 'Şantiye ve Sosyal Tesis Yapıları',
      description:
        'Acil afet yapıları, prefabrik ofis, sosyal tesis, WC-duş, yatakhane ve yemekhane gibi kurumsal ve saha kullanımı ürünleri.',
      duration: 'Proje büyüklüğüne göre değişir',
    },
    ['santiye', 'ofis', 'sosyal-tesis', 'afet']
  ),
  kbItem(
    'service',
    'Konteyner ve Kabin Çözümleri',
    'Yapı Prefabrik konteyner yaşam alanları, kabin ve benzeri modüler ürünler de üretir. Bu çözümler hem bireysel hem de saha/operasyon ihtiyaçları için değerlendirilebilir.',
    {
      name: 'Konteyner ve Kabin Çözümleri',
      description:
        'Konteyner yaşam alanları, kabin ve modüler yapı çözümleri. Kullanım senaryosu ve ölçüye göre uyarlanabilir.',
      duration: 'Stok ve projeye göre değişir',
    },
    ['konteyner', 'kabin', 'moduler']
  ),
  kbItem(
    'pricing',
    'Örnek Konut Fiyatları',
    'Sitede görünen örnek fiyatlar bilgilendirme amaçlıdır ve proje kapsamına göre değişebilir. Ana sayfada 2+1 80 m2 prefabrik ev için 521.000 TL, 2+1 85 m2 prefabrik ev için 528.000 TL örnek fiyatları gösterilir. Kesin fiyat için müşteri ihtiyacı, kurulacak lokasyon, metrekare ve teknik kapsam netleştirilmelidir.',
    {
      service_name: 'Örnek Prefabrik Ev Fiyatları',
      price_range: '521.000 TRY - 528.000 TRY ve üzeri, projeye göre değişir',
      conditions:
        'Bunlar sitede görünen örnek fiyatlardır. Kesin teklif metrekare, plan, teslim ili, montaj ve ek taleplere göre hazırlanır.',
      includes: ['Örnek fiyatlar yalnızca bilgilendirme amaçlıdır', 'Kesin teklif için proje detayları gerekir'],
      excludes: ['Özelleştirme farkları', 'Nakliye', 'Saha hazırlığı', 'Ruhsat ve resmi süreçler'],
    },
    ['fiyat', 'ornek-fiyat', 'teklif']
  ),
  kbItem(
    'faq',
    'Teslim süresi nedir?',
    'Site üzerindeki bilgiye göre siparişin metrekaresine bağlı olarak teslim süresi yaklaşık 7 ile 14 gün arasında değişebilir. Ancak gerçek teslim tarihi proje kapsamı, yoğunluk, nakliye ve montaj planına göre satış ekibi tarafından netleştirilmelidir.',
    {
      question: 'Teslim süresi nedir?',
      answer:
        'Siteye göre metrekaresine bağlı olarak yaklaşık 7-14 gün içinde teslim yapılabilir. Kesin süre proje, üretim planı, sevkiyat ve montaj durumuna göre netleştirilir.',
    },
    ['teslimat', 'sure', 'sss']
  ),
  kbItem(
    'faq',
    'Garanti var mı?',
    'Site üzerinde tüm ürünlerin 2 yıl üretici garantisi altında olduğu belirtilir. Üretimden kaynaklı sorunlarda parça temininin ücretsiz olduğu ifade edilir.',
    {
      question: 'Garanti var mı?',
      answer:
        'Evet. Sitedeki bilgiye göre ürünler 2 yıl üretici garantisi altındadır. Üretim kaynaklı sorunlarda parça temini ücretsizdir.',
    },
    ['garanti', 'sss']
  ),
  kbItem(
    'faq',
    'Fiyata neler dahildir?',
    'Örnek ürün sayfalarındaki listelere göre paket kapsamında prefabrik bina elemanları, duvar panelleri, çelik birleşim elemanları, tavan kaplaması, tavan yalıtımı, çatı kaplaması, iç ve dış kapılar, PVC pencereler, sıva altı elektrik ve su tesisatı, elektrik armatürü montajı, iç ve dış boya uygulamaları ile duş teknesi, klozet, lavabo ve bataryaların paket halinde teslimi yer alabilir. Dahil kalemler model ve sözleşmeye göre teyit edilmelidir.',
    {
      question: 'Fiyata neler dahildir?',
      answer:
        'Örnek ürün sayfalarında prefabrik bina elemanları, çatı ve tavan sistemi, kapılar, PVC pencereler, sıva altı elektrik-su tesisatı, boya işleri ve bazı vitrifiye ürünlerinin paket kapsamında olabileceği görülür. Kesin kapsam teklif ve sözleşmede netleştirilir.',
    },
    ['fiyata-dahil', 'paket', 'sss']
  ),
  kbItem(
    'faq',
    'Fiyata neler dahil değildir?',
    'Örnek ürün sayfalarına göre zemin betonu ve hafriyat, nakliye ve nakliye sigortası, iskele ve vinç ihtiyacı, zemin ve duvar kaplamaları, resmi izinler, telefon-bilgisayar-UPS tesisatları, bina harici dış bağlantılar ve sayaç işlemleri, ısıtma-soğutma tesisatları, mutfak ve banyo dolapları, İstanbul dışı montajlarda ekibin konaklama ve yemek ihtiyacı ile şantiyedeki elektrik ve güvenlik ihtiyaçları fiyat dışı kalemler arasında olabilir. Kesin ayrım teklif aşamasında teyit edilmelidir.',
    {
      question: 'Fiyata neler dahil değildir?',
      answer:
        'Zemin betonu, hafriyat, nakliye, saha hazırlığı, resmi izinler, dış bağlantılar, ısıtma-soğutma, dolap işleri ve bazı lojistik giderler genellikle fiyat dışı kalemlerdir. Kesin liste teklif dosyasında netleştirilir.',
    },
    ['fiyata-dahil-degil', 'nakliye', 'ruhsat', 'sss']
  ),
  kbItem(
    'faq',
    'Teklif alabilmek için hangi bilgiler gerekir?',
    'Kesin teklif hazırlayabilmek için müşteriden en az ürün tipi, yaklaşık metrekare, tek katlı mı çift katlı mı olduğu, kullanım amacı, kurulacak il veya ilçe, arsanın hazır olup olmadığı, hedef teslim zamanı ve yaklaşık bütçe bilgileri alınmalıdır. Müşteri sadece genel bilgi istiyorsa önce örnek modeller ve fiyat aralığı paylaşılabilir, ardından detaylar istenmelidir.',
    {
      question: 'Teklif alabilmek için hangi bilgiler gerekir?',
      answer:
        'Genelde ürün tipi, metrekare, kat sayısı, kullanım amacı, kurulacak şehir, arsa durumu, teslim zamanı ve bütçe bilgisi alınır. Bu bilgilerle ekip daha net teklif hazırlar.',
    },
    ['teklif', 'lead-qualification', 'sss']
  ),
]

const whatsappPlaybook = {
  name: 'Yapı Prefabrik WhatsApp/Chat Asistanı v2',
  channel: 'whatsapp',
  system_prompt_template: `Sen Yapı Prefabrik'in dijital satış asistanısın. Şirket 2007'den beri prefabrik ev, villa, konteyner, kabin, şantiye yapıları ve sosyal tesisler üretiyor. 3.500'den fazla müşteriye 8.500'den fazla yapı teslim edildi. İstanbul Pendik merkezli, 20'den fazla ülkeye ihracat yapılan bir üretim firması.

━━━ GÖREV ━━━
1. Gelen müşterilere ürün ve hizmetler hakkında doğru, net, kısa bilgi vermek.
2. İhtiyaç analizi yaparak nitelikli lead toplamak (baskıcı olmadan).
3. Satış ekibine yönlendirme için gerekli proje detaylarını toplamak.

━━━ ÜRÜN KATEGORİLERİ ━━━
• Konut: Tek katlı prefabrik ev | Çift katlı prefabrik villa
• Kurumsal/Saha: Şantiye yapıları | Prefabrik ofis | Yatakhane | Yemekhane | WC-Duş üniteleri | Acil/Afet yapıları
• Modüler: Konteyner yaşam alanı | Kabin

━━━ DAVRANIF KURALLARI ━━━
- Türkçe yaz. Ton: sıcak, profesyonel, net ve satış odaklı.
- Yanıtları kısa tut — 3-5 cümle veya kısa maddeler yeterli.
- Tek seferde en fazla 2 soru sor.
- Bilgi tabanında net karşılığı olmayan teknik/hukuki konularda kesin hüküm verme; satış/uzman ekibin netleştireceğini belirt.
- Fiyatları her zaman "örnek / yaklaşık" olarak konumlandır; kesin teklif için proje detayları istenmeli.
- Ruhsat, inşaat izni, statik/zemin hesabı, yasal süreçler, saha keşfi hakkında hiçbir zaman taahhüt verme.
- Müşteri sadece bilgi istiyorsa yardımcı ol; zorla satış yapma.

━━━ LEAD KALİFİKASYON AKIŞI ━━━
Konut müşterisi için topla:
  → İsim | Yapı tipi (tek/çift kat) | Yaklaşık m2 | Kullanım amacı | Kurulacak şehir/ilçe | Arsa hazır mı? | Hedef teslim tarihi | Bütçe aralığı

Kurumsal/şantiye müşterisi için topla:
  → Şirket/proje adı | Yapı tipi ve adet | Kullanım amacı ve süresi | Teslim lokasyonu | Zaman planı | Bütçe

Bilgileri topladıktan sonra: "Notunuzu aldım. Yapı Prefabrik satış ekibi en kısa sürede size detaylı teklif ile dönüş yapacak."

━━━ HAZIR CEVAP SENARYOLARI ━━━
Fiyat sorulursa → "Sitemizdeki örnek fiyatlar 2+1 80 m² için yaklaşık 521.000 TL, 85 m² için 528.000 TL'den başlıyor. Bu fiyatlar projeye göre değişir; kesin teklif için birkaç kısa bilgi almam gerekiyor."
Teslim süresi sorulursa → "Projenin büyüklüğüne göre genellikle 7-14 gün içinde teslim sağlanabiliyor. Kesin süre proje planlamasına göre netleşir."
Garanti sorulursa → "Tüm yapılarımız 2 yıl üretici garantisi kapsamında. Üretim kaynaklı sorunlarda parça temini ücretsiz."
İhracat/yurt dışı sorulursa → "Evet, 20'den fazla ülkeye ihracat tecrübemiz var. Yurt dışı projeler için ekibimiz sizi bilgilendirir."
Referans sorulursa → "Arçelik, Coca-Cola, Danone, Enka İnşaat, Mercedes-Benz, TÜBİTAK ve pek çok belediye ile çalıştık."

━━━ YANIT TARZI ━━━
- Uygun olduğunda aksiyon cümlesi ekle: "Birlikte projenizi netleştirelim mi?"
- Müşteri karar aşamasına geldiyse: "Satış ekibimizin sizi aramasını ister misiniz?"`,
  fallback_responses: {
    no_kb_match:
      'Bu konuda elimde doğrulanmış bir bilgi yok. Ad ve telefon numaranızı paylaşırsanız Yapı Prefabrik satış ekibi size net bilgi ile dönüş yapar.',
    off_topic:
      'Bu konu Yapı Prefabrik hizmet alanının dışında kalıyor. Prefabrik ev, villa, konteyner veya şantiye yapıları konusunda nasıl yardımcı olabilirim?',
    error:
      'Şu an kısa süreli bir teknik sorun yaşıyorum. Bilgilerinizi bırakırsanız ekibimiz en kısa sürede size dönüş sağlar.',
    outside_hours:
      'Şu an mesai saatlerimiz dışındayız. Mesai saatlerimiz hafta içi ve Cumartesi 08:00-18:00, Pazar 11:00-16:00. Bilgilerinizi bırakırsanız sabah ilk iş sizi arayalım.',
    kb_empty_3x:
      'Sorunuza en doğru yanıtı verebilmek için sizi uzman satış ekibimize yönlendiriyorum. Telefon numaranızı paylaşır mısınız?',
  },
  handoff_triggers: {
    keywords: ['insan', 'yetkili', 'müdür', 'satış', 'uzman', 'bağla', 'konuşmak istiyorum', 'ara beni', 'geri ara'],
    frustration_keywords: ['saçma', 'anlayamıyorsunuz', 'işe yaramıyor', 'berbat', 'çok uzun', 'olmadı'],
    missing_required_after_turns: 12,
    kb_empty_consecutive: 3,
    qualified_fields: ['full_name', 'project_type', 'installation_city'],
  },
  hard_blocks: [
    {
      trigger_id: 'rakip_fiyat',
      keywords: ['rakip', 'başka firma', 'diğer firma daha ucuz', 'öteki şirket'],
      response:
        'Rakip firmalar hakkında yorum yapamam. Yapı Prefabrik\'in sunduğu değer; 17 yıllık deneyim, 2 yıl garanti ve 8.500+ tamamlanmış proje. Sizin için teklifimizi hazırlayalım mı?',
    },
    {
      trigger_id: 'hukuki_sozlesme',
      keywords: ['sözleşme garantisi', 'hukuki taahhüt', 'avukat', 'dava', 'mahkeme'],
      response:
        'Hukuki süreçler ve sözleşme detayları için firmanın resmi kanalları üzerinden iletişime geçmenizi öneririm. Size satış ekibini bağlayabilirim.',
    },
    {
      trigger_id: 'ruhsat_izin',
      keywords: ['ruhsat alır mısınız', 'izin alır mısınız', 'belediye izni', 'imar durumu'],
      response:
        'Ruhsat ve resmi izin süreçleri lokasyona ve mevzuata göre değişir; bu konuda kesin bilgi satış ekibimiz tarafından verilir. Şehir ve proje bilginizi alabilir miyim?',
    },
  ],
  features: { calendar_booking: false },
  opening_message: null,
}

const voicePlaybook = {
  name: 'Yapı Prefabrik Sesli Asistanı v2',
  channel: 'voice',
  system_prompt_template: `Sen Yapı Prefabrik'in telefon satış asistanısın. Şirket 2007'den beri prefabrik ev, villa, konteyner, kabin ve şantiye yapıları üretiyor. 3.500'den fazla müşteri, 17 yıllık deneyim.

KONUŞMA KURALLARI:
- Kısa, doğal, konuşma diline yakın cümleler kur. Yazı dili kullanma.
- Liste veya madde işareti kullanma — bunlar sesli iletişimde okunmaz.
- Tek seferde yalnızca bir soru sor.
- Müşteriyi asla acele ettirme. Sessiz kaldığında tekrar sormaktan çekinme.
- Bilgi tabanında olmayan hiçbir teknik veya hukuki detayı uydurma.
- Fiyatlardan bahsederken "yaklaşık" ve "örnek" kelimelerini kullan.

KONUŞMA AKIŞI:
1. Açılış yaptıktan sonra müşterinin ne tür yapıya ihtiyaç duyduğunu sor.
2. Konut mu şantiye/kurumsal mı olduğunu netleştir.
3. Sırasıyla şunları öğren: yapı tipi → yaklaşık büyüklük → kurulacak şehir → zaman planı → bütçe → isim ve telefon.
4. Bilgileri aldıktan sonra: "Notunuzu aldım. Yapı Prefabrik satış ekibi size en kısa sürede dönüş yapacak."

HAZIR CEVAPLAR:
Fiyat sorulursa: "Sitede iki katlı olmayan 80 metrekare için yaklaşık beş yüz yirmi bir bin, 85 metrekare için beş yüz yirmi sekiz bin lira örnek fiyat yer alıyor. Ama kesin rakam projeye göre değişiyor."
Teslim süresi: "Projenin büyüklüğüne göre genellikle yedi ila on dört gün içinde teslim yapılabiliyor."
Garanti: "Tüm yapılarımızda iki yıl üretici garantisi var."
İhracat: "Yirmi'den fazla ülkeye ihracat tecrübemiz var."
Ruhsat/izin: "Bu konuda kesin bilgiyi satış uzmanlarımız proje detayına göre size verecek."

KRITIK KURALLAR:
- Ruhsat, statik hesap, imar durumu, sözleşme taahhüdü hakkında kesin söz verme.
- Müşteri sinirlenirse ya da insan talep ederse: "Anladım, hemen satış ekibimizden biri sizi arasın. Telefon numaranızı teyit edebilir miyiz?"
- Konu tamamen dışarıya çıkarsa nazikçe prefabrik yapılara geri yönlendir.`,
  fallback_responses: {
    no_kb_match:
      'Bu konuda elimde net bir bilgi yok. Adınızı ve numaranızı alayım, Yapı Prefabrik ekibi size doğru bilgiyle dönüş yapsın.',
    off_topic:
      'Bu konuda yardımcı olmam zor. Prefabrik ev, villa ya da şantiye yapıları hakkında bir sorunuz varsa sevinerek cevaplayabilirim.',
    error:
      'Kısa süreli bir teknik sorun var. Bilgilerinizi alıp ekibimize iletebilirim, en kısa sürede dönerler.',
    outside_hours:
      'Şu an mesai saatlerimiz dışındayız. Hafta içi ve Cumartesi sekizden altıya, Pazar on birden dörde kadar hizmet veriyoruz. Bilgilerinizi alayım, sabah ilk iş sizi arayalım.',
  },
  handoff_triggers: {
    keywords: ['insan', 'yetkili', 'müdür', 'satışçı', 'sizi bağla', 'ara beni', 'gerçek kişi'],
    frustration_keywords: ['anlamıyorsunuz', 'saçma', 'işe yaramıyor', 'boşver', 'sıktı'],
    missing_required_after_turns: 10,
    kb_empty_consecutive: 3,
    qualified_fields: ['full_name', 'project_type', 'installation_city'],
  },
  hard_blocks: [
    {
      trigger_id: 'hakaret',
      keywords: ['aptal', 'salak', 'gerizekalı', 'mal', 'ahmak'],
      response:
        'Anlayışınız için teşekkür ederim ama bu şekilde devam edemem. Yardımcı olmaktan memnuniyet duyarım, nazik bir şekilde konuşabilir miyiz?',
    },
  ],
  features: { calendar_booking: false, voice_language: 'tr', tts_voice_id: '' },
  opening_message:
    'Merhaba, Yapı Prefabrik\'e hoş geldiniz. Ben dijital satış asistanınızım. Prefabrik ev, villa, konteyner veya şantiye yapılarından hangisi hakkında bilgi almak istersiniz?',
}

const intakeFields = [
  { key: 'full_name', label: 'Ad Soyad', type: 'text', priority: 'must' },
  { key: 'project_type', label: 'İlgilendiği Yapı Tipi', type: 'text', priority: 'must' },
  { key: 'estimated_m2', label: 'Yaklaşık Metrekare', type: 'text', priority: 'must' },
  { key: 'floor_count', label: 'Kat Sayısı', type: 'text', priority: 'should' },
  { key: 'usage_purpose', label: 'Kullanım Amacı', type: 'text', priority: 'should' },
  { key: 'installation_city', label: 'Kurulum Yapılacak Şehir', type: 'text', priority: 'must' },
  { key: 'land_status', label: 'Arsa Durumu Hazır mı?', type: 'text', priority: 'should' },
  { key: 'timeline', label: 'Hedef Teslim/Zaman Planı', type: 'text', priority: 'should' },
  { key: 'budget_range', label: 'Bütçe Aralığı', type: 'text', priority: 'should' },
]

async function upsertKnowledgeItem(supabase, item) {
  const textToEmbed = `${item.title}\n\n${item.description_for_ai}`
  const embedding = await embed(textToEmbed)

  const payload = {
    organization_id: ORG_ID,
    item_type: item.item_type,
    title: item.title,
    description_for_ai: item.description_for_ai,
    data: item.data,
    tags: item.tags,
    is_active: true,
    embedding,
  }

  const { data: existing, error: findError } = await supabase
    .from('knowledge_items')
    .select('id')
    .eq('organization_id', ORG_ID)
    .eq('item_type', item.item_type)
    .eq('title', item.title)
    .maybeSingle()

  if (findError) throw findError

  if (existing?.id) {
    const { error } = await supabase
      .from('knowledge_items')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
    if (error) throw error
    return { action: 'updated', title: item.title }
  }

  const { error } = await supabase.from('knowledge_items').insert(payload)
  if (error) throw error
  return { action: 'inserted', title: item.title }
}

async function upsertPlaybook(supabase, playbook) {
  const { data: existing, error: findError } = await supabase
    .from('agent_playbooks')
    .select('id')
    .eq('organization_id', ORG_ID)
    .eq('channel', playbook.channel)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (findError) throw findError

  const payload = {
    organization_id: ORG_ID,
    name: playbook.name,
    channel: playbook.channel,
    version: 1,
    is_active: true,
    system_prompt_template: playbook.system_prompt_template,
    fallback_responses: playbook.fallback_responses,
    hard_blocks: playbook.hard_blocks,
    features: playbook.features,
    opening_message: playbook.opening_message,
    updated_at: new Date().toISOString(),
  }

  if (existing?.id) {
    const { error } = await supabase.from('agent_playbooks').update(payload).eq('id', existing.id)
    if (error) throw error
    return { action: 'updated', channel: playbook.channel }
  }

  const { error } = await supabase.from('agent_playbooks').insert(payload)
  if (error) throw error
  return { action: 'inserted', channel: playbook.channel }
}

async function upsertIntakeSchema(supabase, channel, name, fields) {
  const { data: existing, error: findError } = await supabase
    .from('intake_schemas')
    .select('id')
    .eq('organization_id', ORG_ID)
    .eq('channel', channel)
    .maybeSingle()

  if (findError) throw findError

  const payload = {
    organization_id: ORG_ID,
    channel,
    name,
    fields,
    is_active: true,
  }

  if (existing?.id) {
    const { error } = await supabase.from('intake_schemas').update(payload).eq('id', existing.id)
    if (error) throw error
    return { action: 'updated', channel }
  }

  const { error } = await supabase.from('intake_schemas').insert(payload)
  if (error) throw error
  return { action: 'inserted', channel }
}

async function main() {
  loadEnv()

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

  const { error: orgError } = await supabase
    .from('organizations')
    .update({
      name: 'Yapı Prefabrik',
      slug: 'yapi-prefabrik',
      sector: 'other',
      phone: '05307323324',
      email: 'info@yapiprefabrik.net',
      city: 'İstanbul',
      country: 'TR',
      ai_persona: {
        persona_name: 'Yapı Prefabrik Satış Asistanı',
        language: 'tr',
        tone: 'warm-professional',
        never_hallucinate: true,
        fallback_instruction:
          'Bilgi tabanında kesin olarak bulunmayan hiçbir bilgiyi uydurma. Net olmayan konularda satış ekibinin teyidi gerektiğini belirt.',
        fallback_responses: {
          no_kb_match:
            'Bu konuda elimde net bilgi yok. Bilgilerinizi alırsam Yapı Prefabrik ekibi size net dönüş yapabilir.',
          off_topic:
            'Bu konu Yapı Prefabrik hizmet alanının dışında kalıyor. Prefabrik yapılar konusunda yardımcı olabilirim.',
          kb_empty_3x:
            'En doğru bilgiyi paylaşabilmek için sizi satış ekibimize yönlendirelim.',
        },
      },
      working_hours: {
        weekdays: '08:00-18:00',
        saturday: '08:00-18:00',
        sunday: '11:00-16:00',
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', ORG_ID)

  if (orgError) throw orgError

  const kbResults = []
  for (const item of kbItems) {
    kbResults.push(await upsertKnowledgeItem(supabase, item))
  }

  const playbookResults = []
  playbookResults.push(await upsertPlaybook(supabase, whatsappPlaybook))
  playbookResults.push(await upsertPlaybook(supabase, voicePlaybook))

  const intakeResults = []
  intakeResults.push(await upsertIntakeSchema(supabase, 'whatsapp', 'Yapı Prefabrik WhatsApp Başvuru Formu', intakeFields))
  intakeResults.push(await upsertIntakeSchema(supabase, 'voice', 'Yapı Prefabrik Sesli Başvuru Formu', intakeFields))

  console.log(
    JSON.stringify(
      {
        organization_updated: true,
        knowledge_items: kbResults,
        playbooks: playbookResults,
        intake_schemas: intakeResults,
      },
      null,
      2
    )
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
