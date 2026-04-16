# STOAIX Platform 360dialog Architecture Analysis Brief

Bu doküman Claude Code'a doğrudan verilecek analiz brifidir.

Amaç, `C:\Users\emirt\stoaix\stoaix-platform` projesini güncel iş gerçekliğimize göre mimari ve operasyonel açıdan değerlendirmektir.

Bu bir generic code review değildir.
Amaç, mevcut kod tabanını ve ürün mimarisini gerçek müşteri rollout'u, güvenilirlik, veri sınırları ve entegrasyon stratejisi açısından değerlendirmektir.

Önemli:

- önce repoyu incele
- sonra bulgularını mevcut iş modelimize göre önceliklendir
- teorik "best practice" listesi üretme
- uygulanabilir kararlar üret

## İş Gerçekliği

STOAIX bugün self-serve SaaS değil, managed-service ağırlıklı bir healthcare clinic operations platformudur.

Odak sektörler:

- hair transplant
- dental
- medical aesthetics
- cosmetic / plastic surgery clinics

Platformun değeri sadece AI konuşması değil:

- lead kaybetmemek
- mesajlaşma akışlarını güvenilir çalıştırmak
- follow-up ve handoff süreçlerini yönetmek
- operasyon ekibine görünürlük sağlamak

Lost leads = lost revenue.
Silent failures, eksik feature'lardan daha tehlikelidir.

## Çok Önemli Yeni Karar

WhatsApp mesajlaşma katmanında `GoHighLevel / WAGHL` bağımlılığını sistemden çıkarmaya karar verdik.

Yeni hedef durum:

- WhatsApp messaging provider olarak `360dialog` ana çözüm olacak
- `GoHighLevel / WAGHL` messaging katmandan tamamen çıkarılacak
- Supabase internal system of record olarak kalacak
- CRM bağımlılığı messaging layer'dan ayrılacak
- Twilio veya diğer alternatifler daha sonra opsiyonel provider olarak düşünülebilir
- şu an ana hedef provider-agnostic teori değil; `360dialog`u düzgün ana akış haline getirmek

Yani analiz şu soruya cevap vermeli:

Mevcut mimaride `GHL/WAGHL` bağımlılığı nasıl temizlenir ve `360dialog` merkezli, daha temiz bir mesajlaşma katmanına nasıl geçilir?

## Çok Net Scope Sınırı

`Voice agent`, `LiveKit`, SIP, telephony ve mevcut sesli ajan akışı bu analizde ana değişim alanı değildir.

Şunları özellikle yapma:

- voice agent mimarisini yeniden tasarlama
- LiveKit tarafına müdahale önermeye çalışma
- voice workflow'leri bu analizin merkezi yapma
- ses tarafındaki unfinished alanları bu çalışmanın blocker'ı gibi sunma

Voice tarafına sadece şu durumlarda referans ver:

- messaging, lead state veya handoff boundary ile doğrudan ilişkiliyse
- veri modeli veya shared domain contract açısından etkisi varsa

Ama bu durumda bile önerilerin odağı voice değil, messaging / platform boundary olmalı.

## Temel Varsayımlar

Aşağıdakileri analiz boyunca doğru kabul et:

### 1. Supabase core operational system of record

Supabase bizim gerçek iç sistemimiz:

- leads
- conversations
- handoff state
- workflow state
- clinic-side operational tracking

### 2. GHL artık messaging için stratejik değil

`GHL/WAGHL` çıkarılacak.
Messaging katmanında kalıcı çözüm olarak düşünme.

### 3. 360dialog ana WhatsApp yönü

Yakın vadeli ana provider `360dialog` olacak.

### 4. Twilio ve benzerleri sonra

Twilio veya başka provider'lar daha sonra eklenebilir.
Ama bugünkü ana mimari kararı bunlara göre verilmemeli.

### 5. Appointment booking tenant bazlı

Booking feature her tenant için zorunlu değil.
Booking sorunlarını global blocker gibi değerlendirme.

### 6. Voice agent bu çalışmanın merkezi değil

Voice tarafı önemli ama bu analizde asıl odak:

- WhatsApp messaging migration
- provider boundary
- rollout safety
- reliability
- CRM ayrışması

## Analizden Beklenen Başlıklar

### 1. Current-State Architecture Assessment

Repoyu inceleyip mevcut mimarinin pratikte nasıl çalıştığını çıkar:

- dashboard
- supabase edge functions
- shared chat engine
- sql schema
- onboarding / org settings / channel config yapıları
- mevcut GHL/WAGHL bağımlılık noktaları
- mevcut Meta WhatsApp / diğer provider izleri

Kağıt üstü değil, kod bazlı current state çıkar.

### 2. GHL / WAGHL Dependency Inventory

Özellikle şunları envanterle:

- GHL/WAGHL webhook giriş noktaları
- outbound message send bağımlılıkları
- GHL contact id / location id / pipeline id gibi veri bağımlılıkları
- CRM side-effect'lerinin messaging akışına gömülü olduğu yerler
- tenant config ekranlarında GHL'ye bağlı kalan alanlar
- migration açısından riskli coupling'ler

Bu kısmı net ve somut istiyorum.

### 3. 360dialog-Centric Target Architecture

`360dialog` ana provider olacaksa hedef yapı nasıl olmalı?

Şunları değerlendir:

