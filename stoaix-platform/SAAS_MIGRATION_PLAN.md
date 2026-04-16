# stoaix Platform — Modular SaaS Migration Plan

> Bu dosya, platformun modular SaaS yapısına dönüştürülmesi için implementation rehberidir.
> Oluşturulma: 13 Nisan 2026 | Son güncelleme: 13 Nisan 2026

---

## Temel Prensipler

1. **Legacy-safe**: Mevcut müşteriler (Eurostar, Solo Dent vb.) hiçbir şekilde etkilenmez. Otomatik `legacy` plana alınır, tüm feature'lar sınırsız açık kalır.
2. **Feature-level granülerlik**: Module > Feature ayrımı. `voice` modülü altında `voice_agent_inbound`, `voice_agent_outbound`, `voice_appointment_reminder` ayrı ayrı kontrol edilir.
3. **Müşteri özgürlüğü**: Bir plan satın alan müşteri, plan içindeki feature'ları kendisi açıp kapatabilir veya limitlerini özelleştirebilir. Kullanmadığı modülü kapatması = daha temiz dashboard.
4. **Hata = izin ver**: Entitlement check hatası durumunda fallback her zaman `true`. Sistem feature gate yüzünden müşteriyi KİLİTLEMEZ.
5. **Backward compatible**: Mevcut 54 API route, 7 Edge Function, middleware — hepsi çalışmaya devam eder. Sadece üstüne guard eklenir.

---

## Auth Sistemi: Supabase Auth (Clerk DEĞİL)

Projede Clerk YOKTUR. Tüm auth akışı Supabase Auth üzerine kuruludur:
- `dashboard/lib/supabase/client.ts` — Browser client (createBrowserClient)
- `dashboard/lib/supabase/server.ts` — Server client + service client
- `dashboard/middleware.ts` — Supabase getUser() ile auth check
- `@clerk/nextjs` paketi projede BULUNMAZ

Entitlement cache stratejisi: **In-memory Map (5dk TTL) → Supabase DB (source of truth)**

---

## Modüler Feature Sistemi (Detaylı)

### Nasıl Çalışır?

```
PLAN (starter/growth/pro)
  └── Her plan bir dizi feature'a DEFAULT erişim tanımlar
        └── plan_entitlements tablosu: {plan_id, feature_key, enabled, limit_value}

ORG SUBSCRIPTION
  └── Müşteri bir plan satın alır
        └── org_subscriptions tablosu: {organization_id, plan_id, status}

ORG FEATURE OVERRIDES (MÜŞTERİ ÖZELLEŞTİRMESİ)
  └── Müşteri kendi dashboard'undan veya admin'den:
        - Planında açık olan bir feature'ı KAPATABİLİR (istemiyorum)
        - Admin, planda olmayan bir feature'ı açabilir (addon/promo)
        - Limitleri override edebilir (plan: 100dk → override: 200dk)
        └── org_entitlement_overrides tablosu

USAGE COUNTERS
  └── Her metered feature için aylık sayaç
        └── usage_counters tablosu: {org_id, billing_period, metric, used_value}
```

### Entitlement Resolution Sırası (Öncelik)

```
1. Legacy plan mı? → EVET → her şey açık, limit yok, DUR
2. Subscription status suspended/canceled mı? → EVET → her şey kapalı, DUR
3. org_entitlement_overrides'da bu feature var mı?
   → EVET + expires_at geçerli → override'ı kullan (enabled + limit_override)
   → HAYIR → devam
4. plan_entitlements'da bu feature var mı?
   → EVET → plan default'unu kullan (enabled + limit_value)
   → HAYIR → feature kapalı
5. Limit varsa → usage_counters'dan mevcut kullanımı çek → remaining hesapla
```

### Müşteri Feature Toggle Senaryoları

