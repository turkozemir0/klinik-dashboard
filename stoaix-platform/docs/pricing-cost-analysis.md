# stoaix Platform — Fiyatlandırma & Maliyet Analizi

> Tarih: 4 Mayıs 2026
> Versiyon: 3.0
> Durum: Uygulandı (SQL migration: 2026-05-03_pricing_v3.sql)

---

## 1. Plan Yapısı

| | Essential | Professional | Business | Custom |
|---|:---:|:---:|:---:|:---:|
| **Aylık** | $129 | $249 | $599 | Görüşmeli |
| **Yıllık** | $1,238.40 ($103/ay) | $2,390.40 ($199/ay) | $5,750.40 ($479/ay) | Görüşmeli |
| Deneme süresi | 7 gün | 7 gün | — | 7 gün |
| Max takım üyesi | 5 | 10 | 20 | Sınırsız |
| **AI Konuşma** | 1,000/ay | 2,000/ay | 5,000/ay | Sınırsız |

### Kanal & Özellik Matrisi

| Özellik | Essential | Professional | Business | Custom |
|---------|:---------:|:------------:|:--------:|:------:|
| WhatsApp Inbound/Outbound | Sınırsız | Sınırsız | Sınırsız | Sınırsız |
| Instagram DM | Sınırsız | Sınırsız | Sınırsız | Sınırsız |
| Unified Inbox | ✓ | ✓ | ✓ | ✓ |
| Bilgi Bankası (KB) | Sınırsız | Sınırsız | Sınırsız | Sınırsız |
| CRM / Kanban / CSV Import | ✓ | ✓ | ✓ | ✓ |
| Teklifler & Ödemeler | ✓ | ✓ | ✓ | ✓ |
| Takvim | ✓ | ✓ | ✓ | ✓ |
| Otomatik takip sekansları | ✓ | ✓ | ✓ | ✓ |
| **Voice Inbound** | **—** | **200 dk/ay** | **500 dk/ay** (shared) | Sınırsız |
| **Voice Outbound** | **—** | **—** | **500 dk/ay** (shared) | Sınırsız |
| Çok dilli ses | — | — | ✓ | ✓ |
| Multi-pipeline | — | 3 | Sınırsız | Sınırsız |
| Gelişmiş analitik | — | ✓ | ✓ | ✓ |
| Analitik export | — | — | ✓ | ✓ |
| Workflow Engine (chat) | ✓ | ✓ | ✓ | ✓ |
| Workflow (voice) | — | — | ✓ | ✓ |
| Reactivation kampanyası | — | — | 5,000 lead/ay | 20,000 lead/ay |

> **Not:** WhatsApp mesaj ücretleri (template) müşterinin kendi Meta hesabına faturalanır. stoaix'e maliyet yansımaz. Embedded Signup ile müşteri kendi WABA'sını bağlar.

---

## 2. Birim Maliyetler

### 2.1 Voice Agent (dakika başı)

**Teknoloji stack:** LiveKit Cloud + Deepgram STT + Cartesia TTS + Claude Haiku 4.5

| Bileşen | Ship Planı ($/dk) | Scale Planı ($/dk) | Kaynak |
|---------|:-----------------:|:------------------:|--------|
| Deepgram STT (LiveKit inference) | $0.0092 | $0.0078 | livekit.com/pricing |
| Cartesia TTS (LiveKit inference) | $0.0300 | $0.0225 | livekit.com/pricing |
| Claude Haiku 4.5 (direkt API) | $0.0070 | $0.0070 | platform.claude.com |
| **Değişken toplam** | **$0.0462** | **$0.0373** | Agent+SIP dahil dk'larda |
| + LiveKit Agent Session (overage) | +$0.0100 | +$0.0100 | Allotment aşılınca |
| + LiveKit SIP (overage) | +$0.0040 | +$0.0030 | Allotment aşılınca |
| **Tam maliyet (overage)** | **$0.0602** | **$0.0503** | |

