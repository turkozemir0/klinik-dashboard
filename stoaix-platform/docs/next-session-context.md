# Sonraki Session — Bağlam ve Plan

## Tarih: 11 Nisan 2026

---

## 1. Instagram OAuth — TAMAMLANDI ✅

### Yapılanlar
- ✅ OAuth one-click bağlantı (settings sayfası — Bağla/Kes butonu)
- ✅ Webhook alımı + AI yanıt + Instagram'a gönderim çalışıyor
- ✅ Auto-subscribe callback'te otomatik (Messenger use case eklendi → `pages_messaging` aktif)
- ✅ Standard Access, Live modda — App Review gerekmez, sınırsız müşteri bağlanabilir

### Meta App Bilgileri
- App ID: `2208488116225592`
- Webhook verify token: `stoaix-ig-2026` (Supabase secret)
- Callback URL: `https://ablntzdbsrzbqyrnfwpl.supabase.co/functions/v1/instagram-inbound`
- Test org: `dee765d8-69c9-4f0b-a8c9-2bfbe25df19b` (@emirturkoz.ai)

---

## 2. Önümüzdeki Büyük Görevler

### Faz A — Self-Service Kanal Kurulumu (her org kendi panelinden)

#### A1. Instagram DM Self-Service (mevcut OAuth akışını settings'te tamamla)
- Şu an sadece `/dashboard/settings` sayfasında var → **tamamlandı**
- Webhook çalışınca production-ready

#### A2. WhatsApp Business Platform Self-Service
- Benzer OAuth akışı ama Meta'nın WhatsApp Business API üzerinden
- Her org kendi WhatsApp numarasını bağlar
- Şu an 360dialog kullanıyoruz (manuel credentials girişi — OrgSettingsModal admin tarafında)
- **Hedef:** Müşteri kendi panelinden "WhatsApp'ı Bağla" butonuyla bağlasın
- Meta Business Platform → WhatsApp Embedded Signup akışı (Instagram OAuth'a benzer)
- Gerekli: `whatsapp_business_management` + `whatsapp_business_messaging` izinleri
- Callback'te: WABA ID + phone number ID + access token alınır → `channel_config.whatsapp` yazılır

### Faz B — Unified Inbox (ÖNCELİKLİ)

#### B1. Conversations Inbox — `/dashboard/inbox` (yeni sayfa)
Sol panel: konuşma listesi (son mesaj, zaman, kanal badge, contact adı)
Sağ panel: seçili konuşmanın mesaj thread'i + reply box

**Filtreler (üst bar):**
- Kanal: Hepsi / WhatsApp / Instagram / Voice
- Pipeline Stage: Hepsi / New Lead / AI Qualifying / Hot Lead / Nurturing / Appointment Booked / Won / Lost
  - `leads.status` kolonuna göre: `new` / `in_progress` / `handed_off` / `nurturing` / `qualified` / `converted` / `lost`

**Veri modeli:**
- `conversations` → `contact_id`, `channel`, `organization_id`
- `messages` → `conversation_id`, `content`, `role`, `created_at`
- `contacts` → `display_name`, `phone`, `channel_identifiers`
- `leads` → `contact_id`, `status`, `score` (pipeline stage filtresi için JOIN)

#### B2. Kanal bazlı reply API
- WhatsApp → `POST /api/inbox/reply` → 360dialog API (`channel_config.whatsapp.credentials`)
- Instagram → `POST /api/inbox/reply` → Graph API `/{fb_page_id}/messages`
- Voice → reply yok, sadece transcript görünümü

#### B3. Real-time
- Supabase realtime: `messages` INSERT subscription → yeni mesaj anında görünür
- `conversations` UPDATE subscription → son mesaj + okunmamış sayısı güncellenir

#### B4. Sidebar navigasyonu
- Mevcut sidebar'a "Inbox" linki ekle (`/dashboard/inbox`)
- Okunmamış mesaj badge'i (realtime sayaç)

---

## 3. Kritik Dosyalar

| Dosya | Açıklama |
|---|---|
| `dashboard/app/api/instagram/auth/route.ts` | Instagram OAuth başlatma |
| `dashboard/app/api/instagram/callback/route.ts` | Token exchange + DB kayıt |
| `dashboard/app/api/instagram/disconnect/route.ts` | Bağlantıyı kes |
| `dashboard/app/api/admin/instagram/subscribe/route.ts` | Manuel page subscription |
| `dashboard/app/dashboard/settings/page.tsx` | Instagram + Calendar + Excluded Phones |
| `supabase/functions/instagram-inbound/index.ts` | Instagram DM webhook handler |
| `supabase/functions/_shared/chat-engine.ts` | Merkezi chat engine |

## 4. Env Vars (Vercel + .env.local)
```
META_APP_ID=2208488116225592
META_APP_SECRET=<app dashboard'dan>
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=stoaix-ig-2026  (Supabase secret)
```
