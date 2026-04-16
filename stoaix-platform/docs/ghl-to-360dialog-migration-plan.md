# GHL/WAGHL → 360dialog Geçiş Planı

**Tarih:** Nisan 2026
**Hazırlayan:** Claude Code (mimari analiz + uygulama planı)
**Durum:** Onay bekliyor

---

## Karar ve Gerekçe

GoHighLevel (GHL/WAGHL) messaging katmanından çıkarılıyor.

**Neden:**
- WhatsApp mesajlaşma işlevini harici CRM'e bağlamak gereksiz bağımlılık yaratıyor
- GHL fiyatlandırması, esneklik ve multi-tenant yönetim açısından dezavantajlı
- Pipeline / lead yönetimi zaten Supabase'de tam olarak mevcut (ayrı sisteme gerek yok)
- 360dialog, Meta'nın resmi BSP'si (Business Solution Provider) — doğrudan WhatsApp Business API

**Kapsam dışı:**
- Voice agent / LiveKit / SIP — dokunulmayacak
- Eurostar voice akışı — sadece Eurostar kullanıyor, değişmeyecek

---

## Müşteri Profili (Klinik Odaklı)

| Müşteri Tipi | Kanal | Durum |
|---|---|---|
| Klinik (hair transplant, dental, estetik) | **WhatsApp Chat** | Ana hedef |
| Eurostar Yurtdışı Eğitim | WhatsApp Chat + Voice | Mevcut, ayrı tutulacak |

Klinikler ağırlıklı olarak chat sistemini kullanacak. Mimari esnek — ileride voice eklenebilir.

---

## 360dialog Fiyatlandırması

### Platform Ücreti (360dialog)

| Plan | Aylık Ücret | Throughput |
|---|---|---|
| Regular | **€49 / numara** | 80 mesaj/sn |
| Premium | €99 / numara | + SLA garantisi |
| High Throughput | €249 / numara | 1000 mesaj/sn |

→ Klinikler için **Regular (€49/ay)** yeterli.

Partner Platform (birden fazla müşteri yönetimi):
- Growth: €500/ay (20 müşteriye kadar)
- Premium: €1,000/ay

→ Şu an direct client aktivasyonu yeterli. Hacim artınca Partner Platform değerlendirilebilir.

### Meta Mesaj Ücretleri (per-message, Temmuz 2025 sonrası)

| Ülke | Marketing | Utility | Auth |
|---|---|---|---|
| Türkiye | $0.0109 | $0.0053 | $0.0053 |
| Almanya | €0.1131 | €0.0456 | €0.0456 |
| Birleşik Krallık | £0.0382 | £0.0159 | £0.0159 |

**Önemli:** Müşteri mesajı gönderdikten sonraki 24 saat içindeki AI yanıtları **ücretsiz** (service window).
AI sadece gelen mesajlara yanıt veriyorsa → pratik olarak mesaj ücreti neredeyse sıfır.

### Örnek Aylık Maliyet — Türk Klinik

| Kalem | Miktar | Birim | Toplam |
|---|---|---|---|
| 360dialog Regular | 1 numara | €49/ay | €49 |
| Gelen lead AI yanıtları | ~1.000 mesaj | Ücretsiz (24h window) | €0 |
| Outbound follow-up kampanya | ~200 mesaj | $0.0109 | ~$2 |
| **Toplam** | | | **~€51/ay** |

→ Klinik başına ~€50-55/ay messaging maliyeti.

### Onay Süreci

- **WhatsApp Business doğrulaması:** Meta tarafından yönetilir, **7-10 iş günü** (garanti yok)
- **Onayı hızlandıran:** Meta Business Manager doğrulanmış olmalı, işletme adı tutarlı olmalı
- **Display name değişikliği:** Kayıt sonrası 30 gün bekleme süresi var

**Pratik beklenti:** Onay başvurusundan aktivasyona kadar **1-3 hafta** arası plan yapın.

---

## Mevcut Mimari (Kod Bazlı Bulgular)

### Mesajlaşma Akışı (Şu An)

```
GHL Webhook
    ↓
supabase/functions/whatsapp-inbound/index.ts   ← GHL-specific
    ↓
_shared/chat-engine.ts handleInboundMessage()  ← ZATEN PROVIDER-AGNOSTIC
    ↓
OpenAI → sendGHLMessage() callback             ← GHL API
    ↓
updateGHLPipelineStage() callback              ← GHL CRM side-effect
```

### Kritik Bulgu: Chat-Engine Zaten Hazır

`handleInboundMessage(opts)` interface callback tabanlı:
- `sendReply(message)` → provider-specific outbound
- `onNewLead?()` → optional CRM side-effect

**360dialog için sadece yeni webhook handler lazım. Chat-engine değişmiyor.**
Meta WhatsApp Cloud API handler (`meta-whatsapp-inbound/index.ts`) doğrudan template.

### GHL Bağımlılık Haritası

