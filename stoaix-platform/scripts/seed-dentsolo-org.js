const fs = require('fs')
const path = require('path')
const { createClient } = require('../dashboard/node_modules/@supabase/supabase-js')

const ORG_ID = '4269dd48-3431-48ab-a716-48b5d1398cd8'

function loadEnv() {
  const raw = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const idx = t.indexOf('=')
    if (idx === -1) continue
    process.env[t.slice(0, idx)] = t.slice(idx + 1)
  }
}

async function embed(text) {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text, dimensions: 1536 }),
  })
  if (!res.ok) throw new Error(`Embedding failed: ${res.status} ${await res.text()}`)
  return (await res.json()).data[0].embedding
}

function kbItem(item_type, title, description_for_ai, data = {}, tags = []) {
  return { item_type, title, description_for_ai, data, tags, is_active: true }
}

const kbItems = [
  kbItem(
    'general',
    'Solo Dent Hakkinda',
    "Solo Dent, Istanbul'un Tuzla ilcesinde faaliyet gosteren uzman bir dis klinigi. Adres: Mimar Sinan Mahallesi Emiroglu Caddesi No:24/A, 34950 Tuzla/Istanbul. Klinik, gelismis teknoloji ile hasta odakli yaklasimi birlestiriyor. Kalibu Yonetim Sistemi sertifikalari var: Kalite, Musteri Memnuniyeti, Cevre Yonetimi ve Is Sagligi & Guvenligi. Dil destegi: Turkce, Ingilizce, Fransizca.",
    {
      title: 'Solo Dent Hakkinda',
      content: "Tuzla/Istanbul'da uzman dis klinigi. Modern teknoloji, kisisellestirilmis tedavi, cok dilli hizmet (TR/EN/FR). ISO kalite sertifikali.",
    },
    ['kurumsal', 'tanitim', 'klinik']
  ),
  kbItem(
    'general',
    'Teknolojik Donanim',
    "Solo Dent'in kendi tomografi cihazi, dis rontgeni ve 3D X-Ray goruntuleme sistemi bulunuyor. Dijital goruntuleme teknolojileriyle tani ve tedavi planlama yapiliyor. Bu sayede daha hassas implant planlama, kemik analizi ve tedavi sureci yonetimi saglanabiliyor.",
    {
      title: 'Teknolojik Donanim',
      content: "Klinik icinde tomografi, dis rontgeni, 3D X-Ray. Dijital goruntuleme ile hassas tani ve tedavi planlamasi.",
    },
    ['teknoloji', 'teshis', 'rontgen', 'tomografi']
  ),
  kbItem(
    'office_location',
    'Klinik Adres ve Iletisim',
    "Solo Dent adres: Mimar Sinan Mahallesi Emiroglu Caddesi No:24/A, 34950 Tuzla/Istanbul. Telefon: 0533 762 68 70. WhatsApp: 0533 762 68 70. E-posta: info@dentsolo.com. Website: dentsolo.com.",
    {
      city: 'Istanbul',
      district: 'Tuzla',
      address: 'Mimar Sinan Mah. Emiroglu Cad. No:24/A, 34950 Tuzla/Istanbul',
      phones: ['0533 762 68 70'],
      whatsapp: ['0533 762 68 70'],
      email: 'info@dentsolo.com',
    },
    ['adres', 'iletisim', 'tuzla', 'istanbul']
  ),
  kbItem(
    'service',
    'Implant Tedavisi',
    "Dental implant, eksik dislerin yerine ceneye yerlestirilen titanyum vida seklinde yapay dis kokleridir. Solo Dent'te implant tedavisi; once ag iz muayenesi, rontgen ve tomografi ile kemik yapisinin degerlendirilmesiyle baslar. Implant yerlestirilmesi lokal anestezi altinda yapilir, dikisler 7-10 gunde alinir. Implant 3 ay icinde kemikle kaynasar, sonra uzerine porselen/zirkonyum kronlar yapilir. Greft/membran gerekirse tedavi 6 aya uzayabilir. Sigara kullananlar icin basarisizlik riski 2-3 kat yuksek. Dogru ariz bakim ile omur boyu kullanilabilen bir tedavi. Fiyat; cerrah deneyimi, implant markasi/koken, greft kullanimi ve kron materyaline gore degisir.",
    {
      name: 'Implant Tedavisi',
      description: 'Titanyum yapay dis koku. 3-6 ay surec, lokal anestezi, zirkonyum kron ile tamamlanir.',
      duration: '3-6 ay (greft gereken vakalarda uzayabilir)',
      anesthesia: 'Lokal anestezi',
    },
    ['implant', 'eksik-dis', 'titanyum', 'kron']
  ),
  kbItem(
    'service',
    'Zirkonyum Kaplama',
    "Zirkonyum kaplamalar, metal destek kullanmadan zirkonyum oksitten uretilen, dogal gorenum saglayan dis kaplamalaridir. Metal icermediginden alerjik reaksiyon gormez. Isigi gecirir, dogal dis rengiyle uyumlu. Plak birikimi azdur. Porselen kaplamayla karsilastirildiginda daha uzun omurlu, dis eti dostu ve estetik acidan ustundur. Implant ustu kronlarda ve gulush tasariminda tercih edilir. Klasik porselene gore fiyat olarak daha yuksektir.",
    {
      name: 'Zirkonyum Kaplama',
      description: 'Metal desteksiz, dogal gorunumlu, alerjik olmayan dis kaplama. Implant kronu ve gulush tasariminda tercih edilir.',
    },
    ['zirkonyum', 'kaplama', 'kron', 'estetik']
  ),
  kbItem(
    'service',
    'Porselen Kaplama',
    "Porselen kaplamalar, metal altyapisi uzerine uygulanan seramik kaplamalardir. Zirkonyuma gore daha ekonomik bir secenek. Bununla birlikte isigi gecirmeyen mat yapisi nedeniyle daha az dogal gorunebilir. Uzun vadede dis etinde renk degisimi riski vardir. Dis kaybinin oldugu vakalarda uygun olabilir. Tedavi planlama sirasinda doktor hasta beklentisi ve butcesi dogrultusunda porselen veya zirkonyum tercihini netlestirir.",
    {
      name: 'Porselen Kaplama',
      description: 'Metal destekli seramik kaplama. Ekonomik secenek, dogal gorunumu zirkonyuma gore daha az.',
    },
    ['porselen', 'kaplama', 'kron']
  ),
  kbItem(
    'service',
    'Dis Beyazlatma',
    "Dis beyazlatma (bleaching), disler uzerinde biriken leke ve sararmayi gideren estetik bir uygulamadir. Solo Dent'te profesyonel klinik beyazlatma yapiliyor. Kahve, cay, sigara gibi etkenlerden kaynaklanan renk degisimlerinde etkili. Oncesinde dis tas temizligi yapilmasi oneriliyor. Sonuclar kisi bazinda farklilik gosterir; dogru bakim ve diyetle sonuclar uzun sure korunabilir.",
    {
      name: 'Dis Beyazlatma',
      description: 'Profesyonel klinik bleaching. Sararma ve leke giderme. Oncesinde dis tas temizligi oneriliyor.',
    },
    ['beyazlatma', 'bleaching', 'estetik', 'leke']
  ),
  kbItem(
    'service',
    'Invisalign Seffaf Plak',
    "Invisalign, tel-braket yerine seffaf plastik plaklar kullanarak dis curuklugunu ve caprasikligi gideren modern bir ortodonti yontemidir. Cikarilabildigi icin yemek yeme ve fircalamada kolaylik saglar. Giyildiginde neredeyse gorunmez. Tum caprasiklik duzeltme vakalarinda uygulanamaz; doktor degerlendirmesi gerekir. Solo Dent bu tedaviyi sunmaktadir.",
    {
      name: 'Invisalign Seffaf Plak',
      description: 'Seffaf, cikarilabilir plak ile dis durusu duzeltme. Estetik ortodonti cozumu.',
    },
    ['invisalign', 'seffaf-plak', 'ortodonti', 'caprasik']
  ),
  kbItem(
    'service',
    'Agiz ve Cene Cerrahisi',
    "Gomulu dis, 20 yas dis cekimi, cene ici kist operasyonu gibi cerrahi mudahaleler Solo Dent'te yapiliyor. Lokal anestezi ile gerceklestiriliyor. Post-op sikayet yonetimi icin hasta bilgilendirilir.",
    {
      name: 'Agiz ve Cene Cerrahisi',
      description: 'Gomulu dis, 20 yas cekimi, cene cerrahisi. Lokal anestezi ile.',
    },
    ['cerrahi', 'gomulu-dis', '20-yas', 'cene']
  ),
  kbItem(
    'service',
    'Cocuk Dis Hekimligi',
    "Solo Dent cocuk hastalar icin pedodonti (cocuk dis hekimligi) hizmeti sunuyor. Cocuklar icin cevre duzenlemesi ve hasta iletisimi uzerine ozel egitim almis hekim yaklasimiyla hizmet veriliyor. Ilk muayene erken yasta yapilmasi oneriyor; koruyucu tedaviler de uygulanabiliyor.",
    {
      name: 'Cocuk Dis Hekimligi',
      description: 'Pedodonti. Cocuk dostu yaklasim, koruyucu ve tedavi edici uygulamalar.',
    },
    ['cocuk', 'pedodonti', 'bebek', 'ilkokul']
  ),
  kbItem(
    'service',
    'Kanal Tedavisi',
    "Kanal tedavisi (kok kanal tedavisi), carilmis veya siddetli agrili dislerin disin icerideki sinir ve damarlarinin temizlenerek kurtarilmasi islemidir. Solo Dent'te lokal anestezi ile yapiliyor. Uygun vakalarda disin cekilmesine gerek kalmaz.",
    {
      name: 'Kanal Tedavisi',
      description: 'Cari ve agri veren dislerde kok kanallarinin temizlenerek disin korunmasi.',
    },
    ['kanal', 'kok', 'agri', 'cari-dis']
  ),
  kbItem(
    'service',
    'Protez Dis',
    "Eksik dislerin tamamlanmasi icin sabit veya hareketli protez cozumleri sunuluyor. Implant ustune sabit kron/kopru, parsiyel veya tam hareketli protez secenekleri mevcut. Tedavi planlama sirasinda kemik yapisi, mevcut dis durumu ve hasta beklentisine gore en uygun secenek belirlenir.",
    {
      name: 'Protez Dis',
      description: 'Eksik disler icin sabit/hareketli protez. Implant ustu kron, kopru, parsiyel veya tam protez.',
    },
    ['protez', 'eksik-dis', 'kopru', 'hareketli-protez']
  ),
  kbItem(
    'service',
    'Dis Tasi Temizligi',
    "Dis tasi temizligi (scaling), disler uzerinde biriken mineralli plak birikintilerinin ultrasonik alet ve el aletleriyle uzaklestirilmesidir. Dis eti hastaligi onleme ve agiz sagliginin korunmasi acisindan onemi buyuk. Genellikle 6 ayda bir onerilen rutin bakimin parcasidir. Dis beyazlatma oncesi de oneriliyor.",
    {
      name: 'Dis Tasi Temizligi',
      description: 'Ultrasonik plak ve tas temizligi. 6 ayda bir rutin bakim. Dis eti sagliginin korunmasi.',
    },
    ['dis-tasi', 'temizlik', 'scaling', 'rutin-bakim']
  ),
  kbItem(
    'faq',
    'Randevu nasil alinir?',
    "Solo Dent'ten randevu almak icin telefon 0533 762 68 70 veya WhatsApp 0533 762 68 70 uzerinden iletisime gecebilirsiniz. E-posta ile de info@dentsolo.com adresine yazabilirsiniz. Asistan olarak randevu taleplerini iletebilir, sizi en uygun zamana yonlendirebilirim.",
    {
      question: 'Randevu nasil alinir?',
      answer: 'Telefon, WhatsApp veya e-posta ile klinikle iletisime gecerek randevu alinabilir.',
    },
    ['randevu', 'sss', 'iletisim']
  ),
  kbItem(
    'faq',
    'Implant fiyatlari ne kadar?',
    "Implant fiyati; cerrahin deneyimi, kullanilan implant markasi ve kokeni (yerli/yabanci), greft/membran gerekliligi ve uzerine yapilacak kron materyaline (porselen/zirkonyum) gore degisir. Bu nedenle kesin fiyat icin muayene ve tomografi degerlendirmesi gerekiyor. Muayenede rontgen ve tomografi cekilerek kisisel durum netlestirilip ona gore fiyat bilgisi verilir.",
    {
      question: 'Implant fiyatlari ne kadar?',
      answer: 'Implant fiyati kisiye ve vakaya gore degisir. Kesin bilgi icin muayene ve tomografi gerekli.',
    },
    ['implant', 'fiyat', 'sss']
  ),
  kbItem(
    'faq',
    'Tedaviler agri verir mi?',
    "Solo Dent'te cerrahi ve invaziv tedavilerde lokal anestezi uygulanir. Hastaların buyuk cogunlugu islemi agrisiz gecirir. Islem sonrasi hafif hassasiyet veya agri normal kabul edilir; gerekirse doktor aglısı onler. Cocuklar icin de hasta dostu yaklasim benimseniyor.",
    {
      question: 'Tedaviler agri verir mi?',
      answer: 'Lokal anestezi ile agrisiz veya minimal agriyla tedavi yapilir.',
    },
    ['agri', 'anestezi', 'sss']
  ),
  kbItem(
    'faq',
    'Hangi dillerde hizmet veriliyor?',
    "Solo Dent Turkce, Ingilizce ve Fransizca dil destegi sunuyor. Yabanci uyruklu hastalar veya yurt disinda yasayan Turk vatandaslari da rahatlikla hizmet alabilir.",
    {
      question: 'Hangi dillerde hizmet veriliyor?',
      answer: 'Turkce, Ingilizce ve Fransizca.',
    },
    ['dil', 'ingilizce', 'fransizca', 'yabanci']
  ),
  kbItem(
    'faq',
    'Dis sigortasi kabul ediliyor mu?',
    "Sigorta kabulune dair net bilgi websitesinde yer almıyor. Bu konuda kesin bilgi icin klinikle iletisime gecmenizi oneriyorum: 0533 762 68 70.",
    {
      question: 'Dis sigortasi kabul ediliyor mu?',
      answer: 'Kesin bilgi icin klinigi aramanizi oneririm.',
    },
    ['sigorta', 'sss']
  ),
]