**Claude Haiku 4.5 detay:** $1.00 input / $5.00 output per 1M token. ~3000 input + ~800 output token/dk.
Haiku tercih sebebi: Düşük latency (voice için kritik) + GPT-4o Mini'ye göre yalnızca +$0.006/dk extra.

### 2.2 Chat AI (konuşma başı)

**Model:** Claude Sonnet ($3/$15 per 1M token), prompt caching aktif.

| Konuşma Tipi | Tur | Tahmini Maliyet |
|-------------|:---:|:--------------:|
| Kısa (SSS) | ~3 | ~$0.015 |
| Orta (lead qualification) | ~8 | ~$0.040 |
| Uzun (detaylı danışma) | ~15 | ~$0.080 |
| **Ağırlıklı ortalama** | ~8-10 | **~$0.045** |

Prompt caching: System prompt + KB context (~2000 token) 2. turdan itibaren %90 indirimli.

### 2.3 WhatsApp / Instagram

| Kalem | Maliyet | Ödeme Sorumlusu |
|-------|---------|-----------------|
| Service mesajları (24 saat içi) | Bedava | — |
| Marketing template (Türkiye) | $0.0109/msg | **Müşteri** (Meta'ya direkt) |
| Utility template (Türkiye) | $0.0008/msg | **Müşteri** |
| Authentication template | $0.0053/msg | **Müşteri** |
| AI yanıt üretimi (Claude Sonnet) | ~$0.045/konuşma | **stoaix** |

> Embedded Signup ile müşteri kendi Meta Business Account'unu bağlar. WABA müşteriye aittir. Meta mesaj ücretlerini müşteriye faturalandırır. stoaix sadece AI işlem maliyetini (Claude API) karşılar.

### 2.4 Diğer (İhmal Edilebilir)

| Kalem | Maliyet |
|-------|---------|
| OpenAI text-embedding-3-small | $0.02/1M token ≈ $0.00001/KB item |
| Supabase edge function çağrısı | 2M dahil, sonra $2/1M |

---

## 3. Altyapı Maliyetleri (Sabit, Paylaşılan)

| Servis | 10 Müşteri | 25 Müşteri | 50 Müşteri | 100 Müşteri |
|--------|:----------:|:----------:|:----------:|:-----------:|
| **LiveKit** | Ship $50 | Ship $50 | **Scale $500** | Scale $500 |
| — dahil agent dk | 5,000 | 5,000 | 50,000 | 50,000 |
| — dahil SIP dk | 5,000 | 5,000 | 50,000 | 50,000 |
| — STT/TTS indirim | — | — | %15-25 | %15-25 |
| **Supabase Pro** | Micro $25 | Small $30 | Medium $75 | Medium $75 |
| **n8n VPS** | 4GB $30 | 8GB $50 | 16GB $70 | 16GB $100 |
| **Vercel Pro** | 1 seat $20 | 1 seat $20 | 2 seat $40 | 2 seat $40 |
| Monitoring/Logs | $0 | $10 | $25 | $40 |
| Domain/DNS | $5 | $5 | $5 | $5 |
| **TOPLAM** | **$130** | **$165** | **$715** | **$760** |
| **Müşteri başı** | **$13.00** | **$6.60** | **$14.30** | **$7.60** |

### Kritik Geçiş Noktaları

- **LiveKit Ship → Scale:** ~40-50 müşteride. $450 ek aylık maliyet ama 50K dk allotment + STT/TTS'de %15-25 indirim.
- **Supabase Micro → Small:** ~15 müşteride. +$5/ay.
- **Supabase Small → Medium:** ~30 müşteride. +$45/ay.
- **n8n VPS upgrade:** Kademeli, yük arttıkça.

---

## 4. Plan Bazlı Maliyet Analizi

### 4.1 ESSENTIAL ($129/ay) — Sadece Chat (1,000 AI konuşma/ay)

| Senaryo | AI Konuşma/ay | Claude Maliyeti | Altyapı Payı | **Toplam** | **Markup** |
|---------|:------------:|:--------------:|:------------:|:---------:|:---------:|
| Normal | 300 | $13.50 | $6.60 | **$20.10** | **6.42x** |
| Yoğun | 600 | $27.00 | $6.60 | **$33.60** | **3.84x** |
| Limit | 1000 | $45.00 | $6.60 | **$51.60** | **2.50x** |

### 4.2 PROFESSIONAL ($249/ay) — 200dk Voice Inbound + 2,000 AI konuşma/ay

| Senaryo | AI Konuşma | Voice dk | Claude | Voice | Altyapı | **Toplam** | **Markup** |
|---------|:---------:|:-------:|:------:|:-----:|:-------:|:---------:|:---------:|
| Normal | 500 | 120 | $22.50 | $5.54 | $6.60 | **$34.64** | **7.19x** |
| Yoğun | 1000 | 200 | $45.00 | $9.24 | $6.60 | **$60.84** | **4.09x** |
| Limit | 2000 | 200 | $90.00 | $9.24 | $6.60 | **$105.84** | **2.35x** |

### 4.3 BUSINESS ($599/ay) — 500dk Voice Shared Pool + 5,000 AI konuşma/ay

| Senaryo | AI Konuşma | Voice dk | Claude | Voice | Altyapı | **Toplam** | **Markup** |
|---------|:---------:|:-------:|:------:|:-----:|:-------:|:---------:|:---------:|
| Normal | 800 | 300 | $36.00 | $13.86 | $6.60 | **$56.46** | **10.61x** |
| Yoğun | 2000 | 500 | $90.00 | $23.10 | $6.60 | **$119.70** | **5.00x** |
| Limit | 5000 | 500 | $225.00 | $23.10 | $6.60 | **$254.70** | **2.35x** |

> Tüm hesaplamalar 25 müşteri ölçeği (Ship planı) baz alınmıştır.

---

## 5. Portföy Analizi (Ölçeğe Göre)

**Müşteri karması varsayımı:** %50 Essential, %30 Professional, %20 Business
**Kullanım senaryosu:** Yoğun (tüm müşteriler aktif kullanımda)

### Yoğun Kullanım Varsayımları

| Plan | AI Konuşma/ay | Voice dk/ay |
|------|:------------:|:----------:|
| Essential | 600 | 0 |
| Professional | 1000 | 200 (limit) |
| Business | 2000 | 500 (limit) |

### Ölçek Tablosu

| | 10 Müşteri | 25 Müşteri | 50 Müşteri | 100 Müşteri |
|---|:---:|:---:|:---:|:---:|
| **MRR** | **$2,887** | **$7,225** | **$14,400** | **$28,800** |
| Mix | 5E+3P+2B | 12E+8P+5B | 25E+15P+10B | 50E+30P+20B |
| Toplam voice dk | 1,600 | 4,100 | 8,000 | 16,000 |
| Toplam AI konuşma | 8,600 | 21,600 | 43,000 | 86,000 |
| | | | | |
| **Altyapı** | $130 | $165 | $715 | $760 |
| **Voice maliyeti** | $74 | $189 | $370 | $739 |
| **Chat AI maliyeti** | $387 | $972 | $1,935 | $3,870 |
| **TOPLAM MALİYET** | **$591** | **$1,326** | **$3,020** | **$5,369** |
| | | | | |
| **KÂR** | **$2,296** | **$5,899** | **$11,380** | **$23,431** |
| **Margin** | **79.5%** | **81.6%** | **79.0%** | **81.4%** |
| **Markup** | **4.89x** | **5.45x** | **4.77x** | **5.36x** |

### Maliyet Dağılımı (100 müşteri)

```
Chat AI (Claude Sonnet)  ████████████████████████████████  67.9%  $2,430
Altyapı (tüm servisler)  ██████████████                   21.2%  $760
Voice Stack (STT+TTS+LLM) ████████                        10.9%  $389
WhatsApp mesaj ücreti:    $0 (müşteri Meta'ya direkt ödüyor)
Embedding:                ~$0 (ihmal edilebilir)
```

---

## 6. Voice Overage & Ekstra Dakika Paketleri

### 6.1 Voice Overage

| | Fiyat | Maliyet (Ship) | Maliyet (Scale) | Markup |
|---|:---:|:---:|:---:|:---:|
| **$0.19/dk** | ✅ Uygulandı | $0.060 | $0.050 | **3.17x / 3.80x** |

### 6.2 Konuşma Overage

| | Fiyat | Maliyet | Markup |
|---|:---:|:---:|:---:|
| **$0.09/konuşma** | ✅ Uygulandı | $0.045 | **2.0x** |

### 6.3 Ekstra Dakika Paketleri

| Paket | Dakika | Fiyat | dk Başı | vs Overage | Maliyet (Ship) | Maliyet (Scale) | Markup (Scale) |
|-------|:------:|:-----:|:-------:|:---------:|:--------------:|:--------------:|:--------------:|
| **Paket 100** | 100 dk | **$15** | $0.150 | %21 indirim | $6.00 | $3.70 | **4.05x** |
| **Paket 200** | 200 dk | **$25** | $0.125 | %34 indirim | $12.00 | $7.40 | **3.38x** |
| **Paket 500** | 500 dk | **$55** | $0.110 | %42 indirim | $30.00 | $18.50 | **2.97x** |

```
Fiyat kademesi (dk başı):

$0.190 ─── Overage (otomatik, en pahalı)
$0.150 ─── 100dk paketi
$0.125 ─── 200dk paketi
$0.110 ─── 500dk paketi
─────── MÜŞTERİ FİYATI / MALİYET SINIRI ───────
$0.060 ─── Bizim maliyet (Ship overage)
$0.050 ─── Bizim maliyet (Scale overage)
$0.046 ─── Bizim maliyet (Ship dahil dakikalar)
$0.037 ─── Bizim maliyet (Scale dahil dakikalar)
```

### 6.4 Konuşma Paketleri

| Paket | Konuşma | Fiyat | Konuşma Başı | vs Overage | Maliyet | Markup |
|-------|:-------:|:-----:|:------------:|:---------:|:-------:|:------:|
| **Paket 500** | 500 | **$35** | $0.070 | %22 indirim | $22.50 | **1.56x** |
| **Paket 1000** | 1,000 | **$59** | $0.059 | %34 indirim | $45.00 | **1.31x** |

### 6.5 Paketlerin Plan Uygunluğu

| Paket | Essential | Professional | Business | Custom |
|-------|:---------:|:------------:|:--------:|:------:|
| Voice paketleri | Hayır (voice yok) | Evet (inbound havuzuna eklenir) | Evet (shared havuza eklenir) | Anlaşmaya göre |
| Konuşma paketleri | Evet | Evet | Evet | Anlaşmaya göre |

### 6.6 Senaryo Örnekleri

**Professional müşteri — 270dk kullanım (70dk over):**

| Yöntem | Gelir | Maliyet | Kâr |
|--------|:-----:|:-------:|:---:|
| Overage ($0.19/dk) | $249 + $13.30 = $262.30 | $16.72 | $245.58 |
| 100dk paketi ($15) | $249 + $15 = $264.00 | $16.72 | $247.28 |

**Business müşteri — 650dk kullanım (150dk over):**

| Yöntem | Gelir | Maliyet | Kâr |
|--------|:-----:|:-------:|:---:|
| Overage ($0.19/dk) | $599 + $28.50 = $627.50 | $37.44 | $590.06 |
| 200dk paketi ($25) | $599 + $25 = $624.00 | $37.44 | $586.56 |
| 500dk paketi ($55) | $599 + $55 = $654.00 | $37.44 | $616.56 |

---

## 7. Eşzamanlı Oturum (Concurrent Session) Politikası

### Yaklaşım: Sınırlama Değil, Dakika Tüketimi

Concurrent session'a katı sınır koymuyoruz. Nedenleri:

1. **Hasta kaçırma riski:** Klinik aynı anda 3 çağrı alıyorsa, 2'sini reddetmek ürünün değer önerisini yok eder.
2. **Outbound paralellik:** Randevu teyit aramaları paralel yapılamıyorsa, 50 hasta aramak 100dk+ sürer.
3. **Dakika havuzu zaten koruma sağlıyor:** 3 eşzamanlı çağrı dakikayı 3x hızlı bitirir → müşteri daha çabuk overage'a girer → daha fazla gelir.

### Dakika Tüketim Etkisi

| Eşzamanlı Çağrı | Tüketim | 500dk Havuz Dayanma Süresi |
|:---:|:---:|:---:|
| 1 | 1dk/dk | 8.3 saat |
| 2 | 2dk/dk | 4.2 saat |
| 3 | 3dk/dk | 2.8 saat |
| 5 | 5dk/dk | 1.7 saat |

### Güvenlik Tavanı (Altyapı Koruması)

Sert bir fiyatlandırma sınırı değil, altyapı güvenlik ağı:

| Plan | Max Eşzamanlı | Amacı |
|------|:---:|---------|
| Professional | 5 | Bug/abuse koruması |
| Business | 10 | Bug/abuse koruması |
| Custom | Anlaşmaya göre | |

> Bu tavanlar normal kullanımda asla tutmaz. Bir klinik aynı anda 10 çağrı almaz. Sadece teknik güvenlik ağı olarak mevcuttur.

---

## 8. Maliyet Yapısı Özeti & Riskler

### En Büyük Maliyet Kalemleri

| Sıra | Kalem | Toplam Maliyet Payı | Risk |
|:---:|-------|:---:|:---:|
| 1 | Claude Sonnet (chat AI) | **%68** | Sınırsız chat vaadi, aşırı kullanıcıda margin düşer |
| 2 | Altyapı (LiveKit+Supabase+n8n+Vercel) | **%21** | 50 müşteride LiveKit Scale geçişi ($450 sıçrama) |
| 3 | Voice stack (STT+TTS+Haiku) | **%11** | Dakika limitleri ile kontrol altında |

### Risk Azaltma Önerileri

| Risk | Çözüm | Etki |
|------|-------|------|
| Essential'da limit aşımı (1,000 konuşma) | ✅ Hard limit + overage $0.09/konuşma | Kontrol altında |
| Claude Sonnet maliyeti (toplam %68) | Model routing: basit sorularda Haiku ($1/$5), komplekste Sonnet ($3/$15) | Chat maliyeti %40-50 düşer |
| Voice overage | ✅ $0.19/dk uygulandı | 3.8x markup |
| Ek paket geliri | ✅ Voice + konuşma paketleri eklendi | Ek gelir kanalı |

---

## 9. 4x Markup Kuralı Sonucu

| Ölçek | Toplam Maliyet | MRR | Markup | 4x Kuralı |
|-------|:--------------:|:---:|:-----:|:---------:|
| 10 müşteri | $591 | $2,887 | 4.89x | **UYGUN** |
| 25 müşteri | $1,326 | $7,225 | 5.45x | **UYGUN** |
| 50 müşteri | $3,020 | $14,400 | 4.77x | **UYGUN** |
| 100 müşteri | $5,369 | $28,800 | 5.36x | **UYGUN** |

> Tüm ölçeklerde portföy genelinde 4x kuralı karşılanıyor. Yeni fiyatlarla margin artışı sağlandı.

---

## 10. Fiyat Referans Kaynakları

| Servis | Kaynak |
|--------|--------|
| LiveKit Cloud | https://livekit.com/pricing |
| Deepgram STT | https://deepgram.com/pricing |
| Cartesia TTS | https://cartesia.ai/pricing |
| Anthropic Claude API | https://platform.claude.com/docs/en/about-claude/pricing |
| OpenAI Embedding | https://openai.com/api/pricing/ |
| WhatsApp Business API | https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing |
| Supabase | https://supabase.com/pricing |
| Vercel | https://vercel.com/pricing |

---

*Bu doküman stoaix Platform fiyatlandırma kararları için referans niteliğindedir. Servis fiyatları değişebilir; periyodik güncelleme gerektirir.*
