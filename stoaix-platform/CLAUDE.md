# stoaix Platform (Multi-Tenant)

## Proje Hakkında
Multi-sektör AI asistan platformu. Her müşteri (organization) kendi AI asistanını bu platform üzerinden yönetir.
- Sektörler: eğitim, klinik, gayrimenkul, teknoloji, turizm vb.
- Müşteri akışı: Admin invite gönderir → müşteri register olur → onboarding → dashboard

**NOT:** Üst dizindeki klinik sistemiyle (`stoaix/`) karıştırmayın. Bu bağımsız bir Supabase projesine sahip.

## Mimari

```
[URL belirlenecek] (Vercel — Next.js 14)
        ↕
Supabase Platform DB (ablntzdbsrzbqyrnfwpl)
        ↕
LiveKit (Voice Agent — Python)
        ↕
OpenAI (Embedding + GPT-4o Mini)
```

## Klasör Yapısı

```
stoaix-platform/
├── dashboard/                     ← Next.js 14 App Router
│   ├── app/
│   │   ├── login/                 ← Giriş sayfası
│   │   ├── register/              ← Invite token ile kayıt
│   │   ├── onboarding/            ← 4 adımlı müşteri kurulum wizard'ı
│   │   ├── dashboard/             ← Ana dashboard (overview, conversations, calls, knowledge)
│   │   ├── admin/                 ← Super admin (org listesi, invite oluşturma, tickets)
│   │   └── api/                   ← API route'ları
│   │       ├── invite/[token]/    ← Token doğrulama (GET)
│   │       ├── register/          ← Kayıt tamamlama (POST)
│   │       ├── orgs/              ← Org + invite oluşturma (POST, admin only)
│   │       ├── onboarding/
│   │       │   ├── business-info/ ← İşletme bilgisi güncelleme (PATCH)
│   │       │   └── complete/      ← Onboarding tamamlama (POST)
│   │       └── knowledge/         ← KB CRUD + embedding (POST/PATCH/DELETE)
│   ├── components/
│   │   └── admin/
│   │       ├── AdminClient.tsx    ← Admin sayfası client bileşeni
│   │       └── NewOrgModal.tsx    ← Yeni müşteri ekleme modalı
│   ├── lib/supabase/
│   │   ├── client.ts              ← Browser client (createBrowserClient)
│   │   └── server.ts              ← Server client + service client
│   └── middleware.ts              ← Auth + onboarding_status routing
│
├── voice-agent/
│   ├── agent.py                   ← LiveKit Python agent (organization_id tabanlı)
│   └── livekit.toml               ← LiveKit Cloud deploy config
│
└── sql/
    ├── 01_schema.sql              ← 15 tablo tanımı
    ├── 02_rls.sql                 ← Row Level Security
    ├── 03_eurostar_seed.sql       ← İlk müşteri seed verisi
    ├── 04_eurostar_kb.sql         ← Eurostar KB (62 knowledge_items)
    └── migrations/                ← Tarihli değişiklikler
```

## Teknolojiler

- **Frontend:** Next.js 14, App Router, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL 15 + pgvector, Auth, RLS)
- **Voice:** LiveKit Cloud + Deepgram STT + Cartesia TTS + GPT-4o Mini
- **AI/Embedding:** OpenAI text-embedding-3-small (1536 dim)
- **Deployment:** Vercel (dashboard), LiveKit Cloud (voice agent)

## Supabase

- **Project ID:** ablntzdbsrzbqyrnfwpl
- **URL:** https://ablntzdbsrzbqyrnfwpl.supabase.co
- Email confirmation: **KAPALI**
- Migration format: `YYYY-MM-DD_kisa_aciklama.sql`

## Veritabanı Tabloları (15)

| Tablo | Açıklama |
|---|---|
| organizations | Tenant kökü (sector, status, onboarding_status) |
| org_users | Kullanıcı↔org ilişkisi (role: admin/viewer) |
| super_admin_users | Platform adminleri |
| invite_tokens | 7 günlük davet token'ları |
| contacts | Kanal agnostik müşteri profilleri |
| leads | Qualification score (0-100), collected_data JSONB |
| conversations | voice/whatsapp/instagram/web |
| messages | Konuşma mesajları |
| voice_calls | LiveKit room kayıtları + transcript |
| knowledge_items | vector(1536) embedding, match_knowledge_items() RPC |
| intake_schemas | Veri toplama şeması (fields JSONB) |
| agent_playbooks | AI persona + system prompt + routing_rules |
| handoff_logs | İnsan devir kayıtları |
| follow_up_tasks | Takip görevleri |
| crm_sync_logs | CRM entegrasyon logları |