**Senaryo 1: Growth planı alan klinik, Instagram DM istemiyor**
```
plan_entitlements: growth + instagram_dm = enabled:true, limit:1000
org_entitlement_overrides: org_xyz + instagram_dm = enabled:false, reason:'user_disabled'
→ Sonuç: Instagram DM kapalı. Sidebar'da görünmez.
```

**Senaryo 2: Starter planı alan klinik, admin voice agent açmak istiyor (addon)**
```
plan_entitlements: starter + voice_agent_inbound = enabled:false
org_entitlement_overrides: org_abc + voice_agent_inbound = enabled:true, limit_override:50, reason:'addon_purchase'
→ Sonuç: Voice agent 50dk/ay limitle açık, Starter planında normalde yok.
```

**Senaryo 3: Pro planı alan klinik, proposals modülünü kapatmak istiyor**
```
plan_entitlements: pro + proposals_manage = enabled:true
org_entitlement_overrides: org_def + proposals_manage = enabled:false, reason:'user_disabled'
→ Sonuç: Proposals sidebar'da görünmez, API 403 döner.
```

**Senaryo 4: Admin promosyon — 30 gün extra voice dakika**
```
org_entitlement_overrides: org_ghi + voice_agent_inbound = enabled:true, limit_override:300, expires_at:'2026-05-13', reason:'promo_30day'
→ 30 gün sonra override expire olur, plan default'una döner.
```

### Dashboard Settings'de Feature Toggle UI

```
/dashboard/settings → "Modüller" sekmesi

┌─────────────────────────────────────────────────┐
│ Modül Yönetimi                                  │
├─────────────────────────────────────────────────┤
│                                                 │
│ ✅ WhatsApp          [Açık]     500/500 mesaj   │
│ ✅ Unified Inbox     [Açık]     ─                │
│ 🔒 Voice Agent      [Planınızda yok] [Upgrade]  │
│ ✅ Bilgi Bankası     [Açık]     32/50 item      │
│ ✅ Lead Yönetimi     [Açık]     ─                │
│ 🔒 Kanban Board     [Planınızda yok] [Upgrade]  │
│ ❌ Instagram DM      [Kapalı]   [Aç]            │  ← Planda var ama müşteri kapattı
│ ✅ Temel Analitik    [Açık]     ─                │
│ 🔒 Gelişmiş Analitik[Planınızda yok] [Upgrade]  │
│                                                 │
│ Açıklama:                                       │
│ ✅ Aktif  🔒 Plan yükseltme gerekli  ❌ Kapalı   │
└─────────────────────────────────────────────────┘

[Aç] → org_entitlement_overrides'dan user_disabled kaydını siler
[Kapat] → org_entitlement_overrides'a user_disabled kaydı ekler
[Upgrade] → /dashboard/billing sayfasına yönlendir
```

---

## Feature Registry (28 Feature)

```
MODULE           FEATURE_KEY                    USAGE_METRIC              IS_BOOLEAN
──────────────────────────────────────────────────────────────────────────────────────
whatsapp         whatsapp_inbound               whatsapp_inbound_msgs     false
                 whatsapp_outbound              whatsapp_outbound_msgs    false
                 whatsapp_templates             template_count            false

inbox            unified_inbox                  NULL                      true

voice            voice_agent_inbound            voice_minutes             false
                 voice_agent_outbound           voice_minutes             false
                 voice_appointment_reminder     voice_minutes             false

knowledge_base   kb_read                        NULL                      true
                 kb_write                       kb_item_count             false

leads            leads_manage                   NULL                      true
                 leads_kanban                   NULL                      true
                 leads_import_csv               import_row_count          false

proposals        proposals_manage               NULL                      true
                 proposals_payments             NULL                      true

calendar         calendar_manage                NULL                      true

followup         followup_sequences             NULL                      true
                 followup_manual                NULL                      true

instagram        instagram_dm                   instagram_messages        false

analytics        analytics_basic                NULL                      true
                 analytics_advanced             NULL                      true
                 analytics_export               NULL                      true

api              outbound_webhooks              NULL                      true

crm              dentsoft_integration           NULL                      true

support          support_tickets                NULL                      true

team             multi_team                     team_member_count         false
```