| Bileşen | Dosya | Coupling | Aksiyon |
|---|---|---|---|
| Inbound webhook receiver | `whatsapp-inbound/index.ts` | KRİTİK | Yeni 360dialog handler yaz |
| Outbound send | `sendGHLMessage()` | KRİTİK | `send360dialogMessage()` yaz |
| Pipeline stage update | `updateGHLPipelineStage()` | ORTA | `onNewLead: undefined` bırak |
| Calendar booking | `chat-engine.ts:327-343` | ORTA | Guard ekle, sonra Google ile değiştir |
| Admin config formu | `OrgSettingsModal.tsx` | DÜŞÜK | 360dialog form fields ekle |

### Internal CRM: Zaten Var

GHL pipeline'ına gerek yok. Supabase'de eksiksiz:

```
leads.status: new → in_progress → handed_off → nurturing → qualified → converted → lost
leads.qualification_score: 0-100 (chat-engine otomatik günceller)
leads.collected_data: JSONB (AI extracted structured data)
KanbanBoard.tsx: visual pipeline (mevcut, çalışıyor)
follow_up_tasks: takip görevleri
handoff_logs: handoff geçmişi
```

`onNewLead` callback kaldırılırsa → lead yönetimi tamamen internal → **GHL pipeline çıkıyor**.

---

## Hedef Mimari

### Mesajlaşma Akışı (Hedef)

```
360dialog Webhook
    ↓
supabase/functions/360dialog-inbound/index.ts   ← YENİ
    ↓
_shared/chat-engine.ts handleInboundMessage()   ← AYNEN KALIR
    ↓
OpenAI → send360dialogMessage() callback        ← YENİ
    ↓
[onNewLead: undefined]                           ← Supabase internal CRM yeterli
```

### channel_config.whatsapp (360dialog için)

```jsonb
{
  "active": true,
  "provider": "360dialog",
  "credentials": {
    "client_token": "...",
    "phone_number_id": "...",
    "waba_id": "...",
    "webhook_verify_token": "stoaix_verify_xyz"
  }
}
```

### Org Lookup

360dialog → Meta gibi `phone_number_id` üzerinden:
```sql
SELECT * FROM organizations
WHERE channel_config->'whatsapp'->>'provider' = '360dialog'
AND channel_config->'whatsapp'->'credentials'->>'phone_number_id' = $phoneNumberId
```

---

## Uygulama Planı

### Faz 1 — 360dialog Handler (2-3 gün teknik iş)

**Teknik:**

1. `supabase/functions/360dialog-inbound/index.ts` — YENİ
   - Template: `supabase/functions/meta-whatsapp-inbound/index.ts`
   - 360dialog payload normalize et (Meta format ile neredeyse aynı)
   - `send360dialogMessage()` → `POST https://waba.360dialog.io/v1/messages`, header: `D360-API-KEY`
   - `wamid` idempotency check (duplicate webhook önleme)
   - Webhook signature verification (`X-Hub-Signature-256`)
   - `onNewLead: undefined` (no GHL pipeline)

2. `supabase/functions/_shared/chat-engine.ts` — KÜÇÜK DEĞİŞİKLİK
   - Calendar booking bloğuna guard: `if (crm_config?.provider === 'ghl' && features?.calendar_booking)`
   - 360dialog org'larda otomatik disable

3. `dashboard/components/admin/OrgSettingsModal.tsx` — ORTA DEĞİŞİKLİK
   - `WA_PROVIDERS` listesine `360dialog` ekle
   - Provider `360dialog` seçilince: `client_token`, `phone_number_id`, `waba_id`, `webhook_verify_token` alanları
   - Save: `channel_config.whatsapp.credentials` olarak kaydet

**Test:**
- Supabase Edge Function deploy
- 360dialog test webhook → handler doğru parse ediyor mu?
- OrgSettingsModal → 360dialog provider seç, kaydet, DB'de doğru görünüyor mu?

---

### Faz 2 — Eurostar Geçişi (1-2 gün + 1-3 hafta 360dialog onay bekleme)

**Önkoşul:** 360dialog'da WABA başvurusu tamamlanmış, `client_token` + `phone_number_id` elinizde.

1. OrgSettingsModal → Eurostar → WhatsApp sekmesi → `360dialog` seç → credentials gir
2. 360dialog webhook URL'ini Supabase endpoint'e yönlendir:
   `https://ablntzdbsrzbqyrnfwpl.supabase.co/functions/v1/360dialog-inbound`
3. **24 saat dual-mode:** GHL webhook aktif tutulur (eski mesajlar için)
4. Yeni mesajların 360dialog'dan geldiği confirm edilir
5. GHL webhook kapatılır, `crm_config.provider = 'none'` güncellenir

**Rollback:** `channel_config.whatsapp.provider = 'ghl'` → GHL handler tekrar devreye girer.
**Müşteri kesintisi:** Sıfır.