## Auth & Routing Mantığı

```
/login          → public
/register       → public (token gerekli)
/onboarding     → auth gerekli, onboarding_status != completed
/dashboard/*    → auth gerekli, onboarding_status = completed
/admin/*        → sadece super_admin_users
```

**Middleware akışı:**
1. super_admin → her yere erişebilir
2. org_user + onboarding tamamlanmamış → sadece /onboarding
3. org_user + onboarding tamamlanmış → /dashboard (onboarding'e giremez)
4. Hiçbiri → /login

## Müşteri Onboarding Akışı

1. Admin `/admin` → "Yeni Müşteri Ekle" → org + invite token oluşur
2. Müşteri `/register?token=xxx` → signOut (mevcut session temizle) → signUp → `/api/register`
3. `/onboarding` → 4 adım:
   - İşletme bilgileri (phone, email, city, country)
   - Hizmetler → `knowledge_items` (item_type: service) + embedding
   - SSS → `knowledge_items` (item_type: faq) + embedding
   - Ek bilgiler → pricing + policy → `onboarding_status: completed`
4. `/dashboard` → erişim açılır

## İlk Müşteri: Eurostar Yurtdışı Eğitim

- **org_id:** a1b2c3d4-0000-0000-0000-000000000001
- **slug:** eurostar, **sector:** education
- **AI Persona:** "Elif", dil: tr
- **Intake schema:** 15 alan (city, full_name, phone, age, nationality, vb.)
- **KB:** 62 knowledge_item (ülkeler, fiyatlar, SSS)
- **Voice:** LiveKit SIP → Twilio +1 318 569 8481

## Standart GHL Pipeline (Tüm Müşteriler)

Her GHL müşterisi için aynı pipeline yapısı kullanılır. `stage_mapping` key'leri sabit:

| Key | GHL Stage Adı | DB `leads.status` |
|---|---|---|
| `new_lead` | New Lead | `new` |
| `ai_qualifying` | AI Qualifying | `in_progress` |
| `hot_lead` | 🔥 Hot Lead / Handoff | `handed_off` |
| `nurturing` | ⏳ Nurturing | `nurturing` |
| `appointment_booked` | 📅 Appointment Booked | `qualified` |
| `won` | ✅ Won | `converted` |
| `lost` | ❌ Lost / Archive | `lost` |

Edge function yeni lead geldiğinde otomatik `ai_qualifying` stage'ine taşır.
Hot Lead / Handoff: appointment booking'i insan satışçıya devretmek isteyen müşteriler için opsiyonel.

```json
{
  "provider": "ghl",
  "location_id": "...",
  "pit_token": "...",
  "pipeline_id": "...",
  "stage_mapping": {
    "new_lead":           "ghl_stage_id",
    "ai_qualifying":      "ghl_stage_id",
    "hot_lead":           "ghl_stage_id",
    "nurturing":          "ghl_stage_id",
    "appointment_booked": "ghl_stage_id",
    "won":                "ghl_stage_id",
    "lost":               "ghl_stage_id"
  }
}
```

## Geliştirme Kuralları

1. API route'larda service client için `@supabase/supabase-js` direkt kullan (`createClient` from package, cookies bağımsız) — GET route'larda `cookies()` sorun çıkarır
2. Server component'larda `createClient()` from `@/lib/supabase/server`
3. Client component'larda `createClient()` from `@/lib/supabase/client`
4. Her SQL değişikliği `sql/migrations/` altına tarihle eklenmeli
5. TypeScript strict mode kapalı
6. RLS her zaman açık, service role key sadece server-side

## Sık Kullanılan Komutlar

```bash
# Dashboard geliştirme
cd stoaix-platform/dashboard
npm run dev   # localhost:3000

# Deploy
git add stoaix-platform/...
git commit -m "açıklama"
git push origin main   # Vercel otomatik deploy

# Voice agent (LiveKit Cloud'da çalışıyor, lokal test için)
cd stoaix-platform/voice-agent
python agent.py dev
```

## Açık Görevler

- [ ] Custom domain belirleme (app.stoaix.com veya farklı)
- [ ] Twilio outbound SIP bağlantısı (Credential List + LIVEKIT_SIP_OUTBOUND_TRUNK_ID)