---

## Plan x Feature Matrisi

| Feature | Legacy | Lite ($79) | Plus ($149) | Advanced ($299) | Agency ($499) |
|---|---|---|---|---|---|
| whatsapp_inbound | unlimited | 500/ay | 2000/ay | unlimited | unlimited |
| whatsapp_outbound | unlimited | 500/ay | 2000/ay | unlimited | unlimited |
| whatsapp_templates | unlimited | 5 | 20 | unlimited | unlimited |
| unified_inbox | ON | ON | ON | ON | ON |
| voice_agent_inbound | unlimited | OFF | 100dk/ay | 500dk/ay | unlimited |
| voice_agent_outbound | unlimited | OFF | OFF | 500dk/ay | unlimited |
| voice_appointment_reminder | unlimited | OFF | 30dk/ay | 100dk/ay | unlimited |
| kb_read | ON | ON | ON | ON | ON |
| kb_write | unlimited | 50 item | 300 item | unlimited | unlimited |
| leads_manage | ON | ON | ON | ON | ON |
| leads_kanban | ON | OFF | ON | ON | ON |
| leads_import_csv | unlimited | OFF | 500 satir/ay | unlimited | unlimited |
| proposals_manage | ON | OFF | ON | ON | ON |
| proposals_payments | ON | OFF | ON | ON | ON |
| calendar_manage | ON | OFF | ON | ON | ON |
| followup_sequences | ON | OFF | ON | ON | ON |
| followup_manual | ON | ON | ON | ON | ON |
| instagram_dm | unlimited | OFF | 1000/ay | unlimited | unlimited |
| analytics_basic | ON | ON | ON | ON | ON |
| analytics_advanced | ON | OFF | ON | ON | ON |
| analytics_export | ON | OFF | OFF | ON | ON |
| outbound_webhooks | ON | OFF | ON | ON | ON |
| dentsoft_integration | ON | OFF | OFF | ON | ON |
| support_tickets | ON | OFF | ON | ON | ON |
| multi_team | unlimited | 2 kisi | 5 kisi | 10 kisi | unlimited |

> Legacy plan: Mevcut musteriler icin. Tum feature'lar acik, limit yok, Stripe baglantisi yok.

---

## Veritabani Semasi (7 Yeni Tablo)

### 1. features

```sql
CREATE TABLE features (
  key          text PRIMARY KEY,
  module       text NOT NULL,
  name         text NOT NULL,
  description  text,
  usage_metric text,
  is_boolean   boolean DEFAULT false,
  created_at   timestamptz DEFAULT now()
);
```

### 2. plans

```sql
CREATE TABLE plans (
  id                      text PRIMARY KEY,
  name                    text NOT NULL,
  stripe_product_id       text,
  stripe_price_monthly    text,
  stripe_price_annual     text,
  price_monthly           numeric(10,2),
  price_annual            numeric(10,2),
  currency                text DEFAULT 'USD',
  voice_overage_rate      numeric(10,4),
  whatsapp_overage_rate   numeric(10,4),
  max_team_members        int,
  trial_days              int DEFAULT 0,
  sort_order              int DEFAULT 0,
  is_active               boolean DEFAULT true,
  created_at              timestamptz DEFAULT now()
);
```

### 3. plan_entitlements

```sql
CREATE TABLE plan_entitlements (
  plan_id       text REFERENCES plans(id),
  feature_key   text REFERENCES features(key),
  enabled       boolean DEFAULT false,
  limit_value   int,
  config        jsonb,
  PRIMARY KEY (plan_id, feature_key)
);
```

### 4. org_subscriptions

