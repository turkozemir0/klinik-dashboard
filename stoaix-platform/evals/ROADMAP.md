# Promptfoo Eval Framework — Yol Haritası

## Mevcut Durum (20 Nisan 2026)

### Tamamlanan
- [x] Promptfoo framework kurulumu (config, providers, rubrics)
- [x] Custom API endpoint (`/api/evals/test-agent`) — DB mode + Template mode
- [x] Template mode: `buildClinicPlaybookDefaults()` ile DB bağımsız test
- [x] Fixture KB: 8 klinik tipi için mock bilgi bankası snippet'leri
- [x] Core testler: safety (10), format (6), red-team (9), outbound (9) = 34 test
- [x] Sektör testleri: dental (11), hair_transplant (10), medical_aesthetics (10) = 31 test
- [x] Sektör bazlı config dosyaları: `promptfoo-dental.yaml`, `promptfoo-hair.yaml`, `promptfoo-medestetik.yaml`
- [x] Solo Dent DB mode testleri: 65 test (8 dosya)
- [x] npm scripts: `eval`, `eval:dental`, `eval:hair`, `eval:medestetik`, `eval:all-sectors`

### Baseline Sonuçları
| Sektör | Pass Rate | Test | Maliyet |
|---|---|---|---|
| Dental | 84.4% | 45 | ~$0.39 |
| Hair Transplant | 88.6% | 44 | ~$0.39 |
| Medical Aesthetics | 93.2% | 44 | ~$0.37 |
| **3 sektör toplam** | **88.7%** | **133** | **~$1.55** |

---

## Sonraki Adımlar (Öncelik Sırasıyla)

### P1 — Outbound Senaryo Uyumu
**Problem:** Fail'lerin %40'ı outbound senaryolarda (appt_confirm, appointment_reminder, treatment_reminder, payment_followup). Template prompt'lar outbound context'i yeterince içermiyor.

**Çözüm:**
- `buildClinicPlaybookDefaults()` fonksiyonuna outbound senaryo desteği ekle
- Veya `OUTBOUND_PREFIXES`'i daha spesifik hale getir (randevu detayı, ödeme bilgisi vb.)
- Outbound testlerde `conversationHistory` ile context sağla

**Etki:** Pass rate %88 → %95+ bekleniyor

### P2 — Kalan 5 Sektör Testleri
- `tests/sectors/surgical-aesthetics.yaml`
- `tests/sectors/physiotherapy.yaml`
- `tests/sectors/ophthalmology.yaml`
- `tests/sectors/general-practice.yaml`
- `tests/sectors/other.yaml`

Her biri ~10 test, template yapısı mevcut. Config dosyaları oluşturulacak.

### P3 — Çok Dil Desteği
**Durum:** Prompt'lar Türkçe. Modeller gelen mesajın dilinde yanıt verebilir ama bu garanti değil.

**Chat multi-language:**
1. `buildClinicPlaybookDefaults()` fonksiyonuna `language` parametresi
2. Dil bazlı prompt varyasyonları (en, ar, de, ru, fr)
3. `tests/languages/en.yaml`, `tests/languages/ar.yaml` vb.
4. Türkçe haricinde gelen mesajlarda otomatik dil algılama + o dilde yanıt talimatı

**Voice premium dil desteği:**
- Zaten `CARTESIA_VOICES` 8 dil destekli (agent.py)
- Prompt'ların o dildeki versiyonları gerekecek
- Business/Custom planlarda çok dil

**Test stratejisi:**
- Core safety testleri her dilde tekrarlanmalı (ilaç, teşhis, garanti yasağı dil-agnostik değil)
- Format testleri dile özgü (siz/sen formu Türkçe'ye özgü)
- llm-rubric'ler o dilde yazılmalı

### P4 — WhatsApp Message Template Standardizasyonu
**Context:** Meta Business API'nin message template sistemi. Proaktif mesaj göndermek için Meta onaylı template gerekli.

**Plan:**
1. Klinik tipine göre standart WA template seti tanımla
   - `re_engagement_v1` — reaktivasyon
   - `appointment_reminder_v1` — randevu hatırlatma
   - `welcome_v1` — hoş geldin
   - `follow_up_v1` — takip
2. Template registry: `dashboard/lib/wa-template-registry.ts`
3. Onboarding sonrası otomatik template oluşturma + Meta'ya gönderme
4. Admin panelde template durumu (pending/approved/rejected)

### P5 — CI/CD Gate
- `.github/workflows/eval.yml` path trigger: `agent-templates.ts` değiştiğinde
- Pass rate threshold: %80 altı → PR fail
- PR comment'e eval sonucu yazılsın
- İlk etapta sadece core safety testleri (hızlı, ucuz)

### P6 — Admin Dashboard Entegrasyonu
- `/admin/evals` sayfası — son eval sonuçları
- Klinik tipi bazlı pass rate gösterge
- "Eval Çalıştır" butonu (on-demand)
- Template versiyonlama + eval geçmişi

---

## Komutlar

```bash
# Sektör bazlı eval
npm run eval:dental
npm run eval:hair
npm run eval:medestetik
npm run eval:all-sectors

# Solo Dent (DB mode)
npm run eval

# Sonuçları görüntüle
npm run eval:view

# Red team (güvenlik taraması)
npm run eval:redteam
```

## Dosya Yapısı

```
evals/
├── promptfooconfig.yaml          ← Ana config (Solo Dent DB mode)
├── promptfoo-dental.yaml         ← Diş kliniği (template mode)
├── promptfoo-hair.yaml           ← Saç ekimi (template mode)
├── promptfoo-medestetik.yaml     ← Medikal estetik (template mode)
├── promptfoo-all-sectors.yaml    ← Tüm sektörler
├── providers/
│   ├── voice-agent-provider.ts   ← Voice custom provider
│   └── chat-agent-provider.ts    ← Chat custom provider
├── tests/
│   ├── core/                     ← Klinik-agnostik testler
│   │   ├── safety.yaml           (10 test)
│   │   ├── format.yaml           (6 test)
│   │   ├── red-team.yaml         (9 test)
│   │   └── outbound.yaml         (9 test)
│   ├── sectors/                  ← Sektöre özgü testler
│   │   ├── dental.yaml           (11 test)
│   │   ├── hair-transplant.yaml  (10 test)
│   │   └── medical-aesthetics.yaml (10 test)
│   └── 01-08-*.yaml             ← Legacy Solo Dent testleri (65 test)
├── rubrics/
├── output/                       ← Eval sonuçları (.gitignore)
├── analyze-results.js            ← Fail analiz scripti
└── ROADMAP.md                    ← Bu dosya
```
