# Plan: Entegrasyon Sağlık Kontrolü + Workflow Aktivasyon Doğrulaması

## Problem
Workflow aktifleştirilirken sadece plan (entitlement) kontrolü yapılıyor. Kanalın gerçekten kurulu olup olmadığı kontrol edilmiyor. Sonuç: workflow aktif ama runtime'da sessizce başarısız oluyor.

## Çözüm: 2 Katman

---

### Katman 1: Pre-Activation Validation (Workflow Aktivasyonda Kanal Kontrolü)

#### 1.1 — `dashboard/lib/integration-health.ts` (YENİ DOSYA)

Her workflow template'inin hangi entegrasyonlara ihtiyacı olduğunu tanımlar ve kontrol eder.

Kanal kontrol kuralları:
| Workflow Channel | Kontrol edilecek `channel_config` alanı |
|---|---|
| `voice` | `voice_outbound.active === true` VE `voice_outbound.livekit_sip_outbound_trunk_id` mevcut |
| `whatsapp` | `whatsapp.active === true` VE `whatsapp.waba_id` VE `whatsapp.phone_number_id` mevcut |
| `instagram` | `instagram.active === true` VE `instagram.page_id` mevcut |
| `multi` | Hem `voice` hem `whatsapp` kuralları birlikte geçmeli |

Fonksiyon: `checkChannelReady(orgId, channel)` → `{ ready: boolean, missing: string[] }`

#### 1.2 — `POST /api/workflows` route güncelleme

Entitlement kontrolünden SONRA, `checkChannelReady()` çağrılır. Eksikse 400 döner:
```json
{ "error": "channel_not_ready", "missing": ["whatsapp"], "message": "..." }
```

#### 1.3 — `GET /api/workflows/templates` güncelleme

Response'a `channel_ready` ve `missing_channels` eklenir.

#### 1.4 — `workflow-types.ts` güncelleme

`TemplateWithStatus`'a `channel_ready: boolean` ve `missing_channels: string[]` eklenir.

#### 1.5 — WorkflowsClient.tsx UI güncellemesi

WorkflowCard'a 3. durum: plan izni var ama kanal eksik → sarı uyarı banner + "Entegrasyonlara Git" linki.
"Kur & Aktif Et" butonu disabled olur.

---

### Katman 2: Integration Health Dashboard Widget

#### 2.1 — `GET /api/integration-health` (YENİ ENDPOINT)

Org'un tüm entegrasyonlarını + sorunlu workflow sayısını döner:
```json
{
  "channels": {
    "whatsapp": { "status": "connected", "detail": "+90 555 xxx" },
    "instagram": { "status": "not_configured" },
    "voice_inbound": { "status": "connected", "detail": "LiveKit" },
    "voice_outbound": { "status": "missing_config", "detail": "SIP trunk gerekli" },
    "calendar": { "status": "not_configured" }
  },
  "active_workflow_count": 5,
  "blocked_workflow_count": 2,
  "blocked_workflows": [
    { "name": "Lead İlk Temas Mesajı", "missing": ["whatsapp"] }
  ]
}
```

Status: `connected` | `missing_config` | `not_configured` | `token_expired`

#### 2.2 — `dashboard/components/IntegrationHealthWidget.tsx` (YENİ BİLEŞEN)

Dashboard overview'da kompakt widget. Renkli durum noktaları (yeşil/gri/sarı/kırmızı) + sorunlu workflow uyarısı.

#### 2.3 — Dashboard `page.tsx` güncelleme

SetupBanner'dan sonra widget render edilir.

---

## Dosya Değişiklik Listesi

| Dosya | İşlem |
|---|---|
| `dashboard/lib/integration-health.ts` | YENİ |
| `dashboard/lib/workflow-types.ts` | GÜNCELLE |
| `dashboard/app/api/workflows/route.ts` | GÜNCELLE |
| `dashboard/app/api/workflows/templates/route.ts` | GÜNCELLE |
| `dashboard/app/api/integration-health/route.ts` | YENİ |
| `dashboard/components/IntegrationHealthWidget.tsx` | YENİ |
| `dashboard/app/dashboard/page.tsx` | GÜNCELLE |
| `dashboard/app/dashboard/workflows/WorkflowsClient.tsx` | GÜNCELLE |

## DB Değişikliği: YOK
Tüm veriler `channel_config` JSONB'de mevcut.

## Uygulama Sırası
1. `integration-health.ts` utility
2. `workflow-types.ts` tip güncellemesi
3. `GET /api/integration-health` endpoint
4. `GET /api/workflows/templates` + `POST /api/workflows` güncelleme
5. `IntegrationHealthWidget.tsx` bileşen
6. `WorkflowsClient.tsx` UI güncelleme
7. `page.tsx` widget ekleme
