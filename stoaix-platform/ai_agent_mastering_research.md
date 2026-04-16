# AI Agent Mastering — STOAIX Araştırma Belgesi

Sağlık turizmi klinikleri (saç ekimi, diş implant, cerrahi estetik, medikal estetik) için **AI asistan stratejisinin** kapsamlı referans rehberi. Bu belge STOAIX'in ürün geliştirme, dokümantasyon mimarisi ve müşteri stratejisini şekillendirmek için tasarlanmıştır.

---

## Executive Summary

AI asistan teknolojisi klinik operasyonlarında yapısal dönüşüm yaratmaktadır. Ancak başarı sadece teknoloji seçimiyle değil, **hangi probleme ne tür agent'in** uygun olduğunun anlaşılmasıyla belirlenmiştir.

STOAIX'in 3K MRR'den 15K+ MRR'ye ulaşması için, 10 farklı **iş görevi odaklı agent şablonunun** (Resepsiyonist, Outbound Follow-up, Lead Reactivation, vb.) yapılandırılması ve türkiye-uk pazar farklılıklarının dikkate alınması gerekmektedir.

**Kültürel ve Operasyonel Gerçekler:**
- Türkiye'deki kliniklerin %70'i WhatsApp-öncelikli, sesli AI konusunda çekimser (riskten korkar)
- UK pazarında sağlık turizmi klinikleri premium deneyim beklentisi yüksektir — ses kalitesi ve insansılık kritik
- Lead kaybı sorunu (mesai dışı aramalar, eski lead datası) her iki pazarda da ekonomik olarak en yüksek değerledir
- Follow-up ve randevu hatırlatma otomasyonu yok sayılsa da, ROI hesaplamasında en kolay somutlaştırılabilir

**Temel Bulgu:** Sesli asistan "wow" etkisi yaratır, ancak bu etki prompt mimarisi, turn-taking kalitesi ve state-based yönetiminden geliyor — sadece TTS ses seçiminden değil.

---

## 1. AI Agent Kategorileri (Genel Taksonomi)

### 1.1 Chatbot vs Sesli Asistan vs Task Agent

| Kategori | Tanım | Güç | Zayıflık | Klinik Kullanımı |
|---|---|---|---|---|
| **Chatbot (Metin)** | Mesaj kanallarında (WhatsApp, web) soru-cevap | Hızlı yanıt, tarih, metin-tabanlı | Senkron olması gerekir, karmaşık sohbetler zor | SMS, WhatsApp, Web chat (ön tarama) |
| **Sesli Asistan** | Telefon/SIP aramaları otomatik yanıtlar | İnsana yakın, hızlı, detaylı sohbet | Teknis olarak daha karmaşık, latency kritik | Gelen aramalar, randevu teyiti, follow-up |
| **Task Agent** | Belirli iş akışı (takvim entegrasyon, veri tarama) | Deterministik, güvenilir, ölçülebilir | Dış entegrasyona bağlı, insan müdahalesi gerekli | Randevu oluşturma, CRM senkronizasyon |

**STOAIX Avantajı:** Üç tipi de entegre sunabilmek. Klinik müşterisinin sorunu hangisiyse, o kanala yatırım yapma.

### 1.2 Inbound vs Outbound Mimariler

| Mimari | Tetikleyici | Hedef | Risk |
|---|---|---|---|
| **Inbound** | Hasta araması / mesaj gönderişi | Cevap ver, randevu al, handoff et | Yoğun zaman dilimleri, kaçırılan çağrılar |
| **Outbound** | Sistematic batch (eski lead, hatırlatma) | Proaktif temas, re-engagement, güven kurma | Belirsiz kabul oranı, spam algılanma riski |
| **Hibrid** | İkisinin kombinasyonu | Tam customer journey kapsama | Yönetim karmaşıklığı |

**Türkiye pazar bulgusu:** %60 klinik inbound çağrı kaybından şikâyet ediyor. Outbound'a sadece eski lead reactivation'da investor bulur.

### 1.3 Senkron vs Asenkron Davranışlar

- **Senkron (Gerçek-zaman):** Telefon araması, canlı sohbet — bekleme toleransı düşük
- **Asenkron (Uzun-vadeli):** Email, WhatsApp sequence'ları, otomatik hatırlatmalar — yanıt gecikmesine tolerans var

STOAIX'in üstünlüğü: Senkron (sesli arama) + Asenkron (n8n workflow'lar) kombinasyonunu sunması. Klinik bunu tek panelden yönetebilir.

### 1.4 Hangi Agent Tipi Hangi Business Problemini Çözer

| Business Problem | Optimal Agent | Kanał | KPI |
|---|---|---|---|
| Mesai dışı aramalar gidiyor | Sesli asistan (inbound) | SIP telefon | Cevaplanan çağrı oranı ↑ |
| Randevu soruları masayı meşgul ediyor | Chatbot | WhatsApp/Web | Çalışan saati tasarrufu |
| Konsültasyon sonrası takip yok | Task agent + Outbound | n8n workflow'ları | Follow-up tamamlanma oranı |
| Eski lead datası atıl duruyor | Outbound Agent (bot) | WhatsApp/SMS | Lead reactivation oran |
| Hasta kaygısı / güven eksikliği | Sesli asistan (insansı) | Telefon | Handoff öncesi dönüşüm ↑ |

---

## 2. İş Görevi Odaklı Agent Şablonları (10 Temel Tür)

Her agent şablonu aşağıdaki yapıya sahip olacak:
- **Görev:** Ne yapıyor
- **Tetikleyici:** Ne zaman devreye giriyor
- **Kanal:** Hangi kanalda çalışıyor
- **Hedef Kullanıcı:** Hangi klinik tipi en çok fayda görür
- **KPI Etkisi:** Ölçülebilir etki
- **Minimum Config:** Çalışmaya başlamak için gerekli asgari veri
- **Örnek Senaryo:** Gerçek dünya örneği

### 2.1 Resepsiyonist Agent

**Görev:** Gelen aramaları karşılamak, kliniğin bilgilerini vermek, kalitatör soruları sorarak lead'i nitelemek.

**Tetikleyici:** Hasta / potansiyel hasta telefon arar.

**Kanal:** Sesli (SIP telefon, Twilio veya LiveKit), WhatsApp sesli mesaj (opsiyonel).

**Hedef Kullanıcı:** Tüm klinik tipleri, özellikle yoğun call center olan saç ekimi ve diş klinikleri.

**KPI Etkisi:**
- Cevaplanan çağrı oranı: +70% (mesai saatleri içinde)
- İlk temas süresi: < 5 saniye
- Lead kalitesi skoru: +30% (doğru kalitatör soruları sayesinde)

**Minimum Config:**
- Klinik adı, telefon, adres
- 10-15 adet sık sorulan soru (SSS) cevapları
- Intake şeması (ad, telefon, ne tür prosedür, zaman tercihı)
- Türkçe sistem prompt + persona

**Örnek Senaryo:**

```
Hasta:   "Merhaba, saç ekimi hakkında bilgi almak istiyorum."
Agent:   "Sizi saç ekimi konusunda danışabilirim. İlk olarak, 
         ne tür bilgiye ihtiyaç duyuyorsunuz — süreç, fiyat, 
         veya uygunluk hakkında?"
Hasta:   "Fiyat biraz pahalı olmaz mı?"
Agent:   "Anlıyorum, cost konusu önemli. Bize halkından kaç tane 
         vericek dediler? [bilgi alındı] O zaman % ne taşıyorsunuz? 
         Size uygun seçeneğ Gözlemlerim... [randevu teklifi]"
```

**Stack'te Uygulaması:**
- LiveKit Agents (Python)
- Deepgram STT (Nova-2 veya Flux)
- OpenAI GPT-4o Mini (LLM)
- Cartesia Sonic 3 (TTS)
- n8n (randevu oluşturma entegrasyonu)

---

### 2.2 Inbound Call Agent (Telefon Sorgu)

**Görev:** Gelen arayan ile 5-10 dakikalık konsültasyon yapmak, teşhis etmek, randevu önerisinde bulunmak.

