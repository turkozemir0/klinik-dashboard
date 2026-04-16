# Production Hardening Plan

Klinik SaaS platformu için live öncesi tamamlanması gereken 3 kritik alan.
Bu dosyayı Claude Code'a okutarak implementasyona başlayabilirsin.

---

## 1. KVKK Aydınlatma & Rıza Akışı

### Hedef
Türkiye KVKK Madde 10 (aydınlatma yükümlülüğü) ve Madde 11 (ilgili kişi hakları) uyumu.
Klinik verisi "özel nitelikli kişisel veri" (sağlık verisi) kategorisinde — açık rıza zorunlu.

### Yapılacaklar

#### A) Veritabanı
```sql
-- sql/migrations/2026-04-XX_kvkk_consent.sql

-- Kullanıcı rıza kayıtları
CREATE TABLE consent_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type text NOT NULL, -- 'privacy_policy' | 'data_processing' | 'marketing'
  version text NOT NULL,      -- örn: '2026-04-01'
  accepted_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text
);

-- Veri silme/dışa aktarma talepleri (KVKK Madde 11)
CREATE TABLE data_subject_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  email text NOT NULL,
  request_type text NOT NULL, -- 'deletion' | 'export' | 'rectification'
  status text NOT NULL DEFAULT 'pending', -- 'pending' | 'processing' | 'completed'
  notes text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_subject_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users own consent records"
  ON consent_records FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "admins see dsr"
  ON data_subject_requests FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM super_admin_users WHERE user_id = auth.uid())
  );
```

#### B) Sayfalar & Bileşenler

**`dashboard/app/privacy/page.tsx`** — Aydınlatma metni sayfası (statik)
- TR + EN toggle (mevcut dil sistemi ile)
- Güncel tarih versiyonu header'da
- Bölümler: Veri sorumlusu | Toplanan veriler | Amaç | Saklama süresi | Haklar | İletişim

**`dashboard/components/ConsentModal.tsx`** — İlk girişte çıkan modal
- "Gizlilik Politikasını okudum, kabul ediyorum" checkbox
- "Kişisel verilerimin işlenmesine açık rıza veriyorum" checkbox (ayrı, zorunlu)
- "Pazarlama iletişimleri" checkbox (opsiyonel)
- Kabul etmeden dashboard'a erişim yok
- Kayıt: `consent_records` tablosuna POST

**`dashboard/app/api/consent/route.ts`** — POST (rıza kaydet) + GET (rıza durumu)

**`dashboard/app/api/data-request/route.ts`** — POST (silme/dışa aktarma talebi)
- Herhangi biri email ile talep gönderebilir
- Admin dashboard'a bildirim düşer

