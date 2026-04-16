# STOAIX Platform Analysis Brief for crewAI

## Purpose

Bu doküman `crewAI` tabanlı çoklu agent analizleri için hazırlanmıştır.

Amaç:

1. STOAIX platformunu sadece "kod kalitesi" açısından değil, gerçek müşteri ortamında çalıştırma açısından değerlendirmek.
2. Özellikle müşteriye rollout, operasyonel güvenilirlik, uyumluluk, entegrasyon bağımlılıkları ve mesajlaşma katmanının soyutlanması konularını netleştirmek.
3. Gereksiz feature brainstorming yerine yakın vadede ticari olarak önemli kararları destekleyecek analiz üretmek.

Bu çalışma bir "greenfield architecture design" çalışması değildir.
Bu çalışma, mevcut platformun hangi sınırlar içinde güvenle satılabileceğini ve hangi alanların standardize edilmesi gerektiğini anlamaya yöneliktir.

## Business Reality

STOAIX bugün self-serve SaaS değil, managed-service ağırlıklı bir platformdur.

Odak müşteri:

- hair transplant
- dental
- medical aesthetics
- cosmetic / plastic surgery clinics

Operasyonel gerçek:

- lead kaybı doğrudan gelir kaybıdır
- mesaj teslim edilmeyip bunun fark edilmemesi kritik risktir
- her müşteri aynı entegrasyon setini istemeyecektir
- ürünün değeri sadece AI konuşması değil, güvenilir çalışması ve operasyona oturmasıdır

## Current Platform Reality

Mevcut mimari içinde önemli noktalar:

- Supabase, temel operasyonel system of record
- Dashboard, tenant yönetimi ve operasyon paneli
- Voice agent ayrı Python servisinde çalışıyor
- WhatsApp katmanı bugün pratikte çoğunlukla `GoHighLevel / WAGHL` üzerinden ilerliyor
- Repo içinde `Meta Cloud API` için ayrı inbound function mevcut
- Admin panelinde `whatsapp` provider seçenekleri şimdiden tanımlı: `ghl`, `whatsapp_cloud`, `wati`, `twilio`

Bu nedenle analiz, "sıfırdan provider support tasarla" değil, "mevcut dağınık provider yaklaşımını ürünleştirilebilir bir entegrasyon sınırına taşı" şeklinde yapılmalıdır.

## Main Analysis Themes

Agent’ler aşağıdaki temalar etrafında analiz üretmelidir.

### 1. Customer Rollout and Operability

Soru:
Bir müşteri canlıya alınırken sistem hangi minimum şartlarla güvenle devreye alınabilir?

İncelenecek başlıklar:

- tenant onboarding bağımlılıkları
- environment / credential yönetimi
- hangi entegrasyonların zorunlu, hangilerinin opsiyonel olduğu
- müşteri bazlı feature toggles
- support / incident handling modeli
- pilot rollout ile daha geniş rollout arasındaki fark

Beklenen çıktı:

- minimum viable rollout checklist
- enterprise-ready olmayan ama pilot için kabul edilebilir alanlar
- canlı müşteri için riskli manuel adımlar

### 2. Compliance, Privacy, and Data Boundary

Soru:
Platform sağlık-klinikleriyle çalışırken hangi veri ve süreç sınırlarını netleştirmeli?

İncelenecek başlıklar:

- PII / sağlık verisi temas noktaları
- veri nerede tutuluyor, hangi sistemlerde kopyalanıyor
- mesajlaşma sağlayıcılarında veri sızıntısı / gereksiz veri çoğalması riski
- access control, auditability, retention, deletion beklentileri
- UK / EU / Turkey müşteri beklentileri için operasyonel uyumluluk seviyesi

Beklenen çıktı:

- "şimdi çözülmesi gereken" uyumluluk riskleri
- "sözleşme / süreç ile yönetilebilir" riskler
- teknik olarak sade ama satışta güven veren policy / process ihtiyaçları

### 3. Messaging Layer Abstraction

Soru:
WhatsApp mesajlaşma katmanı `WAGHL` bağımlılığından nasıl soyutlanmalı ki `Twilio`, `Dialog360`, `Meta Cloud API` gibi sağlayıcılar eklenebilsin?

İncelenecek başlıklar:

- inbound webhook normalizasyonu
- outbound message sending contract
- delivery status / error / retry modeli
- provider-specific identity mapping
- conversation state ile provider state’in ayrılması
- tenant başına provider seçimi
- fallback / provider switch / migration etkileri

Beklenen çıktı:

- önerilen abstraction boundary
- ortak message contract taslağı
- provider adapter sorumlulukları
- core domain ile provider SDK/API katmanının ayrımı
- hemen yapılacaklar vs sonraya bırakılacaklar

Not:
Bugünkü repoda `whatsapp-inbound` ve `meta-whatsapp-inbound` ayrışmış durumda, ayrıca admin panelinde provider seçimi bulunuyor. Analiz bunu temel almalı; teori üretmemeli, mevcut kod yönüne yaslanmalı.

### 4. Reliability and Failure Visibility

Soru:
Mesajlaşma ve follow-up akışlarında en tehlikeli sessiz hata noktaları neler?

İncelenecek başlıklar:

- webhook duplication
- duplicate send riskleri
- provider timeout / rate limit / auth expiry
- delivery failure görünürlüğü
- retry / dead-letter ihtiyacı
- background task dayanıklılığı
- outbound mesaj ile internal state yazım sırası

