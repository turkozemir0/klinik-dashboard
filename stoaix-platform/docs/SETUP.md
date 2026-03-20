# stoaix Platform — Kurulum

## Supabase Project
- **Project ID:** `ablntzdbsrzbqyrnfwpl`
- **URL:** `https://ablntzdbsrzbqyrnfwpl.supabase.co`

---

## Adım 1 — SQL Sırası

Supabase Dashboard → SQL Editor'da **sırayla** çalıştır:

```
sql/01_schema.sql         ← Tablolar, indexler, triggerlar (vector extension dahil)
sql/02_rls.sql            ← Row Level Security politikaları
sql/03_eurostar_seed.sql  ← Eurostar org + intake schema + playbook
sql/04_eurostar_kb.sql    ← 62 KB item (ülkeler, SSS, policy)
```

---

## Adım 2 — .env Dosyası

`stoaix-platform/.env` oluştur (git'e commit etme):

```env
OPENAI_API_KEY=sk-...
SUPABASE_DB_URL=postgresql://postgres:[şifre]@db.ablntzdbsrzbqyrnfwpl.supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://ablntzdbsrzbqyrnfwpl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## Adım 3 — Embedding Üretimi (Vector RAG için zorunlu)

KB verileri SQL ile eklendikten sonra `embedding` kolonu boş olur.
Voice agent vector search yapabilmek için embedding'ler doldurulmalı:

```bash
pip install openai psycopg2-binary python-dotenv
python scripts/generate_embeddings.py
```

Bu script:
- `embedding IS NULL` olan tüm knowledge_items'ı bulur
- OpenAI `text-embedding-3-small` ile embed eder (1536 dim)
- Supabase'e kaydeder
- Maliyet: ~62 item × ortalama 500 token = ~31.000 token ≈ $0.001 (neredeyse sıfır)

KB güncellenince aynı scripti tekrar çalıştır — sadece yeni/değişen itemları işler.

---

## Adım 4 — İlk Super Admin

Supabase Auth'dan kullanıcı kaydettikten sonra:

```sql
INSERT INTO public.super_admin_users (user_id, name)
VALUES ('auth-user-uuid-buraya', 'Adın');
```

---

## Adım 5 — Voice Agent Bağlantısı

`voice-agent/agent.py`'de `organization_id` değişkeni ayarlanacak:
```python
ORGANIZATION_ID = "a1b2c3d4-0000-0000-0000-000000000001"  # Eurostar
```

Vector search sorgusu (agent.py'de kullanılacak):
```sql
SELECT title, description_for_ai
FROM knowledge_items
WHERE organization_id = $1
  AND is_active = true
ORDER BY embedding <=> $2   -- cosine similarity
LIMIT 5
```

---

## KB Güncelleme Akışı (sonradan)

```
1. CSV güncelle veya data/ klasörüne yeni CSV ekle
2. python scripts/parse_eurostar_kb.py   → sql/04_eurostar_kb.sql güncellenir
3. Supabase SQL Editor → sql/04_eurostar_kb.sql çalıştır  (ON CONFLICT DO UPDATE)
4. python scripts/generate_embeddings.py → yeni itemlar embed edilir
```



