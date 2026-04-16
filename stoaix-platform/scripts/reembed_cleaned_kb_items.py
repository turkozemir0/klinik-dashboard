"""
Promosyon dili temizlenen 12 KB item'ının embedding'ini yeniler.
Kullanım: python scripts/reembed_cleaned_kb_items.py
.env: PLATFORM_SUPABASE_URL, PLATFORM_SUPABASE_SERVICE_KEY, OPENAI_API_KEY
"""

import os
import sys
import time
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'voice-agent', '.env'))

# Turkish chars için
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from supabase import create_client
from openai import OpenAI

TITLES = [
    # kb_data_fixes.sql
    "TAHRAN TIP ÜNİVERSİTESİ (İran)",
    "TEBRİZ ÜNİVERSİTESİ (İran)",
    "İSFAHAN TIP ÜNİVERSİTESİ (İran)",
    # kb_promo_cleanup.sql
    "ADA (DİPLOMATİK AKADEMİ) ÜNİVERSİTESİ (Azerbaycan)",
    "GENCE DEVLET TARIM ÜNİVERSİTESİ (Azerbaycan)",
    "LODZ ÜNİVERSİTESİ (Polonya)",
    "AZERBAYCAN MEDENİYET VE İNCE SANAT ÜNİVERSİTESİ (Azerbaycan)",
    "VARŞOVA EKONOMİ ÜNİVERSİTESİ (SGH) (Polonya)",
    "CLUJ TEKNİK ÜNİVERSİTESİ (Romanya)",
    "GENCE DEVLET ÜNİVERSİTESİ (Azerbaycan)",
    "GÜRCİSTAN TARIM ÜNİVERSİTESİ (Gürcistan)",
    "KAZAN FEDERAL ÜNİVERSİTESİ (Rusya)",
]

ORG_ID = "a1b2c3d4-0000-0000-0000-000000000001"

def main():
    sb = create_client(
        os.environ["PLATFORM_SUPABASE_URL"],
        os.environ["PLATFORM_SUPABASE_SERVICE_KEY"],
    )
    oai = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

    res = sb.table("knowledge_items") \
        .select("id, title, description_for_ai") \
        .eq("organization_id", ORG_ID) \
        .in_("title", TITLES) \
        .execute()

    items = res.data
    print(f"Bulunan item sayısı: {len(items)} / {len(TITLES)}")

    missing = set(TITLES) - {it["title"] for it in items}
    if missing:
        print("Bulunamayan başlıklar:")
        for t in missing:
            print(f"  - {t}")

    for i, item in enumerate(items, 1):
        text = f"{item['title']}\n\n{item['description_for_ai']}"
        emb_res = oai.embeddings.create(
            model="text-embedding-3-small",
            input=text,
            dimensions=1536,
        )
        embedding = emb_res.data[0].embedding

        sb.table("knowledge_items") \
            .update({"embedding": embedding, "updated_at": "now()"}) \
            .eq("id", item["id"]) \
            .execute()

        print(f"[{i}/{len(items)}] Güncellendi: {item['title'][:60]}")
        time.sleep(0.2)  # rate limit

    print("Tamamlandı.")

if __name__ == "__main__":
    main()