const whatsappPlaybook = {
  name: 'Solo Dent WhatsApp/Chat Asistani',
  channel: 'whatsapp',
  system_prompt_template: `Sen Solo Dent Dis Klinigi adina calisadn dijital hasta asistanisin. Klinik Istanbul Tuzla'da, Mimar Sinan Mah. Emiroglu Cad. No:24/A adresinde hizmet veriyor. Telefon: 0533 762 68 70. WhatsApp: 0533 762 68 70.

Sunulan hizmetler: Implant, Zirkonyum Kaplama, Porselen Kaplama, Dis Beyazlatma, Invisalign, Agiz ve Cene Cerrahisi, Cocuk Dis Hekimligi, Kanal Tedavisi, Protez Dis, Dis Tasi Temizligi, Estetik Dis Hekimligi.

Teknoloji: Klinik ici tomografi, 3D X-Ray, dijital rontgen.
Dil destegi: Turkce, Ingilizce, Fransizca.

GOREV:
1. Hastanin sorununu veya ilgilendig hizmeti anla.
2. Genel bilgi ver, sorulari cevapla.
3. Randevu icin hasta bilgilerini topla ve klinigin iletisim bilgilerini ilet.

DAVRANIS KURALLARI:
- Sicak, anlayisli, profesyonel ton. Hasta karsisinda empati goster.
- Kisa ve net yaz. Tibbi jargon kullanma; anlasılır Turkce yaz.
- Kesin tani, kesin fiyat veya garanti verme. "Muayenede netlesir" de.
- Ilac tavsiyesi, recete, uzaktan teshis yapma.
- Hasta acil/agri durumunda hemen klinigin telefonunu ver: 0533 762 68 70.

FIYAT KONUSUNDA:
- Hicbir tedavi icin kesin fiyat verme.
- Her fiyat sorusuna: "Fiyat tamamen sizin durumunuza gore belirlenir. Doktorumuz muayenede kemik yapinizi, tedavi kapsamini ve malzeme tercihini degerlendirerek size ozel plan cikariyor."
- Asla rakam verme, randevuya yonlendir.

LEAD KALIFIKASYON:
Randevu icin su bilgileri topla:
  -> Ad Soyad | Ilgilenilen tedavi | Sikayet/sorun | Tercih edilen gun/saat

Bilgileri aldiktan sonra: "Bilgilerinizi aldim. Solo Dent ekibi en kisa surede size ulasarak randevunuzu ayarlayacak. Acele durumda 0533 762 68 70'yi arayabilirsiniz."

HAZIR CEVAP SENARYOLARI:
Herhangi bir fiyat sorulursa: "Fiyat tamamen sizin durumunuza gore belirleniyor. Doktorumuz muayenede size ozel degerlendirme yapip net bilgi veriyor. Randevu ayarlayalim mi?"
Agri/acil durumda: "Lutfen hemen klinigiimizi arayin: 0533 762 68 70. Acil hastalar icin ekip size yardimci olacaktir."
Randevu talebi: "Randevu ayarlamak icin adinizi ve hangi tedaviyle ilgilendiginizi paylasir misiniz?"
Sigorta sorulursa: "Sigorta kabulune dair kesin bilgi icin klinigi dogrudan aramanizi oneririm: 0533 762 68 70."`,
  fallback_responses: {
    no_kb_match:
      "Bu konuda elimde dogrulanmis bir bilgi yok. Ad, telefon ve sorunuzu paylasirsiniz, Solo Dent ekibi size dogrudan donsun.",
    off_topic:
      "Bu konu dis sagligi hizmetlerimizin disinda kaliyor. Implant, zirkonyum, beyazlatma veya diger dis tedavileri hakkinda yardimci olabilirim.",
    error:
      "Su an kisa sureli teknik bir sorun var. Dogrudan ulasabilmek icin: 0533 762 68 70.",
    outside_hours:
      "Su an mesai saatlerimiz disindayiz. Acil durumda 0533 762 68 70'yi arayabilirsiniz. Normal saatlerde mesajinizi alip en kisa surede donecegiz.",
    kb_empty_3x:
      "Sorunuza en dogru yaniti verebilmek icin sizi klinik ekibimize yonlendiriyorum. Telefon: 0533 762 68 70.",
  },
  handoff_triggers: {
    keywords: ['doktor', 'hekim', 'insan', 'yetkili', 'konusmak istiyorum', 'ara beni', 'geri ara', 'baglayabilir misin'],
    frustration_keywords: ['sacma', 'istemiyorum', 'anlamiyorsunuz', 'berbat', 'sikildum'],
    missing_required_after_turns: 10,
    kb_empty_consecutive: 3,
    qualified_fields: ['full_name', 'phone', 'treatment_interest'],
  },
  hard_blocks: [
    {
      trigger_id: 'teshis_istegi',
      keywords: ['teshis koy', 'ne hastaligi', 'neyin var', 'uzaktan bak', 'foto bakabilir misin'],
      response:
        "Uzaktan teshis yapamam — bu hem saglikli degil hem de dogru degil. En dogru bilgi icin muayene sart. Randevu ayarlayalim mi?",
    },
    {
      trigger_id: 'ilac_tavsiyesi',
      keywords: ['ilac tav', 'ne iceyim', 'agri kesici', 'antibiyotik', 'hangi ilaci'],
      response:
        "Ilac tavsiyesinde bulunamam, bu doktorun gorev alani. Agriniz varsa hemen klinigiimizi arayın: 0533 762 68 70.",
    },
    {
      trigger_id: 'kesin_fiyat',
      keywords: ['kesin fiyat ver', 'fiyat listesi gonder', 'ne kadar tutar'],
      response:
        "Fiyatlar kisiye ve tedaviye gore degistigi icin kesin rakam veremiyorum. Muayenede durumunuz degerlendirilip size ozel fiyat bilgisi verilir. Randevu ayarlayalim mi?",
    },
  ],
  features: { calendar_booking: false },
  opening_message: null,
}