- inbound webhook normalization
- outbound send contract
- provider message id handling
- delivery/read/failure status modeli
- retry / idempotency / duplicate protection
- provider-specific metadata ile internal conversation state'in ayrılması
- tenant başına channel credential yönetimi
- CRM bağımlılığının messaging core'dan ayrılması

Burada amaç teori değil:
mevcut repoya uygulanabilir minimum doğru sınırı tanımla.

### 4. Migration Strategy: GHL/WAGHL -> 360dialog

Müşterileri `WAGHL`'den `360dialog`'a taşımak için aşamalı plan çıkar:

- hangi kodlar önce refactor edilmeli
- hangi compatibility layer geçici olarak gerekir
- hangi veri / config migration'ı gerekir
- hangi operational runbook gerekir
- hangi adımda rollback zor olur
- müşteri kesintisi olmadan geçiş mümkün mü, nasıl

Bu bölüm çok önemli.
Sadece teknik değil, rollout riski açısından da değerlendir.

### 5. Reliability and Operational Safety

Messaging ve follow-up katmanında şu riskleri değerlendir:

- duplicate inbound webhook
- duplicate outbound send
- delivery failure visibility
- credential expiry / auth failure
- background task failures
- message persisted but not sent / sent but not persisted consistency sorunları
- tenant misconfiguration
- observability eksikleri
- operator alerting eksikleri

Minimal ama güçlü reliability standardı öner.

### 6. Compliance / Data Boundary / Privacy

Healthcare-clinic bağlamında şu açıdan değerlendir:

- PII / health-related information temas noktaları
- hangi sistemlerde veri çoğalıyor
- provider'lara gereksiz veri yayılması var mı
- log'larda hassas veri riski var mı
- retention / deletion / audit beklentileri
- UK / EU / Turkey müşteri beklentileri açısından hangi alanlar yakın vadede problem çıkarabilir

Tam hukuk memo istemiyoruz.
Teknik ve operasyonel açıdan şimdi önemli olan veri sınırlarını istiyoruz.

### 7. Rollout Readiness

Bugünkü sistem hangi müşteri profili için güvenle canlıya alınabilir?

Şu ayrımı net yap:

- controlled pilot için yeterli olanlar
- daha fazla müşteri rollout öncesi düzeltilmesi gerekenler
- enterprise / higher-volume müşteri öncesi şart olanlar

## İnceleme Tarzı

Şu prensiplere göre değerlendir:

- feature brainstorming yapma
- gereksiz büyük redesign önermeyin
- mevcut ürün yönünü koruyarak en doğru minimum mimari sınırı bul
- operasyonel gerçekliği teorik temizlikten üstün tut
- bugün satılabilirlik ve çalıştırılabilirlik açısından düşün
- GHL messaging'i savunmaya çalışma; karar verilmiş durumda, çıkacak
- `360dialog` ana çözüm varsayımıyla düşün
- Twilio gibi provider'ları future-compatible not olarak ele alabilirsin ama bugünkü ana hedef yapma
- voice / LiveKit tarafını bu analizin merkezine çekme

## Özellikle Cevaplamanı İstediğim Sorular

Bu soruları açık başlıklar halinde cevapla:

1. Mevcut sistemde WhatsApp messaging tarafında GHL/WAGHL'ye en kritik bağımlılık noktaları neler?
2. `360dialog`'a geçiş için minimum doğru target architecture ne olmalı?
3. Messaging core ile CRM/provider side-effect boundary bugün nerede yanlış karışmış?
4. Bu migration'da en büyük teknik riskler neler?
5. En büyük operasyonel rollout riskleri neler?
6. Hangi refactor'lar hemen yapılmalı?
7. Hangi alanlar daha sonra bırakılabilir?
8. Sistem controlled pilot için hangi şartlarla güvenli kalır?
9. Enterprise veya daha yüksek hacim öncesi hangi eksikler kapanmalı?
10. Voice / LiveKit alanına dokunmadan bu migration nasıl güvenli şekilde yürütülür?

## İstenen Çıktı Formatı

Yanıtını şu formatta ver:

### Part 1. Executive Summary

- kısa ama net genel değerlendirme

### Part 2. Current-State Findings

- mevcut mimari
- GHL/WAGHL dependency map
- messaging + CRM coupling bulguları

### Part 3. Risks

- real blockers
- high risks
- medium risks
- overblown / not urgent items

### Part 4. 360dialog Target Architecture

- önerilen minimum target architecture
- abstraction boundary
- adapter responsibilities
- persistence / webhook / delivery model

### Part 5. Migration Plan

- phase by phase migration
- immediate refactors
- transitional compatibility needs
- safe-to-defer items

### Part 6. Rollout & Compliance View

- pilot suitability
- rollout prerequisites
- compliance/data-boundary concerns

### Part 7. Concrete Next Actions

- önümüzdeki 2-4 hafta içinde yapılacak en değerli işler

## Uygulama Beklentisi

Eğer çok net, contained ve high-value bir refactor opportunity görürsen bunu ayrıca belirt.
Ama bu aşamada primary task implement etmek değil; önce doğru mimari analizi ve önceliklendirme çıkarmak.

Özet:

Generic yorum istemiyoruz.
Mevcut repo üstünden, `GHL/WAGHL`'yi çıkarıp `360dialog`u ana mesajlaşma katmanı yapmaya dönük gerçekçi bir mimari değerlendirme istiyoruz.

Ve bunu yaparken `voice agent / LiveKit` alanına müdahale önermemelisin.