---

### Faz 3 — Google Calendar Entegrasyonu (3-4 gün — ayrı, blocker değil)

GHL calendar booking'i Google Calendar ile değiştir.

**Akış:**
1. Org admin → "Google Takvim Bağla" butonuna tıklar
2. Google OAuth → `calendar.events` scope → `refresh_token` saklanır
3. AI randevu intent algılar → Google Calendar free/busy sorgusu
4. Slot seçilir → Google Calendar event oluşturulur

**channel_config.calendar:**
```jsonb
{
  "provider": "google",
  "calendar_id": "primary",
  "access_token": "ya29...",
  "refresh_token": "1//...",
  "token_expiry": "2026-04-06T..."
}
```

**Yapılacaklar:**
- `dashboard/app/api/calendar/auth/route.ts` — Google OAuth redirect
- `dashboard/app/api/calendar/callback/route.ts` — code → tokens → DB kaydet
- `OrgSettingsModal.tsx` → Calendar sekmesi: "Google Takvim Bağla" butonu
- `chat-engine.ts` → `fetchFreeSlots()` + `createAppointment()` rewrite (Google Calendar API)
- Token refresh logic (access_token 1 saatte sürüyor)

**Not:** Google Cloud Console'dan OAuth credentials gerekiyor (OAuth 2.0 Client ID + Secret).

---

### Sonraya Bırakılanlar

- Delivery/read status tracking (360dialog status webhooks: sent/delivered/read)
- Operator alerting (outbound send failure notification)
- Credential encryption at rest
- n8n follow-up sequence → 360dialog API kullanması
- Partner Platform aktivasyonu (müşteri sayısı arttıkça)

---

## Değiştirilecek Dosyalar

| Dosya | Değişim Türü | Faz |
|---|---|---|
| `supabase/functions/360dialog-inbound/index.ts` | YENİ | Faz 1 |
| `supabase/functions/meta-whatsapp-inbound/index.ts` | OKUMA (template) | Faz 1 |
| `supabase/functions/_shared/chat-engine.ts` | KÜÇÜK (calendar guard + onNewLead) | Faz 1 |
| `dashboard/components/admin/OrgSettingsModal.tsx` | ORTA (360dialog provider fields) | Faz 1 |
| `dashboard/app/api/calendar/auth/route.ts` | YENİ | Faz 3 |
| `dashboard/app/api/calendar/callback/route.ts` | YENİ | Faz 3 |
| `sql/migrations/YYYY-MM-DD_calendar_config.sql` | YENİ (channel_config.calendar field) | Faz 3 |

---

## Önemli Riskler

| Risk | Olasılık | Etki | Önlem |
|---|---|---|---|
| 360dialog WABA onayı gecikir | ORTA | Eurostar geçişi gecikir | Başvuruyu hemen yap |
| Duplicate 360dialog webhook | DÜŞÜK | Çift AI yanıt | `wamid` idempotency (Faz 1'de implement) |
| Calendar token expiry | ORTA | Randevu alınamaz | Token refresh logic zorunlu |
| Eurostar'da geçiş sırasında mesaj kaybı | ÇOK DÜŞÜK | Müşteri memnuniyeti | Dual-mode geçiş ile önlenir |

---

## Özet Zaman Çizelgesi

```
Şimdi          → 360dialog WABA başvurusu yap (harici, bekleme süresi başlasın)
Hafta 1        → Faz 1: 360dialog handler + OrgSettingsModal + calendar guard
Hafta 2-3      → WABA onay bekleme süresi
Onay gelince   → Faz 2: Eurostar geçişi (1-2 gün)
Hafta 4+       → Faz 3: Google Calendar entegrasyonu
Sonra          → Delivery tracking, alerting, cleanup
```

---

## Sorular / Kararlar (Yarın İçin)

1. **360dialog WABA başvurusu:** Eurostar numarası mevcut GHL'den migrate mi edilecek, yoksa yeni numara mı alınacak?
   - Mevcut numara migrate = müşteri aynı numarayı kullanmaya devam eder (tavsiye)
   - Yeni numara = geçiş daha basit ama müşteri numarası değişir

2. **Google Calendar önceliği:** Klinikler için randevu booking şu an GHL üzerinden mi yürüyor, yoksa manuel mi? Faz 3'e ne kadar acil ihtiyaç var?

3. **Partner Platform:** 360dialog Regular (€49/müşteri) ile mi başlayalım, yoksa Partner Platform (€500/ay sabit, sınırsız müşteri) ile mi?
   - Break-even: 11 müşteri sonrası Partner Platform avantajlı

---

*Kaynak: [360dialog Fiyatlandırma](https://360dialog.com/pricing) | [Meta WhatsApp Fiyatları](https://business.whatsapp.com/products/platform-pricing) | [2026 Fiyat Rehberi](https://www.flowcall.co/blog/whatsapp-business-api-pricing-2026)*