**`dashboard/app/dashboard/settings/privacy/page.tsx`** — Kullanıcı gizlilik sayfası
- Verilerimi indir butonu
- Hesabımı sil butonu (soft delete → data_subject_requests'e kayıt)
- Rıza geçmişi tablosu

#### C) Middleware Güncelleme
`dashboard/middleware.ts` — authenticated user ama consent kaydı yoksa → `/onboarding/consent` veya modal göster.

#### D) Aydınlatma Metni İçeriği (TR/EN)
Aşağıdaki bilgileri kullanarak statik metin oluşturulacak:

```
Veri Sorumlusu: stoaix / [Şirket adı ve adresi eklenecek]
İletişim: privacy@stoaix.com
Platform: platform.stoaix.com

Toplanan Veriler:
- Kimlik: ad, soyad, e-posta
- İletişim: telefon numarası
- İşlem: randevu bilgileri, konuşma geçmişi
- Teknik: IP, tarayıcı bilgisi, oturum verileri

Saklama Süresi: Hesap silme tarihinden itibaren 90 gün
Aktarım: Supabase (AB SCC), Vercel (AB SCC), Stripe (AB SCC)
Haklar: Bilgi alma, düzeltme, silme, itiraz, şikayet (KVKK Madde 11)
Başvuru: privacy@stoaix.com veya dashboard → Ayarlar → Gizlilik
```

---

## 2. Sentry Entegrasyonu

### Hedef
Production hataları anlık görme. Frontend JS hataları + API route hataları + Edge function hataları.

### Kurulum

```bash
cd dashboard
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

Wizard şunları oluşturur:
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- `next.config.js` güncelleme

### Yapılacaklar

#### A) Environment Variables (Vercel Dashboard'a ekle)
```
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.sentry.io/xxx
SENTRY_AUTH_TOKEN=xxx   (source maps için)
SENTRY_ORG=stoaix
SENTRY_PROJECT=platform-dashboard
```

#### B) `sentry.client.config.ts`
```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,       // prod'da %10 yeterli
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.05,
  integrations: [Sentry.replayIntegration()],
  // PII filtrele — KVKK uyumu
  beforeSend(event) {
    if (event.request?.data) {
      // system_prompt, telefon, email gibi alanları maskele
      const sensitive = ['system_prompt', 'phone', 'email', 'access_token', 'pit_token']
      sensitive.forEach(key => {
        if (event.request?.data?.[key]) event.request.data[key] = '[Filtered]'
      })
    }
    return event
  },
})
```

#### C) `sentry.server.config.ts`
```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.05,
})
```

#### D) API Route'larda Error Capture
Kritik route'lara ekle: `/api/billing/webhook`, `/api/agent/*`, `/api/inbox/reply`

```typescript
// Mevcut catch bloklarına ekle:
} catch (err) {
  Sentry.captureException(err, { extra: { orgId, route: 'billing/webhook' } })
  return NextResponse.json({ error: 'Internal error' }, { status: 500 })
}
```

#### E) Sentry Alert Kuralları (Sentry Dashboard'dan)
- Yeni issue → email alert (anlık)
- 1 saatte 10+ aynı hata → Slack/email
- `billing/webhook` hatası → anlık (para kaybı riski)

#### F) Ücretsiz Plan Notu
Sentry free plan: 5.000 error/ay yeterli başlangıç için.
https://sentry.io üzerinden kayıt yap → Next.js project oluştur → DSN al.

---

## 3. n8n Health Check

### Hedef
n8n down olduğunda (AI konuşmaları durur) otomatik uyarı + dashboard'da durum göstergesi.

### Yapılacaklar

#### A) Health Check API Route
**`dashboard/app/api/health/n8n/route.ts`**

```typescript
import { NextResponse } from 'next/server'

const N8N_BASE = process.env.N8N_WEBHOOK_BASE_URL?.replace(/\/$/, '') ?? ''
const N8N_API_KEY = process.env.N8N_API_KEY ?? ''

export async function GET() {
  const start = Date.now()
  try {
    const res = await fetch(`${N8N_BASE}/api/v1/workflows?limit=1`, {
      headers: { 'X-N8N-API-KEY': N8N_API_KEY },
      signal: AbortSignal.timeout(5000),
    })
    const latency = Date.now() - start
    if (res.ok) {
      return NextResponse.json({ status: 'ok', latency_ms: latency })
    }
    return NextResponse.json({ status: 'degraded', http_status: res.status, latency_ms: latency }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ status: 'down', error: err.message }, { status: 200 })
  }
}
```

#### B) Scheduled Health Check (Vercel Cron)
`vercel.json` güncelleme — mevcut dunning cron'un yanına:
```json
{
  "crons": [
    { "path": "/api/billing/dunning",  "schedule": "0 6 * * *" },
    { "path": "/api/health/n8n-alert", "schedule": "*/15 * * * *" }
  ]
}
```

**`dashboard/app/api/health/n8n-alert/route.ts`** — Her 15 dakikada çalışır
```typescript
// n8n down ise Supabase'e kayıt atar + email/webhook ile uyarı gönderir
// system_alerts tablosuna INSERT
// (opsiyonel) Resend/SendGrid ile admin@stoaix.com'a email
```

**`sql/migrations/2026-04-XX_system_alerts.sql`**
```sql
CREATE TABLE system_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service text NOT NULL,   -- 'n8n' | 'supabase' | 'livekit'
  status text NOT NULL,    -- 'down' | 'degraded' | 'ok'
  message text,
  created_at timestamptz DEFAULT now()
);
-- RLS: sadece super_admin okuyabilir
```

#### C) Admin Dashboard Durum Göstergesi
**`dashboard/app/admin/page.tsx`** — Mevcut admin sayfasına küçük bir "Sistem Durumu" widget'ı:
- n8n: 🟢 OK / 🟡 Degraded / 🔴 Down
- Son kontrol zamanı
- `/api/health/n8n` route'unu client-side her 60sn poll eder

#### D) Vercel Hobby Cron Notu
Hobby plan: cron dakika cinsinden minimum `0 * * * *` (saatte bir) destekler — `*/15` çalışmaz.
Seçenekler:
1. `0 * * * *` → saatte bir kontrol (yeterince sık)
2. Ücretsiz [UptimeRobot](https://uptimerobot.com) → 5dk'da bir `/api/health/n8n` endpoint'ini monitor eder, down olunca email atar. **Önerilen.**

---

## Uygulama Sırası

| # | Görev | Süre | Öncelik |
|---|---|---|---|
| 1 | `consent_records` + `data_subject_requests` migration | 30dk | 🔴 Kritik |
| 2 | Aydınlatma metni sayfası (TR/EN statik) | 2sa | 🔴 Kritik |
| 3 | `ConsentModal` bileşeni + middleware entegrasyonu | 2sa | 🔴 Kritik |
| 4 | Sentry kurulum (wizard) + DSN Vercel'e ekleme | 1sa | 🟡 Önemli |
| 5 | Kritik route'lara `captureException` ekleme | 1sa | 🟡 Önemli |
| 6 | `/api/health/n8n` route | 30dk | 🟡 Önemli |
| 7 | UptimeRobot monitor kurulumu (external) | 15dk | 🟡 Önemli |
| 8 | Admin sistem durum widget | 1sa | 🟢 Nice-to-have |
| 9 | Kullanıcı gizlilik sayfası (veri silme/indirme) | 2sa | 🟡 Önemli |

**Toplam tahmini:** ~10 saat geliştirme

---

## Notlar

- Vercel Hobby → Pro geçiş şimdilik gerekli değil. UptimeRobot n8n monitoring'i çözer.
- Sentry free plan 5k error/ay — başlangıç için yeterli.
- KVKK için resmi hukuki danışmanlık alınması önerilir (bu plan teknik kısım, hukuki metin ayrı).
- privacy@stoaix.com adresi oluşturulmalı (Google Workspace veya Resend catch-all).
