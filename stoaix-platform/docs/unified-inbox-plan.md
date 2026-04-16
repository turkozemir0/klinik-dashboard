# Unified Inbox + WhatsApp Self-Service Onboarding — Güncellenmiş Plan

## Versiyon: v3 (Nisan 2026)

---

## WhatsApp Coexistence — Nedir?

**Resmi Meta özelliği.** Aynı WhatsApp Business App numarası:
- Telefonda WhatsApp Business App üzerinden manuel kullanım → devam eder
- Aynı anda WhatsApp Business Platform (API) üzerinden AI/otomasyon → aktif

Gerektiren: WhatsApp BSP (Business Solution Provider) — 360dialog, respond.io, WATI vb.
Tüm BSP'ler desteklemiyor, 360dialog destekliyor.

**Bizim için anlamı:** Klinik "numaramı değiştirmek zorunda mıyım?" diye sormuyor.
Mevcut WhatsApp Business numarasını getiriyor, biz API erişimini BSP üzerinden açıyoruz,
telefon app'i çalışmaya devam ediyor. Sorunsuz geçiş.

**Teknik altyapı değişmez:** 360dialog API, mesaj gönderme endpoint'i aynı.
Fark sadece onboarding akışında — kullanıcı kendi numarasını bağlıyor.

---

## WhatsApp Self-Service Onboarding (Meta Embedded Signup)

Şu anki durum: Admin OrgSettingsModal'a 360dialog credentials'ı elle giriyor.
Hedef: Kullanıcı panelden tek tıkla bağlasın.

### Akış

```
1. Dashboard → Ayarlar → Kanallar → "WhatsApp Bağla" butonu
2. Meta Embedded Signup popup açılır (Meta'nın resmi JS SDK'sı)
3. Kullanıcı Meta Business hesabıyla login olur
4. WhatsApp Business App numarasını seçer (coexistence) veya yeni numara ekler
5. 360dialog BSP olarak authorize edilir
6. 360dialog webhook → bizim /api/whatsapp/callback → credentials DB'ye yazılır
7. channel_config.whatsapp güncellenir: { provider, phone_number_id, client_token }
8. "Bağlandı ✓" — inbox artık çalışıyor
```

### Gereksinimler
- Meta Business App (Meta for Developers) → Embedded Signup entegrasyonu
- 360dialog Partner hesabı → partner_id alınması
- `/api/whatsapp/callback` endpoint (yeni)
- OrgSettingsModal'da "Bağla" butonu + durum göstergesi

### Alternatif (kısa vadeli)
Meta Embedded Signup karmaşıksa (Meta review süreci gibi gecikmeler olabilir):
Kullanıcı 360dialog'a direkt kaydolur, credentials'ı kopyalayıp panele girer.
Şu anki yöntem bu — kötü UX ama çalışıyor.

---

## Unified Inbox — Mimari (değişmedi)

```
/dashboard/inbox
├── GET  /api/inbox                              → konuşma listesi
├── GET  /api/inbox/[conversationId]/messages    → thread
└── POST /api/inbox/reply                        → gönder (channel-aware)
    ├── whatsapp + 360dialog → waba.360dialog.io/v1/messages
    ├── instagram            → graph.facebook.com messages
    └── voice                → 400 (reply yok)
```

Reply API'de Coexistence için özel bir şey yok — 360dialog API zaten aynı.
BSP üzerinden gelen cevaplar hem API'ye hem telefon app'ine yansır.

---

## Dosyalar

### Unified Inbox (Faz 1 — hemen)
1. `dashboard/app/api/inbox/route.ts`
2. `dashboard/app/api/inbox/[conversationId]/messages/route.ts`
3. `dashboard/app/api/inbox/reply/route.ts`
4. `dashboard/app/dashboard/inbox/page.tsx`
5. `dashboard/app/dashboard/inbox/InboxClient.tsx`
6. `dashboard/components/Sidebar.tsx` → Conversations → Inbox

### WhatsApp Self-Service (Faz 2 — ayrı session)
7. `dashboard/app/api/whatsapp/callback/route.ts` — 360dialog OAuth callback
8. OrgSettingsModal güncelleme — "WhatsApp Bağla" butonu + Meta Embedded Signup JS
9. 360dialog Partner hesabı gerekli (external setup)

---

## Inbox UI Tasarımı

```
+---------------------------+------------------------------------------+
|  INBOX          [filtreler]|   Ahmet Yılmaz  • WhatsApp • AI Modu    |
|  ─────────────────────────|   ──────────────────────────────────────  |
|  Ahmet Yılmaz             |                                           |
|  WhatsApp • AI • 70 puan  |     [kullanıcı mesajı]         ← sol/gri |
|  "Merhaba, randevu..."    |                                           |
|  2 dk önce                |     AI yanıtı →                sağ/mavi  |
|  ─────────────────────────|                                           |
|  Fatma Kaya               |     [kullanıcı mesajı]         ← sol/gri |
|  Instagram • Human        |                                           |
|  "Fiyatlar nedir?"        |   ──────────────────────────────────────  |
|  15 dk önce               |   [reply textarea + Gönder butonu]        |
|                           |   (Voice konuşmalarda reply yok)           |
+---------------------------+------------------------------------------+
```

Mesaj rolleri:
- `user` → sol, gri bubble
- `assistant` → sağ, mavi bubble
- `system` → orta, italik küçük metin

Filtreler: Kanal (Hepsi/WhatsApp/Instagram/Voice) + Lead Status dropdown

---

## Real-time

Supabase Realtime:
- `messages` INSERT filter `conversation_id=eq.{id}` → thread'e append
- `conversations` UPDATE filter `organization_id=eq.{orgId}` → liste refresh

---

## API Detayları

### GET /api/inbox
```
Query: channel?, leadStatus?
Returns: conversations[] with last_message + contact + lead
SQL: conversations JOIN contacts JOIN leads + last message lateral join
Order: last_message_at DESC, limit 50
```

### GET /api/inbox/[conversationId]/messages
```
Returns: messages[] ASC created_at, limit 100
Auth: org_id check via service client
```

### POST /api/inbox/reply
```
Body: { conversationId, content }
1. Fetch conversation + org channel_config
2. Fetch contact identifier (phone wa_id or igsid)
3. Route by channel
4. INSERT message (role: assistant)
Returns: { messageId }
```

---

## Uygulama Sırası

**Bu session:** Faz 1 — Unified Inbox (6 dosya, schema değişikliği yok)
**Sonraki session:** Faz 2 — WhatsApp Self-Service Onboarding

---

## Notlar

- Coexistence için 360dialog BSP olarak seçilmesi yeterli, kod tarafında değişiklik yok
- Meta Embedded Signup için Meta App Review gerekebilir (Instagram OAuth'taki gibi gecikme riski)
- Kısa vadede manuel credential girişi + 360dialog dashboard yeterli
- WhatsApp Business App numarasının Meta Business Suite'e bağlı olması şart (coexistence prereq)