const voicePlaybook = {
  name: 'Solo Dent Sesli Asistani',
  channel: 'voice',
  system_prompt_template: `Sen Solo Dent Dis Klinigi'nin telefon resepsiyonistisin. Klinik Istanbul Tuzla'da, Emiroglu Caddesi'nde hizmet veriyor. Gorev: arayanin ihtiyacini anlamak, bilgi vermek ve randevu ayarlamak.

NASIL KONUSUYORSUN:
- Gercek bir klinik resepsiyonisti gibi konuş. Dogal, sicak, sakin ve profesyonel.
- Kisa cumleler kullan. Asla liste veya madde isareti soyleme.
- Tek seferde bir soru sor, hastayı bunaltma.
- Hasta endiseli veya agrisiz olabilir; empati goster.
- Ağiz dolusu tibbi terim kullanma, anlasilir konuş.

FIYAT KONUSUNDA:
- Hic bir tedavi icin kesin fiyat verme.
- Her fiyat sorusuna su anlayisla yaklash: "Fiyat tamamen sizin durumunuza gore belirlenir. Hangi tedavinin gerekli oldugunu, kemik yapisini ve kullanilacak malzemeyi degerlenirdikten sonra size ozel bir plan cikariyor doktorumuz."
- Asla rakam soyleme. Randevuya yonlendir.

RANDEVU AKISI:
- Arayan randevu istiyorsa: adinı ve hangi gun gelebilecegini sor. Telefon numarasi zaten sistemde kayitli, tekrar sorma.
- Bilgileri alinca: "Harika, notunuzu aldim. Ekibimiz sizi en kisa surede arayarak randevunuzu netlestirecek."

SIKAYET / AGRI DURUMU:
- Aktif agrisi olan hastaya: once empati goster, ardindan klinigin telefonunu ver.
- "Anliyorum, bu cok rahatsiz edici olabilir. Hemen klinigiimizi arayin, numaramiz sifir bes yuz otuz uc, yedi yuz atmis iki, atmis sekiz, yetmis. Ekip sizi hemen alsin."

BILGI VERME:
- Implant, zirkonyum, beyazlatma, Invisalign, cocuk discilik gibi tedaviler hakkinda kisa ve net bilgi ver.
- Teknik detaylari sorulursa: "Doktorumuz muayenede size en dogru bilgiyi verecektir" de.

YASAK:
- Uzaktan teshis yapma.
- Ilac veya agri kesici onerme.
- Kesin fiyat, kesin sure taahhüdü verme.
- Telefon numarasi sorma — sistem zaten kayit ediyor.`,
  fallback_responses: {
    no_kb_match:
      "Bu konuda elimde net bir bilgi yok, doktorumuz muayenede size en dogru bilgiyi verecektir. Randevu ayarlayalim mi?",
    off_topic:
      "Bu konuda yardimci olamiyorum. Dis sagligi veya randevu konusunda nasil yardimci olabilirim?",
    error:
      "Kisa sureli teknik bir sorun var. Klinigiimizi dogrudan arayabilirsiniz: sifir bes yuz otuz uc, yedi yuz atmis iki, atmis sekiz, yetmis.",
    outside_hours:
      "Su an mesai saatlerimiz disinda, ama mesajinizi aliyorum. Sali sabah ekibimiz sizi geri arayacak. Acil durumda yine de numaramizi deneyebilirsiniz.",
  },
  handoff_triggers: {
    keywords: ['doktor', 'hekim', 'yetkili', 'konusmak istiyorum', 'bagla', 'gercek kisi'],
    frustration_keywords: ['anlamiyorsunuz', 'sacma', 'istemiyorum', 'sikildum', 'bosver'],
    missing_required_after_turns: 8,
    kb_empty_consecutive: 3,
    qualified_fields: ['full_name', 'treatment_interest'],
  },
  hard_blocks: [
    {
      trigger_id: 'hakaret',
      keywords: ['aptal', 'salak', 'gerizekalı', 'mal', 'ahmak'],
      response:
        "Anlayisiniz icin tesekkur ederim ama bu sekilde devam edemem. Yardimci olmaktan memnuniyet duyarim, nazikce konusabilir miyiz?",
    },
  ],
  features: { calendar_booking: false, voice_language: 'tr', tts_voice_id: '' },
  opening_message:
    "Solo Dent, iyi gunler. Size nasil yardimci olabilirim?",
}