```sql
CREATE TABLE org_subscriptions (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         uuid REFERENCES organizations(id) UNIQUE,
  plan_id                 text REFERENCES plans(id),
  status                  text DEFAULT 'active',
  stripe_customer_id      text UNIQUE,
  stripe_subscription_id  text UNIQUE,
  billing_interval        text DEFAULT 'monthly',
  trial_ends_at           timestamptz,
  current_period_start    timestamptz,
  current_period_end      timestamptz,
  cancel_at_period_end    boolean DEFAULT false,
  canceled_at             timestamptz,
  grace_period_ends_at    timestamptz,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);
-- status: active | trialing | past_due | grace_period | canceled | suspended | legacy
```

### 5. org_entitlement_overrides

```sql
CREATE TABLE org_entitlement_overrides (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid REFERENCES organizations(id),
  feature_key       text REFERENCES features(key),
  enabled           boolean NOT NULL,
  limit_override    int,
  reason            text,
  -- reason: 'user_disabled' | 'user_enabled' | 'admin_grant' | 'admin_revoke' | 'addon_purchase' | 'promo'
  expires_at        timestamptz,
  created_by        uuid,
  created_at        timestamptz DEFAULT now(),
  UNIQUE (organization_id, feature_key)
);
```

### 6. usage_counters

```sql
CREATE TABLE usage_counters (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid REFERENCES organizations(id),
  billing_period    text NOT NULL,
  metric            text NOT NULL,
  used_value        int DEFAULT 0,
  stripe_reported   boolean DEFAULT false,
  updated_at        timestamptz DEFAULT now(),
  UNIQUE (organization_id, billing_period, metric)
);
```

### 7. billing_events

```sql
CREATE TABLE billing_events (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id   text UNIQUE NOT NULL,
  event_type        text NOT NULL,
  organization_id   uuid REFERENCES organizations(id),
  payload           jsonb,
  processed_at      timestamptz DEFAULT now()
);
```

### Mevcut tablo degisikligi

```sql
ALTER TABLE organizations ADD COLUMN plan_id text DEFAULT 'legacy';
```

### Atomic RPC'ler

```sql
CREATE OR REPLACE FUNCTION increment_usage(
  p_org_id uuid, p_period text, p_metric text, p_amount int DEFAULT 1
) RETURNS void AS $$
  INSERT INTO usage_counters (organization_id, billing_period, metric, used_value)
  VALUES (p_org_id, p_period, p_metric, p_amount)
  ON CONFLICT (organization_id, billing_period, metric)
  DO UPDATE SET used_value = usage_counters.used_value + p_amount, updated_at = now();
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION decrement_usage(
  p_org_id uuid, p_period text, p_metric text, p_amount int DEFAULT 1
) RETURNS void AS $$
  UPDATE usage_counters
  SET used_value = GREATEST(0, used_value - p_amount), updated_at = now()
  WHERE organization_id = p_org_id AND billing_period = p_period AND metric = p_metric;
$$ LANGUAGE sql;
```

---

## Entitlement Engine (Kod Mimarisi)

### Dosya Yapisi

```
dashboard/lib/entitlements/
  types.ts              → EntitlementResult, CachedOrg, FeatureConfig tipleri
  registry.ts           → FEATURE_METRIC_MAP + featureKeyToMetric()
  cache.ts              → In-memory Map cache (5dk TTL)
  resolver.ts           → DB bazli entitlement cozumu (low-freq: admin, billing sayfasi)
  check.ts              → Runtime check: checkEntitlement() + hasFeature() (API route'lar)
  usage.ts              → incrementUsage(), decrementUsage(), getUsage() helper'lari
  guard.ts              → withFeatureGuard() HOC — API route'lara tek satirda guard ekler
```

### Resolution Logic (check.ts)

