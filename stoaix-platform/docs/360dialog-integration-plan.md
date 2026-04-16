# 360dialog WhatsApp Entegrasyonu — Teknik Plan & Maliyet Analizi

> Oluşturulma: Nisan 2026
> Durum: Planlama
> Bağlam: Receptionist modeli — bilgi topla, qualify et, handoff yap. Satış kapatma yok.

---

## İçindekiler

1. [Mevcut Durum](#1-mevcut-durum)
2. [Tespit Edilen Riskler](#2-tespit-edilen-riskler)
3. [Sprint Planı](#3-sprint-planı)
4. [360dialog Onboarding Hızlandırma](#4-360dialog-onboarding-hızlandırma)
5. [Görsel Pipeline (GPT-4o Vision)](#5-görsel-pipeline-gpt-4o-vision)
6. [Follow-up Task Otomasyonu](#6-follow-up-task-otomasyonu)
7. [Maliyet Analizi — 100 Lead/Gün](#7-maliyet-analizi--100-leadgün)

---

## 1. Mevcut Durum

Altyapı büyük ölçüde hazır:

| Bileşen | Dosya | Durum |
|---|---|---|
| 360dialog webhook handler | `supabase/functions/dialog-inbound/index.ts` | ✅ Çalışıyor |
| Provider-agnostic chat engine | `supabase/functions/_shared/chat-engine.ts` | ✅ Çalışıyor |
| Debounce + processing lock | `chat-engine.ts:84-114` | ✅ Çalışıyor |
| Lead data extraction | `chat-engine.ts:303-455` | ✅ Çalışıyor |
| Credential yönetimi (admin modal) | `components/admin/OrgSettingsModal.tsx` | ✅ Manuel giriş |
| Conversation mode kolonu | `sql/migrations/2026-04-01_conversation_mode.sql` | ✅ DB'de var |
| Re-contact task iptal | `chat-engine.ts:587-592` | ✅ Çalışıyor |
| Delivery status işleme | `dialog-inbound/index.ts:35` | ❌ Yok |
| Görsel mesaj işleme | `dialog-inbound/index.ts:72` | ❌ Sessiz drop |
| wamid idempotency | `messages` tablosu | ❌ Yok |
| AI/Human mod senkronizasyonu | `chat-engine.ts:534-611` | ❌ Mode okunmuyor |
| Client token güvenliği | `channel_config` JSONB | ⚠️ RLS riski |

---

## 2. Tespit Edilen Riskler

### 🔴 Kritik

**R1 — wamid Idempotency Yok**
- Nerede: `dialog-inbound/index.ts` webhook handler, `chat-engine.ts` mesaj kaydı
- Risk: 360dialog başarısız response'ta 20 dakika boyunca retry yapar. Aynı mesaj duplicate kayıt olur, AI aynı mesaja çift yanıt üretir.
- Fix: `messages.external_id` kolonu + `(organization_id, channel, external_id)` unique index

**R2 — Human Modunda AI Sessizleşmiyor**
- Nerede: `chat-engine.ts:534` → conversation sadece `id` ile seçiliyor, `mode` okunmuyor
- Risk: Satışçı `mode: 'human'` yazdığında bile `runChatEngine` çalışmaya devam ediyor. Müşteri hem AI hem insan yanıtı alabilir.
- Fix: `handleInboundMessage` başında `mode` kontrolü — `human` ise AI üretme, mesajı kaydet + bildirim gönder

**R3 — Client Token Browser'a Sızabiliyor**
- Nerede: `OrgSettingsModal.tsx:381` → `channel_config.whatsapp.credentials.client_token` olarak yazılıyor
- Risk: `sql/02_rls.sql:55` org üyelerine `organizations` SELECT izni veriyor. `settings/page.tsx` channel_config'i client'a çekiyor → client_token browser'a gidiyor.
- Fix: Credentials'ı `org_secrets` tablosunda service-role-only saklama

### 🟡 Önemli

**R4 — Org Routing O(N) Tarama**
- Nerede: `dialog-inbound/index.ts:85-88`
- Risk: Tüm aktif org'lar JS'de linear taranıyor. 50+ müşteride her mesajda belirgin yavaşlama.
- Fix: Expression index veya `channel_routing` lookup tablosu

**R5 — 24h Pencere Takibi Yok**
- Risk: Re-contact mesajları 24 saat sonra free text olarak gönderilmeye çalışılıyor → 360dialog reddediyor, sessizce başarısız.
- Fix: `follow_up_tasks.window_expires_at` alanı + n8n'de template/free-text kararı

**R6 — Non-text Mesaj: Sessiz Drop**
- Nerede: `dialog-inbound/index.ts:72`
- Risk: Ses, görsel, PDF gönderen müşteri cevap alamıyor, deneyim kötü.
- Fix: Görsel için Vision pipeline, diğerleri için fallback yanıt

### 🟢 İyileştirme

**R7 — Receptionist Parametreleri Yanlış Ayarlı**
- `max_tokens: 400` → receptionist için fazla uzun yanıt üretme riski
- `MAX_HISTORY: 8` → kısa receptionist konuşmaları için gereğinden fazla
- Fix: `max_tokens: 160`, `MAX_HISTORY: 6`, playbook'ta "2-4 cümle, tek soru" kuralı

---

## 3. Sprint Planı

### Sprint 1 — Güvenilirlik Patch'i (Öncelikli)

**S1-1: wamid Idempotency**

```sql
-- sql/migrations/2026-04-XX_message_idempotency.sql
ALTER TABLE messages ADD COLUMN external_id TEXT;
CREATE UNIQUE INDEX idx_messages_external_id
  ON messages (organization_id, channel, external_id)
  WHERE external_id IS NOT NULL;
```

```typescript
// chat-engine.ts — mesaj kaydında
const { data: existing } = await supabase
  .from('messages')
  .select('id')
  .eq('organization_id', orgId)
  .eq('external_id', wamid)
  .maybeSingle()

if (existing) return  // duplicate webhook, skip

await supabase.from('messages').insert({
  ...,
  external_id: wamid,  // channel + external_id unique
})
```

Etki: Webhook retry'larında duplicate mesaj + AI çift yanıt engellenir.

---

**S1-2: Human Mode AI Suppress**

```typescript
// chat-engine.ts — handleInboundMessage içinde, conversation seçiminde
const { data: existingConvo } = await supabase
  .from('conversations')
  .select('id, mode')    // mode ekle
  ...

// Mesaj kaydedildikten sonra, debounce'dan önce
if (existingConvo?.mode === 'human') {
  // Mesaj zaten kaydedildi (satışçı görsün)
  // Follow-up task iptal (re-contact beklemesin)
  await supabase.from('follow_up_tasks')
    .update({ status: 'cancelled' })
    .eq('contact_id', contactId)
    .like('sequence_stage', 're_contact_%')
  // Bildirim: satışçıya "müşteri yanıtladı"
  await supabase.from('notifications').insert({
    organization_id: orgId,
    type: 'human_reply_received',
    body: `Müşteri yanıtladı — insan modunda konuşma aktif`,
    contact_id: contactId,
  })
  return  // AI üretme
}
```

Etki: Handoff sonrası AI tamamen sessizleşir. Satışçı mesajları görür, bildirim alır.

---

### Sprint 2 — Receptionist Tuning

**S2-1: Parametre Güncelleme**

```typescript
// chat-engine.ts
const MAX_HISTORY = 6       // 8'den 6'ya
// max_tokens: 400 → 160
```

**S2-2: Deterministik Handoff Kuralları**

Otomatik handoff tetikleyicileri (score >= 70 tek başına yeterli değil):

```typescript
function shouldHandoff(
  score: number,
  missingMustFields: string[],
  messageText: string,
  kbFallbackCount: number  // conversations tablosunda tutulacak
): boolean {
  // Kural 1: Tüm must alanlar toplandı
  if (missingMustFields.length === 0 && score >= 60) return true

  // Kural 2: Kullanıcı insan/uzman/fiyat istedi
  const humanKeywords = ['fiyat', 'teklif', 'uzman', 'aranmak', 'randevu',
                          'price', 'quote', 'expert', 'call me', 'appointment']
  if (humanKeywords.some(kw => messageText.toLowerCase().includes(kw))) return true

  // Kural 3: Bot art arda 2 kez KB cevabı bulamadı
  if (kbFallbackCount >= 2) return true

  return false
}
```

**S2-3: Handoff Köprü Mesajı**

```typescript
// Handoff tetiklendiğinde AI son mesajı gönderir
const bridgeMessage = playbook.handoff_bridge_message
  ?? 'Bilgilerinizi aldım, uzman ekibimiz en kısa sürede sizinle iletişime geçecek. 👋'

await sendReply(bridgeMessage)
await supabase.from('conversations')
  .update({ mode: 'human' })
  .eq('id', conversationId)
```

---

### Sprint 3 — Follow-up Task Otomasyonu

**S3-1: Otomatik Task Oluşturma**

```sql
-- sql/migrations/2026-04-XX_followup_window.sql
ALTER TABLE follow_up_tasks
  ADD COLUMN window_expires_at TIMESTAMPTZ,
  ADD COLUMN template_name     TEXT;
```

```typescript
// chat-engine.ts — runChatEngine sonunda (AI yanıt gönderildi)
await supabase.from('follow_up_tasks').upsert({
  organization_id: orgId,
  contact_id:      contactId,
  conversation_id: conversationId,
  task_type:       're_contact',
  sequence_stage:  're_contact_1',
  status:          'pending',
  scheduled_at:    new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
  window_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  template_name:   're_engagement_v1',  // 360dialog onaylı template
}, {
  onConflict: 'organization_id,contact_id,sequence_stage',
  ignoreDuplicates: true,
})
```

**Sequence Tablosu:**

| Stage | Süre | Pencere Durumu | Gönderim Tipi |
|---|---|---|---|
| `re_contact_1` | +4 saat | Açık (< 24h) | Free text |
| `re_contact_2` | +24 saat | Kapalı (≥ 24h) | Template |
| `re_contact_3` | +3 gün | Kapalı | Template |
| Sonrası | — | — | Lead → `nurturing` |

n8n, `pending` taskları işlerken `window_expires_at < now()` kontrolüyle template/free-text kararı verir.

---

### Sprint 4 — Görsel Pipeline

**S4-1: GPT-4o Vision Entegrasyonu**

Desteklenen mesaj tipleri:

| WhatsApp Tipi | İşlem |
|---|---|
| `image` | GPT-4o Vision analizi + lead nota |
| `audio` | (Gelecek) Whisper transkripsiyon |
| `document` | (Gelecek) PDF özet |
| `location` | Şehir bilgisi olarak extracted_data'ya ekle |
| Diğer | "Sadece metin/görsel anlıyorum" fallback |

Sector-aware analiz prompt'ları:

```
dental     → "Hangi bölge, kırık/renk/eksik/dolgu/protez var mı?"
hair       → "Dökülme alanı, yoğunluk, bölge tanımla"
aesthetics → "Hangi bölge, endikasyon nedir?"
default    → "Klinik açıdan önemli bir detay var mı?"
```

Lead profilinde görünüm (dashboard):
```
📎 Görsel Analizi 08.04.2026:
Alt sol bölgede eksik diş, komşu dişlerde hafif sararma.
İmplant veya köprü konsültasyonu uygun.
```

Inbound flow değişikliği:
```
image geldi → Vision analizi → lead.notes'a ekle → messages'a system kayıt
           → "Fotoğrafınızı aldım" acknowledge gönder
           → AI chat engine ÇALIŞMA (görsel ayrı flow)
```

---

### Sprint 5 — Güvenlik (Secret Isolation)

**S5-1: org_secrets Tablosu**

```sql
-- sql/migrations/2026-04-XX_org_secrets.sql
CREATE TABLE org_secrets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  secret_type     TEXT NOT NULL,  -- 'wa_client_token' | 'wa_verify_token' | ...
  secret_value    TEXT NOT NULL,  -- encrypted at rest (Supabase Vault veya pgcrypto)
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (organization_id, secret_type)
);

-- Service role ONLY — anon ve authenticated hiçbir şey göremesin
ALTER TABLE org_secrets ENABLE ROW LEVEL SECURITY;
-- Bilinçli olarak hiçbir SELECT policy yok = service_role only
```

Geçiş planı:
1. `org_secrets` tablosu oluştur
2. Mevcut `channel_config.whatsapp.credentials.client_token` değerlerini migrate et
3. `dialog-inbound` → `org_secrets`'tan okusun
4. `OrgSettingsModal` → kaydetme/okuma endpoint'i üzerinden (token'ı asla frontende gönderme)
5. `channel_config.whatsapp.credentials`'dan client_token'ı temizle

---

### Sprint 6 — Performans

**S6-1: Org Routing Index**

```sql
-- sql/migrations/2026-04-XX_routing_index.sql
CREATE INDEX idx_org_wa_phone_number_id
  ON organizations (
    (channel_config->'whatsapp'->'credentials'->>'phone_number_id')
  )
  WHERE status = 'active'
    AND channel_config->'whatsapp'->>'provider' = '360dialog';
```

Değişiklik: `dialog-inbound`'da JS linear scan → tek SQL sorgu.

**S6-2: Delivery Status Loglama**

```typescript
// dialog-inbound/index.ts — statuses handler
for (const status of change.value.statuses ?? []) {
  const s = status as { id: string; status: string; recipient_id: string }
  if (s.status === 'failed') {
    await supabase.from('messages')
      .update({ delivery_status: 'failed' })
      .eq('external_id', s.id)
    console.error(`[delivery-failed] wamid=${s.id} to=${s.recipient_id}`)
  }
}
```

---

## 4. 360dialog Onboarding Hızlandırma

### Mevcut Flow (Manuel)

```
Admin → OrgSettingsModal → 4 alan manuel giriş → Kaydet
Müşteri: kendi 360dialog hesabını açıyor, credentials kopyalıyor, admin'e bildiriyor
Toplam süre: saatler/günler (müşteri dependent)
```

### Ne Yapılabilir, Ne Yapılamaz?

**Yapılabilir (şimdi):**

| Hızlandırma | Etki | Çaba |
|---|---|---|
| Webhook URL otomatik kopyala butonu | Admin manuel kopyalamak zorunda kalmaz | Küçük |
| "Bağlantıyı Test Et" butonu | Credential doğrulama anında | Küçük |
| Onboarding checklist (müşteri için) | Müşteri adımları biliyor | Küçük |
| Webhook otomatik kayıt (360dialog API) | Credential girilince webhook URL otomatik set | Orta |

Webhook otomatik kayıt — 360dialog `PATCH /v1/configs/webhook` endpoint'i var:
```
POST /v1/configs/webhook
D360-API-KEY: {client_token}
{ "url": "https://ablntzdbsrzbqyrnfwpl.supabase.co/functions/v1/dialog-inbound" }
```
Admin credentials kaydedince backend bunu otomatik çağırabilir.

**Yapılamaz (şimdi) — Embedded Signup:**

Embedded Signup = Facebook Business Login OAuth → müşteri 1-click bağlar.

Gereksinimler:
- 360dialog ile **partner/reseller anlaşması** (ayrı başvuru, minimum commit)
- Meta **App Review** (Business Verification + review süreci)
- Token yönetimi (her WABA için ayrı token, refresh logic)

Sonuç: Aylık 20+ müşteri onboarding'e ulaşmadan ROI yok. Şimdilik **webhook otomatik kayıt** yeterli iyileştirme.

### Önerilen Orta Yol: Guided Setup

```
Admin → "Yeni WhatsApp Bağla" → 3 adımlı wizard
  Adım 1: 360dialog'dan alınacak bilgiler (ekran görüntülü rehber)
  Adım 2: Credentials girilir
  Adım 3: Sistem webhook'u otomatik kaydeder + test eder
```

---

## 5. Görsel Pipeline (GPT-4o Vision)

Detaylar Sprint 4'te. Burada maliyet notu:

- GPT-4o `detail: "low"` mod → 85 token fixed ek maliyet/görsel
- Günde 10 görsel varsayımıyla ek maliyet: ~**$1.5/ay** (ihmal edilebilir)
- Değer: Satışçı hazırlıklı handoff alır, müşteri bilgi tekrar vermek zorunda kalmaz

---

## 6. Follow-up Task Otomasyonu

Tetikleme senaryoları:

```
Senaryo A — Qualify edildi, cevap kesildi:
  AI yanıt verdi → 4h bekledi → cevap yok → re_contact_1

Senaryo B — Handoff yapıldı, satışçı yazmadı:
  mode='human' → 2h bekledi → satışçı yazmadı → satışçıya internal bildirim

Senaryo C — Tek mesaj attı, kayboldu:
  AI sordu → 4h bekledi → re_contact_1 → 24h → re_contact_2 (template) → ...
```

Müşteri cevap verirse tüm pending re_contact task'ları iptal — bu zaten çalışıyor (`chat-engine.ts:587`).

---

## 7. Maliyet Analizi — 100 Lead/Gün

### Varsayımlar

| Parametre | Değer | Açıklama |
|---|---|---|
| Günlük lead | 100 | Yeni veya aktif konuşma |
| Ortalama turn/konuşma | 6 | Receptionist: karşılama + 3 soru + qualify + handoff |
| Günlük AI çağrısı | 600 | 100 lead × 6 turn |
| Input token/çağrı | ~2.000 | System prompt + KB + history + mesaj |
| Output token/çağrı | ~140 | max_tokens: 160, ortalama |
| Görsel mesaj | ~10/gün | Leadlerin %10'u görsel gönderiyor |
| Re-contact template | ~30/gün | Leadlerin %30'u follow-up alıyor |

### Aylık Maliyet Kırılımı (30 gün)

#### OpenAI

| İşlem | Hesap | Aylık Maliyet |
|---|---|---|
| GPT-4o-mini chat (input) | 18.000 çağrı × 2.000 token = 36M token × $0.15/M | **$5.40** |
| GPT-4o-mini chat (output) | 18.000 × 140 token = 2.52M × $0.60/M | **$1.51** |
| extractCollectedData (input) | 18.000 × 2.000 token = 36M × $0.15/M | **$5.40** |
| extractCollectedData (output) | 18.000 × 150 token = 2.7M × $0.60/M | **$1.62** |
| Embedding (KB search) | 18.000 × 50 token = 0.9M × $0.02/M | **$0.02** |
| GPT-4o Vision (10/gün × 30) | 300 çağrı × 1.100 token input = 330K × $2.50/M | **$0.83** |
| GPT-4o Vision (output) | 300 × 200 token = 60K × $10/M | **$0.60** |
| **OpenAI Toplam** | | **~$15.38/ay** |

#### 360dialog + WhatsApp

| Kalem | Hesap | Aylık Maliyet |
|---|---|---|
| 360dialog platform ücreti | Sabit | **~€50-80/ay** |
| WhatsApp kullanıcı kaynaklı konuşma | 3.000 conv × $0.008 (TR oranı) | **$24/ay** |
| WhatsApp business kaynaklı (template) | 900 template × $0.014 | **$12.60/ay** |
| **360dialog + WhatsApp Toplam** | | **~$100-120/ay** |

> ⚠️ WhatsApp conversation fiyatları Meta tarafından ülkeye göre belirlenir. Türkiye oranları 2024 sonrası güncellenmiş olabilir, resmi Meta pricing sayfasından teyit edilmeli.

#### Altyapı

| Servis | Plan | Aylık Maliyet |
|---|---|---|
| Supabase | Pro | **$25** |
| Vercel | Pro | **$20** |
| n8n | Cloud Starter (10K execution) | **$50** veya self-hosted **$15** |
| **Altyapı Toplam** | | **$95-115/ay** |

### Özet

| Kategori | Aylık |
|---|---|
| OpenAI | ~$15 |
| 360dialog + WhatsApp | ~$110 |
| Altyapı | ~$95-115 |
| **Toplam** | **~$220-240/ay** |

**Lead başına maliyet:** $220 / 3.000 lead = **~$0.07/lead**

### Ölçek Projeksiyonu

| Lead/Gün | Aylık Lead | Tahmini Maliyet | Lead Başına |
|---|---|---|---|
| 50 | 1.500 | ~$165/ay | $0.11 |
| 100 | 3.000 | ~$230/ay | $0.08 |
| 250 | 7.500 | ~$420/ay | $0.056 |
| 500 | 15.000 | ~$700/ay | $0.047 |
| 1.000 | 30.000 | ~$1.200/ay | $0.040 |

Ölçek büyüdükçe lead başına düşen maliyet — sabit altyapı maliyeti dağılıyor, OpenAI ve WhatsApp linear artıyor.

### Kritik Maliyet Uyarıları

1. **extractCollectedData her turn çalışıyor** — GPT-4o-mini maliyetinin ~%50'si buradan geliyor. Optimizasyon: her turn değil, her 2-3 turn'de bir çalıştır veya sadece konuşma kapanırken.

2. **WhatsApp conversation pricing dominant** — Toplam maliyetin ~%45'i. Lead başına WhatsApp maliyeti sabit → ölçekte en az lineer artan kalem.

3. **GPT-4o Vision pahalı** — Görsel başına ~$0.005, günde 10 görselde $1.5/ay kabul edilebilir. Ama günde 100 görsele çıkılırsa $15/ay olur.

4. **n8n Starter 10K execution** — 100 lead/gün × 30 gün × ortalama 3 n8n execution = 9.000/ay. Sınırda. 150+ lead/gün'de Pro plan gerekiyor ($150/ay).

---

## Sonraki Adımlar

```
[ ] Sprint 1: messages.external_id migration + chat-engine mode check — ~2-3 saat
[ ] Sprint 2: max_tokens/MAX_HISTORY + deterministik handoff — ~1-2 saat
[ ] Sprint 3: follow_up_tasks migration + otomatik task oluşturma — ~3-4 saat
[ ] Sprint 4: image handler + GPT-4o Vision pipeline — ~4-5 saat
[ ] Sprint 5: org_secrets migration + credential izolasyonu — ~1 gün
[ ] Sprint 6: routing index + delivery status logging — ~1-2 saat
```