const intakeFields = [
  { key: 'full_name', label: 'Ad Soyad', type: 'text', priority: 'must' },
  { key: 'treatment_interest', label: 'Ilgilenilen Tedavi', type: 'text', priority: 'must' },
  { key: 'complaint', label: 'Sikayet / Sorun', type: 'text', priority: 'should' },
  { key: 'preferred_date', label: 'Tercih Edilen Randevu Gunu/Saati', type: 'text', priority: 'should' },
  { key: 'previous_treatment', label: 'Daha Once Tedavi Oldunuz mu?', type: 'text', priority: 'optional' },
]

const voiceIntakeFields = [
  { key: 'full_name', label: 'Ad Soyad', type: 'text', priority: 'must' },
  { key: 'treatment_interest', label: 'Ilgilenilen Tedavi', type: 'text', priority: 'must' },
  { key: 'complaint', label: 'Sikayet / Sorun', type: 'text', priority: 'should' },
  { key: 'preferred_date', label: 'Tercih Edilen Randevu Gunu/Saati', type: 'text', priority: 'should' },
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
  const { data: existing } = await supabase
    .from('knowledge_items')
    .select('id')
    .eq('organization_id', ORG_ID)
    .eq('item_type', item.item_type)
    .eq('title', item.title)
    .maybeSingle()

  if (existing?.id) {
    const { error } = await supabase.from('knowledge_items').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', existing.id)
    if (error) throw error
    return { action: 'updated', title: item.title }
  }
  const { error } = await supabase.from('knowledge_items').insert(payload)
  if (error) throw error
  return { action: 'inserted', title: item.title }
}