```typescript
export async function checkEntitlement(orgId: string, featureKey: string): Promise<EntitlementResult> {
  // 1. Cache'den org bilgisi
  const cached = getFromCache(orgId);

  // 2. Legacy bypass (ZORUNLU ILK KONTROL)
  if (cached?.planId === 'legacy') return ALLOW_ALL;

  // 3. Cache hit + fresh → extract feature
  if (cached && !isExpired(cached)) return extractFeature(cached, featureKey);

  // 4. Cache miss → DB'den cek
  try {
    const sub = await fetchSubscription(orgId);
    if (!sub || sub.plan_id === 'legacy') { setCache(orgId, LEGACY); return ALLOW_ALL; }
    if (['suspended','canceled'].includes(sub.status)) return DENY_ALL;

    // 5. Override > Plan default
    const override = await fetchOverride(orgId, featureKey);
    const planEnt = await fetchPlanEntitlement(sub.plan_id, featureKey);
    const effective = override ?? planEnt;

    if (!effective || !effective.enabled) return { enabled: false, limit: null, used: null, remaining: null };

    // 6. Usage check (metered feature)
    if (effective.limit_value !== null) {
      const used = await getUsage(orgId, featureKey);
      return { enabled: true, limit: effective.limit_value, used, remaining: effective.limit_value - used };
    }

    return { enabled: true, limit: null, used: null, remaining: null };

  } catch (err) {
    // HATA = IZIN VER (kilitleme yok)
    console.error('Entitlement check failed, allowing:', err);
    return ALLOW_ALL;
  }
}
```

### API Route Guard Pattern

```typescript
// Ornek: app/api/calendar/events/route.ts
import { checkEntitlement } from '@/lib/entitlements/check';

export async function GET(req) {
  const { orgId } = await getAuthContext(req);

  const ent = await checkEntitlement(orgId, 'calendar_manage');
  if (!ent.enabled) {
    return NextResponse.json({ error: 'upgrade_required', feature: 'calendar_manage' }, { status: 403 });
  }

  // ... mevcut kod degismez ...
}
```

---

## API Route → Feature Eslesmesi

```
ROUTE                                          METHOD    FEATURE_KEY                 NOT
─────────────────────────────────────────────────────────────────────────────────────────
/api/inbox/*                                   ALL       unified_inbox
/api/agent/voice-token                         POST      voice_agent_inbound
/api/agent/test-chat                           POST      (gate yok — test)
/api/calendar/*                                ALL       calendar_manage
/api/knowledge/* (GET)                         GET       kb_read
/api/knowledge/* (POST/PATCH/DELETE)           MUTATE    kb_write                    + usage increment
/api/leads/kanban                              GET       leads_kanban
/api/leads/[id]/assign                         PATCH     leads_manage
/api/import/*                                  ALL       leads_import_csv            + usage increment
/api/inbox/reply (whatsapp)                    POST      whatsapp_outbound           + usage increment
/api/inbox/reply (instagram)                   POST      instagram_dm                + usage increment
/api/proposals/*                               ALL       proposals_manage
/api/proposals/[id]/payments/*                 ALL       proposals_payments
/api/templates/*                               ALL       whatsapp_templates          + usage increment (create)
/api/followup/manual/*                         ALL       followup_manual
/api/contacts/search                           GET       leads_manage
/api/settings/excluded-phones                  PATCH     (gate yok — settings)

WEBHOOK'LAR — GATE EKLENMEZ (MUTLAKA ACIK KALMALI):
/api/whatsapp/callback                         POST      (gate yok)
/api/whatsapp/manual-connect                   POST      (gate yok)
/api/instagram/callback                        GET       (gate yok)
/api/billing/webhook                           POST      (gate yok — Stripe)

EDGE FUNCTIONS — GATE EKLENMEZ:
dialog-inbound                                           (gate yok)
meta-whatsapp-inbound                                    (gate yok)
instagram-inbound                                        (gate yok)
```

---

## Stripe Entegrasyonu

### Urunler & Fiyatlar

