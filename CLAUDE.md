# stoaix AI Klinik System

## Proje Hakkında
Kliniğe özel AI satış asistanı platformu. Klinikler bu dashboard üzerinden:
- AI asistanını onboarding ile kendi bilgileriyle besler
- Gelen WhatsApp/SMS konuşmalarını takip eder
- Lead skorlarını ve satış devirlerini yönetir
- Bilgi bankasını günceller

## Mimari

```
panel.stoaix.com (Vercel — Next.js 14)
        ↕
Supabase (PostgreSQL + Auth + RLS + Edge Functions)
        ↕
n8n (Otomasyon — AI konuşma akışı)
        ↕
GoHighLevel (CRM — WhatsApp/SMS gelen mesajlar)
```

## Klasör Yapısı

```
stoaix/
├── klinik-dashboard/          ← Next.js 14 App Router (panel.stoaix.com)
│   ├── app/
│   │   ├── (auth)/            ← Login, register, waiting sayfaları
│   │   ├── admin/             ← Super admin paneli
│   │   ├── dashboard/         ← Klinik dashboard
│   │   └── onboarding/        ← Onboarding akışı
│   ├── components/
│   ├── lib/
│   │   ├── supabase/          ← Supabase client'ları
│   │   └── clinic-types.ts    ← Klinik tipi şablonları
│   └── middleware.ts          ← Auth yönlendirme
│
├── sql/                       ← Supabase SQL dosyaları
│   ├── 01_schema.sql          ← Tablo tanımları
│   ├── 02_functions.sql       ← Fonksiyonlar ve triggerlar
│   ├── 03_rls.sql             ← Row Level Security politikaları
│   ├── 04_realtime.sql        ← Realtime ve son ayarlar
│   └── migrations/            ← Tarihli değişiklikler
│
├── supabase/
│   └── functions/
│       └── handle-incoming-message/
│           └── index.ts       ← GHL webhook → n8n köprüsü
│
├── n8n-workflows/             ← n8n workflow JSON export'ları
│
└── docs/
    └── database.docx          ← Database dokümantasyonu
```

## Teknolojiler

- **Frontend:** Next.js 14, App Router, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL 15, Auth, RLS, Edge Functions / Deno)
- **CRM:** GoHighLevel (GHL) — WhatsApp/SMS entegrasyonu
- **Otomasyon:** n8n — AI konuşma workflow'u
- **AI:** Claude claude-sonnet-4-20250514 (n8n üzerinden)
- **Deployment:** Vercel (frontend), Supabase Cloud (backend)
- **Domain:** panel.stoaix.com

## Önemli Bilgiler

### Veritabanı
- Supabase project ID: iylabpsokydolhuhvvwi
- Tüm tablo değişiklikleri sql/migrations/ altına tarihle eklenmeli
- Migration format: YYYY-MM-DD_kisa_aciklama.sql
- SQL değişikliklerini Supabase Dashboard → SQL Editor'dan çalıştır

### Auth Akışı
1. Kullanıcı invite link ile /register sayfasına gelir
2. invite_tokens tablosundan token doğrulanır
3. Supabase Auth ile kayıt olur
4. clinic_registrations tablosuna başvuru kaydedilir
5. Admin onaylar → clinics + clinic_users oluşturulur
6. Kullanıcı /onboarding'e yönlendirilir
7. Onboarding tamamlanınca /dashboard'a erişim açılır

### Middleware Mantığı
- super_admin_users'da kayıtlı → /admin erişim açık
- clinic_users'da kayıtlı → dashboard/onboarding erişim açık
- Hiçbirinde yok → /waiting sayfasına yönlendir

### n8n Akışı
1. GHL'den gelen mesaj → Supabase Edge Function (handle-incoming-message)
2. Edge Function 4sn debounce → mesajları birleştirir
3. n8n webhook'una POST atar
4. n8n → Claude API ile yanıt üretir
5. n8n → Supabase'e konuşma kaydeder
6. n8n → GHL'e yanıt gönderir

### GHL Entegrasyonu
- Her klinik için: ghl_location_id, ghl_pit_token, ghl_pipeline_id
- ghl_pipeline_stages JSONB: { "stage_adı": "ghl_stage_id" }

### Deployment
- `git push origin main` → Vercel otomatik deploy alır
- SQL değişiklikleri manuel olarak Supabase SQL Editor'dan çalıştırılır
- Edge Function değişiklikleri: Supabase Dashboard → Edge Functions

## Geliştirme Kuralları

1. Her SQL değişikliği için sql/migrations/ altına dosya ekle
2. TypeScript strict mode kapalı (tsconfig.json'da strict: false)
3. Supabase anon key frontend'de kullanılabilir, service role key asla
4. RLS her zaman açık olmalı
5. Yeni tablo eklenirse: RLS politikaları + realtime publication eklenmeli

## Sık Kullanılan Komutlar

```bash
# Lokal geliştirme
cd klinik-dashboard
npm run dev

# Deploy
git add .
git commit -m "açıklama"
git push origin main

# Supabase SQL çalıştır
# → Supabase Dashboard → SQL Editor'dan yapılır
```
