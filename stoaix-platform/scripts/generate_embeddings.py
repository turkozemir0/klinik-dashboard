"""
knowledge_items tablosundaki boş embedding'leri doldurur.
Supabase Python client kullanır — DB şifresi gerekmez.

Gerekli .env değişkenleri:
  OPENAI_API_KEY
  NEXT_PUBLIC_SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY

Kullanım:
  python scripts/generate_embeddings.py
"""
import os
import time
from dotenv import load_dotenv
from openai import OpenAI
from supabase import create_client

load_dotenv()

OPENAI_API_KEY       = os.getenv("OPENAI_API_KEY")
SUPABASE_URL         = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
EMBED_MODEL          = "text-embedding-3-small"
BATCH_SIZE           = 20


def embed_texts(client: OpenAI, texts: list) -> list:
    for attempt in range(3):
        try:
            response = client.embeddings.create(
                model=EMBED_MODEL,
                input=texts,
                encoding_format="float"
            )
            return [item.embedding for item in response.data]
        except Exception as e:
            if attempt < 2:
                print(f"    Retry {attempt+1}/3: {e}")
                time.sleep(2 ** attempt)
            else:
                raise


def main():
    if not all([OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY]):
        missing = [k for k, v in {
            "OPENAI_API_KEY": OPENAI_API_KEY,
            "NEXT_PUBLIC_SUPABASE_URL": SUPABASE_URL,
            "SUPABASE_SERVICE_ROLE_KEY": SUPABASE_SERVICE_KEY
        }.items() if not v]
        print(f"Eksik .env değişkenleri: {missing}")
        return

    openai_client = OpenAI(api_key=OPENAI_API_KEY)
    sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    print(f"Supabase: {SUPABASE_URL}")
    print("Embedding olmayan itemlar sorgulanıyor...")

    # embedding IS NULL olan itemları çek
    result = sb.table("knowledge_items") \
        .select("id, title, description_for_ai") \
        .is_("embedding", "null") \
        .eq("is_active", True) \
        .execute()

    items = result.data
    print(f"{len(items)} item embedding bekliyor\n")

    if not items:
        print("Tüm itemlar zaten embed edilmiş.")
        return

    total = 0
    for i in range(0, len(items), BATCH_SIZE):
        batch = items[i:i + BATCH_SIZE]
        texts = [f"{row['title']}\n\n{row['description_for_ai']}" for row in batch]

        print(f"Batch {i//BATCH_SIZE + 1}/{-(-len(items)//BATCH_SIZE)}: {len(batch)} item...")
        embeddings = embed_texts(openai_client, texts)

        # Her item'ı güncelle
        for row, embedding in zip(batch, embeddings):
            vec_str = "[" + ",".join(str(x) for x in embedding) + "]"
            sb.table("knowledge_items") \
                .update({"embedding": vec_str}) \
                .eq("id", row["id"]) \
                .execute()

        total += len(batch)
        print(f"  {total}/{len(items)} tamamlandı")

        if i + BATCH_SIZE < len(items):
            time.sleep(0.5)

    print(f"\nBitti. {total} item embed edildi.")


if __name__ == "__main__":
    main()