Beklenen çıktı:

- top reliability risks
- minimal observability standard
- hangi failure’lar müşteri operasyonunu doğrudan etkiler

### 5. Commercial Packaging and Customer Fit

Soru:
Teknik mimari, STOAIX’in paketleme ve satış modelini nasıl desteklemeli?

İncelenecek başlıklar:

- hangi entegrasyonlar Foundation / Growth / Scale paketlerine doğal oturur
- hangi özellikler managed-service olarak kalmalı
- hangi capability’ler ürünleşmeli
- hangi müşteriler için provider choice kritik olur
- "tek çözüm herkese" yaklaşımının nerede kırılacağı

Beklenen çıktı:

- teknik kapasite ile pricing / packaging uyumu
- müşteri segmentine göre opsiyonel modüller

## Non-Goals

Agent’ler aşağıdakilere sapmamalı:

- büyük ölçekli CRM redesign önermek
- tüm sağlayıcıları aynı anda production-ready yapmaya çalışmak
- mevcut iş modelini self-serve SaaS varsaymak
- gereksiz microservice veya event-bus romantizmi
- yakın vadede ticari değeri olmayan mimari temizlikler

## Shared Facts Agents Should Assume

- Supabase ana operasyonel kayıt sistemi
- GHL pipeline sync ana ürün stratejisi değil, gerekirse opsiyonel
- appointment booking tenant bazlı özellik
- Meta Cloud API şu an aktif müşteri trafiğinin merkezi değil
- managed-service modeli nedeniyle operasyon ekibinin görünürlüğü çok önemli
- müşteri başına farklı kanal / CRM / voice bağlantı kombinasyonları olabilir

## Required Deliverable Format

Her agent çıktısını şu formatta vermeli:

1. Executive summary
2. Findings
3. Real risks vs overblown concerns
4. Near-term recommendations
5. Deferred recommendations
6. Open assumptions

Her bulgu için şu ayrım net olmalı:

- pilot use için kabul edilebilir
- controlled rollout öncesi düzeltilmeli
- daha büyük müşteri / enterprise öncesi gerekli

## Recommended crewAI Agent Set

### Agent 1. Platform Operations Analyst

Odak:

- rollout readiness
- onboarding dependency map
- supportability
- customer-specific config complexity

### Agent 2. Compliance and Data Boundary Analyst

Odak:

- PII / health-data exposure
- retention / audit / access risks
- operational compliance expectations

### Agent 3. Messaging Architecture Analyst

Odak:

- WAGHL bağımlılığı
- provider abstraction
- adapter boundaries
- Twilio / Dialog360 / Cloud API genişleme yolu

### Agent 4. Reliability and Observability Analyst

Odak:

- retry, idempotency, duplicate prevention
- message delivery visibility
- silent failure surfaces

### Agent 5. Product Strategy Synthesizer

Odak:

- teknik çıktıları paketleme, rollout ve satış gerçekliğiyle bağlamak
- "şimdi / sonra / hiç dokunma" ayrımı yapmak

## Suggested Questions Per Agent

### Platform Operations Analyst

- Bir müşteri canlıya alınırken hangi adımlar kırılgan?
- Hangi config alanları operatör hatasına açık?
- Minimum rollout standardı nasıl tanımlanmalı?

### Compliance and Data Boundary Analyst

- Hangi veri alanları hassas kabul edilmeli?
- Veri hangi sistemlerde gereksiz kopyalanıyor?
- Sözleşmesel ve operasyonel olarak hangi kontrol noktaları şart?

### Messaging Architecture Analyst

- Mevcut repo hangi abstraction yönünü zaten işaret ediyor?
- Provider adapter contract’ı nasıl tanımlanmalı?
- GHL merkezli akıştan provider-agnostic çekirdeğe geçişte minimum refactor nedir?

### Reliability and Observability Analyst

- En tehlikeli sessiz failure noktaları neler?
- Hangi event’ler mutlaka loglanmalı ve alarmlanmalı?
- Mesaj gönderiminde success/failure state nasıl izlenmeli?

### Product Strategy Synthesizer

- Bu teknik bulgular STOAIX’in paketleri ve satış diliyle nasıl örtüşür?
- Hangi capability managed-service olarak tutulmalı?
- Hangi yatırım kısa vadede en çok ticari güven üretir?

## Suggested Final Synthesis Questions

Crew sonunda şu sorulara ortak cevap üretmeli:

1. Platform bugün hangi müşteri profilleri için güvenle satılabilir?
2. Hangi entegrasyon / rollout modeli bugün fazla kırılgan?
3. Mesajlaşma katmanında minimum doğru abstraction ne olmalı?
4. Hangi uyumluluk / veri sınırları satıştan önce netleştirilmeli?
5. Hangi teknik iyileştirmeler 30 gün içinde yapılmalı?
6. Hangi alanlar enterprise gelmeden önce bekleyebilir?

## Practical Prompting Note

Agent’lere "best architecture" sormayın.

Şunu sorun:

- mevcut repo ve iş modeli içinde en doğru minimum yapı nedir
- hangi karar kısa vadede müşteri güvenini artırır
- hangi riskler satışta, onboard’da veya operasyonda patlar

Bu çalışma için en değerli çıktı, soyut doğrular değil; uygulanabilir sınırlar ve önceliklendirilmiş karar setidir.
