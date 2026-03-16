import type { Lang } from './i18n/messages';

// ─── CLINIC TYPE DEFINITIONS ──────────────────────────────────────────────────

export const CLINIC_TYPE_KEYS = ['estetik', 'dis', 'sac', 'lazer', 'goz', 'ortopedi', 'dermato', 'diyetisyen', 'psikoloji', 'diger'] as const;

const CLINIC_TYPE_META: Record<string, { emoji: string; color: string }> = {
  estetik:    { emoji: '✨', color: 'border-pink-200 bg-pink-50 text-pink-700 hover:bg-pink-100' },
  dis:        { emoji: '🦷', color: 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100' },
  sac:        { emoji: '💇', color: 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100' },
  lazer:      { emoji: '💎', color: 'border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100' },
  goz:        { emoji: '👁️', color: 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100' },
  ortopedi:   { emoji: '🦴', color: 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100' },
  dermato:    { emoji: '🌿', color: 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100' },
  diyetisyen: { emoji: '🥗', color: 'border-lime-200 bg-lime-50 text-lime-700 hover:bg-lime-100' },
  psikoloji:  { emoji: '🧠', color: 'border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100' },
  diger:      { emoji: '🏥', color: 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100' },
};

const TR_LABELS: Record<string, string> = {
  estetik: 'Estetik Cerrahi', dis: 'Diş Kliniği', sac: 'Saç Kliniği',
  lazer: 'Lazer & Güzellik', goz: 'Göz Kliniği', ortopedi: 'Ortopedi',
  dermato: 'Dermatoloji', diyetisyen: 'Diyet & Beslenme', psikoloji: 'Psikoloji', diger: 'Diğer',
};

const EN_LABELS: Record<string, string> = {
  estetik: 'Aesthetic Surgery', dis: 'Dental Clinic', sac: 'Hair Clinic',
  lazer: 'Laser & Beauty', goz: 'Eye Clinic', ortopedi: 'Orthopaedics',
  dermato: 'Dermatology', diyetisyen: 'Dietetics & Nutrition', psikoloji: 'Psychology', diger: 'Other',
};

// Legacy export for backward compatibility
export const CLINIC_TYPES = CLINIC_TYPE_KEYS.map(key => ({
  key,
  label: TR_LABELS[key] ?? key,
  emoji: CLINIC_TYPE_META[key]?.emoji ?? '🏥',
  color: CLINIC_TYPE_META[key]?.color ?? '',
}));

export function getClinicTypes(lang: Lang) {
  const labels = lang === 'en' ? EN_LABELS : TR_LABELS;
  return CLINIC_TYPE_KEYS.map(key => ({
    key,
    label: labels[key] ?? key,
    emoji: CLINIC_TYPE_META[key]?.emoji ?? '🏥',
    color: CLINIC_TYPE_META[key]?.color ?? '',
  }));
}

// ─── SERVICE TEMPLATES ────────────────────────────────────────────────────────

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
      description_for_ai: 'Yüz germe operasyonu, yüz ve boyun bölgesindeki sarkmalar ile kırışıklıkları gidererek doğal ve dinç bir görünüm sağlar.',
      procedure_duration: '3-5 saat', anesthesia_type: 'Genel anestezi', recovery_time: '2-4 hafta', final_result_time: '3-6 ay',
      pricing_response: 'Yüz germe fiyatı, müdahale kapsamına göre değişir. Detaylı bilgi için randevu alabilirsiniz.' },
    { display_name: 'Meme Büyütme (Augmentasyon)', service_key: 'breast_augmentation', category: 'Vücut Estetiği',
      description_for_ai: 'Meme büyütme operasyonu, silikon protez kullanılarak meme hacminin artırılması ve şekillendirilmesi işlemidir.',
      procedure_duration: '1.5-2.5 saat', anesthesia_type: 'Genel anestezi', recovery_time: '1 hafta iş yaşamına dönüş', final_result_time: '3-6 ay',
      pricing_response: 'Fiyat tercih edilen protez markası ve boyutuna göre değişir. Muayenede size özel fiyat sunulur.' },
    { display_name: 'Liposuction (Yağ Aldırma)', service_key: 'liposuction', category: 'Vücut Estetiği',
      description_for_ai: 'Liposuction, diyetle erimeyen bölgesel yağ birikintilerini vakumla uzaklaştırarak vücut konturunu iyileştirir.',
      procedure_duration: '1-3 saat', anesthesia_type: 'Genel veya lokal anestezi', recovery_time: '3-7 gün', final_result_time: '3-6 ay',
      pricing_response: 'Fiyat tedavi edilecek bölge sayısına ve hacmine göre değişir.' },
    { display_name: 'Karın Germe (Abdominoplasti)', service_key: 'abdominoplasty', category: 'Vücut Estetiği',
      description_for_ai: 'Karın germe, doğum veya kilo değişikliği sonrası oluşan deri sarkmasını ve gevşek kasları düzeltir.',
      procedure_duration: '2-4 saat', anesthesia_type: 'Genel anestezi', recovery_time: '2-3 hafta', final_result_time: '6-12 ay',
      pricing_response: 'Mini veya tam abdominoplasti seçimine göre fiyatlandırma yapılır.' },
    { display_name: 'Vajinal Estetik (Labioplasti)', service_key: 'labiaplasty', category: 'Jinekolojik Estetik',
      description_for_ai: 'Labia minora veya majoranın şekillendirilmesi veya küçültülmesi işlemidir.',
      procedure_duration: '1-2 saat', anesthesia_type: 'Lokal veya genel anestezi', recovery_time: '1-2 hafta', final_result_time: '2-3 ay',
      pricing_response: 'Muayene sonrası kişiye özel fiyatlandırma yapılır.' },
  ],

  dis: [
    { display_name: 'Diş İmplantı', service_key: 'implant', category: 'Cerrahi',
      description_for_ai: 'Eksik dişlerin yerine titanyum vida ve üzerine porselen veya zirkonyum protez yerleştirme işlemidir.',
      procedure_duration: 'Vida: 30-60 dk, Protez: 2-3 ay sonra', anesthesia_type: 'Lokal anestezi', recovery_time: '3-6 ay osseointegrasyon', final_result_time: '6-9 ay',
      pricing_response: 'İmplant marka ve sayısına göre fiyat değişir. Muayene sonrası detaylı plan ve fiyat sunulur.' },
    { display_name: 'Laminate Veneer (Porselen Kaplama)', service_key: 'veneer', category: 'Kozmetik Diş',
      description_for_ai: 'Dişlerin ön yüzüne uygulanan ince porselen kaplamalar. Renk, şekil ve boyut problemlerini çözer.',
      procedure_duration: '2 seans (7-10 gün arayla)', anesthesia_type: 'Lokal anestezi', recovery_time: 'Yok', final_result_time: 'Hemen',
      pricing_response: 'Diş başına fiyatlandırılır. Tam gülüş tasarımı için paket fiyatı oluşturulur.' },
    { display_name: 'Diş Beyazlatma (Bleaching)', service_key: 'whitening', category: 'Kozmetik Diş',
      description_for_ai: 'Profesyonel ofis tipi diş beyazlatma. Tek seansta 3-8 ton açılabilir.',
      procedure_duration: '45-60 dakika', anesthesia_type: 'Yok', recovery_time: 'Yok', final_result_time: 'Hemen',
      pricing_response: 'Ofis tipi ve ev tipi paket seçeneklerimiz mevcuttur.' },
    { display_name: 'Ortodonti - Şeffaf Plak (Invisalign)', service_key: 'invisalign', category: 'Ortodonti',
      description_for_ai: 'Görünmez şeffaf plaklar ile diş düzeltme tedavisi.',
      procedure_duration: '6-24 ay tedavi süreci', anesthesia_type: 'Yok', recovery_time: 'Yok', final_result_time: '6-24 ay',
      pricing_response: 'Durum karmaşıklığına göre fiyat belirlenir. Ücretsiz ön değerlendirmede bilgilendirilirsiniz.' },
    { display_name: 'Gülüş Tasarımı (Smile Design)', service_key: 'smile_design', category: 'Kozmetik Diş',
      description_for_ai: 'Dijital gülüş tasarımı ile veneer, beyazlatma, implant ve ortodontiyi birleştiren kapsamlı estetik tedavi planı.',
      procedure_duration: 'Kapsamına göre değişir', anesthesia_type: 'Değişir', recovery_time: 'Değişir', final_result_time: 'Tedavi sonunda',
      pricing_response: 'Kapsamına göre kişisel fiyat planı oluşturulur. Ücretsiz dijital simülasyon için randevu alın.' },
  ],

  sac: [
    { display_name: 'FUE Saç Ekimi', service_key: 'fue_hair', category: 'Saç Ekimi',
      description_for_ai: 'FUE yöntemiyle ense bölgesinden tek tek alınan kök hücreler, kelleşen bölgeye nakledilir.',
      procedure_duration: '6-8 saat', anesthesia_type: 'Lokal anestezi', recovery_time: '10-14 gün kabuk dökülmesi', final_result_time: '12-18 ay',
      pricing_response: 'Ekilecek greft sayısına göre fiyatlandırılır. Ücretsiz analiz için randevu alın.' },
    { display_name: 'DHI Saç Ekimi (Kalem Tekniği)', service_key: 'dhi_hair', category: 'Saç Ekimi',
      description_for_ai: 'DHI yöntemiyle foliküller özel Choi kalemi ile kanalsız, direkt olarak ekilir.',
      procedure_duration: '6-8 saat', anesthesia_type: 'Lokal anestezi', recovery_time: '7-10 gün', final_result_time: '12-18 ay',
      pricing_response: 'Greft sayısı ve uygulama bölgesine göre paket fiyatı belirlenir.' },
    { display_name: 'PRP Saç Tedavisi', service_key: 'prp_hair', category: 'Medikal Tedavi',
      description_for_ai: 'Kişinin kendi kanından elde edilen trombositten zengin plasma (PRP), saç derisine enjekte edilerek kök hücreler güçlendirilir.',
      procedure_duration: '45-60 dakika', anesthesia_type: 'Yok', recovery_time: 'Yok', final_result_time: '3-6 ay',
      pricing_response: 'Genellikle 3-6 seans uygulanır. Seans veya paket fiyatı için bilgi alın.' },
  ],

  lazer: [
    { display_name: 'Lazer Epilasyon', service_key: 'laser_epilation', category: 'Lazer',
      description_for_ai: 'Alexandrite veya Nd:YAG lazer ile kalıcı tüy azaltma.',
      procedure_duration: 'Bölgeye göre 15-60 dk', anesthesia_type: 'Yok (soğutma sistemi)', recovery_time: 'Yok', final_result_time: '6-8 seans',
      pricing_response: 'Bölge ve seans sayısına göre paket fiyatı oluşturulur.' },
    { display_name: 'Botoks', service_key: 'botox', category: 'Dolgu & Botoks',
      description_for_ai: 'Mimik kaslarını 4-6 ay süreyle gevşeterek alın, kaş arası ve göz kenarı kırışıklıklarını giderir.',
      procedure_duration: '15-20 dakika', anesthesia_type: 'Yok', recovery_time: 'Yok (15 dk dinlenme)', final_result_time: '5-7 gün',
      pricing_response: 'Bölge sayısı ve ünite miktarına göre fiyatlandırılır.' },
    { display_name: 'Hyalüronik Asit Dolgu', service_key: 'filler', category: 'Dolgu & Botoks',
      description_for_ai: 'Dudak, yanak, burun, çene ve nazolabial kıvrımlara hyalüronik asit enjeksiyonu.',
      procedure_duration: '20-30 dakika', anesthesia_type: 'Lokal krem anestezi', recovery_time: '1-2 gün hafif şişlik', final_result_time: 'Hemen (tam sonuç 2 hafta)',
      pricing_response: 'Uygulama bölgesi ve ml miktarına göre değişir.' },
    { display_name: 'Cilt Gençleştirme (Fraksiyonel Lazer)', service_key: 'skin_rejuvenation', category: 'Lazer',
      description_for_ai: 'Fraksiyonel CO2 veya Erbium lazer ile cilt yenileme. Kırışıklık, leke, skar ve gözenek sorunlarını hedefler.',
      procedure_duration: '30-60 dakika', anesthesia_type: 'Lokal krem anestezi', recovery_time: '3-7 gün kızarıklık', final_result_time: '1-3 ay (3 seans)',
      pricing_response: 'İşlem türü ve yoğunluğuna göre fiyatlandırılır.' },
  ],

  goz: [
    { display_name: 'LASIK / LASEK Lazer Göz Tedavisi', service_key: 'lasik', category: 'Refraktif Cerrahi',
      description_for_ai: 'Miyopi, hipermetropi ve astigmatı kalıcı olarak düzelten lazer göz ameliyatı.',
      procedure_duration: '10-15 dakika (her göz)', anesthesia_type: 'Damla anestezi', recovery_time: '1-2 gün', final_result_time: '1 hafta',
      pricing_response: 'İki göz için toplam fiyat belirlenir. Ön muayene genellikle ücretsizdir.' },
    { display_name: 'Katarakt Ameliyatı', service_key: 'cataract', category: 'Katarakt',
      description_for_ai: 'Bulanıklaşmış göz merceğini yapay (akıllı) mercekle değiştirme.',
      procedure_duration: '20-30 dakika', anesthesia_type: 'Lokal (damla) anestezi', recovery_time: '1-2 hafta', final_result_time: '1 ay',
      pricing_response: 'Mercek tipine (standart/premium/trifocal) göre fiyat değişir.' },
    { display_name: 'Şaşılık Ameliyatı (Strabismus)', service_key: 'strabismus', category: 'Cerrahi',
      description_for_ai: 'Göz kaslarının cerrahi olarak düzenlenmesiyle gözlerin hizalanması sağlanır.',
      procedure_duration: '30-60 dakika', anesthesia_type: 'Genel anestezi', recovery_time: '1-2 hafta', final_result_time: '1-2 ay',
      pricing_response: 'Tek veya çift göz seçimine göre fiyat belirlenir.' },
  ],

  ortopedi: [
    { display_name: 'Diz Protezi Ameliyatı', service_key: 'knee_replacement', category: 'Eklem Cerrahisi',
      description_for_ai: 'Yıpranmış diz eklemini yapay protezle değiştiren ameliyat.',
      procedure_duration: '1.5-2.5 saat', anesthesia_type: 'Genel veya spinal anestezi', recovery_time: '6-12 hafta', final_result_time: '6-12 ay',
      pricing_response: 'Protez tipine ve tek/çift diz seçimine göre fiyat değişir.' },
    { display_name: 'Artroskopik Diz Ameliyatı', service_key: 'knee_arthroscopy', category: 'Artroskopi',
      description_for_ai: 'Kapalı (artroskopik) yöntemle menisküs yırtığı, bağ hasarı ve kıkırdak sorunlarının tedavisi.',
      procedure_duration: '30-90 dakika', anesthesia_type: 'Genel anestezi', recovery_time: '1-6 hafta', final_result_time: '3-6 ay',
      pricing_response: 'Yapılan işleme göre fiyatlandırılır.' },
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
    { display_name: 'Ben Kontrolü & Dermoskopi', service_key: 'mole_check', category: 'Tanı',
      description_for_ai: 'Tüm vücut benlerin dermoskop ile detaylı incelenmesi, şüpheli lezyonların tespiti.',
      procedure_duration: '30-60 dakika', anesthesia_type: 'Yok (alımda lokal)', recovery_time: 'Yok', final_result_time: 'Hemen',
      pricing_response: 'Muayene ve alım ayrı ücretlendirilir.' },
    { display_name: 'Kimyasal Peeling', service_key: 'chemical_peel', category: 'Kozmetik Dermatoloji',
      description_for_ai: 'Glikolik, TCA veya salisilik asit gibi kimyasal solüsyonlarla cilt yenileme.',
      procedure_duration: '30-45 dakika', anesthesia_type: 'Yok', recovery_time: '3-7 gün', final_result_time: '2-4 seans',
      pricing_response: 'Peeling derinliğine ve bölgesine göre fiyatlandırılır.' },
  ],

  diyetisyen: [
    { display_name: 'Kişisel Beslenme Danışmanlığı', service_key: 'nutrition_consult', category: 'Danışmanlık',
      description_for_ai: 'Kilo yönetimi, hastalık diyetleri veya genel sağlıklı beslenme için kişisel diyet planı hazırlanması.',
      procedure_duration: '60 dakika (ilk görüşme)', anesthesia_type: 'Yok', recovery_time: 'Yok', final_result_time: '4-12 hafta',
      pricing_response: 'İlk görüşme ve takip seansları ayrı ücretlendirilir. Paket seçeneklerimiz mevcuttur.' },
    { display_name: 'Sporcu Beslenmesi', service_key: 'sports_nutrition', category: 'Sporcu',
      description_for_ai: 'Performansı artırmak, kas kütlesi kazanmak veya yağ yakmak için sporcuya özel beslenme programı.',
      procedure_duration: '60 dakika', anesthesia_type: 'Yok', recovery_time: 'Yok', final_result_time: '4-12 hafta',
      pricing_response: 'Program süresi ve içeriğine göre fiyatlandırılır.' },
  ],

  psikoloji: [
    { display_name: 'Bireysel Psikoterapi', service_key: 'individual_therapy', category: 'Terapi',
      description_for_ai: 'Anksiyete, depresyon, travma veya ilişki sorunları için birebir psikoterapi seansları.',
      procedure_duration: '50 dakika', anesthesia_type: 'Yok', recovery_time: 'Yok', final_result_time: '8-20 seans',
      pricing_response: 'Seans ücretimiz için lütfen bizi arayın. Paket seçeneklerimiz mevcuttur.' },
    { display_name: 'Çift & İlişki Terapisi', service_key: 'couples_therapy', category: 'Terapi',
      description_for_ai: 'İletişim sorunları, çatışma ve kriz dönemlerinde çiftlere yönelik psikoterapi.',
      procedure_duration: '60-75 dakika', anesthesia_type: 'Yok', recovery_time: 'Yok', final_result_time: '8-16 seans',
      pricing_response: 'Seans fiyatı bireysel terapiden farklıdır, bilgi için ulaşın.' },
  ],
};

// ─── ENGLISH (UK) SERVICE TEMPLATES ──────────────────────────────────────────

const EN_SERVICE_TEMPLATES: Record<string, any[]> = {
  estetik: [
    { display_name: 'Rhinoplasty (Nose Job)', service_key: 'rhinoplasty', category: 'Facial Aesthetics',
      description_for_ai: 'Rhinoplasty reshapes the nose to improve its appearance and/or function. We perform both open and closed techniques under general anaesthesia in a CQC-registered theatre. Results are long-lasting and natural-looking.',
      procedure_duration: '2-3 hours', anesthesia_type: 'General anaesthesia', recovery_time: '1-2 weeks to return to work; swelling settles over 3-6 months', final_result_time: '6-12 months',
      pricing_response: 'Prices start from £4,500 and are tailored to your individual anatomy. We offer a complimentary consultation to discuss your goals and provide a personalised quote.' },
    { display_name: 'Eyelid Surgery (Blepharoplasty)', service_key: 'blepharoplasty', category: 'Facial Aesthetics',
      description_for_ai: 'Blepharoplasty removes excess skin, muscle and fat from the upper and/or lower eyelids, restoring a refreshed, more youthful appearance. Can address both aesthetic and functional concerns.',
      procedure_duration: '1-2 hours', anesthesia_type: 'Local anaesthesia or sedation', recovery_time: '7-10 days', final_result_time: '2-3 months',
      pricing_response: 'Upper lids, lower lids, or combined procedures are priced separately. Please book a consultation for a personalised quote.' },
    { display_name: 'Facelift (Rhytidectomy)', service_key: 'facelift', category: 'Facial Aesthetics',
      description_for_ai: 'A facelift addresses sagging skin and deep folds of the face and neck, producing a natural, rejuvenated appearance. Mini and full facelift options are available.',
      procedure_duration: '3-5 hours', anesthesia_type: 'General anaesthesia', recovery_time: '2-4 weeks', final_result_time: '3-6 months',
      pricing_response: 'Prices vary depending on the extent of the procedure. Book a complimentary consultation for full details.' },
    { display_name: 'Breast Augmentation', service_key: 'breast_augmentation', category: 'Body Contouring',
      description_for_ai: 'Breast augmentation uses implants to increase the size and improve the shape of the breasts. We use CE-marked implants with a full manufacturer guarantee. A range of profiles and sizes are available.',
      procedure_duration: '1.5-2.5 hours', anesthesia_type: 'General anaesthesia', recovery_time: '1 week to return to office work; avoid strenuous exercise for 6 weeks', final_result_time: '3-6 months',
      pricing_response: 'Prices start from £5,500 and depend on implant choice. A personalised quote is given at consultation.' },
    { display_name: 'Liposuction', service_key: 'liposuction', category: 'Body Contouring',
      description_for_ai: 'Liposuction removes stubborn localised fat deposits that are resistant to diet and exercise. Suitable for the abdomen, flanks, thighs, arms, and chin. We use VASER or traditional tumescent techniques.',
      procedure_duration: '1-3 hours', anesthesia_type: 'General or local anaesthesia', recovery_time: '3-7 days', final_result_time: '3-6 months',
      pricing_response: 'Pricing depends on the number of areas treated. Please attend a consultation for an accurate quote.' },
    { display_name: 'Tummy Tuck (Abdominoplasty)', service_key: 'abdominoplasty', category: 'Body Contouring',
      description_for_ai: 'Abdominoplasty removes excess skin and tightens the abdominal muscles following pregnancy or significant weight loss. Mini and full tummy tuck options available.',
      procedure_duration: '2-4 hours', anesthesia_type: 'General anaesthesia', recovery_time: '2-3 weeks', final_result_time: '6-12 months',
      pricing_response: 'Prices from £6,000. Mini or full abdominoplasty options are discussed at consultation.' },
    { display_name: 'Labiaplasty', service_key: 'labiaplasty', category: 'Gynaesthetic Procedures',
      description_for_ai: 'Labiaplasty reshapes or reduces the labia minora or majora. It can address both aesthetic concerns and functional discomfort. Performed discreetly in a private, compassionate environment.',
      procedure_duration: '1-2 hours', anesthesia_type: 'Local or general anaesthesia', recovery_time: '1-2 weeks', final_result_time: '2-3 months',
      pricing_response: 'A personalised quote is provided following your consultation.' },
  ],

  dis: [
    { display_name: 'Dental Implants', service_key: 'implant', category: 'Oral Surgery',
      description_for_ai: 'Dental implants replace missing teeth with a titanium root and a porcelain or zirconia crown. They look and function like natural teeth and are designed to last a lifetime with proper care.',
      procedure_duration: 'Placement: 60 min; Crown: 2-3 months later', anesthesia_type: 'Local anaesthesia', recovery_time: '3-6 months osseointegration', final_result_time: '6-9 months',
      pricing_response: 'Single implant packages start from £2,500 including the crown. A full treatment plan and quote is provided after your assessment.' },
    { display_name: 'Porcelain Veneers', service_key: 'veneer', category: 'Cosmetic Dentistry',
      description_for_ai: 'Thin shells of high-quality porcelain are bonded to the front surface of the teeth, correcting colour, shape, and alignment. Minimal preparation is required and results are immediate.',
      procedure_duration: '2 appointments (7-10 days apart)', anesthesia_type: 'Local anaesthesia', recovery_time: 'None', final_result_time: 'Immediate',
      pricing_response: 'Veneers are priced per tooth. Smile makeover packages are available — please enquire at your consultation.' },
    { display_name: 'Teeth Whitening', service_key: 'whitening', category: 'Cosmetic Dentistry',
      description_for_ai: 'Professional in-chair teeth whitening can lighten your teeth by up to 8 shades in a single 60-minute appointment. We also offer take-home whitening kits for gradual results.',
      procedure_duration: '45-60 minutes', anesthesia_type: 'None', recovery_time: 'None', final_result_time: 'Immediate',
      pricing_response: 'In-chair whitening from £350; take-home kits from £180. Combined packages are available.' },
    { display_name: 'Invisible Braces (Invisalign)', service_key: 'invisalign', category: 'Orthodontics',
      description_for_ai: 'Invisalign uses a series of clear, removable aligners to straighten teeth discreetly. Unlike traditional braces, they can be removed for eating and cleaning. A free digital scan shows your projected results before you commit.',
      procedure_duration: '6-24 months treatment', anesthesia_type: 'None', recovery_time: 'None', final_result_time: '6-24 months',
      pricing_response: 'Prices from £2,800 depending on complexity. A complimentary scan and consultation is available.' },
    { display_name: 'Smile Design', service_key: 'smile_design', category: 'Cosmetic Dentistry',
      description_for_ai: 'A fully personalised smile makeover combining veneers, whitening, implants and orthodontics as needed. We use digital planning so you can preview your new smile before any treatment begins.',
      procedure_duration: 'Varies by scope', anesthesia_type: 'Varies', recovery_time: 'Varies', final_result_time: 'End of treatment',
      pricing_response: 'A bespoke treatment plan and price is prepared following your complimentary consultation and digital smile preview.' },
  ],

  sac: [
    { display_name: 'FUE Hair Transplant', service_key: 'fue_hair', category: 'Hair Transplant',
      description_for_ai: 'Follicular Unit Extraction (FUE) harvests individual hair follicles from the donor area and implants them into thinning or bald areas. The procedure leaves no linear scar and produces natural, permanent results.',
      procedure_duration: '6-8 hours', anesthesia_type: 'Local anaesthesia', recovery_time: '10-14 days for crusts to resolve', final_result_time: '12-18 months',
      pricing_response: 'Pricing is based on the number of grafts required. A complimentary hair analysis and quote is provided at your consultation.' },
    { display_name: 'DHI Hair Transplant (Pen Technique)', service_key: 'dhi_hair', category: 'Hair Transplant',
      description_for_ai: 'Direct Hair Implantation (DHI) uses a specialised Choi implanter pen to place follicles directly without the need for channel incisions first. This allows denser packing and a faster recovery.',
      procedure_duration: '6-8 hours', anesthesia_type: 'Local anaesthesia', recovery_time: '7-10 days', final_result_time: '12-18 months',
      pricing_response: 'Package pricing depends on graft count and technique. Please attend a free consultation for a full assessment.' },
    { display_name: 'PRP Hair Treatment', service_key: 'prp_hair', category: 'Medical Treatment',
      description_for_ai: 'Platelet-Rich Plasma (PRP) therapy uses growth factors from your own blood to stimulate hair follicles, reduce shedding and promote regrowth. No downtime required.',
      procedure_duration: '45-60 minutes', anesthesia_type: 'None', recovery_time: 'None', final_result_time: '3-6 months',
      pricing_response: 'A course of 3-6 sessions is recommended. Session and package pricing is available — please enquire.' },
    { display_name: 'Eyebrow Transplant', service_key: 'eyebrow_transplant', category: 'Hair Transplant',
      description_for_ai: 'FUE technique is used to restore sparse or thin eyebrows, precisely matching the natural growth direction and angle.',
      procedure_duration: '2-3 hours', anesthesia_type: 'Local anaesthesia', recovery_time: '7-10 days', final_result_time: '6-12 months',
      pricing_response: 'Prices differ for single and both brows. A consultation is required for an accurate quote.' },
    { display_name: 'Beard Transplant', service_key: 'beard_transplant', category: 'Hair Transplant',
      description_for_ai: 'Follicles are transplanted from the scalp or body into patchy areas of the beard to create a fuller, more defined look.',
      procedure_duration: '3-5 hours', anesthesia_type: 'Local anaesthesia', recovery_time: '7-10 days', final_result_time: '6-12 months',
      pricing_response: 'Pricing depends on the area and graft count. Please book a consultation for a personalised quote.' },
  ],

  lazer: [
    { display_name: 'Laser Hair Removal', service_key: 'laser_epilation', category: 'Laser',
      description_for_ai: 'Permanent hair reduction using medical-grade Alexandrite or Nd:YAG laser, suitable for all skin tones. Safe, effective, and suitable year-round for most body areas.',
      procedure_duration: '15-60 min depending on area', anesthesia_type: 'None (integrated cooling)', recovery_time: 'None', final_result_time: '6-8 sessions',
      pricing_response: 'Area packages and full-body packages available. Please enquire for a quote tailored to your treatment areas.' },
    { display_name: 'Botulinum Toxin (Botox)', service_key: 'botox', category: 'Injectables',
      description_for_ai: 'Botulinum toxin temporarily relaxes the muscles that cause forehead lines, frown lines and crow\'s feet, producing a natural, refreshed appearance that lasts 3-6 months.',
      procedure_duration: '15-20 minutes', anesthesia_type: 'None', recovery_time: 'None (avoid strenuous activity for 24h)', final_result_time: '5-7 days',
      pricing_response: 'Pricing is per area or per unit. A full-face assessment is included at your appointment.' },
    { display_name: 'Dermal Fillers', service_key: 'filler', category: 'Injectables',
      description_for_ai: 'Hyaluronic acid fillers restore volume and contour to the lips, cheeks, jawline and nasolabial folds. Results are immediate and can last 9-18 months depending on the area.',
      procedure_duration: '20-30 minutes', anesthesia_type: 'Topical numbing cream', recovery_time: '1-2 days mild swelling', final_result_time: 'Immediate (full result in 2 weeks)',
      pricing_response: 'Pricing is per syringe and by area. A complimentary consultation is available.' },
    { display_name: 'Skin Rejuvenation (Fractional Laser)', service_key: 'skin_rejuvenation', category: 'Laser',
      description_for_ai: 'Fractional CO2 or Erbium laser resurfacing addresses wrinkles, pigmentation, acne scars and enlarged pores. Stimulates new collagen for long-lasting improvement.',
      procedure_duration: '30-60 minutes', anesthesia_type: 'Topical numbing cream', recovery_time: '3-7 days redness', final_result_time: '1-3 months (3 sessions)',
      pricing_response: 'Pricing varies by treatment type and intensity. Please book a complimentary skin assessment.' },
  ],

  goz: [
    { display_name: 'LASIK / LASEK Laser Eye Surgery', service_key: 'lasik', category: 'Refractive Surgery',
      description_for_ai: 'Laser eye surgery permanently corrects short-sightedness, long-sightedness and astigmatism. Most patients achieve 20/20 vision or better. Vision stabilises within days.',
      procedure_duration: '10-15 min per eye', anesthesia_type: 'Eye drops (topical)', recovery_time: '1-2 days', final_result_time: '1 week',
      pricing_response: 'All-inclusive pricing from £1,995 per eye. A complimentary suitability assessment is the first step.' },
    { display_name: 'Cataract Surgery', service_key: 'cataract', category: 'Cataract',
      description_for_ai: 'The clouded natural lens is replaced with a premium intraocular lens (IOL). Monofocal, multifocal and trifocal lenses are available, potentially reducing the need for glasses.',
      procedure_duration: '20-30 minutes', anesthesia_type: 'Local (eye drops)', recovery_time: '1-2 weeks', final_result_time: '1 month',
      pricing_response: 'Pricing depends on lens choice (standard/premium/trifocal). A full breakdown is given at your assessment.' },
    { display_name: 'Squint Surgery (Strabismus)', service_key: 'strabismus', category: 'Surgery',
      description_for_ai: 'Surgical realignment of the eye muscles to correct squint in children and adults. Performed under general anaesthesia as a day case procedure.',
      procedure_duration: '30-60 minutes', anesthesia_type: 'General anaesthesia', recovery_time: '1-2 weeks', final_result_time: '1-2 months',
      pricing_response: 'Pricing covers one or both eyes. Please attend a consultation for a full assessment and quote.' },
  ],

  ortopedi: [
    { display_name: 'Knee Replacement Surgery', service_key: 'knee_replacement', category: 'Joint Surgery',
      description_for_ai: 'Total or partial knee replacement surgery replaces the worn joint surfaces with high-quality prosthetics. Most patients are walking the same day with physiotherapy support.',
      procedure_duration: '1.5-2.5 hours', anesthesia_type: 'General or spinal anaesthesia', recovery_time: '6-12 weeks', final_result_time: '6-12 months',
      pricing_response: 'All-inclusive packages are available. Pricing varies by implant type. A consultation is required for a full quote.' },
    { display_name: 'Knee Arthroscopy', service_key: 'knee_arthroscopy', category: 'Arthroscopy',
      description_for_ai: 'Keyhole surgery to treat meniscal tears, ligament injuries and cartilage damage inside the knee. Performed as a day case with a rapid return to activity.',
      procedure_duration: '30-90 minutes', anesthesia_type: 'General anaesthesia', recovery_time: '1-6 weeks', final_result_time: '3-6 months',
      pricing_response: 'Fixed-price packages available. Please enquire for a procedure-specific quote.' },
    { display_name: 'Physiotherapy & Rehabilitation', service_key: 'physio', category: 'Rehabilitation',
      description_for_ai: 'Evidence-based physiotherapy for post-surgical rehabilitation, sports injuries and musculoskeletal conditions. Sessions include manual therapy, therapeutic exercise and electrotherapy.',
      procedure_duration: '45-60 min per session', anesthesia_type: 'None', recovery_time: 'None', final_result_time: '4-8 weeks',
      pricing_response: 'Session and block-booking packages available. Please enquire for current rates.' },
  ],

  dermato: [
    { display_name: 'Acne Treatment', service_key: 'acne', category: 'Medical Dermatology',
      description_for_ai: 'Consultant-led acne management combining prescription topicals, chemical peels and laser therapy. Suitable for mild to severe acne including cystic acne.',
      procedure_duration: 'Session-based', anesthesia_type: 'None', recovery_time: 'None–3 days', final_result_time: '2-4 months',
      pricing_response: 'Pricing depends on the treatment plan. A consultation is required to assess your skin and recommend the appropriate protocol.' },
    { display_name: 'Mole Check & Dermoscopy', service_key: 'mole_check', category: 'Diagnosis',
      description_for_ai: 'Full-body mole mapping using dermoscopy to identify suspicious lesions. Any concerning moles can be removed on the same day and sent for histological analysis.',
      procedure_duration: '30-60 minutes', anesthesia_type: 'None (local if removed)', recovery_time: 'None', final_result_time: 'Immediate',
      pricing_response: 'Assessment and removal are priced separately. Please enquire for current rates.' },
    { display_name: 'Chemical Peel', service_key: 'chemical_peel', category: 'Cosmetic Dermatology',
      description_for_ai: 'Medical-grade glycolic, TCA or salicylic acid peels to resurface the skin, improving pigmentation, texture and acne scarring.',
      procedure_duration: '30-45 minutes', anesthesia_type: 'None', recovery_time: '3-7 days', final_result_time: '2-4 sessions',
      pricing_response: 'Pricing varies by peel depth and area. Please book a skin consultation for a tailored plan.' },
  ],

  diyetisyen: [
    { display_name: 'Personalised Nutrition Consultation', service_key: 'nutrition_consult', category: 'Consultation',
      description_for_ai: 'A registered dietitian creates a bespoke nutrition plan for weight management, medical conditions or general wellbeing. Initial 60-minute consultation includes a full dietary assessment.',
      procedure_duration: '60 min (initial)', anesthesia_type: 'None', recovery_time: 'None', final_result_time: '4-12 weeks',
      pricing_response: 'Initial consultation and follow-up sessions are priced separately. Block-booking packages are available.' },
    { display_name: 'Sports Nutrition', service_key: 'sports_nutrition', category: 'Sports',
      description_for_ai: 'Tailored nutrition and supplementation strategies for athletes looking to improve performance, build muscle or reduce body fat, developed by a qualified sports dietitian.',
      procedure_duration: '60 minutes', anesthesia_type: 'None', recovery_time: 'None', final_result_time: '4-12 weeks',
      pricing_response: 'Programme pricing depends on duration and content. Please enquire for details.' },
  ],

  psikoloji: [
    { display_name: 'Individual Psychotherapy', service_key: 'individual_therapy', category: 'Therapy',
      description_for_ai: 'Evidence-based one-to-one therapy for anxiety, depression, trauma, OCD and relationship difficulties. Our BACP-accredited psychologists use CBT, EMDR and other evidence-based approaches.',
      procedure_duration: '50 minutes', anesthesia_type: 'None', recovery_time: 'None', final_result_time: '8-20 sessions',
      pricing_response: 'Please contact us for current session fees. Block-booking packages are available.' },
    { display_name: 'Couples Therapy', service_key: 'couples_therapy', category: 'Therapy',
      description_for_ai: 'Relationship counselling for couples experiencing communication difficulties, conflict or life transitions. Sessions are conducted in a confidential, non-judgemental environment.',
      procedure_duration: '60-75 minutes', anesthesia_type: 'None', recovery_time: 'None', final_result_time: '8-16 sessions',
      pricing_response: 'Couples session fees differ from individual sessions — please contact us for details.' },
  ],
};

// ─── FAQ TEMPLATES ────────────────────────────────────────────────────────────

export const CLINIC_FAQ_TEMPLATES: Record<string, any[]> = {
  estetik: [
    { question_patterns: ['fiyat', 'ne kadar', 'ücret', 'kaça'], answer: 'Fiyatlarımız kişiye özel belirlenmektedir. Her hastanın anatomisi farklı olduğundan, kesin fiyat için ücretsiz ön görüşmemize davet ediyoruz.', category: 'fiyat' },
    { question_patterns: ['acıyor mu', 'ağrı', 'ağrılı mı', 'acı hissedilir mi'], answer: 'Operasyonlarımız anestezi altında gerçekleştirildiğinden işlem sırasında ağrı hissetmezsiniz. İyileşme sürecinde hafif rahatsızlık olabilir, verilen ağrı kesicilerle yönetilebilir.', category: 'medikal' },
    { question_patterns: ['kaç gün izin', 'iş', 'işe ne zaman', 'iyileşme süresi'], answer: 'İyileşme süresi operasyona göre değişir. Küçük işlemlerde 3-5 gün, kapsamlı operasyonlarda 1-2 hafta dinlenme tavsiye edilir.', category: 'medikal' },
    { question_patterns: ['güvenli mi', 'risk', 'tehlikeli mi', 'komplikasyon'], answer: 'Tüm operasyonlar uluslararası standartlarda uzman ekibimiz tarafından gerçekleştirilir. Her operasyonda belirli riskler mevcuttur; bu riskler muayenede detaylıca açıklanır.', category: 'medikal' },
    { question_patterns: ['taksit', 'ödeme', 'kredi kartı'], answer: 'Tüm kredi kartlarına taksit imkânımız mevcuttur. Faizsiz taksit seçenekleri için muayene sırasında bilgi alabilirsiniz.', category: 'fiyat' },
  ],
  dis: [
    { question_patterns: ['implant fiyat', 'implant ne kadar', 'implant kaça'], answer: 'İmplant fiyatları kullanılan marka ve adete göre değişir. Muayene sonrası size özel tedavi planı ve fiyat sunulur.', category: 'fiyat' },
    { question_patterns: ['ağrılı mı', 'acıyor mu', 'diş çekimi acı'], answer: 'Tüm işlemlerimiz lokal anestezi altında yapılır, ağrı hissetmezsiniz. İşlem sonrası hafif hassasiyet normal olup birkaç günde geçer.', category: 'medikal' },
    { question_patterns: ['garanti', 'kaç yıl', 'bozulur mu'], answer: 'İmplantlarımız ömür boyu garantilidir. Zirkonyum ve porselen kaplamalarda 5 yıl garanti sunmaktayız.', category: 'genel' },
  ],
  sac: [
    { question_patterns: ['greft fiyat', 'saç ekimi ne kadar', 'fiyat'], answer: 'Fiyat, ekilecek greft sayısına ve kullanılan tekniğe göre belirlenir. Ücretsiz saç analizi sonrasında size özel fiyat sunulur.', category: 'fiyat' },
    { question_patterns: ['acıyor mu', 'ağrı', 'anestezi'], answer: 'Lokal anestezi uygulanır. İşlem sırasında ağrı hissetmezsiniz.', category: 'medikal' },
    { question_patterns: ['ne zaman çıkar', 'sonuç ne zaman', 'uzama'], answer: 'Ekilen saçlar 2-3 ay içinde dökülür (şok dökülme normaldir), 3-4. ayda yeniden çıkmaya başlar, 12-18. ayda tam sonuç görülür.', category: 'medikal' },
    { question_patterns: ['kalıcı mı', 'tekrar döker mi'], answer: 'Ense bölgesinden alınan saçlar genetik olarak kalıcıdır.', category: 'medikal' },
  ],
  lazer: [
    { question_patterns: ['botoks kaç ay', 'ne kadar sürer', 'kalıcı mı'], answer: 'Botoks etkisi ortalama 4-6 ay sürer. Düzenli tekrarlanan uygulamalarla etki süresi uzayabilir.', category: 'medikal' },
    { question_patterns: ['dolgu ağrılı mı', 'acıyor mu'], answer: 'Lokal krem anestezi uygulandığından ağrı minimumdur.', category: 'medikal' },
    { question_patterns: ['lazer epilasyon kaç seans', 'kaç seans yeterli'], answer: 'Ortalama 6-8 seans, 4-6 hafta aralıklarla uygulanır.', category: 'medikal' },
  ],
};

const EN_FAQ_TEMPLATES: Record<string, any[]> = {
  estetik: [
    { question_patterns: ['how much', 'cost', 'price', 'fees'], answer: 'Our prices are tailored to each individual patient as no two cases are the same. We offer a complimentary consultation where we can discuss your goals and provide a personalised quote.', category: 'pricing' },
    { question_patterns: ['is it painful', 'will it hurt', 'anaesthesia', 'pain'], answer: 'All our surgical procedures are performed under appropriate anaesthesia so you will not feel pain during the operation. Post-operative discomfort is normal and well-managed with prescribed pain relief.', category: 'medical' },
    { question_patterns: ['how long to recover', 'time off work', 'recovery', 'downtime'], answer: 'Recovery time depends on the procedure. Minor treatments may require only 3-5 days, whilst more involved operations may need 1-2 weeks off work. Your surgeon will give you specific guidance at your consultation.', category: 'medical' },
    { question_patterns: ['is it safe', 'risks', 'complications'], answer: 'All procedures carry some degree of risk. Our surgeons are fully trained, GMC-registered specialists who will discuss all risks and benefits with you in detail during your consultation, in line with Montgomery guidelines.', category: 'medical' },
    { question_patterns: ['finance', 'payment plan', 'monthly payments', 'pay in installments'], answer: 'We offer 0% finance options through reputable providers. Details are available at your consultation.', category: 'pricing' },
    { question_patterns: ['GP referral', 'do I need a referral', 'self-refer'], answer: 'You can self-refer directly to our clinic — you do not need a GP referral for a private consultation. We do recommend informing your GP if you proceed with surgery.', category: 'general' },
  ],
  dis: [
    { question_patterns: ['how much are implants', 'implant cost', 'implant price'], answer: 'Implant pricing varies depending on the brand, complexity and number of implants. A full treatment plan and fixed-price quote is provided following your assessment.', category: 'pricing' },
    { question_patterns: ['is it painful', 'does it hurt', 'pain'], answer: 'All our dental procedures are performed under local anaesthesia so you will not feel pain. Some mild sensitivity afterwards is normal and settles within a few days.', category: 'medical' },
    { question_patterns: ['guarantee', 'warranty', 'how long will it last'], answer: 'Our implants come with a lifetime guarantee. Zirconia and porcelain crowns and veneers carry a 5-year guarantee. Routine care is essential to maintain your results.', category: 'general' },
  ],
  sac: [
    { question_patterns: ['how much', 'cost', 'price', 'graft price'], answer: 'Pricing is based on the number of grafts required and the technique used. A free hair analysis and personalised quote is provided at your consultation.', category: 'pricing' },
    { question_patterns: ['is it painful', 'does it hurt'], answer: 'Local anaesthesia is used throughout the procedure. You will not feel pain; some pressure sensation is normal.', category: 'medical' },
    { question_patterns: ['when will I see results', 'how long for hair to grow', 'timeline'], answer: 'Transplanted hair sheds within 2-3 months (this is normal — shock loss). Regrowth begins from month 3-4 and full results are visible at 12-18 months.', category: 'medical' },
    { question_patterns: ['is it permanent', 'will it fall out again'], answer: 'Donor hair taken from the back and sides of the scalp is genetically resistant to male-pattern hair loss and will be permanent in the recipient area.', category: 'medical' },
  ],
  lazer: [
    { question_patterns: ['how long does botox last', 'how long does it last'], answer: 'The effects of botulinum toxin typically last 3-6 months. With regular treatment the results often improve over time.', category: 'medical' },
    { question_patterns: ['do fillers hurt', 'are injections painful'], answer: 'A topical numbing cream is applied beforehand, making the procedure very comfortable. You may feel a little pressure but significant pain is uncommon.', category: 'medical' },
    { question_patterns: ['how many sessions for laser hair removal', 'how many sessions'], answer: 'Most patients require 6-8 sessions spaced 4-6 weeks apart. Skin and hair type influence the number of sessions needed.', category: 'medical' },
  ],
};

export const GENERAL_FAQ_TEMPLATES = [
  { question_patterns: ['randevu', 'nasıl randevu', 'muayene', 'görüşme'], answer: 'Telefon, WhatsApp veya web sitemiz üzerinden randevu alabilirsiniz.', category: 'genel' },
  { question_patterns: ['adres', 'nerede', 'konum', 'nasıl gidilir'], answer: 'Adresimiz ve ulaşım bilgisi için web sitemizi ziyaret edebilir ya da bizi arayabilirsiniz.', category: 'genel' },
  { question_patterns: ['sigorta', 'SGK', 'özel sigorta'], answer: 'Bazı işlemlerimiz özel sigorta kapsamında değerlendirilebilir. Sigorta şirketinizle teyit etmenizi öneririz.', category: 'genel' },
  { question_patterns: ['online görüşme', 'video', 'online muayene'], answer: 'Ön değerlendirme için online görüşme seçeneğimiz mevcuttur.', category: 'genel' },
];

const EN_GENERAL_FAQ_TEMPLATES = [
  { question_patterns: ['how to book', 'appointment', 'consultation', 'how do I book'], answer: 'You can book online via our website, by phone, or by WhatsApp. We offer both in-person and online video consultations.', category: 'general' },
  { question_patterns: ['where are you', 'location', 'address', 'how to find you'], answer: 'Please visit our website for address and travel directions. We are easily accessible by public transport and there is parking nearby.', category: 'general' },
  { question_patterns: ['insurance', 'private health insurance', 'covered'], answer: 'Some procedures may be covered by private health insurance depending on your policy. We recommend checking with your insurer beforehand. We accept self-paying patients.', category: 'general' },
  { question_patterns: ['virtual consultation', 'online appointment', 'video call'], answer: 'We offer online video consultations for initial assessments. An in-person visit will be required before any procedure.', category: 'general' },
];

// ─── BILINGUAL ACCESSOR FUNCTIONS ────────────────────────────────────────────

export function getClinicTemplates(lang: Lang, typeKey: string): any[] {
  if (lang === 'en') return EN_SERVICE_TEMPLATES[typeKey] ?? [];
  return CLINIC_SERVICE_TEMPLATES[typeKey] ?? [];
}

export function getFaqTemplates(lang: Lang, typeKey: string): any[] {
  if (lang === 'en') return EN_FAQ_TEMPLATES[typeKey] ?? [];
  return CLINIC_FAQ_TEMPLATES[typeKey] ?? [];
}

export function getGeneralFaqTemplates(lang: Lang): any[] {
  return lang === 'en' ? EN_GENERAL_FAQ_TEMPLATES : GENERAL_FAQ_TEMPLATES;
}