```
Product: stoaix Lite
  Price: lite_monthly   → $79/month
  Price: lite_annual    → $756/year ($63/mo — ~2 ay bedava)
  trial_days: 7

Product: stoaix Plus
  Price: plus_monthly   → $149/month
  Price: plus_annual    → $1,428/year ($119/mo)
  trial_days: 7

Product: stoaix Advanced
  Price: advanced_monthly → $299/month
  Price: advanced_annual  → $2,868/year ($239/mo)
  trial_days: 7

Product: stoaix Agency
  Price: agency_monthly → $499/month
  Price: agency_annual  → $4,788/year ($399/mo)
  trial_days: 7

Meter: voice_minutes       → $0.05/minute (dahil dakika asildiktan sonra)
Meter: whatsapp_messages   → $0.005/message (dahil limit asildiktan sonra)
```

### Stripe Ozellikleri

| Ozellik | Kullanim |
|---|---|
| Subscriptions | Aylik/yillik plan aboneligi |
| Meters | Voice dakika + WhatsApp mesaj sayaci |
| Usage-based billing | Meter eventi → otomatik fatura ekleme |
| Customer Portal | Self-service plan degistirme, fatura, iptal |
| Checkout Sessions | Trial → odeme gecisi |
| Webhooks | subscription.*, invoice.*, trial_will_end |
| Tax | Otomatik vergi hesaplama |

### Webhook Handler

```
POST /api/billing/webhook

Event'lar:
- checkout.session.completed       → subscription aktif, syncEntitlements
- customer.subscription.updated    → DB guncelle, cache invalidate
- customer.subscription.deleted    → canceled status
- customer.subscription.trial_will_end → email uyari (3 gun once)
- invoice.payment_failed           → dunning akisi baslat
- invoice.paid                     → active status'a geri don

Guvenlik: stripe.webhooks.constructEvent() ZORUNLU
Idempotency: billing_events.stripe_event_id UNIQUE
```

---

## Dunning Akisi

```
invoice.payment_failed
  |
  +-- 0-3 gun: grace_period
  |     status = 'grace_period'
  |     Tum ozellikler ACIK
  |     DunningBanner: "Odeme alinamadi"
  |     Email #1
  |
  +-- 3-7 gun: past_due
  |     status = 'past_due'
  |     voice_outbound + appointment_reminder KILITLI
  |     Diger ozellikler acik
  |     DunningBanner: kirmizi
  |     Email #2
  |
  +-- 7-14 gun: suspended
  |     status = 'suspended'
  |     Tum feature'lar KILITLI (read-only)
  |     Veri SILINMEZ
  |     Email #3
  |
  +-- 30 gun: archived
        organizations.status = 'archived'
        Veri silinme uyarisi (90 gun)
        Admin'e notification
```

---

## Free Trial

- Voice Agent **ICERMEYEN** paketlerde (Starter): 7 gun trial
- Trial suresi boyunca plan'daki tum feature'lar acik
- Trial bitiminde: Stripe odeme alir veya hesap `past_due`'ya duser
- Kredi karti: Checkout sirasinda zorunlu (donusum icin)
- Trial countdown: Dashboard'da banner

---

## Frontend Bilesenler (Yeni)

```
dashboard/components/billing/
  UpgradeGate.tsx        → Kilitli feature overlay + upgrade butonu
  UsageWidget.tsx        → Sidebar'da voice/whatsapp progress bar
  TrialBanner.tsx        → "X gun kaldi" countdown
  DunningBanner.tsx      → Odeme hatasi uyarisi (dismiss yok)
  PlanCard.tsx           → Plan karsilastirma karti
  FeatureToggle.tsx      → Settings'deki modul acma/kapama toggle

dashboard/app/dashboard/billing/
  page.tsx               → Plan karsilastirma + upgrade/downgrade
  usage/page.tsx         → Aylik kullanim detayi

dashboard/app/admin/billing/
  page.tsx               → MRR overview, plan dagilimi
  [orgId]/page.tsx       → Per-org billing + module override yonetimi
```

