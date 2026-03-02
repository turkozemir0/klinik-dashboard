# Klinik AI Asistan Paneli

Next.js 14 + Supabase ile çalışan, multi-tenant klinik dashboard'u.

## Mimari

```
Supabase (Veritabanı + Auth)
    ↕ Row Level Security (her klinik sadece kendi verisini görür)
Next.js 14 App Router (Server Components)
    ↕
Vercel (Hosting) ← panel.klinikiniz.com
```

---

## Kurulum

### 1. Supabase Tarafı

**a) SQL Çalıştır**

Supabase Dashboard → SQL Editor'a gir ve `supabase-rls-setup.sql` dosyasının tamamını yapıştır, çalıştır.

**b) Auth Kullanıcısı Oluştur**

Supabase Dashboard → Authentication → Users → "Add user" butonu ile klinik için bir kullanıcı oluştur (email + şifre).

**c) clinic_users'a Bağla**

SQL Editor'da yeni bir query aç:

```sql
INSERT INTO clinic_users (user_id, clinic_id, role)
VALUES (
  '<yeni oluşturduğun user UUID>',   -- Authentication > Users'dan kopyala
  '<clinics tablosundaki clinic UUID>',  -- clinics tablosundan kopyala
  'admin'
);
```

---

### 2. Yerel Geliştirme

```bash
# Projeyi kopyala
git clone ...
cd klinik-dashboard

# Bağımlılıkları yükle
npm install

# Ortam değişkenlerini ayarla
cp .env.local.example .env.local
# .env.local dosyasını aç ve Supabase URL + ANON_KEY değerlerini gir

# Geliştirme sunucusunu başlat
npm run dev
# → http://localhost:3000
```

---

### 3. Vercel Deploy

```bash
# Vercel CLI ile deploy
npx vercel --prod

# Vercel Dashboard'da Environment Variables ekle:
# NEXT_PUBLIC_SUPABASE_URL = https://xxxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGci...
```

**Subdomain Yönlendirme (Hostinger → Vercel)**

Hostinger'da DNS yönetimine gir:
- CNAME kaydı ekle: `panel` → `cname.vercel-dns.com`
- Vercel Dashboard → Project → Domains → `panel.istanbulklinik.com` ekle

Bu sayede ana siteniz (`istanbulklinik.com`) Hostinger'da kalır, panel (`panel.istanbulklinik.com`) Vercel'de çalışır. Birbirini etkilemez.

---

## Güvenlik Modeli

```
clinic_users tablosu
  user_id (auth.users FK)  →  Supabase'de kim giriş yaptı
  clinic_id (clinics FK)   →  Hangi kliniğe ait
  role: admin | viewer
```

`get_my_clinic_id()` SQL fonksiyonu her RLS policy'sinde devrede. Bir kullanıcı **sadece kendi `clinic_id`'sine** ait kayıtlara erişebilir. Bu kontrol veritabanı seviyesinde — uygulama kodu bypass edilse bile koruma devam eder.

---

## Sayfalar

| URL | Açıklama |
|-----|----------|
| `/login` | Giriş sayfası |
| `/dashboard` | Genel bakış, istatistikler, trend grafik |
| `/dashboard/leads` | Lead pipeline, filtreleme (durum/tier/arama) |
| `/dashboard/handoffs` | Handoff logları, sonuç takibi |
| `/dashboard/services` | Hizmet bazlı lead analitikleri |

---

## Yeni Klinik Eklemek

1. `clinics` tablosuna yeni klinik ekle
2. Supabase Auth'ta yeni kullanıcı oluştur
3. `clinic_users` tablosuna `user_id + clinic_id` bağlantısını ekle

RLS otomatik devreye girer, başka bir şey yapmana gerek yok.
