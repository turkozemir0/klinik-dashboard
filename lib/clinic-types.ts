export const CLINIC_TYPES = [
  { key: 'estetik',    label: 'Estetik Cerrahi',  emoji: '✨', color: 'border-pink-200 bg-pink-50 text-pink-700 hover:bg-pink-100' },
  { key: 'dis',        label: 'Diş Kliniği',       emoji: '🦷', color: 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100' },
  { key: 'sac',        label: 'Saç Kliniği',       emoji: '💇', color: 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100' },
  { key: 'lazer',      label: 'Lazer & Güzellik',  emoji: '💎', color: 'border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100' },
  { key: 'goz',        label: 'Göz Kliniği',       emoji: '👁️', color: 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100' },
  { key: 'ortopedi',   label: 'Ortopedi',           emoji: '🦴', color: 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100' },
  { key: 'dermato',    label: 'Dermatoloji',        emoji: '🌿', color: 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100' },
  { key: 'diyetisyen', label: 'Diyet & Beslenme',  emoji: '🥗', color: 'border-lime-200 bg-lime-50 text-lime-700 hover:bg-lime-100' },
  { key: 'psikoloji',  label: 'Psikoloji',          emoji: '🧠', color: 'border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100' },
  { key: 'diger',      label: 'Diğer',             emoji: '🏥', color: 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100' },
] as const;

// ─── HİZMET ŞABLONLARI (klinik tipine göre) ──────────────────────────────────

export const CLINIC_SERVICE_TEMPLATES: Record<string, any[]> = {

  estetik: [
    { display_name: 'Burun Estetiği (Rinoplasti)', service_key: 'rhinoplasty', category: 'Yüz Estetiği',
      description_for_ai: 'Burun estetiği, burnun şeklini, boyutunu ve oranını düzelten bir operasyondur. Hem estetik hem de fonksiyonel (nefes) sorunları çözebilir. Açık veya kapalı teknikle uygulanır.',
      procedure_duration: '2-3 saat', anesthesia_type: 'Genel anestezi', recovery_time: '1-2 hafta iş yaşamına dönüş, şişlik 3-6 ay', final_result_time: '6-12 ay',
      pricing_response: 'Burun estetiği fiyatları yapılan müdahaleye ve tekniğe göre değişir. Detaylı fiyat için ücretsiz ön görüşmemize davet ediyoruz.' },

    { display_name: 'Göz Kapağı Estetiği (Blefaroplasti)', service_key: 'blepharoplasty', category: 'Yüz Estetiği',
      description_for_ai: 'Göz kapağı estetiği, üst ve/veya alt göz kapaklarındaki sarkma, şişkinlik ve torbalanmaları düzelterek daha dinç ve genç bir görünüm sağlar.',
      procedure_duration: '1-2 saat', anesthesia_type: 'Lokal anestezi veya sedasyon', recovery_time: '7-10 gün', final_result_time: '2-3 ay',
      pricing_response: 'Üst kapak, alt kapak veya her ikisi için farklı fiyatlandırma yapılır. Muayene sonrası detaylı bilgi verilir.' },

    { display_name: 'Yüz Germe (Ritidektomi)', service_key: 'facelift', category: 'Yüz Estetiği',
      description_for_ai: 'Yüz germe operasyonu, yüz ve boyun bölgesindeki sarkmalar ile kırışıklıkları gidererek doğal ve dinç bir görünüm sağlar. Mini veya tam yüz germe olarak uygulanabilir.',
      procedure_duration: '3-5 saat', anesthesia_type: 'Genel anestezi', recovery_time: '2-4 hafta', final_result_time: '3-6 ay',
      pricing_response: 'Yüz germe fiyatı, müdahale kapsamına göre değişir. Detaylı bilgi için randevu alabilirsiniz.' },

    { display_name: 'Alın Germe (Brow Lift)', service_key: 'brow_lift', category: 'Yüz Estetiği',
      description_for_ai: 'Alın germe, kaşların düşmesini ve alın kırışıklıklarını düzelterek daha genç ve dinç bir ifade kazandırır.',
      procedure_duration: '1-2 saat', anesthesia_type: 'Genel veya lokal anestezi', recovery_time: '1-2 hafta', final_result_time: '3-6 ay',
      pricing_response: 'Endoskopik veya klasik tekniğe göre fiyat değişir, muayenede bilgilendirme yapılır.' },

    { display_name: 'Kulak Estetiği (Otoplasti)', service_key: 'otoplasty', category: 'Yüz Estetiği',
      description_for_ai: 'Kepçe kulak gibi şekil bozukluklarını düzelten, kulağı başa yaklaştıran estetik operasyondur. Çocuklarda ve yetişkinlerde uygulanabilir.',
      procedure_duration: '1-2 saat', anesthesia_type: 'Lokal veya genel anestezi', recovery_time: '1 hafta', final_result_time: '1-2 ay',
      pricing_response: 'Tek veya çift kulak seçimine göre fiyat belirlenir.' },

    { display_name: 'Çene & Yanak İmplantı', service_key: 'facial_implant', category: 'Yüz Estetiği',
      description_for_ai: 'Çene ucu veya yanak bölgesine silikon implant yerleştirilerek yüz hatları güçlendirilir ve orantılı bir görünüm elde edilir.',
      procedure_duration: '1-2 saat', anesthesia_type: 'Genel anestezi', recovery_time: '1-2 hafta', final_result_time: '2-3 ay',
      pricing_response: 'Bölge ve implant tipine göre fiyatlandırılır.' },

    { display_name: 'Meme Büyütme (Augmentasyon)', service_key: 'breast_augmentation', category: 'Vücut Estetiği',
      description_for_ai: 'Meme büyütme operasyonu, silikon protez kullanılarak meme hacminin artırılması ve şekillendirilmesi işlemidir. Farklı boyut ve profillerde protez seçeneği mevcuttur.',
      procedure_duration: '1.5-2.5 saat', anesthesia_type: 'Genel anestezi', recovery_time: '1 hafta iş yaşamına dönüş', final_result_time: '3-6 ay',
      pricing_response: 'Fiyat tercih edilen protez markası ve boyutuna göre değişir. Muayenede size özel fiyat sunulur.' },

    { display_name: 'Meme Küçültme (Redüksiyon)', service_key: 'breast_reduction', category: 'Vücut Estetiği',
      description_for_ai: 'Büyük meme dokusunu küçülterek hem estetik hem de fonksiyonel (bel/boyun ağrısı, postür) sorunları çözen operasyondur.',
      procedure_duration: '2-4 saat', anesthesia_type: 'Genel anestezi', recovery_time: '1-2 hafta', final_result_time: '6-12 ay',
      pricing_response: 'Küçültme miktarına göre fiyat belirlenir, muayene sonrası bilgilendirilirsiniz.' },

    { display_name: 'Meme Dikleştirme (Mastopeksi)', service_key: 'mastopexy', category: 'Vücut Estetiği',
      description_for_ai: 'Sarkık meme dokusunu kaldırarak doğal ve genç bir görünüm kazandırır. İstenirse implant ile kombine edilebilir.',
      procedure_duration: '2-3 saat', anesthesia_type: 'Genel anestezi', recovery_time: '1-2 hafta', final_result_time: '6-12 ay',
      pricing_response: 'Tek başına veya implant ile kombine seçeneğe göre fiyat değişir.' },

    { display_name: 'Liposuction (Yağ Aldırma)', service_key: 'liposuction', category: 'Vücut Estetiği',
      description_for_ai: 'Liposuction, diyetle erimeyen bölgesel yağ birikintilerini vakumla uzaklaştırarak vücut konturunu iyileştirir. Karın, bacak, kalça, kol gibi birçok bölgeye uygulanabilir.',
      procedure_duration: '1-3 saat', anesthesia_type: 'Genel veya lokal anestezi', recovery_time: '3-7 gün', final_result_time: '3-6 ay',
      pricing_response: 'Fiyat tedavi edilecek bölge sayısına ve hacmine göre değişir.' },

    { display_name: 'Karın Germe (Abdominoplasti)', service_key: 'abdominoplasty', category: 'Vücut Estetiği',
      description_for_ai: 'Karın germe, doğum veya kilo değişikliği sonrası oluşan deri sarkmasını ve gevşek kasları düzelterek düz bir karın profili oluşturur.',
      procedure_duration: '2-4 saat', anesthesia_type: 'Genel anestezi', recovery_time: '2-3 hafta', final_result_time: '6-12 ay',
      pricing_response: 'Mini veya tam abdominoplasti seçimine göre fiyatlandırma yapılır.' },

    { display_name: 'Kol Germe (Brachioplasti)', service_key: 'brachioplasty', category: 'Vücut Estetiği',
      description_for_ai: 'Kol iç bölgesindeki sarkmayı düzelten, daha sıkı ve şekilli kollar elde edilmesini sağlayan operasyondur.',
      procedure_duration: '1-2 saat', anesthesia_type: 'Genel anestezi', recovery_time: '1 hafta', final_result_time: '3-6 ay',
      pricing_response: 'Muayene sonrası kişiye özel fiyat belirlenir.' },

    { display_name: 'Bacak Estetiği (Uyluk Germe)', service_key: 'thigh_lift', category: 'Vücut Estetiği',
      description_for_ai: 'Uyluk iç ve dış bölgesindeki sarkma ve fazla deriyi uzaklaştırarak bacak görünümünü iyileştirir.',
      procedure_duration: '2-3 saat', anesthesia_type: 'Genel anestezi', recovery_time: '1-2 hafta', final_result_time: '6 ay',
      pricing_response: 'İç veya dış uyluk tercihine göre fiyat değişir.' },

    { display_name: 'Vajinal Estetik (Labioplasti)', service_key: 'labiaplasty', category: 'Jinekolojik Estetik',
      description_for_ai: 'Labia minora veya majoranın şekillendirilmesi veya küçültülmesi işlemidir. Hem estetik hem fonksiyonel şikayetlerde uygulanabilir.',
      procedure_duration: '1-2 saat', anesthesia_type: 'Lokal veya genel anestezi', recovery_time: '1-2 hafta', final_result_time: '2-3 ay',
      pricing_response: 'Muayene sonrası kişiye özel fiyatlandırma yapılır.' },
  ],

  dis: [
    { display_name: 'Diş İmplantı', service_key: 'implant', category: 'Cerrahi',
      description_for_ai: 'Eksik dişlerin yerine titanyum vida ve üzerine porselen veya zirkonyum protez yerleştirme işlemidir. Doğal diş görünümü ve fonksiyonu sağlar.',
      procedure_duration: 'Vida: 30-60 dk, Protez: 2-3 ay sonra', anesthesia_type: 'Lokal anestezi', recovery_time: '3-6 ay osseointegrasyon', final_result_time: '6-9 ay',
      pricing_response: 'İmplant marka ve sayısına göre fiyat değişir. Muayene sonrası detaylı plan ve fiyat sunulur.' },

    { display_name: 'Laminate Veneer (Porselen Kaplama)', service_key: 'veneer', category: 'Kozmetik Diş',
      description_for_ai: 'Dişlerin ön yüzüne uygulanan ince porselen kaplamalar. Renk, şekil ve boyut problemlerini çözer. Minimal diş aşındırması gerektirir.',
      procedure_duration: '2 seans (7-10 gün arayla)', anesthesia_type: 'Lokal anestezi', recovery_time: 'Yok', final_result_time: 'Hemen',
      pricing_response: 'Diş başına fiyatlandırılır. Tam gülüş tasarımı için paket fiyatı oluşturulur.' },

    { display_name: 'Zirkonyum Kaplama', service_key: 'zirconia', category: 'Protetik Diş',
      description_for_ai: 'Metal desteksiz, ışık geçirgenliği yüksek, doğal görünümlü diş kaplamaları. Ön ve arka dişlere güvenle uygulanabilir.',
      procedure_duration: '2-3 seans', anesthesia_type: 'Lokal anestezi', recovery_time: 'Yok', final_result_time: 'Hemen',
      pricing_response: 'Diş başına fiyatlandırılır. Tam ağız restorasyonu için özel paket fiyatı sunulur.' },

    { display_name: 'Diş Beyazlatma (Bleaching)', service_key: 'whitening', category: 'Kozmetik Diş',
      description_for_ai: 'Profesyonel ofis tipi diş beyazlatma. Tek seansta 3-8 ton açılabilir. Kalıcılık 1-2 yıl. Ev tipi destekleyici set ile sonuç uzatılabilir.',
      procedure_duration: '45-60 dakika', anesthesia_type: 'Yok', recovery_time: 'Yok', final_result_time: 'Hemen',
      pricing_response: 'Ofis tipi ve ev tipi paket seçeneklerimiz mevcuttur.' },

    { display_name: 'Ortodonti - Şeffaf Plak (Invisalign)', service_key: 'invisalign', category: 'Ortodonti',
      description_for_ai: 'Görünmez şeffaf plaklar ile diş düzeltme tedavisi. Çıkarılabilir olduğu için yeme içme ve fırçalamada kolaylık sağlar.',
      procedure_duration: '6-24 ay tedavi süreci', anesthesia_type: 'Yok', recovery_time: 'Yok', final_result_time: '6-24 ay',
      pricing_response: 'Durum karmaşıklığına göre fiyat belirlenir. Ücretsiz ön değerlendirmede bilgilendirilirsiniz.' },

    { display_name: 'Ortodonti - Metal Braket', service_key: 'braces', category: 'Ortodonti',
      description_for_ai: 'Klasik metal tel tedavisi. Karmaşık vakalar için etkili ve ekonomik seçenek.',
      procedure_duration: '12-24 ay', anesthesia_type: 'Yok', recovery_time: 'Yok', final_result_time: '12-24 ay',
      pricing_response: 'Muayene sonrası tedavi süresi ve fiyatı belirlenir.' },

    { display_name: 'Kanal Tedavisi', service_key: 'root_canal', category: 'Endodonti',
      description_for_ai: 'Ilerlemiş çürük veya enfeksiyonlu dişlerin kurtarılması için uygulanan pulpa temizleme ve kanal dolgusu işlemidir.',
      procedure_duration: '1-3 seans', anesthesia_type: 'Lokal anestezi', recovery_time: '1-2 gün hassasiyet', final_result_time: 'Hemen',
      pricing_response: 'Kanal sayısı ve duruma göre fiyat değişir.' },

    { display_name: 'Diş Çekimi (Gömük Yirmilik)', service_key: 'wisdom_tooth', category: 'Cerrahi',
      description_for_ai: 'Ağızda yer bulamayan, gömülü kalan yirmilik dişlerin cerrahi olarak çekilmesi işlemidir.',
      procedure_duration: '20-60 dakika', anesthesia_type: 'Lokal anestezi', recovery_time: '3-7 gün', final_result_time: '1-2 hafta',
      pricing_response: 'Dişin konumuna göre fiyat değişir.' },

    { display_name: 'Diş Eti Tedavisi (Periodontoloji)', service_key: 'periodontics', category: 'Periodontoloji',
      description_for_ai: 'Diş eti iltihabı, çekilmesi ve kemik kayıplarının tedavisi. Tartar temizliği, küretaj ve cerrahi müdahaleler uygulanabilir.',
      procedure_duration: 'Duruma göre değişir', anesthesia_type: 'Lokal anestezi', recovery_time: '3-7 gün', final_result_time: '1-3 ay',
      pricing_response: 'Tedavi kapsamına göre fiyatlandırılır.' },

    { display_name: 'Gülüş Tasarımı (Smile Design)', service_key: 'smile_design', category: 'Kozmetik Diş',
      description_for_ai: 'Dijital gülüş tasarımı ile veneer, beyazlatma, implant ve ortodontiyi birleştiren kapsamlı estetik tedavi planı. Sonuç görmeden tedaviye başlanmaz.',
      procedure_duration: 'Kapsamına göre değişir', anesthesia_type: 'Değişir', recovery_time: 'Değişir', final_result_time: 'Tedavi sonunda',
      pricing_response: 'Kapsamına göre kişisel fiyat planı oluşturulur. Ücretsiz dijital simülasyon için randevu alın.' },

    { display_name: 'Çocuk Diş Hekimliği (Pedodonti)', service_key: 'pedodontics', category: 'Pedodonti',
      description_for_ai: 'Çocuklara özel diş muayenesi, dolgu, fissür örtücü ve diş çekimi. Çocuk dostu ortam ile tedavi korkusu minimize edilir.',
      procedure_duration: 'Duruma göre değişir', anesthesia_type: 'Lokal anestezi', recovery_time: 'Yok', final_result_time: 'Hemen',
      pricing_response: 'İşlem türüne göre fiyatlandırılır.' },
  ],

  sac: [
    { display_name: 'FUE Saç Ekimi', service_key: 'fue_hair', category: 'Saç Ekimi',
      description_for_ai: 'FUE yöntemiyle ense bölgesinden tek tek alınan kök hücreler, kelleşen bölgeye nakledilir. İz bırakmaz ve doğal sonuç verir.',
      procedure_duration: '6-8 saat', anesthesia_type: 'Lokal anestezi', recovery_time: '10-14 gün kabuk dökülmesi', final_result_time: '12-18 ay',
      pricing_response: 'Ekilecek greft sayısına göre fiyatlandırılır. Ücretsiz analiz için randevu alın.' },

    { display_name: 'DHI Saç Ekimi (Kalem Tekniği)', service_key: 'dhi_hair', category: 'Saç Ekimi',
      description_for_ai: 'DHI yöntemiyle foliküller özel Choi kalemi ile kanalsız, direkt olarak ekilir. Daha yoğun yerleşim ve hızlı iyileşme sağlar.',
      procedure_duration: '6-8 saat', anesthesia_type: 'Lokal anestezi', recovery_time: '7-10 gün', final_result_time: '12-18 ay',
      pricing_response: 'Greft sayısı ve uygulama bölgesine göre paket fiyatı belirlenir.' },

    { display_name: 'Saç Analizi ve Danışmanlık', service_key: 'hair_analysis', category: 'Tanı',
      description_for_ai: 'Trikoskopi ile saç dökülmesinin tipi, şiddeti ve nedeni belirlenir. Operasyon gerekip gerekmediğine karar verilir.',
      procedure_duration: '30-45 dakika', anesthesia_type: 'Yok', recovery_time: 'Yok', final_result_time: 'Hemen',
      pricing_response: 'Analiz ücretsiz veya ücretlidir, bilgi için bize ulaşın.' },

    { display_name: 'PRP Saç Tedavisi', service_key: 'prp_hair', category: 'Medikal Tedavi',
      description_for_ai: 'Kişinin kendi kanından elde edilen trombositten zengin plasma (PRP), saç derisine enjekte edilerek kök hücreler güçlendirilir ve dökülme azaltılır.',
      procedure_duration: '45-60 dakika', anesthesia_type: 'Yok', recovery_time: 'Yok', final_result_time: '3-6 ay',
      pricing_response: 'Genellikle 3-6 seans uygulanır. Seans veya paket fiyatı için bilgi alın.' },

    { display_name: 'Mezoterapi (Saç)', service_key: 'hair_meso', category: 'Medikal Tedavi',
      description_for_ai: 'Saç derisine vitamin, mineral ve büyüme faktörü karışımı enjekte edilerek dökülme engellenir ve saç kalitesi artırılır.',
      procedure_duration: '30 dakika', anesthesia_type: 'Yok', recovery_time: 'Yok', final_result_time: '2-3 ay',
      pricing_response: '4-8 seans protokol uygulanır. Seans fiyatı veya paket seçeneği mevcuttur.' },

    { display_name: 'Kaş Ekimi', service_key: 'eyebrow_transplant', category: 'Saç Ekimi',
      description_for_ai: 'İnce veya seyrek kaşlara FUE yöntemiyle doğal yön ve açıya uygun kıl nakli yapılır.',
      procedure_duration: '2-3 saat', anesthesia_type: 'Lokal anestezi', recovery_time: '7-10 gün', final_result_time: '6-12 ay',
      pricing_response: 'Tek veya çift kaş seçimine göre fiyat değişir.' },

    { display_name: 'Sakal Ekimi', service_key: 'beard_transplant', category: 'Saç Ekimi',
      description_for_ai: 'Seyrek veya boş sakal bölgelerine ense veya vücuttan alınan kıl nakli ile dolgun ve doğal sakal görünümü elde edilir.',
      procedure_duration: '3-5 saat', anesthesia_type: 'Lokal anestezi', recovery_time: '7-10 gün', final_result_time: '6-12 ay',
      pricing_response: 'Bölge ve greft sayısına göre fiyatlandırılır.' },
  ],

  lazer: [
    { display_name: 'Lazer Epilasyon', service_key: 'laser_epilation', category: 'Lazer',
      description_for_ai: 'Alexandrite veya Nd:YAG lazer ile kalıcı tüy azaltma. Her cilt tonuna uygun cihazlarla güvenli uygulama.',
      procedure_duration: 'Bölgeye göre 15-60 dk', anesthesia_type: 'Yok (soğutma sistemi)', recovery_time: 'Yok', final_result_time: '6-8 seans',
      pricing_response: 'Bölge ve seans sayısına göre paket fiyatı oluşturulur. Tüm vücut paketlerimiz mevcuttur.' },

    { display_name: 'Botoks', service_key: 'botox', category: 'Dolgu & Botoks',
      description_for_ai: 'Mimik kaslarını 4-6 ay süreyle gevşeterek alın, kaş arası ve göz kenarı kırışıklıklarını giderir. Sonuç doğal ve ifadeli kalır.',
      procedure_duration: '15-20 dakika', anesthesia_type: 'Yok', recovery_time: 'Yok (15 dk dinlenme)', final_result_time: '5-7 gün',
      pricing_response: 'Bölge sayısı ve ünite miktarına göre fiyatlandırılır.' },

    { display_name: 'Hyalüronik Asit Dolgu', service_key: 'filler', category: 'Dolgu & Botoks',
      description_for_ai: 'Dudak, yanak, burun, çene ve nazolabial kıvrımlara hyalüronik asit enjeksiyonu. Doğal dolgunluk ve şekillendirme sağlar.',
      procedure_duration: '20-30 dakika', anesthesia_type: 'Lokal krem anestezi', recovery_time: '1-2 gün hafif şişlik', final_result_time: 'Hemen (tam sonuç 2 hafta)',
      pricing_response: 'Uygulama bölgesi ve ml miktarına göre değişir.' },

    { display_name: 'Cilt Gençleştirme (Fraksiyonel Lazer)', service_key: 'skin_rejuvenation', category: 'Lazer',
      description_for_ai: 'Fraksiyonel CO2 veya Erbium lazer ile cilt yenileme. Kırışıklık, leke, skar ve gözenek sorunlarını hedefler.',
      procedure_duration: '30-60 dakika', anesthesia_type: 'Lokal krem anestezi', recovery_time: '3-7 gün kızarıklık', final_result_time: '1-3 ay (3 seans)',
      pricing_response: 'İşlem türü ve yoğunluğuna göre fiyatlandırılır.' },

    { display_name: 'IPL Cilt Terapisi', service_key: 'ipl', category: 'Lazer',
      description_for_ai: 'Yoğun atımlı ışık (IPL) ile pigmentasyon, damar bozuklukları ve genel cilt tonu sorunları tedavi edilir.',
      procedure_duration: '30-45 dakika', anesthesia_type: 'Yok', recovery_time: '1-3 gün', final_result_time: '4-6 seans',
      pricing_response: 'Seans veya paket olarak fiyatlandırılır.' },

    { display_name: 'PRP (Gençleştirici Tedavi)', service_key: 'prp_face', category: 'Rejeneratif',
      description_for_ai: 'Kişinin kendi kanından elde edilen PRP yüze enjekte edilerek kolajen üretimi artırılır, cilt tonu ve dokusu iyileşir.',
      procedure_duration: '45-60 dakika', anesthesia_type: 'Lokal krem', recovery_time: '1-2 gün', final_result_time: '3-4 seans',
      pricing_response: '3-4 seans protokol önerilir. Seans veya paket fiyatı mevcuttur.' },

    { display_name: 'Mezoterapi (Cilt)', service_key: 'meso_face', category: 'Rejeneratif',
      description_for_ai: 'Cilt altına enjekte edilen vitamin, mineral ve hyalüronik asit karışımı ile nem, parlaklık ve sıkılık artırılır.',
      procedure_duration: '30-45 dakika', anesthesia_type: 'Lokal krem', recovery_time: '1 gün', final_result_time: '4-6 seans',
      pricing_response: 'Seans fiyatı veya paket seçeneği mevcuttur.' },

    { display_name: 'Leke Tedavisi (Lazer + Kimyasal)', service_key: 'pigmentation', category: 'Lazer',
      description_for_ai: 'Güneş lekesi, melazma ve post-inflamatuar hiperpigmentasyon için lazer veya kimyasal peeling kombinasyonu uygulanır.',
      procedure_duration: '30-45 dakika', anesthesia_type: 'Yok', recovery_time: '3-7 gün', final_result_time: '1-3 ay',
      pricing_response: 'Tedavi planı ve seans sayısına göre fiyat değişir.' },

    { display_name: 'Bölgesel Yağ Eritme (Lipoliz)', service_key: 'lipolysis', category: 'Vücut Şekillendirme',
      description_for_ai: 'Enjeksiyonla veya lazerle bölgesel yağ hücrelerini parçalayan non-cerrahi vücut şekillendirme işlemi.',
      procedure_duration: '30-60 dakika', anesthesia_type: 'Yok veya lokal krem', recovery_time: '1-3 gün', final_result_time: '4-8 seans',
      pricing_response: 'Bölge ve seans sayısına göre paket fiyatı oluşturulur.' },
  ],

  goz: [
    { display_name: 'LASIK / LASEK Lazer Göz Tedavisi', service_key: 'lasik', category: 'Refraktif Cerrahi',
      description_for_ai: 'Miyopi, hipermetropi ve astigmatı kalıcı olarak düzelten lazer göz ameliyatı. Ertesi gün görme netleşir.',
      procedure_duration: '10-15 dakika (her göz)', anesthesia_type: 'Damla anestezi', recovery_time: '1-2 gün', final_result_time: '1 hafta',
      pricing_response: 'İki göz için toplam fiyat belirlenir. Ön muayene genellikle ücretsizdir.' },

    { display_name: 'Smile / Femto LASIK', service_key: 'smile_lasik', category: 'Refraktif Cerrahi',
      description_for_ai: 'Flepsiz lazer göz ameliyatı. Kuru göz yan etkisi daha az, iyileşme daha hızlıdır.',
      procedure_duration: '10 dakika (her göz)', anesthesia_type: 'Damla anestezi', recovery_time: '1 gün', final_result_time: '3-5 gün',
      pricing_response: 'Standart LASIK\'a göre fiyatı biraz daha yüksektir. Muayene sonrası bilgilendirilirsiniz.' },

    { display_name: 'Katarakt Ameliyatı', service_key: 'cataract', category: 'Katarakt',
      description_for_ai: 'Bulanıklaşmış göz merceğini yapay (akıllı) mercekle değiştirme. Mono veya multifokal mercek seçeneği mevcuttur.',
      procedure_duration: '20-30 dakika', anesthesia_type: 'Lokal (damla) anestezi', recovery_time: '1-2 hafta', final_result_time: '1 ay',
      pricing_response: 'Mercek tipine (standart/premium/trifocal) göre fiyat değişir.' },

    { display_name: 'Göz Tansiyonu (Glokom) Takibi', service_key: 'glaucoma', category: 'Tıbbi Göz',
      description_for_ai: 'Göz içi basıncının düzenli takibi, lazer veya cerrahi tedavi ile görme kaybının önlenmesi.',
      procedure_duration: 'Kontrol: 30 dk', anesthesia_type: 'Değişir', recovery_time: 'Değişir', final_result_time: 'Sürekli takip',
      pricing_response: 'Muayene ve tedavi kapsamına göre fiyatlandırılır.' },

    { display_name: 'Şaşılık Ameliyatı (Strabismus)', service_key: 'strabismus', category: 'Cerrahi',
      description_for_ai: 'Göz kaslarının cerrahi olarak düzenlenmesiyle gözlerin hizalanması sağlanır. Çocuk ve yetişkinlere uygulanabilir.',
      procedure_duration: '30-60 dakika', anesthesia_type: 'Genel anestezi', recovery_time: '1-2 hafta', final_result_time: '1-2 ay',
      pricing_response: 'Tek veya çift göz seçimine göre fiyat belirlenir.' },
  ],

  ortopedi: [
    { display_name: 'Diz Protezi Ameliyatı', service_key: 'knee_replacement', category: 'Eklem Cerrahisi',
      description_for_ai: 'Yıpranmış diz eklemini yapay protezle değiştiren ameliyat. Total veya parsiyel (tek bölme) seçenekleri mevcuttur.',
      procedure_duration: '1.5-2.5 saat', anesthesia_type: 'Genel veya spinal anestezi', recovery_time: '6-12 hafta', final_result_time: '6-12 ay',
      pricing_response: 'Protez tipine ve tek/çift diz seçimine göre fiyat değişir.' },

    { display_name: 'Kalça Protezi Ameliyatı', service_key: 'hip_replacement', category: 'Eklem Cerrahisi',
      description_for_ai: 'Yıpranmış kalça eklemini yapay protezle değiştiren ameliyat. Hastalar genellikle 1-2 gün içinde yürümeye başlar.',
      procedure_duration: '1.5-2.5 saat', anesthesia_type: 'Genel veya spinal anestezi', recovery_time: '6-12 hafta', final_result_time: '6-12 ay',
      pricing_response: 'Protez tipine göre fiyatlandırılır.' },

    { display_name: 'Artroskopik Diz Ameliyatı', service_key: 'knee_arthroscopy', category: 'Artroskopi',
      description_for_ai: 'Kapalı (artroskopik) yöntemle menisküs yırtığı, bağ hasarı ve kıkırdak sorunlarının tedavisi.',
      procedure_duration: '30-90 dakika', anesthesia_type: 'Genel anestezi', recovery_time: '1-6 hafta', final_result_time: '3-6 ay',
      pricing_response: 'Yapılan işleme göre fiyatlandırılır.' },

    { display_name: 'Omurga Cerrahisi (Bel/Boyun Fıtığı)', service_key: 'spine_surgery', category: 'Omurga',
      description_for_ai: 'Disk kayması, spinal stenoz veya kayma gibi omurga sorunlarının cerrahi tedavisi.',
      procedure_duration: '1-4 saat', anesthesia_type: 'Genel anestezi', recovery_time: '1-6 hafta', final_result_time: '3-12 ay',
      pricing_response: 'Operasyon kapsamına göre fiyatlandırılır. Muayene sonrası plan hazırlanır.' },

    { display_name: 'Fizik Tedavi & Rehabilitasyon', service_key: 'physio', category: 'Rehabilitasyon',
      description_for_ai: 'Ameliyat sonrası veya konservatif tedavi olarak elektroterapi, egzersiz ve manuel terapi uygulamaları.',
      procedure_duration: 'Seans: 45-60 dk', anesthesia_type: 'Yok', recovery_time: 'Yok', final_result_time: '4-8 hafta',
      pricing_response: 'Seans veya paket olarak fiyatlandırılır.' },
  ],

  dermato: [
    { display_name: 'Akne & Sivilce Tedavisi', service_key: 'acne', category: 'Medikal Dermatoloji',
      description_for_ai: 'Yüzeysel ve kistik aknenin ilaç, kimyasal peeling ve lazer kombinasyonuyla tedavisi.',
      procedure_duration: 'Seans bazlı', anesthesia_type: 'Yok', recovery_time: 'Yok-3 gün', final_result_time: '2-4 ay',
      pricing_response: 'Tedavi planına ve seans sayısına göre fiyatlandırılır.' },

    { display_name: 'Egzama & Sedef (Psoriasis) Tedavisi', service_key: 'psoriasis', category: 'Medikal Dermatoloji',
      description_for_ai: 'Kronik deri hastalıklarında biyolojik ilaçlar, fototerapi veya topikal tedavilerin uzman gözetiminde uygulanması.',
      procedure_duration: 'Değişir', anesthesia_type: 'Yok', recovery_time: 'Değişir', final_result_time: '1-3 ay',
      pricing_response: 'Muayene sonrası kişiye özel tedavi planı ve fiyat belirlenir.' },

    { display_name: 'Ben Kontrolü & Dermoskopi', service_key: 'mole_check', category: 'Tanı',
      description_for_ai: 'Tüm vücut benlerin dermoskop ile detaylı incelenmesi, şüpheli lezyonların tespiti ve gerekirse alınması.',
      procedure_duration: '30-60 dakika', anesthesia_type: 'Yok (alımda lokal)', recovery_time: 'Yok', final_result_time: 'Hemen',
      pricing_response: 'Muayene ve alım ayrı ücretlendirilir.' },

    { display_name: 'Kimyasal Peeling', service_key: 'chemical_peel', category: 'Kozmetik Dermatoloji',
      description_for_ai: 'Glikolik, TCA veya salisilik asit gibi kimyasal solüsyonlarla cilt yenileme, leke ve gözenek tedavisi.',
      procedure_duration: '30-45 dakika', anesthesia_type: 'Yok', recovery_time: '3-7 gün', final_result_time: '2-4 seans',
      pricing_response: 'Peeling derinliğine ve bölgesine göre fiyatlandırılır.' },

    { display_name: 'Alopesi (Saç Dökülmesi) Tedavisi', service_key: 'alopecia', category: 'Medikal Dermatoloji',
      description_for_ai: 'Androgenetik veya areata tipte saç dökülmesinde PRP, mezoterapi ve medikal tedavi kombinasyonları.',
      procedure_duration: '45-60 dakika', anesthesia_type: 'Yok', recovery_time: 'Yok', final_result_time: '3-6 ay',
      pricing_response: 'Seans veya paket olarak fiyatlandırılır.' },
  ],

  diyetisyen: [
    { display_name: 'Kişisel Beslenme Danışmanlığı', service_key: 'nutrition_consult', category: 'Danışmanlık',
      description_for_ai: 'Kilo yönetimi, hastalık diyetleri veya genel sağlıklı beslenme için kişisel diyet planı hazırlanması.',
      procedure_duration: '60 dakika (ilk görüşme)', anesthesia_type: 'Yok', recovery_time: 'Yok', final_result_time: '4-12 hafta',
      pricing_response: 'İlk görüşme ve takip seansları ayrı ücretlendirilir. Paket seçeneklerimiz mevcuttur.' },

    { display_name: 'Sporcu Beslenmesi', service_key: 'sports_nutrition', category: 'Sporcu',
      description_for_ai: 'Performansı artırmak, kas kütlesi kazanmak veya yağ yakmak için sporcuya özel beslenme ve takviye programı.',
      procedure_duration: '60 dakika', anesthesia_type: 'Yok', recovery_time: 'Yok', final_result_time: '4-12 hafta',
      pricing_response: 'Program süresi ve içeriğine göre fiyatlandırılır.' },

    { display_name: 'Obezite & Medikal Diyet', service_key: 'obesity_diet', category: 'Medikal',
      description_for_ai: 'Hekim destekli obezite yönetimi ve medikal beslenme tedavisi. Kan tahlilleri ile desteklenen kişisel program.',
      procedure_duration: '60-90 dakika (ilk)', anesthesia_type: 'Yok', recovery_time: 'Yok', final_result_time: '3-6 ay',
      pricing_response: 'Kapsamlı programlar için paket fiyatı oluşturulur.' },

    { display_name: 'Çocuk Beslenmesi', service_key: 'child_nutrition', category: 'Pediatrik',
      description_for_ai: 'Büyüme ve gelişim için uygun beslenme planı, seçici yeme ve şişmanlık sorunlarında aile rehberliği.',
      procedure_duration: '45-60 dakika', anesthesia_type: 'Yok', recovery_time: 'Yok', final_result_time: '4-8 hafta',
      pricing_response: 'Seans veya paket fiyatı mevcuttur.' },
  ],

  psikoloji: [
    { display_name: 'Bireysel Psikoterapi', service_key: 'individual_therapy', category: 'Terapi',
      description_for_ai: 'Anksiyete, depresyon, travma veya ilişki sorunları için birebir psikoterapi seansları. CBT, EMDR ve diğer kanıta dayalı yaklaşımlar uygulanır.',
      procedure_duration: '50 dakika', anesthesia_type: 'Yok', recovery_time: 'Yok', final_result_time: '8-20 seans',
      pricing_response: 'Seans ücretimiz için lütfen bizi arayın. Paket seçeneklerimiz mevcuttur.' },

    { display_name: 'Çift & İlişki Terapisi', service_key: 'couples_therapy', category: 'Terapi',
      description_for_ai: 'İletişim sorunları, çatışma ve kriz dönemlerinde çiftlere yönelik psikoterapi.',
      procedure_duration: '60-75 dakika', anesthesia_type: 'Yok', recovery_time: 'Yok', final_result_time: '8-16 seans',
      pricing_response: 'Seans fiyatı bireysel terapiden farklıdır, bilgi için ulaşın.' },

    { display_name: 'Çocuk & Ergen Psikolojisi', service_key: 'child_psychology', category: 'Pediatrik',
      description_for_ai: 'Okul sorunları, davranış bozuklukları, sosyal kaygı ve DEHB gibi durumlarda oyun terapisi ve bilişsel-davranışçı yöntemler.',
      procedure_duration: '45-50 dakika', anesthesia_type: 'Yok', recovery_time: 'Yok', final_result_time: '8-16 seans',
      pricing_response: 'Çocuk seansı fiyatı için bizimle iletişime geçin.' },

    { display_name: 'Psikolojik Değerlendirme & Test', service_key: 'psych_assessment', category: 'Değerlendirme',
      description_for_ai: 'IQ, kişilik, dikkat veya nörobilişsel testler ile kapsamlı psikolojik değerlendirme raporu.',
      procedure_duration: '2-4 saat (test)', anesthesia_type: 'Yok', recovery_time: 'Yok', final_result_time: '1-2 hafta (rapor)',
      pricing_response: 'Test türüne göre fiyatlandırılır.' },
  ],
};

// ─── SSS ŞABLONLARI ───────────────────────────────────────────────────────────

export const CLINIC_FAQ_TEMPLATES: Record<string, any[]> = {
  estetik: [
    { question_patterns: ['fiyat', 'ne kadar', 'ücret', 'kaça'], answer: 'Fiyatlarımız kişiye özel belirlenmektedir. Her hastanın anatomisi farklı olduğundan, kesin fiyat için ücretsiz ön görüşmemize davet ediyoruz.', category: 'fiyat' },
    { question_patterns: ['acıyor mu', 'ağrı', 'ağrılı mı', 'acı hissedilir mi'], answer: 'Operasyonlarımız anestezi altında gerçekleştirildiğinden işlem sırasında ağrı hissetmezsiniz. İyileşme sürecinde hafif rahatsızlık olabilir, verilen ağrı kesicilerle yönetilebilir.', category: 'medikal' },
    { question_patterns: ['kaç gün izin', 'iş', 'işe ne zaman', 'sosyal hayat', 'iyileşme süresi'], answer: 'İyileşme süresi operasyona göre değişir. Küçük işlemlerde 3-5 gün, kapsamlı operasyonlarda 1-2 hafta dinlenme tavsiye edilir. Tam iyileşme birkaç ay sürebilir.', category: 'medikal' },
    { question_patterns: ['kaç gün hastanede', 'yatış', 'hastane süresi'], answer: 'Küçük işlemler günübirlik yapılabilirken, kapsamlı operasyonlar 1-2 gün hastane yatışı gerektirebilir. Doktorunuz size özel bilgi verecektir.', category: 'medikal' },
    { question_patterns: ['güvenli mi', 'risk', 'tehlikeli mi', 'komplikasyon'], answer: 'Tüm operasyonlar uluslararası standartlarda uzman ekibimiz tarafından gerçekleştirilir. Her operasyonda belirli riskler mevcuttur; bu riskler muayenede detaylıca açıklanır.', category: 'medikal' },
    { question_patterns: ['taksit', 'ödeme', 'kredi kartı', 'nasıl ödeniyor'], answer: 'Tüm kredi kartlarına taksit imkânımız mevcuttur. Faizsiz taksit seçenekleri için muayene sırasında bilgi alabilirsiniz.', category: 'fiyat' },
    { question_patterns: ['sonuç ne zaman', 'ne zaman görürüm', 'sonuç kalıcı mı'], answer: 'Sonuçlar operasyona göre değişir. Şişlik ve morluğun çekilmesiyle birlikte sonuç netleşir. Kalıcılık sağlıklı yaşam tarzıyla desteklenir.', category: 'medikal' },
    { question_patterns: ['doktor kim', 'kim yapıyor', 'cerrah', 'tecrübe'], answer: 'Operasyonlarımız uzman plastik cerrahımız tarafından gerçekleştirilir. Sertifikalar ve başarılı vakalar için bizimle iletişime geçebilirsiniz.', category: 'genel' },
  ],
  dis: [
    { question_patterns: ['implant fiyat', 'implant ne kadar', 'implant kaça'], answer: 'İmplant fiyatları kullanılan marka ve adete göre değişir. Muayene sonrası size özel tedavi planı ve fiyat sunulur.', category: 'fiyat' },
    { question_patterns: ['ağrılı mı', 'acıyor mu', 'diş çekimi acı'], answer: 'Tüm işlemlerimiz lokal anestezi altında yapılır, ağrı hissetmezsiniz. İşlem sonrası hafif hassasiyet normal olup birkaç günde geçer.', category: 'medikal' },
    { question_patterns: ['kaç seansta', 'kaç seans', 'ne kadar sürer'], answer: 'Seans sayısı tedavinin türüne göre değişir. İmplant 2-3 aşamada tamamlanırken, kaplama 2 seansta, beyazlatma ise tek seansta yapılabilir.', category: 'medikal' },
    { question_patterns: ['garanti', 'kaç yıl', 'bozulur mu'], answer: 'İmplantlarımız ömür boyu garantilidir. Zirkonyum ve porselen kaplamalarda 5 yıl garanti sunmaktayız.', category: 'genel' },
    { question_patterns: ['çocuk', 'kaç yaşından', 'çocuk diş'], answer: 'Çocuk diş hekimliği (pedodonti) biriminde 0-14 yaş çocuklara özel tedavi sunulmaktadır. Çocuk dostu ortamımızda tedavi korkusunu azaltıyoruz.', category: 'genel' },
  ],
  sac: [
    { question_patterns: ['greft fiyat', 'saç ekimi ne kadar', 'fiyat'], answer: 'Fiyat, ekilecek greft sayısına ve kullanılan tekniğe göre belirlenir. Ücretsiz saç analizi sonrasında size özel fiyat sunulur.', category: 'fiyat' },
    { question_patterns: ['acıyor mu', 'ağrı', 'anestezi'], answer: 'Lokal anestezi uygulanır. İşlem sırasında ağrı hissetmezsiniz. Anestezi sonrası hafif baskı hissi olabilir.', category: 'medikal' },
    { question_patterns: ['ne zaman çıkar', 'sonuç ne zaman', 'uzama'], answer: 'Ekilen saçlar 2-3 ay içinde dökülür (şok dökülme normaldir), 3-4. ayda yeniden çıkmaya başlar, 12-18. ayda tam sonuç görülür.', category: 'medikal' },
    { question_patterns: ['kaç greft', 'kaç kıl', 'yeterli mi'], answer: 'Greft sayısı saç analizi ile belirlenir. Tipik bir FUE operasyonunda 2000-4000 greft kullanılır.', category: 'medikal' },
    { question_patterns: ['kalıcı mı', 'tekrar döker mi'], answer: 'Ense bölgesinden alınan saçlar genetik olarak kalıcıdır. Ancak mevcut ince saçlarda dökülme devam edebilir, bunu önlemek için medikal destek önerilebilir.', category: 'medikal' },
  ],
  lazer: [
    { question_patterns: ['botoks kaç ay', 'ne kadar sürer', 'kalıcı mı'], answer: 'Botoks etkisi ortalama 4-6 ay sürer. Düzenli tekrarlanan uygulamalarla etki süresi uzayabilir.', category: 'medikal' },
    { question_patterns: ['dolgu ağrılı mı', 'acıyor mu'], answer: 'Lokal krem anestezi uygulandığından ağrı minimumdur. İşlem sırasında hafif basınç hissi olabilir.', category: 'medikal' },
    { question_patterns: ['lazer epilasyon kaç seans', 'kaç seans yeterli'], answer: 'Ortalama 6-8 seans, 4-6 hafta aralıklarla uygulanır. Ten ve kıl tipine göre seans sayısı değişebilir.', category: 'medikal' },
    { question_patterns: ['yaz lazer', 'güneş', 'lazer mevsim'], answer: 'Lazer epilasyon yaz aylarında dikkatli yapılmalıdır. Güneş görmeyen bölgelere yaz da dahil uygulanabilir. Detaylar için uzmanımıza danışın.', category: 'medikal' },
  ],
};

export const GENERAL_FAQ_TEMPLATES = [
  { question_patterns: ['randevu', 'nasıl randevu', 'muayene', 'görüşme'], answer: 'Telefon, WhatsApp veya web sitemiz üzerinden randevu alabilirsiniz. İlk görüşmemizde tüm sorularınızı yanıtlamaktan memnuniyet duyarız.', category: 'genel' },
  { question_patterns: ['adres', 'nerede', 'konum', 'nasıl gidilir'], answer: 'Adresimiz ve ulaşım bilgisi için web sitemizi ziyaret edebilir ya da bizi arayabilirsiniz. Toplu taşıma ve araçla kolayca ulaşılabilir konumdayız.', category: 'genel' },
  { question_patterns: ['çalışma saati', 'saat', 'ne zaman açık', 'cumartesi'], answer: 'Çalışma saatlerimiz için lütfen bizi arayın veya web sitemizi kontrol edin. Randevunuzu önceden alarak bekleme süresini minimize edebilirsiniz.', category: 'genel' },
  { question_patterns: ['sigorta', 'SGK', 'özel sigorta'], answer: 'Bazı işlemlerimiz özel sigorta kapsamında değerlendirilebilir. Sigorta şirketinizle teyit etmenizi ve bize bildirmenizi öneririz.', category: 'genel' },
  { question_patterns: ['online görüşme', 'online muayene', 'video'], answer: 'Ön değerlendirme için online görüşme seçeneğimiz mevcuttur. Kesin teşhis ve tedavi planı için kliniğimize gelmeniz gerekebilir.', category: 'genel' },
];