---

## Implementation Roadmap

### Milestone 0 — DB Foundation (Sifir Risk)
**Bagimlilk: Yok**

- [ ] `sql/migrations/2026-04-XX_billing_foundation.sql` — 7 tablo + RPC'ler + RLS
- [ ] Legacy plan seed: INSERT INTO plans ... 'legacy'
- [ ] Mevcut org'lari legacy'ye al: INSERT INTO org_subscriptions FROM organizations
- [ ] organizations.plan_id = 'legacy' kolonu ekle
- [ ] Feature registry seed: 28 feature INSERT
- [ ] `check-legacy-safe` kontrol

### Milestone 1 — Plan Entitlements Seed
**Bagimlilk: M0**

- [ ] `sql/migrations/2026-04-XX_plans_seed.sql` — 3 plan + fiyatlar
- [ ] plan_entitlements: Legacy (28 feature unlimited) + Starter + Growth + Pro
- [ ] `check-legacy-safe` kontrol

### Milestone 2 — Entitlement Engine
**Bagimlilk: M1**

- [ ] `lib/entitlements/types.ts`
- [ ] `lib/entitlements/registry.ts` — feature-metric mapping
- [ ] `lib/entitlements/cache.ts` — in-memory Map (5dk TTL)
- [ ] `lib/entitlements/usage.ts` — increment/decrement/get helpers
- [ ] `lib/entitlements/resolver.ts` — DB bazli tam cozum
- [ ] `lib/entitlements/check.ts` — runtime checkEntitlement() + hasFeature()
- [ ] `lib/entitlements/guard.ts` — withFeatureGuard() API route HOC

### Milestone 3 — API Feature Gates
**Bagimlilk: M2**

- [ ] Tum API route'lara guard ekle (yukaridaki esleme tablosuna gore)
- [ ] 403 response format: `{ error: 'upgrade_required', feature, requiredPlan }`
- [ ] Limit asimi: `{ error: 'usage_limit_exceeded', feature, limit, used }`
- [ ] Webhook endpoint'lerine GATE EKLEME
- [ ] Edge Function'lara GATE EKLEME
- [ ] `check-legacy-safe` kontrol

### Milestone 4 — Usage Tracking
**Bagimlilk: M2**

- [ ] Voice minutes: LiveKit room.finished event → increment voice_minutes
- [ ] WhatsApp outbound: reply route → increment whatsapp_outbound_msgs
- [ ] KB items: POST → increment, DELETE → decrement kb_item_count
- [ ] CSV import: import route → increment import_row_count
- [ ] Instagram: reply route → increment instagram_messages
- [ ] Template count: POST → increment, DELETE → decrement template_count
- [ ] Team member count: org_users INSERT/DELETE → increment/decrement
- [ ] Cache invalidation: her usage guncellemesinden sonra

### Milestone 5 — Stripe Integration (Test Mode)
**Bagimlilk: M3 + M4**

- [ ] Stripe hesabi + USD currency
- [ ] 3 Product x 2 Price (monthly/annual) olustur
- [ ] Voice Meter + WhatsApp Meter olustur
- [ ] `app/api/billing/checkout/route.ts` — Checkout Session
- [ ] `app/api/billing/webhook/route.ts` — Event handler + idempotency
- [ ] `app/api/billing/portal/route.ts` — Customer Portal session
- [ ] `app/api/billing/usage/route.ts` — Frontend usage stats
- [ ] `app/api/billing/limits/route.ts` — Frontend entitlement info
- [ ] Stripe Meter reporting: usage_counters → Stripe (async)
- [ ] Dunning logic: grace_period → past_due → suspended → archived
- [ ] `package.json`'a `stripe` dependency ekle

### Milestone 6 — Frontend Billing UI
**Bagimlilk: M5**