**Tetikleyici:** Hasta portalı / web sitesi "Danışman Ara" butonu veya direkt arama.

**Kanal:** Sesli (Telefon).

**Hedef Kullanıcı:** Özel klinikler, sağlık turizmi odaklı (insan danışmanı 24/7 sağlamak pahalı).

**KPI Etkisi:**
- Danışmanlık kapasitesi: 5x artış (insan danışman ihtiyacı azalır)
- Randevu conversion: +40% (doğru soru ve empati nedeniyle)
- Danışman saatinden tasarrufu: 2 FTE

**Minimum Config:**
- Detaylı prosedür açıklamaları (saç ekimi: nasıl çalışır, kaç seans, ne zaman sonuç, vs.)
- Fiyat rehberi (range'ler, neden değişken, vb.)
- Hasta oburyu soruları (yaş sınırı, cilt tipi, vb.)
- Objection handling (fiyat, zaman, sonuç garantisi)

**Örnek Senaryo:**

```
Hasta:     "İlk defa saç ekimi düşünüyorum, çok korkuyorum."
Agent:     "Normal. Çoğu kişi ilk başta endişeli. 
           Prosedür aslında çok rahattır — saç köklerini 
           one by one taşıyor, lokalsiz enjeksiyon ile."
[Agent somut cevap verdi, sonra soru sordu]
Hasta:     "Ne kadar sürüyor?"
Agent:     "8 saatlik bir oturumda ortalama 2500-3000 saç taşırız. 
           Uyunabilir durumda yaparsınız, dinlenç mola verilir."
[Detay + insani yaklaşım = Hasta yeniden randevu teklifi açık hale gelir]
```

---

### 2.3 Outbound Follow-up Agent

**Görev:** Müşteri görüştükten sonra (konsültasyon, randevu) takip arması yapmak — randevu onayı, post-op kontrol, memnuniyet anketi.

**Tetikleyici:** Randevu tarihi ±1 gün öncesi, prosedürün 7 gün sonrası.

**Kanal:** Sesli (outbound arama) veya WhatsApp (text/voice message).

**Hedef Kullanıcı:** Tüm kliniklerde, özellikle mednastlık estetik ve saç ekimi (follow-up kapsamı geniş).

**KPI Etkisi:**
- Randevu gelmeme oranı (no-show): -45%
- Müşteri memnuniyeti (post-op): +60% (cılız follow-up sayesinde güven artışı)
- Tekrar prosedür booking: +25% (başarılı mümkülük).

**Minimum Config:**
- Outbound script şablonu (randevu teyiti, post-op kontrol, memnuniyet soruları)
- Başarı metriği (randevu geliş yüzdesi)
- Yeniden iletişim kuralları (cevap vermediyse 2 deneme sonra manuel handoff)

**Örnek Senaryo:**

```
Agent (outbound):   "Merhaba [Ad], Kliniği arıyorum. 
                    Yarın saat 10'teki randevunuz için 
                    bir hatırlatma olmak istedik — hala 
                    plans yapıyor musunuz?"
Hasta:              "Evet, geliyorum."
Agent:              "Harika! Bir de şunu hatırlatmak istedim: 
                    gelmeden 2 saat önce özel krem sürmeyi 
                    unutmayın. Başka sorunuz var mı?"
```

---

### 2.4 Lead Reactivation Agent

**Görev:** Eski lead listesine (3-12 ay öncesi, cevap vermeyenler) otomatik, kişiselleştirilmiş şekilde ulaşmak, yeniden ilgi uyandırmak, randevu almak.

**Tetikleyici:** Günlük batch (örn. 50-100 eski lead/gün).

**Kanal:** WhatsApp (chatbot) veya SMS, ardından sesli arama (high-intent leads).

**Hedef Kullanıcı:** Yoğun reklam yapan, eski lead datası olan tüm kliniklerin **#1 ROI kaynağı**.

**KPI Etkisi:**
- Lead cost: 1/10 (yeni lead generation'a kıyasla)
- Conversion oranı: 5-8% (eski lead, tekrarlanmış temas)
- Başlangıç momentum: 2-3 ay işletme dürüst ROI (yatırım geri dönüş)

**Minimum Config:**
- Eski lead listesi (SQL, Excel, CRM export)
- A/B test edilmiş mesaj şablonları (WhatsApp primer)
- Qualification criteria (hangi lead'leri telefonda arama yetkisi var)

**Örnek Senaryo:**

```
SMS (Automated):    "Merhaba [Ad], 6 ay önce saç ekimini 
                    düşünmüştünüz. Hala ilgileniyorsanız, 
                    bize hızlıca danışan Deniz ile konuşmak ister misiniz?
                    👇 [link]"
[Click → Web agent handoff ya da otomatik WhatsApp]
WhatsApp Agent:     "Merhaba! Saç ekimi hakkında sorularınız var mı? 
                    Şu anda özel fiyatımız var: 2500 graft = $[X]. 
                    Detay vereyim mi?"
```

STOAIX'in **$797 Reactivation paket'inin** temel yapısı budur.

---

### 2.5 Patient Satisfaction / Survey Agent

**Görev:** Post-op veya post-konsültasyon memnuniyeti ölçmek, sorun varsa escalate etmek, Google review toplama.

**Tetikleyici:** Prosedür sonrası 1-7 gün.

**Kanal:** Voice call, WhatsApp, SMS.

**Hedef Kullanıcı:** Premium klinikler (brand reputation yönetimi önemli), UK pazarı (online review'lar kritik).

**KPI Etkisi:**
- Google review sayısı: +200% (otomatik prompt)
- Satisfaction score: +0.8 puan (memnuniyeti belirtilir)
- Negatif word-of-mouth prevention: müşteri şikâyeti erkenden algılanır

**Minimum Config:**
- 5-7 cümlelik memnuniyet sorusu
- Escalation kuralı (score < 6 = manuel handoff)
- Review request template

---

### 2.6 Sales Agent

**Görev:** Potansiyel hasta ile detaylı satış konuşması yapmak — prosedürü açıklamak, objection handle etmek, randevu kapatmak.

**Tetikleyici:** Lead pipeline'da "hot lead" işareti, doğrudan danışman atama isteği.

**Kanal:** Sesli (telefon).

**Hedef Kullanıcı:** İnsan satış danışmanı tutulamayan kliniklerde başlangıç (low-ticket), premium kliniklerde AI + human hybrid model.

**KPI Etkisi:**
- Satış danışmanı kapasitesi: 3x (AI hazırlık yapıyor, insan sadece sıcak lead'i kapatır)
- Close rate: +20% (konsültasyon uzmanlaşması)

**Minimum Config:**
- Satış playbook (objection handling, soft close)
- Pricing authority (hangi diskaunt verilip verilmeyeceği)
- Handoff trigger (lead'i ne zaman insan'a ver)

---

### 2.7 Post-Operation Follow-up Agent

**Görev:** Cerrahi / invazif prosedür sonrası hastanın recovery'sini takip etmek, komplikasyon erken belirtilerini tespit etmek, ilaç uygulaması hatırlatması.

**Tetikleyici:** Ameliyat sonu saatler, 3. gün, 7. gün, 14. gün.

**Kanal:** WhatsApp voice message, sesli arama.

**Hedef Kullanıcı:** Cerrahi estetik, saç ekimi, diş implant (yüksek post-op touchpoint gereksinimi).

**KPI Etkisi:**
- Komplikasyon früh detection: +80% (manuel hatırlatma yok)
- Hasta memnuniyeti: +70% (proaktif temas → güven)
- Malpractice risk: azalır (dokümantasyon + patient feedback)

**Minimum Config:**
- Post-op checklist (acı seviyesi, şişme, enfeksiyon belirtileri)
- Escalation threshold (ne zaman doktor uyarılır)
- Ilaç / bakım reminder'ları

---

### 2.8 Call Center / Overflow Agent

**Görev:** Yoğun zaman dilimlerinde gelen aramaların devlet kısmını yönlendirmek, basit soruları cevaplamak, complex case'leri kuyruğa almak.

**Tetikleyici:** Telefon sistemi > 2 yoğun, beklemede 3+ çağrı.

**Kanal:** Sesli (SIP).

**Hedef Kullanıcı:** Yüksek call volume klinikleri (saç ekimi, popüler diş).

**KPI Etkisi:**
- Çağrı abandonment oranı: -60%
- Hizmet düzeyi (SLA): + 95% to 98%
- İnsan danışman stress: -50%

---

### 2.9 Appointment Reminder Agent

**Görev:** Randevu gün öncesi veya saati öncesi otomatik hatırlatma göndermek.

**Tetikleyici:** Randevu tarihi -24 saat, -2 saat.

**Kanal:** SMS, WhatsApp, push notification.

**Hedef Kullanıcı:** Tüm kliniklerde **en yüksek ROI** (no-show oranını -50% düşürür).

**KPI Etkisi:**
- No-show oranı: -45%
- Ek gelir (boş slot'ın doldurulması): +15% kapasite

**Minimum Config:**
- Reminder message şablonu (timing, tonality)
- Rescheduling link (WhatsApp, web booking)

---

### 2.10 Dead Lead Win-Back Agent

**Görev:** Uzun süredir hiç temas kurmayan lead'leri yeniden harekete geçirmek — nostalji, yeni teklif, acil kampanya.

**Tetikleyici:** 6-12 ayda hiç temas yok; yıllık 1-2 batch campaign.

**Kanal:** Email, SMS, WhatsApp.

**Hedef Kullanıcı:** Seasonal klinikleri (kış ayında saç ekimi düşünenler), yeni prosedür pazar genişletimi.

**KPI Etkisi:**
- Eski lead pool reactivation: 3-5%
- Cost-effective (kampanya maliyeti düşük)

---

## 3. Kanal Analizi

### 3.1 WhatsApp Business API

**Tarihçe & Neden Merkezi:** Türkiye'de kliniklerin %85'i WhatsApp'ta hastalarla iletişim kuruyor. Orada olmamak = müşteri kaybı.

**STOAIX Avantajı:** WhatsApp Bot (chatbot) + sesli asistan (telefon) kombinasyonu.

**Kullanım Örneği:**
```
1. Hasta web sitesinde "Bilgi Al" → WhatsApp Bot dev receives her
2. Bot: "Merhaba, ne hakkında bilgi almak istiyorsunuz?"
3. Bot 2-3 soru ile pre-qualify → "Sizi danışman Deniz ile bağlayabilirim"
4. Handoff → insan danışman ya da telefonda Sesli Agent
```

**Limitsizler:**
- Rate limiting (batching gerekli)
- Approval process (template mesaj tipi önceden onaylanmalı)
- Cost per message ($0.002-$0.05 aralığı)

**Tavsiye:** Core pakette WhatsApp Bot dahil olmalı.

---

### 3.2 Instagram Direct Message

**Market Reality:** UK'de younger demographic klinikleri Instagram'da arar. Türkiye'de daha sınırlı ama büyüyor.

**STOAIX Planlaması:** Growth pakette opsiyonel add-on.

**Teknik Zorluk:** Meta API'nin rate limiting'i ve mesaj sırasılama. n8n entegrasyonu gerekli.

---

### 3.3 Sesli Kanal (SIP / VoIP, Twilio / LiveKit bağlamında)

**Mimarı:**
```
Telefon çağrısı → Twilio SIP trunk / LiveKit Cloud
    ↓
Deepgram STT (gerçek-zaman)
    ↓
OpenAI LLM (context + tools)
    ↓
Cartesia TTS (prosody kontrolü ile)
    ↓
Telefon'a geri → ses çıkışı
```

**Latency Challenge:** STT + LLM + TTS = 800ms-1500ms. Kullanıcı bunu hisseder ("boşluk"). Çözüm = preemptive_generation + bridge sentences.

**STOAIX Rekabeti:** LiveKit + Deepgram Flux kombinasyonu, RetellAI'den daha hızlı ve Türkçe-odaklı.

---

### 3.4 SMS / SMS Fallback

**Kullanımı:** Sesli kanal yanıt vermezse, WhatsApp mesaj yok ise SMS'e düşen başarısız arama tente.

**Cost:** $0.01-0.03 per SMS (Twilio pricing).

**STOAIX:** Ek kanal olarak sınırlı use case, ama important fallback.

---

### 3.5 Web Chat (NEDEN STOAIX İÇİN DÜŞÜK PRİYORİTE)

**Negatif Karar Gerekçesi:**
1. **Sağlık turizmi klinikleri mobil-first:** Web chat şu anki müşteri segmentinde %5 engagement
2. **WhatsApp + Sesli yeterli:** Gelen trafiğin %90'ı bu iki kanaldan
3. **Bakım yükü:** Web widget'ı debugging'i zaman alıyor
4. **ROI negatif:** Kurulum efortine kıyasla minimal conversion

**Sonuç:** Web chat, Lite / Plus SaaS paketinde "olması güzel" fakat Managed Service müşterilerine önerilmez.

---

## 4. Sesli Asistan Derinlemesi (Öncelik Bölüm)

### 4.1 Neden Sesli Asistan "Wow" Etkisi Yaratıyor

Klinik sahiplerinin çoğu telefon ile gelir — ama bu aynı telefon 24/7 meşgul olmak anlamına gelir. **"Telefonunuz asla meşgul değil"** sahip duygusu tetikleme.

**Psikolojik Faktörler:**
1. **Aciliyet (Urgency):** Hasta araması = danışmanı hemen bul veya kaybı, her arama para
2. **Delegasyon rahatlığı:** İnsan danışman tutuş pahalı ve ekip yönetimi zor
3. **24/7 kaplama:** İş saatleri dışında kaybedilen aramaları düşünmedikleri iyi
4. **Operasyonel Kontrol:** Klinik, her sesi kontrol ediyor (sistem yazım, veri toplanma)

**Operasyonel Gerçekler:**
- Türkiye'deki bir orta boy klinik, aylık ~200-400 arama alıyor
- Mesai dışı + meşgul saatler = ~30-50 kaçırılan arama/ay
- Tek bir "hatalı yönlendirmeyen lead" = $1000-3000 gelir kaybı

### 4.2 Neden Kliniklerin Sesli AI Direnci Var

**Türkiye Pazarı Direnci:**
1. "Yapay zeka hasta kaçırır" — güven eksikliği
2. "Aksan yanlış anlar" — Anadolu lehçesi, telaffuz
3. "Robotik ses korkunç" — ilk deneme olumsuzsa, kapandı
4. "Zaten danışmanımız var" — insan danışman var, ek yatırım istemez

**UK Pazarı Direnci:**
1. "Premium klinik brand'ümüz var" — bot, düşük imajı sinyalı
2. "Kontrol kaybedebiliriz" — GDPR compliance, ses kayıtları
3. "Setup çok zor" — teknik dış kaynak gerekli

**Çözüm Stratejisi:**

| Dirençin Tipi | STOAIX Tarafı |
|---|---|
| Aksan / anlama | "Deepgram Flux özellikle Türkçe konuş+dialekt destek. Test et, sonra konuş." |
| Robotik ses | "Cartesia Sonic 3 ile gerçek insan gibi. Demo dinle." |
| Kontrol kaybı | "Sistemi tamamen sizin kurduğunuz prompt kontrol ediyor. Her çağrı kaydı, transcript archiv'de." |
| İmaj | "Bu premium hizmet. [Randevu tahmininde] ile hastaları pre-qualiyft ettiğiniz için, sadece hot lead'ler insan danışman'a gidiyor." |

### 4.3 Teknik Mimarı: STT → LLM → TTS Pipeline

```
┌─────────────────────────────────────────────────────────┐
│ Telefon Araması (Twilio SIP trunk / LiveKit Cloud)      │
│                                                           │
│  Inbound: +1-318-569-8481 (Eurostar örneği)             │
│  Outbound: Twilio credential + LiveKit SIP trunk        │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
       ┌───────────────────────────────────┐
       │ LiveKit Agents (Python)           │
       │ - AgentSession                    │
       │ - Turn detection (multilingual)   │
       │ - Context management              │
       └───────────────┬───────────────────┘
                       │
        ┌──────────────┼──────────────┬──────────────┐
        ▼              ▼              ▼              ▼
   ┌────────┐  ┌──────────┐  ┌────────┐  ┌────────────┐
   │Deepgram│  │  OpenAI  │  │Cartesia│  │  n8n       │
   │  STT   │  │  LLM     │  │  TTS   │  │Workflows   │
   │(Flux)  │  │(4o Mini) │  │(Sonic3)│  │(Integration│
   │        │  │          │  │        │  │            │
   │Türkçe  │  │System    │  │Voice   │  │Appointment │
   │kanal   │  │prompt +  │  │selec.  │  │ create     │
   │support │  │KB tools  │  │Speed   │  │Lead update │
   │        │  │          │  │emotion │  │            │
   └────────┘  └──────────┘  └────────┘  └────────────┘
```

**Latency Bölümlemesi:**
- STT processing: 200-400ms (Deepgram Flux, adaptive mode)
- LLM token streaming: 400-800ms (turno contextinde daha hızlı)
- TTS generation: 300-500ms (Cartesia, parallelizable)
- **Toplam realistik:** 1-2 saniye (Böyle hissettiriyor)

**Optimizasyon Taktikleri:**
1. **preemptive_generation=True:** LLM output'u hemen stream'e başla, full transcript'i bekleme
2. **Bridge sentence:** Tool çağırması sırasında ("Bakıyorum hemen") ara sesi
3. **Context truncation:** 10+ turn'dan sonra özet alıp fresh context başlat

---

### 4.4 Klinik Bağlamında Voice Agent Prompt Tasarımı

**STOAIX Template (Elif Persona örneği):**

```
## KİMLİK
Sen Elif, [Klinik Adı]'nın deneyimli hasta koordinatörüsün.
Rol: Arayanı anlamak, soru cevaplamak, 
randevu yönlendirmek.
Ses: Sıcak, profesyonel, yardımsever.
Şeffaflık: "Merhaba, sizinle AI asistan Elif'i konuşuyorsunuz.
Size yardım edeceğim, ama ister insan danışman mı — saygı ile devir edeceğim."

## KONUŞMA AKIŞI
1. Sıcak karşılama (1-2 cümle) — ismini sor
2. Arama sebebi — neden aradığını anla
3. Quick answer — temel soruyu cevapla
4. Kalitatör — ciddiyet, zaman, bütçe ölçümü
5. Soft close — "Uygunsa sizi bir sonraki adıma yönlendirelim"
6. Handoff — danışman ya da otomatik randevu

## RESPONSE RULES (kritik!)
- Max 2-3 kısa cümle per turn
- Asla madde işareti, liste, markdown
- Sayıları Türkçe: "250" → "iki yüz elli"
- Saatleri sözel: "15:30" → "saat üç buçuk"
- Cümlede bir soru, ardından bekle

## SATIŞ KURALLARI
- Cevap SONRA bilgi iste
- Tereddüt hissedersen: "Kafanızda bir soru var mı, netleştirelim mi?"
- Itiraz → kabul et, reframe et, soru sor

## OBJECTION HANDLING
Fiyat direnci:
"Anlıyorum. Bir sorum olacak — bir hasta kliniğinize
ortalama ne kazandırıyor? [bekle] Bunu baz alırsak,
aylık kaç geri kazansak bu sistemi karşılar?"

Düşünecek:
"Tabii. Neyin netleşmesi gerekiyor, şimdi konuşalım mı?"

## TOOLS (Deterministic)
- match_knowledge_items(query, intake_schema) → KB ara
- collect_intake(fields) → veri topla, doğrula
- create_appointment(date, time, notes) → randevu oluştur
- escalate_to_human(reason) → danışman'a devir

## ESCALATION TRIGGERS
- Medical advice request → doktor'a devir
- Frustrated tone → danışman
- Explicit human request → danışman
- Decision ready (booking) → danışman
- Non-service topic → professional refusal
```

---

### 4.5 Türkçe + İngilizce Çok Dilli Agentler

**Türkiye Pazarı (Faz 1):**
- Çoğu hasta Türkçe konuşur
- Bazı medical tourism'de İngilizce (Arap, Rus, post-Soviet)
- **Stratejimi:** Türkçe default, İngilizce optional (Growth paket)

**UK Pazarı (Faz 2):**
- İngilizce primary
- Arapça (Middle East patients)
- **Mimarı:** Dil seçimi ilk greeting'te ("English veya Türkçe?")

**Teknik Noktalar:**
- Deepgram STT: `language="tr"` veya `language="en"` başlangıçta set edilir
- LLM system prompt: her dile özgü kültürel noter (Türk hasta vs. Arap hasta farklı communication style'a yaklaşır)
- Cartesia voice: dil başına farklı voice_id (Türkçe: "cansız" vs. "warm female"; İngilizce: "native British" vs. "neutral")

**Uyarı:** ChatGPT Türkçe prompt'a iyi cevap verir, ama nuansa anlama ve cultural repair'da sınırlı. Emir'in "Türkçe native speaker" olması kritik — prompt'u Türkçe dilinin intricate gerçeklerine uyarlaması.

---

### 4.6 Voice Agent Başarı Metrikleri

| Metrik | Target | Nasıl Ölçülür |
|---|---|---|
| **First appointment rate** | 30-40% | Handoff'lar kaç %'sinde randevu alındı |
| **Missed call recovery** | 70-80% | Mesai dışı aramaların kaç %'si answered |
| **Cost per conversation** | $0.15-0.25 | (hosting + STT + LLM + TTS) / conversation |
| **Customer satisfaction (NPS)** | 7+ | Post-call survey |
| **Accuracy (collected data)** | 95%+ | Alınan ad/telefon doğruluk |
| **Handoff rate** | 15-25% | Ne kadar lead insan'a gittiği |
| **Conversation latency** | < 1.5s | STT+LLM+TTS pipeline hızı |

---

### 4.7 LiveKit Agents Architecture Entegrasyonu

STOAIX şu anki mimarı:

```python
# voice-agent/agent.py
class ElifAgent(Agent):
    def __init__(self, org_config: OrgConfig):
        self.org = org_config  # org_id tabanlı dinamik config
        self.kb = match_knowledge_items  # vector search
        self.intake = org_config.intake_schema
        self.tools = [
            create_appointment,
            escalate_to_human,
            collect_data,
        ]
    
    async def on_message(self, chat_ctx):
        # State-based prompt
        prompt = build_prompt_by_state(
            state=chat_ctx.state,
            org_id=self.org.id,
            kb=self.kb,
        )
        # LLM → tools
        response = await llm.chat(
            chat_ctx=chat_ctx,
            system_prompt=prompt,
            tools=self.tools,
        )
        # TTS with state-based emotion
        tts_config = get_tts_config(state=chat_ctx.state)
        yield TTS(response, tts_config)
```

**Geliştime Odakları:**
1. **Turn detection:** MultilingualModel (PR 1.4'ten itibaren)
2. **Preemptive generation:** LLM streaming hemen başlasın
3. **State machine:** Monolitik prompt → state-based sections
4. **Context window:** 10+ turn'dan sonra summary reset

---

## 5. Template Library Konsepti

STOAIX'in müşteri satın alma deneyimi şu anki: 
1. Discovery call (paket seçimi)
2. Onboarding (manual kurulum, 3-5 gün)
3. Go-live (test + iterate)

**Sorun:** Onboarding süresi uzun. Müşteri "hızlı başla" istiyor.

**Çözüm:** "One-click activate" template library.

### 5.1 Template Library UX Tasarımı

```
Dashboard → "Templates" tab
    ├─ Predefined templates (10 adet)
    │  ├─ Resepsiyonist Agent [Turkish]
    │  ├─ Lead Reactivation Agent [Turkish]
    │  ├─ Appointment Reminder [Turkish]
    │  ├─ Satisfaction Survey [Turkish]
    │  ├─ Sales Agent [Turkish]
    │  └─ ... (5 daha)
    │
    ├─ [Kopyala & Özelleştir] butonu
    │  └─ Popup: "Klinik adınız nedir?" → minimum config
    │
    └─ [Go-Live] → 2 dakika sonra canlı

Onboarding süresi:
- Şu anki: 3-5 iş günü
- Template ile: 1-2 saat
```

### 5.2 Minimum Viable Configuration

Her template için gereken asgari veri:

**Resepsiyonist Agent:**
- [ ] Klinik adı
- [ ] Telefon numarası
- [ ] Şehir
- [ ] 10 adet SSS cevapları
- [ ] Türkçe / İngilizce
- [ ] LLM prompt (optional, default template var)

**Lead Reactivation Agent:**
- [ ] CSV yükleme (eski lead listesi)
- [ ] A/B test metin seçimi (3 variant template)
- [ ] Escalation kuralı (WhatsApp → sesli)

**Appointment Reminder:**
- [ ] CRM entegrasyon (GHL, Zoho, vb.)
- [ ] Reminder timing (-24 saat, -2 saat)
- [ ] SMS / WhatsApp seçimi
- [ ] Rescheduling link template

### 5.3 Template Kategorileri (Sektör x İş Görevi Matrisi)

```
             │ Saç Ekimi │ Diş │ Estetik │ Medikal Est. │
─────────────┼───────────┼─────┼─────────┼──────────────┤
Reseptionist │ ✓✓        │ ✓✓  │ ✓       │ ✓            │
Reactivation │ ✓✓        │ ✓   │ ✓       │ ✓✓           │
Follow-up    │ ✓         │ ✓✓  │ ✓✓      │ ✓            │
Post-op      │ ✓✓        │ ✓   │ ✓✓      │ ✓            │
Reminder     │ ✓         │ ✓✓  │ ✓       │ ✓            │
Survey       │ ✓         │ ✓   │ ✓       │ ✓            │
Sales        │ ✓✓        │ ✓   │ ✓✓      │ ✓            │

✓✓ = highly relevant
✓  = relevant but not primary
```

### 5.4 Kullanıcı Konfigüre Edilebilir Parametreler

Her template'de hangi parametreleri müşteri değiştirebilir, hangileri kilitli:

| Parametre | Müşteri Düzenleme | Klinik |
|---|---|---|
| Sistem prompt (role, persona, objection handling) | ✓ Limited (template sections) | ✓ Danışman + AI |
| Knowledge base (SSS, prosedür açıklamaları) | ✓ Full | ✓ Danışman |
| Intake schema (toplanan veri alanları) | ✓ Limited (field adı + order) | ✓ Danışman |
| LLM model seçimi (GPT-4o Mini vs. 4o) | ✗ (admin only) | ✓ Danışman |
| Escalation rules (insan'a devir tetikleri) | ✓ Kısıtlı | ✓ Admin |
| TTS voice (erkek/kadın, aksan) | ✓ | ✓ Danışman |
| Dil (Turkish, English, Arabic) | ✓ | ✓ Admin |
| Outbound timing (reactivation frequency) | ✓ | ✓ Danışman |

---

## 6. Rakip & Pazar İstihbarat Özeti

### 6.1 RetellAI Analizi

**Kim:** US-based, venture-backed, voice agent platform.

**Yetenekler:**
- Native STT (likely Deepgram + Azure options)
- Custom LLM integration (OpenAI, Anthropic)
- Outbound calling at scale
- n8n integration (STOAIX gibi)
- Python + JavaScript SDK

**Fiyatlandırma:** Open access değil, demo/PoC tabanlı.

**STOAIX Avantajı:**
- Türkçe yerel desteği (RetellAI = English-first)
- Healthcare specialization (Retell = generic)
- Managed service model (Retell = self-serve API)
- Lead reactivation paketi (Retell = single voice agent)

**STOAIX Tehdit:**
- Daha hızlı iterasyon (VC-backed)
- Coğrafi skalabilite
- Brand recognition (US market)

### 6.2 PatientDesk.ai ve Benzer Rakipler

**Kim:** Healthcare patient communication platform.

**Yetenekler:** SMS, email, patient portal integrations, appointment management.

**STOAIX Farklılığı:** Sesli AI agentler + lead qualification (PatientDesk = notification-only).

### 6.3 Pazar Boşlukları (STOAIX Diferensiyali)

| Boşluk | STOAIX Çözümü |
|---|---|
| Türkçe sesli AI yok | Türkçe-native agentler |
| Healthcare specialization eksik | Sağlık turizmi playbook'ları |
| Eski lead reactivation eksik | One-time $797 paket |
| Managed service yok | B2B managed service model |
| UK pazarı untouched | UK fırsat (Türk kökenli klinikleri hedef) |

### 6.4 STOAIX Diferensiyasyon Açıları

1. **Yerel Uzmanlık:** Türkiye sağlık turizmi pazarında 18 ayılık operasyon, case study'ler, relational trust.
2. **Dil + Aksent:** Türkçe Anadolu lehçesine Deepgram Flux'un uyumlaştırılması.
3. **Managed Service:** Sadece API değil, kurulum/onboarding/optimization dahil.
4. **Lead Reactivation:** Eski data = "inactiv asset" değil, "opportunity" olarak yönetme.
5. **Hybrid Model:** SaaS (self-serve Lite/Plus) + Managed Service (Core+) combo.

---

## 7. Dokümantasyon Sitesi İçerik Mimarisi

Müşteri kendi sistemini kurmak istediğinde (SaaS Lite/Plus) veya Managed Service onboarding sırasında ihtiyaç duyacağı dokümantasyon.

### 7.1 Sayfa Kategorileri

```
/docs
├─ Getting Started
│  ├─ What is STOAIX? (30 sec video + 2 min read)
│  ├─ How Pricing Works (simple visual + table)
│  ├─ Your First Agent (step-by-step, 5 min)
│  └─ Glossary (Agent, Prompt, Intake, etc.)
│
├─ Voice Agent Guides
│  ├─ How to Write Prompts for Voice
│  │  ├─ Prompt Structure (Identity → Task → Style → Objections)
│  │  ├─ Voice Output Rules (2-3 sentences, no lists, etc.)
│  │  ├─ Turkish-Specific Tips (accent, cultural norms)
│  │  └─ Examples (Receptionist, Sales, Follow-up)
│  │
│  ├─ How to Use the Panel
│  │  ├─ Dashboard Overview (metrics, recent calls)
│  │  ├─ Building Your Knowledge Base (upload, embed, test)
│  │  ├─ Configuring Intake Schema (which fields to collect)
│  │  ├─ Setting Up Escalation Rules (when to hand off)
│  │  ├─ Monitoring Conversations (transcript view, audio playback)
│  │  └─ Analytics & Reports (conversion rate, cost per lead, etc.)
│  │
│  ├─ Templates Library
│  │  ├─ What are Templates? (pre-built agent types)
│  │  ├─ Available Templates (10 types, descriptions)
│  │  ├─ Customizing a Template (copy → edit → launch)
│  │  └─ Template Best Practices
│  │
│  ├─ Channels & Integration
│  │  ├─ Voice (SIP Phone)
│  │  ├─ WhatsApp Bot
│  │  ├─ Instagram DM (coming soon)
│  │  ├─ CRM Integration (GHL, Zoho, HubSpot)
│  │  └─ n8n Workflows (automation examples)
│  │
│  └─ Troubleshooting
│     ├─ Agent Sounds Robotic (fix: response length, variety rules)
│     ├─ Missed Calls Still Happening (check: Twilio config, hours)
│     ├─ Lead Data Not Captured (check: intake schema, LLM function calling)
│     └─ Common Errors (connection, API key, permission issues)
│
├─ Use Case Guides
│  ├─ For Hair Transplant Clinics
│  │  ├─ Sample Playbook (greeting, qualification questions, objections)
│  │  ├─ Intake Schema Example (hair type, age, expectations, budget)
│  │  └─ Metrics Dashboard (focus: first-appointment rate)
│  │
│  ├─ For Dental Clinics
│  ├─ For Aesthetic Surgery
│  └─ For Medical Aesthetics
│
├─ Advanced
│  ├─ Custom LLM Integration (bring your own model)
│  ├─ API Documentation (webhook, batch operations)
│  ├─ SLA & Uptime (99.9% commitment)
│  └─ Security & Privacy (GDPR, data retention)
│
└─ Support & Community
   ├─ FAQ (30 most common questions)
   ├─ Contact Support (email, chat, phone)
   ├─ Community (Discord, customer success stories)
   └─ Blog (updates, case studies, tips)
```

### 7.2 Öncelik Sırası (Publishing Order)

**Faz 1 (Canlı çıkışından 2 hafta sonra):**
1. Getting Started
2. How to Write Prompts for Voice
3. How to Use the Panel
4. Templates Library

**Faz 2 (1 ay sonra):**
5. Use Case Guides (Hair transplant first)
6. CRM Integration
7. Troubleshooting

**Faz 3 (3 ay sonra):**
8. Advanced
9. Security & Privacy

### 7.3 Content Examples

**Başlık: "How to Write Prompts for Voice Agents: Complete Guide"**

**Outline:**
- Neden voice prompts tekst promptlardan farklı (spoken vs. read)
- 5-bölümlü prompt yapısı (Identity → Task → Style → Objections → Limits)
- Pratik uyarılar (2-3 cümle rule, no markdown, Turkish numbers)
- Türkçe-spesifik (Anadolu lehçesi destek, kulturel farklar)
- Örnek: Saç ekimi agentinin full prompt'u (200 satır)
- Sık hatalar ve düzeltmeler

**Başlık: "Voice Output Rules: Making Your Agent Sound Human"**

**Outline:**
- Voice "naturalness" neden kritik (Cartesia research)
- 8 main rules (sentence length, response variety, turn-taking, etc.)
- Doğru vs. yanlış örnekler (ses clip'leri ile)
- A/B test nasıl yapılır (transcript compare + audio review)

---

## Template Library — Şablon Kartları

Her biri production-ready, kopya-yapıştırabilir, customizable.

### Template 1: Resepsiyonist Agent

**Görev:** Gelen aramaları karşılama, temel soruları cevaplama, nitelik sınıflandırması.

**Tetikleyici:** Hasta araması.

**Kanal:** Sesli (SIP telefon).

**Hedef Kullanıcı (klinik türü):** Tüm kliniklere, özellikle saç ekimi, diş (yüksek call volume).

**KPI Etkisi:**
- Cevaplanan çağrı oranı: +70%
- Lead qualification rate: +40%
- Müşteri bekleme süresi: -80%

**Minimum Config:**
- Klinik adı
- Telefon numarası
- 10 SSS cevapları
- Türkçe system prompt (default template provided)

**Örnek Senaryo:**
```
Agent:  "Merhaba, [Clinic Name]'a hoş geldiniz. Size nasıl yardımcı olabilirim?"
Patient: "Saç ekimi fiyatı nedir?"
Agent:  "Elbette. Saç ekimi fiyatı graft sayısına göre değişiyor — 
        ortalama 1500-4000 dolar aralığında. Daha detaylı bilgi için, 
        şu an ne kadar grafta ihtiyacınız olduğunu bilir misiniz?"
Patient: "Bilmiyorum."
Agent:  "Anladım. O zaman size en doğru fiyat tahmini yapabilmek için 
        mini bir danışmanlık yapmamız lazım. Uygunsa size danışman Deniz'i 
        bağlayabilirim, yakında var mı?"
```

**Bizim Stack'te Nasıl Çalışır:**
- LiveKit Agents (Python framework)
- Deepgram STT (Flux model, Turkish support)
- OpenAI GPT-4o Mini (LLM)
- Cartesia Sonic 3 (TTS, warm female voice)
- n8n (appointment creation, CRM sync)

---

### Template 2: Inbound Call Agent (Telefon Danışmanlığı)

**Görev:** Detaylı konsültasyon, prosedür açıklaması, objection handling, randevu kapama.

**Tetikleyici:** Hasta "Danışman Ara" portalını kullanır veya direkt arama.

**Kanal:** Sesli (Telefon).

**Hedef Kullanıcı:** Premium klinikler, sağlık turizmi, insan danışman ihtiyacı azaltmak isteyenler.

**KPI Etkisi:**
- Danışmanlık kapasitesi: +5x (insan yerine AI)
- Conversion to appointment: +40%
- Cost per converted lead: -60%

**Minimum Config:**
- Detaylı prosedür description'ları
- Fiyat range'leri ve açıklamaları
- Hasta eligibility criteria
- Objection handling scripts
- Booking form integration

**Örnek Senaryo:**
```
Agent:  "Merhaba, 15 dakikalık ücretsiz danışma yapmak istiyorum. 
        Saç ekimi mi, diş mi, estetik mi konusunda soru var?"
Patient: "Saç ekimi. Ama çok korkuyorum."
Agent:  "Tamamen normal. Çoğu hasta başta endişeli olur. 
        Bize saç ekimi yöntemini açıklatayım mı?
[Detailed explanation of FUE/DHI]
Patient: "İyi, ama ne kadar sürüyor?"
Agent:  "Yaklaşık 8 saatlik bir oturumda. Uyuşturucu yapılıyor, 
        rahat bir şekilde yaparsınız. Sorularınız bitti mi, 
        randevu istir misiniz?"
```

**Stack'te:**
- LiveKit + Deepgram Flux (fast turn detection)
- GPT-4o (not mini — better reasoning for sales)
- Cartesia TTS (confident tone, proper pacing)
- n8n (appointment scheduling, follow-up automation)

---

### Template 3: Outbound Follow-up Agent

**Görev:** Randevu öncesi teyit, post-op kontrol, satisfaction survey.

**Tetikleyici:** Otomatik (n8n scheduler) — randevu ±1 gün, prosedür +7 gün.

**Kanal:** Sesli (outbound call) veya WhatsApp voice.

**Hedef Kullanıcı:** Cerrahi estetik, saç ekimi, diş implant (yüksek post-op touchpoint).

**KPI Etkisi:**
- No-show oranı: -45%
- Post-op satisfaction: +70%
- Tekrar prosedür booking: +25%

**Minimum Config:**
- Pre-appointment reminder script
- Post-op checklist (pain, swelling, infection signs)
- Satisfaction survey questions
- Escalation rules (when to call doctor)

**Örnek Senaryo:**
```
Agent (outbound): "Merhaba [Name], [Clinic] burası. 
                 Yarın saat 10'teki saç ekimi randevunuz için 
                 bir kontrol arması. Hala uygun mu?"
Patient:         "Evet, geliyorum."
Agent:           "Harika! Öncesinde şu noktaları unutmayın: 
                 gelmeden 2 saat krem sürün, ağır spor yapma. 
                 Başka sorunuz?"
[7 days post-op]
Agent:           "Prosedürden sonra nasılsınız? Ağrı, şişme ne durumda?"
Patient:         "Biraz şişeli ama normal."
Agent:           "Çok normal. Uyarılarım var: şişme 2-3 haftada 
                iyileşir, boğmayın, yumuşak uyut. Doktor kontrol 
                etsin mi?"
```

**Stack'te:**
- n8n (trigger'lar + scheduling)
- LiveKit (outbound call session)
- Deepgram (STT)
- OpenAI LLM (empathy + checklist)
- Cartesia (calm, reassuring tone)

---

### Template 4: Lead Reactivation Agent

**Görev:** Eski lead listesine proaktif ulaşmak, yeniden ilgi uyandırmak, randevu almak.

**Tetikleyici:** Günlük batch (50-100 lead/gün).

**Kanal:** WhatsApp (metin/sesli), SMS, ardından sesli arama (high-intent).

**Hedef Kullanıcı:** Yoğun reklam yapan, eski lead datası olan tüm kliniklerin #1 ROI kaynağı.

**KPI Etkisi:**
- Lead cost: 1/10 (yeni lead generation'a kıyasla)
- Conversion rate: 5-8%
- Başlangıç ROI: 2-3 ayda geri dönüş

**Minimum Config:**
- Eski lead listesi (CSV, WhatsApp sayıları)
- A/B test edilmiş WhatsApp metin'leri
- Escalation rules (response → sesli call)
- Follow-up sequence (3 deneme, sonra stop)

**Örnek Senaryo:**
```
WhatsApp (Day 0):
"Merhaba [Ad], 6 ay öncesinde bize saç ekimi hakkında 
danışmıştınız ama o zamanlar uygun olmamış. 
Şu anda özel fiyat kampanyası açtık — sizi danışman ile 
konuştırmak isterdik. Uygun mu? [Link]"

[Click → WhatsApp agent handoff]

WhatsApp Agent:
"Merhaba! Saç ekimi hakkında sorularınız var mı? 
Şu anda [price] kampanya'mız var. Randevu ister misiniz?"

[If no response after 2 days]

SMS (Day 3):
"[Clinic] — saç ekimi danışmanlığı hala açık. 
Telefon cevapla (WhatsApp) veya 1 tıkla randevu al: [link]"

[If still no response]

Voice Call (Day 7):
"Merhaba [Ad], son deneme. Eski lead'siniz, 
kampanyamızdan yararlanabilirsiniz. 
Danışman Deniz'in bir boş zamanı var mı uygunsa?"
```

**Stack'te:**
- n8n (batch processing, scheduling)
- WhatsApp Business API (metin + handoff)
- Twilio (SMS fallback)
- LiveKit (voice call, high-intent)
- OpenAI (personalization, objection handling)

---

### Template 5: Sales Agent

**Görev:** Hot lead'i kapatmak — detaylı satış konuşması, objection handling, randevu/payment.

**Tetikleyici:** Lead pipeline'da "hot" işareti veya doğrudan danışman atama isteği.

**Kanal:** Sesli (Telefon).

**Hedef Kullanıcı:** İnsan satış danışmanı tutulamayan kliniklere başlangıç, Premium kliniklerde AI + human hybrid.

**KPI Etkisi:**
- Satış danışmanı kapasitesi: +3x
- Close rate: +20% (specialization via prompt)
- Qualified lead cost: -40%

**Minimum Config:**
- Satış playbook (objection handling, soft close, pricing authority)
- Handoff trigger (ne zaman insan'a devir yap)
- Booking form + payment integration
- Follow-up sequence (if no decision)

**Örnek Senaryo:**
```
Agent:  "Merhaba, biz sizi aç danışman olarak sizinle 
        konuşacağım. Saç ekimi mi, diş mi sorumuz?"
Hot Lead: "Saç ekimi. Ama çok ücretli gibi."
Agent:  "Anlıyorum. Benim bir sorum olacak — 
        bir saç ekimi hastanız kliniğinize ortalama 
        ne getiriyor? [if patient is actually clinic owner, 
        then: otherwise] Saç ekimi sonrası ne tarafını 
        en çok merak ediyorsunuz?"

[Consultative discovery → tie to outcomes]

Agent:  "Harika. Bunu baz alırsak, sizin için 
        [custom recommendation]. Yarın 10'te 
        başlayabiliriz, uygun mu?"
```

**Stack'te:**
- LiveKit (voice, real-time)
- GPT-4o (not mini — better reasoning)
- Cartesia (confident, slightly faster tone)
- n8n (payment gateway integration, follow-up automation)
- CRM (lead history context)

---

### Template 6: Patient Satisfaction / Survey Agent

**Görev:** Post-op / post-konsültasyon memnuniyeti ölçmek, sorun varsa escalate, Google review toplama.

**Tetikleyici:** Prosedür sonu +1 gün, +7 gün.

**Kanal:** Sesli (outbound call) veya WhatsApp.

**Hedef Kullanıcı:** Premium klinikleri (brand reputation), UK pazarı (online review'lar kritik).

**KPI Etkisi:**
- Google review artışı: +200%
- Satisfaction score: +0.8 puan
- Negative word-of-mouth prevention: erken alarm

**Minimum Config:**
- Satisfaction questionnaire (5-7 soru)
- NPS scale mapping (score → action)
- Escalation rule (score < 6 = call doctor/manager)
- Google review request template
- Issue categorization (pain, swelling, results, cost, service)

**Örnek Senaryo:**
```
Agent (outbound): "Merhaba [Name], prosedürden sonra 
                 nasıl hissediyorsunuz? 
                 1-10 arasında puan verer misiniz?"
Patient:         "8."
Agent:           "Harika! Sizde iyi sonuçlar gördüğüne göre, 
                Google'da bir yorum bırakır mısınız? 
                [link]"

[If score < 6]
Agent:           "[Score] verdiniz. Sorun nedir, konuşalım mı?"
[Listen, document, escalate to doctor]
```

**Stack'te:**
- n8n (scheduling)
- LiveKit (voice)
- Deepgram (STT)
- OpenAI (empathy, issue categorization)
- Cartesia (warm, reassuring)
- Google API (review request, link generation)
- CRM (satisfaction score tracking)

---

### Template 7: Post-Operation Follow-up Agent

**Görev:** Cerrahi / invazif prosedür sonrası recovery takibi, komplikasyon detection, ilaç reminder'ları.

**Tetikleyici:** Ameliyat sonu saatler, 3. gün, 7. gün, 14. gün otomasyonu.

**Kanal:** WhatsApp voice message / SMS, sesli arama (alarmlı).

**Hedef Kullanıcı:** Cerrahi estetik, saç ekimi, diş implant.

**KPI Etkisi:**
- Komplikasyon early detection: +80%
- Hasta memnuniyeti: +70%
- Malpractice risk: azalış

**Minimum Config:**
- Post-op checklist (pain scale, swelling, infection signs)
- Medication reminder'ları (timing, dosage)
- Red flag criteria (when to call doctor immediately)
- Recovery milestones (expectations by day)

**Örnek Senaryo:**
```
Day 1 (post-op, 6 hours):
WhatsApp voice message:
"Merhaba [Name], prosedür başarılı. 
Şu anda nasılsınız? Acı ne seviyede, şişme var mı? 
Cevap yaz, hemen doktor görsün."

Day 3:
"İyileşme nasıl? Enfeksiyona benzer bir şey gördün mü 
— sarı sıvı, koku? Evet ise doktora hemen git, 
Hayır ise tamamdır."

Day 7:
"Final kontrol. Açılı yer varsa, ilaçını al. 
Ağır spor hala yasak. Endişe varsa doktora git."
```

**Stack'te:**
- n8n (scheduling by days)
- WhatsApp API (voice message)
- LiveKit (escalation calls)
- SMS fallback
- CRM (patient history + medical notes context)

---

### Template 8: Call Center / Overflow Agent

**Görev:** Yoğun zaman dilimlerinde gelen aramaların devlet kısmını handle, basit soruları cevapla, complex case'leri kuyruğa al.

**Tetikleyici:** Telefon sistemi > 2 yoğun, waiting queue 3+ call.

**Kanal:** Sesli (SIP, telekomı entegrasyonu ile).

**Hedef Kullanıcı:** Yüksek call volume (saç ekimi, popüler diş klinikleri).

**KPI Etkisi:**
- Call abandonment: -60%
- Service level (SLA): 95%→98%
- Çalışan stress: -50%

**Minimum Config:**
- Overflow trigger rules (queue length, wait time)
- Triage questions (nedir sorun, hangisi urgent?)
- Routing logic (simple Q → bot answer, complex → queue or escalate)
- Queue management (estimated wait, callback option)

**Örnek Senaryo:**
```
[Busy time: 5 people waiting, avg wait 10+ min]
Overflow Agent activates:

Agent:  "Merhaba, şu an tüm danışmanlar meşgul. 
        Hızlıca size yardımcı olmak isterdim. 
        Ne hakkında soru var?"
Caller: "Saç ekimi fiyatı ve randevu."
Agent:  "[Quick FAQ answer] 
        Şu andaki seçenekler: 
        1. Hemen kuyruğa geçip danışman bekle (10 min), 
        2. Size SMS ile randevu linki gönder."
Caller: "SMS gönder."
[Bot → n8n → SMS sent]
Agent:  "Tamamdır, 2 dakika içinde gelecek. 
        Başka sorunuz?"
```

**Stack'te:**
- Twilio (queue management, overflow routing)
- LiveKit (agent speech)
- n8n (SMS sending, queue logic)

---

### Template 9: Appointment Reminder Agent

**Görev:** Randevu gün öncesi veya saati öncesi otomatik hatırlatma.

**Tetikleyici:** Randevu tarihi -24 saat, -2 saat.

**Kanal:** SMS, WhatsApp, push notification.

**Hedef Kullanıcı:** Tüm kliniklerde en yüksek ROI (no-show -45%).

**KPI Etkisi:**
- No-show oranı: -45%
- Ek gelir (boş slot'ın doldurulması): +15% capacity

**Minimum Config:**
- Reminder message template (timing, tone)
- CRM entegrasyon (appointment data pull)
- Rescheduling link (WhatsApp / web booking)
- Confirmation logic (if confirmed, mark in CRM)

**Örnek Senaryo:**
```
SMS (-24 hours):
"[Clinic] — Yarın saat 10:00'te [Procedure] randevunuz var. 
Onaylıyor musunuz? Evet: [Link] Değişiklik: [Link]"

WhatsApp (-2 hours):
"🕐 2 saat sonra randevunuz! 
[Clinic]'de sizi bekliyoruz. 
Gelmezseniz haber verin: [Reschedule]"

[If no confirmation and no-show pattern]
Post-appointment SMS:
"Yarınki randevunuza gelemediniz. 
Yeni zaman istiyor musunuz? [Book]"
```

**Stack'te:**
- n8n (scheduler, CRM sync)
- Twilio / Gupshup (SMS + WhatsApp)
- Push notification service
- Web booking widget (rescheduling)

---

### Template 10: Dead Lead Win-Back Agent

**Görev:** 6-12 ayda hiç temas kurmayan lead'leri yeniden harekete geçirmek.

**Tetikleyici:** Yıllık 1-2 batch campaign (örn. sezon döneminde).

**Kanal:** Email, SMS, WhatsApp.

**Hedef Kullanıcı:** Seasonal klinikleri (kış saç ekimi), yeni prosedür pazar genişletimi.

**KPI Etkisi:**
- Eski lead pool reactivation: 3-5%
- Low-cost campaign (minimal overhead)

**Minimum Config:**
- Win-back message templates (nostalgia, new offer, urgency)
- Segmentation (last contact date, original interest type)
- CTA (book demo, schedule call, special offer)
- Follow-up sequence (3 touch + stop)

**Örnek Senaryo:**
```
Email (Dead Lead Campaign):
Subject: "12 ay aradan sonra: Saç ekimi konusunda siz'i hatırladık"

Body:
"Merhaba [Name],
12 ay öncesinde saç ekimi konusunda bizimle danışmıştınız. 
O günden sonra çok şey değişti: 
— Daha hızlı prosedür (6 saat → 4 saat)
— Daha iyi sonuçlar (3000+ grafts possible)
— Yeni fiyatlandırma [price]

Yeniden ilgileniyorsanız, buradan başla: [Link]"

[If click]
WhatsApp (automated):
"Hoşgeldiniz geri! Saç ekimi hakkında güncel sorularınız var mı?"

[If no response after 2 days]
SMS:
"[Clinic] — Davetiniz hala geçerli. 
Danışman Deniz'in boş zamanı yarın 14:00. 
Uygun mu? [Confirm]"
```

**Stack'te:**
- Email service (SendGrid, AWS SES)
- WhatsApp Business API
- SMS (Twilio)
- n8n (segmentation, sequence logic)
- CRM (interest history context)

---

## Araştırma Kaynakları & Notlar

### Kullanılan Kaynaklar

1. **STOAIX İçsel Dokümantasyon:**
   - `/Users/ataulufer/stoaix-platform/research/voice-agent-humanlike-sales-research.md`
   - `/Users/ataulufer/stoaix-platform/research/voice-agent-emir-batch.md`

2. **GitHub & API Dokümantasyon:**
   - LiveKit Agents: https://github.com/livekit/agents
   - LiveKit Agents JS: https://github.com/livekit/agents-js
   - RetellAI Organization: https://github.com/RetellAI

3. **Teknik Rehberler:**
   - "stoaix Voice Agent — Prompt Engineering Rehberi" (GitHub raw)
   - "stoaix Voice Agent — Uygulama Referansı" (GitHub raw)
   - Respond.io Prompt Templates: https://respond.io/help/ai-agents/using-prompt-templates

4. **n8n Workflows:**
   - STOAIX n8n workflow structure (GitHub tree view)

### Türkiye vs UK Pazar Farklılıkları

| Boyut | Türkiye | UK |
|---|---|---|
| **Dil** | Türkçe primary, İngilizce secondary | İngilizce primary, Türkçe (diaspora) |
| **Trust Factor** | Personal relationship önemli | Professional credibility önemli |
| **Price Sensitivity** | Yüksek ($ vs. TL) | Orta-Düşük (premium expected) |
| **Call Volume** | Orta (20-50/gün) | Yüksek (50-150/gün) |
| **Online Review** | Önem artıyor | Kritik (Google, Trustpilot) |
| **Follow-up** | Zayıf (manual) | Orta (scheduled) |
| **Mobile Usage** | WhatsApp dominant | SMS + WhatsApp balanced |
| **Regulatory** | Gevşek (GDPR yok) | Kesin (GDPR, ICDR) |
| **Voice Quality** | "Calışması yeterli" | "İnsani hissettirmeli" |
| **Operational Maturity** | Orta | Yüksek (SOP'lar var) |

### Öneriler

**Türkiye (Faz 1):**
- WhatsApp Bot'u öne çıkar (telefon konusunda çekimserlik)
- Fiyata odakl teklif ("3 ayda geri dönüş")
- Reactivation paket'ini agresif satış (eski lead = "buried treasure")
- Lokal case study'ler (ağızdan ağıza marketing)

**UK (Faz 2):**
- Sesli asistan'ı "premium experience" olarak brand
- Google review collection'ı (online reputation = lead source)
- Compliance (GDPR documentation)
- Premium pricing (UK pazarı $500+ pay edebilir)

### Uzun-Vadeli Roadmap İçin Düşünülmesi Gerekenler

1. **Speech-to-Speech Modelleri:** OpenAI gpt-realtime ve benzer modelleri gözlemle (latency, naturalness avantajları)
2. **Video Integration:** Zoom-like call center'larda agent + görüntü kombinasyonu
3. **Multi-Agent Orchestration:** Karmaşık workflow'lar için agent'ler arası handoff
4. **Humanness Eval Sistemi:** Her çağrıyı "insan gibi hissettiriyor mu?" skoru ile değerlendir
5. **Sektör Specialization:** Hair transplant, dental, aesthetic, med-spa branching (farklı playbook'lar)

---

## Sonuç

STOAIX'in yapı taşları var:
- Teknoloji stack (LiveKit, Deepgram, Cartesia, OpenAI)
- Pazar bilgisi (Türkiye + UK healthcare tourism)
- İlk müşteriler (Eurostar, case study'ler)
- Managed Service model (diferensiyasyon)

Açık görevler:
- 10 template'i production'a hazırlamak
- Dokümantasyon sitesini kurgulamak
- Sesli asistan "wow" etkisini optimize etmek (turn-taking, state-based prompt, TTS emotion)
- UK pazarında customer acquisition'ı başlatmak
- Lead reactivation paket'ini skale etmek (en yüksek ROI kaynağı)

Bu belge bu yolculuğun referans haritasıdır.

---

**Araştırma tamamlanması tarihi:** Nisan 2026
**Belge versiyonu:** 1.0
**Tavsiye:** 3 ayda güncelleme (pazar feedback'i + teknik ilerlemeler)