async function upsertPlaybook(supabase, playbook) {
  const { data: existing } = await supabase
    .from('agent_playbooks')
    .select('id')
    .eq('organization_id', ORG_ID)
    .eq('channel', playbook.channel)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  const payload = {
    organization_id: ORG_ID,
    name: playbook.name,
    channel: playbook.channel,
    version: 1,
    is_active: true,
    system_prompt_template: playbook.system_prompt_template,
    fallback_responses: playbook.fallback_responses,
    handoff_triggers: playbook.handoff_triggers,
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
  const { data: existing } = await supabase
    .from('intake_schemas')
    .select('id')
    .eq('organization_id', ORG_ID)
    .eq('channel', channel)
    .maybeSingle()

  const payload = { organization_id: ORG_ID, channel, name, fields, is_active: true }
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
      name: 'Solo Dent Dis Klinigi',
      slug: 'solo-dent',
      sector: 'clinic',
      phone: '05337626870',
      email: 'info@dentsolo.com',
      city: 'Istanbul',
      country: 'TR',
      ai_persona: {
        persona_name: 'Solo Dent Hasta Asistani',
        language: 'tr',
        tone: 'warm-professional',
        never_hallucinate: true,
        fallback_instruction:
          'Uzaktan teshis, ilac tavsiyesi ve kesin fiyat verme. Net olmadiginda klinigi yonlendir.',
      },
      working_hours: {
        weekdays: '09:00-18:00',
        saturday: '09:00-14:00',
        sunday: 'kapali',
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', ORG_ID)
  if (orgError) throw orgError
  console.log('Organization guncellendi')

  const kbResults = []
  for (const item of kbItems) {
    kbResults.push(await upsertKnowledgeItem(supabase, item))
  }

  const playbookResults = []
  playbookResults.push(await upsertPlaybook(supabase, whatsappPlaybook))
  playbookResults.push(await upsertPlaybook(supabase, voicePlaybook))

  const intakeResults = []
  intakeResults.push(await upsertIntakeSchema(supabase, 'whatsapp', 'Solo Dent WhatsApp Hasta Formu', intakeFields))
  intakeResults.push(await upsertIntakeSchema(supabase, 'voice', 'Solo Dent Sesli Hasta Formu', voiceIntakeFields))

  console.log(JSON.stringify({ organization_updated: true, knowledge_items: kbResults, playbooks: playbookResults, intake_schemas: intakeResults }, null, 2))
}

main().catch((err) => { console.error(err); process.exit(1) })