- [ ] `UpgradeGate.tsx` — blur overlay + upgrade CTA
- [ ] `UsageWidget.tsx` — sidebar progress bars
- [ ] `TrialBanner.tsx` — countdown
- [ ] `DunningBanner.tsx` — odeme hatasi
- [ ] `/dashboard/billing/page.tsx` — plan karsilastirma
- [ ] `/dashboard/billing/usage/page.tsx` — kullanim detayi
- [ ] `/dashboard/settings` → "Moduller" sekmesi (feature toggle UI)
- [ ] Sidebar'da kilitli modulleri gri/kilit ikonu ile goster

### Milestone 7 — Admin Billing Dashboard
**Bagimlilk: M5**

- [ ] Admin org listesine: plan badge, status, MRR kolonu
- [ ] `/admin/billing/page.tsx` — MRR, abone sayisi, trial count, plan dagilimi
- [ ] `/admin/billing/[orgId]/page.tsx` — per-org entitlement override UI
- [ ] Module override: feature toggle + limit slider + reason + expires_at
- [ ] Plan teklifi gonder: legacy org'a ozel indirimli Stripe link

### Milestone 8 — Stripe Live
**Bagimlilk: M6 + M7**

- [ ] Test → Production key swap (Vercel env vars)
- [ ] Stripe Customer Portal konfigurasyonu
- [ ] Stripe Tax setup
- [ ] Webhook endpoint production URL'e kayit
- [ ] Smoke test: checkout → subscription → usage → invoice

### Milestone 9 — Legacy Migration Tesvik
**Bagimlilk: M8**

- [ ] Admin panelden per-org plan teklifi gonder
- [ ] Indirimli Stripe Checkout link olustur
- [ ] Musteri kabul ederse: Stripe Customer olustur → plan_id guncelle
- [ ] Email template: "Yeni plan avantajlari" + indirim kodu

---

## Safety: check-legacy-safe Kontrol Listesi

Her milestone sonrasi calistirilacak:

```
1.  [ ] Migration'da legacy plan seed var mi?
2.  [ ] Mevcut tum org'lar legacy'ye alinmis mi?
3.  [ ] checkEntitlement() ILK SATIRDA legacy bypass var mi?
4.  [ ] Hata durumunda fallback = true mi? (try/catch → ALLOW_ALL)
5.  [ ] Webhook endpoint'lerine gate eklenmemis mi?
6.  [ ] Edge Function'lara gate eklenmemis mi?
7.  [ ] RLS policy'ler legacy org'lari engellemiyormu?
8.  [ ] Middleware subscription check legacy'yi bypass ediyor mu?
9.  [ ] Usage tracking legacy'de limit kontrolu UYGULANMIYOR mu?
10. [ ] Frontend UpgradeGate legacy'de children'i RENDER EDIYOR mu?
11. [ ] Stripe webhook'lari legacy org'lari ETKILEMIYOR mu?
12. [ ] Rollback (DOWN) migration dogru yazilmis mi?
```

---

## Kritik Kurallar (Her Milestone Icin)

1. **Mevcut calisan kodu BOZMA** — sadece ustune guard ekle
2. **Webhook/Edge Function'lara gate EKLEME** — Meta ve LiveKit her zaman acik
3. **Legacy = her sey acik** — hicbir kosulda legacy org'lari engelleme
4. **Hata = izin ver** — entitlement check hatasi → true don
5. **Migration onay bekle** — SQL dosyasini goster, onay al, sonra calistir
6. **Cache invalidate unutma** — usage update + Stripe event sonrasi
7. **Source of truth = DB** — Stripe Meter sadece reporting
8. **Tek seferde yapma** — aktif milestone'la ilgilen, sonrakine gecme
9. **Her degisiklikten sonra check-legacy-safe calistir**
10. **Auth = Supabase Auth** — Clerk KULLANILMAZ
