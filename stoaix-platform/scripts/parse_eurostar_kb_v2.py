"""
Eurostar CSV → Structured knowledge_items (v2)

Eski parse_eurostar_kb.py: blob text → SQL dosyasına yazardı
Bu script:
  - Her ülke CSV'sini country_overview + university_programs olarak ayrıştırır
  - Her item için Claude Haiku ile description_for_ai üretir
  - OpenAI text-embedding-3-small ile embedding oluşturur
  - Doğrudan Supabase'e insert eder (upsert)

Kullanım:
  cd stoaix-platform/
  python scripts/parse_eurostar_kb_v2.py [--dry-run] [--country POLONYA]

Gerekli env:
  NEXT_PUBLIC_SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  OPENAI_API_KEY
  ANTHROPIC_API_KEY

Kurulum:
  pip install anthropic openai supabase python-dotenv
"""
import argparse
import csv
import json
import os
import re
import sys
import time
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

ANTHROPIC_API_KEY    = os.getenv("ANTHROPIC_API_KEY")
OPENAI_API_KEY       = os.getenv("OPENAI_API_KEY")
SUPABASE_URL         = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
ORG_ID               = "a1b2c3d4-0000-0000-0000-000000000001"
DATA_DIR             = Path(__file__).parent.parent / "data" / "eurostar"
EMBED_MODEL          = "text-embedding-3-small"
LLM_MODEL            = "gpt-4o-mini"

# Country CSV name → canonical country name
COUNTRY_FILES = {
    "AZERBAYCAN": "Azerbaycan",
    "BOSNA":      "Bosna Hersek",
    "BULGAR":     "Bulgaristan",
    "GURCISTAN":  "Gürcistan",
    "GRCSTAN":    "Gürcistan",
    "MAKEDONYA":  "Kuzey Makedonya",
    "MOLDOVA":    "Moldova",
    "POLONYA":    "Polonya",
    "ROMANYA":    "Romanya",
    "RUSYA":      "Rusya",
    "SIRBISTAN":  "Sırbistan",
    "SERBESTAN":  "Sırbistan",
    "KOSOVA":     "Kosova",
    "IRAN":       "İran",
}

# University name detection keywords (Turkish)
UNIVERSITY_KEYWORDS = [
    "ÜNİVERSİTESİ", "UNIVERSITY", "UNIVERSTY", "COLLEGE",
    "ÜNIVERSITESI", "AKADEMISI", "ENSTITUSU", "ENSTİTÜSÜ",
    "UNIVERSUM", "AKADEMI",
]

PRICE_RE = re.compile(r"[\d.,]+\s*(€|\$|USD|EUR|TRY|AZN|KM)", re.IGNORECASE)

def normalize(s: str) -> str:
    s = s.upper()
    for k, v in {"İ":"I","Ğ":"G","Ü":"U","Ş":"S","Ö":"O","Ç":"C",
                 "ı":"I","ğ":"g","ü":"u","ş":"s","ö":"o","ç":"c"}.items():
        s = s.replace(k, v)
    return s

def read_csv_rows(filepath: Path) -> list[list[str]]:
    rows = []
    with open(filepath, encoding="utf-8-sig", errors="replace") as f:
        reader = csv.reader(f)
        for row in reader:
            rows.append([c.strip() for c in row])
    return rows

def row_text(row: list[str]) -> str:
    return "  ".join(c for c in row if c)

def is_university_header(row: list[str]) -> bool:
    """Detect if this row starts a university block."""
    if not row or not row[0]:
        return False
    cell0 = normalize(row[0])
    return any(kw in cell0 for kw in UNIVERSITY_KEYWORDS)

def has_price(row: list[str]) -> bool:
    return any(PRICE_RE.search(c) for c in row if c)

def rows_to_text(rows: list[list[str]]) -> str:
    return "\n".join(row_text(r) for r in rows if any(c for c in r))

# ─── LLM helpers ──────────────────────────────────────────────────────────────

def llm_generate_description(item_type: str, data: dict, raw_text: str = "") -> str:
    """Generate description_for_ai using GPT-4o mini."""
    from openai import OpenAI
    client = OpenAI(api_key=OPENAI_API_KEY)

    if item_type == "country_overview":
        prompt = f"""Aşağıdaki ülke genel bilgisini AI asistanı için açıklayıcı, doğal Türkçe metne dönüştür.
Bilgiler eksik ya da kaba olabilir, eldeki verileri en iyi şekilde kullan.

Ülke: {data.get('country', '')}
Ham veri:
{raw_text[:3000]}

Sadece metin çıktısı ver, başlık veya liste formatı kullanma."""

    elif item_type == "university_programs":
        programs = data.get("programs", [])
        prog_text = "\n".join(
            f"  - {p.get('name','')}: {p.get('annual_fee','')} {p.get('currency','EUR')} - {p.get('language','')}"
            for p in programs[:30]
        ) if programs else raw_text[:2000]
        prompt = f"""Aşağıdaki üniversite ve program bilgilerini AI asistanı için açıklayıcı Türkçe metne dönüştür.

Ülke: {data.get('country', '')}
Üniversite: {data.get('university_name', '')}
Sıralamalar: {json.dumps(data.get('rankings', {}), ensure_ascii=False)}
Programlar:
{prog_text}
Ek Maliyetler: {json.dumps(data.get('extra_costs', {}), ensure_ascii=False)}

Sadece metin çıktısı ver."""

    elif item_type == "faq":
        prompt = f"""Aşağıdaki SSS içeriğini AI asistanı için açıklayıcı Türkçe metne dönüştür.

{raw_text[:3000]}

Sadece metin çıktısı ver."""

    elif item_type == "office_location":
        prompt = f"""Aşağıdaki ofis/temsilcilik bilgisini AI asistanı için açıklayıcı Türkçe metne dönüştür.

{json.dumps(data, ensure_ascii=False)}

Sadece metin çıktısı ver."""

    else:
        prompt = f"""Aşağıdaki bilgiyi AI asistanı için açıklayıcı Türkçe metne dönüştür:
{raw_text[:3000]}
Sadece metin çıktısı ver."""

    for attempt in range(3):
        try:
            resp = client.chat.completions.create(
                model=LLM_MODEL,
                max_tokens=1024,
                messages=[{"role": "user", "content": prompt}],
            )
            return resp.choices[0].message.content.strip()
        except Exception as e:
            if attempt == 2:
                print(f"    LLM error: {e}", file=sys.stderr)
                return raw_text[:1000]
            time.sleep(2 ** attempt)

def generate_embedding(text: str) -> list[float]:
    from openai import OpenAI
    client = OpenAI(api_key=OPENAI_API_KEY)
    for attempt in range(3):
        try:
            resp = client.embeddings.create(
                model=EMBED_MODEL,
                input=text[:8000],
                dimensions=1536,
            )
            return resp.data[0].embedding
        except Exception as e:
            if attempt == 2:
                raise
            time.sleep(2 ** attempt)

# ─── Country CSV Parsers ───────────────────────────────────────────────────────

def parse_country_csv(filepath: Path, country_name: str) -> list[dict]:
    """Parse country CSV → country_overview + university_programs items."""
    rows = read_csv_rows(filepath)
    items = []

    # Find university block start indices
    uni_starts = [i for i, row in enumerate(rows) if is_university_header(row)]

    # ─── Country Overview ───
    header_end = uni_starts[0] if uni_starts else len(rows)
    header_rows = rows[:header_end]
    header_text = rows_to_text(header_rows)

    # Extract package pricing from header (lines with "EURO" or "€" and a number)
    package_pricing = []
    for row in header_rows:
        if has_price(row):
            txt = row_text(row)
            # Look for "HAZIRLIK" or "DANIŞMANLIK" context
            if any(k in normalize(txt) for k in ["HAZIRLIK", "DANISMANLIK", "PAKET"]):
                package_pricing.append({"description": txt})

    country_data = {
        "country": country_name,
        "raw_notes": header_text[:1500],
        "package_pricing": package_pricing,
    }
    items.append({
        "item_type": "country_overview",
        "title": f"{country_name} — Genel Bilgi ve Koşullar",
        "data": country_data,
        "raw_text": header_text,
        "tags": ["country_overview", normalize(country_name).lower().replace(" ", "_")],
    })

    # ─── University Programs ───
    for idx, uni_start in enumerate(uni_starts):
        uni_end = uni_starts[idx + 1] if idx + 1 < len(uni_starts) else len(rows)
        uni_rows = rows[uni_start:uni_end]

        if not uni_rows:
            continue

        uni_name = uni_rows[0][0].strip()
        if not uni_name or len(uni_name) < 5:
            continue

        # Parse programs: rows with a price in col[1]
        programs = []
        extra_costs = {}
        for row in uni_rows[1:]:
            if not row or not any(row):
                continue
            prog_name = row[0] if row else ""
            price_cell = row[1] if len(row) > 1 else ""
            lang_cell = row[2] if len(row) > 2 else ""
            notes_cell = row[3] if len(row) > 3 else ""

            if prog_name and PRICE_RE.search(price_cell):
                # Detect extra cost rows
                prog_norm = normalize(prog_name)
                if any(k in prog_norm for k in ["YRT", "KIRA", "HAZIRLIK", "OTURUM", "SAGLIK", "SIGORTA", "KAYIT UCRETI"]):
                    extra_costs[prog_name] = price_cell
                else:
                    # Determine level
                    level = "Lisans"
                    if any(k in prog_norm for k in ["YUKSEK LISANS", "MASTER", "MSC"]):
                        level = "Yüksek Lisans"
                    elif any(k in prog_norm for k in ["DOKTORA", "PHD"]):
                        level = "Doktora"

                    # Try to extract numeric fee
                    price_match = re.search(r"[\d.,]+", price_cell.replace(".", "").replace(",", "."))
                    try:
                        fee = float(price_match.group()) if price_match else None
                    except:
                        fee = None

                    programs.append({
                        "name": prog_name,
                        "level": level,
                        "annual_fee": fee,
                        "currency": "EUR",
                        "language": lang_cell or "Belirtilmedi",
                        "notes": notes_cell,
                    })

        if not programs:
            # Still create item if we have rows (descriptive university)
            programs_text = rows_to_text(uni_rows[1:20])
            if not programs_text.strip():
                continue

        # Extract rankings if visible in header text or rows
        rankings = {}
        for row in uni_rows[:3]:
            txt = row_text(row)
            for rk, pattern in [("qs", r"QS[:\s]+(\S+)"), ("the", r"THE[:\s]+(\S+)")]:
                m = re.search(pattern, txt, re.IGNORECASE)
                if m:
                    rankings[rk] = m.group(1)

        uni_data = {
            "country": country_name,
            "university_name": uni_name,
            "programs": programs,
            "rankings": rankings,
            "extra_costs": extra_costs,
        }

        raw_text = rows_to_text(uni_rows[:50])
        tags = [
            "university_programs",
            normalize(country_name).lower().replace(" ", "_"),
            normalize(uni_name[:20]).lower().replace(" ", "_").rstrip("_"),
        ]

        items.append({
            "item_type": "university_programs",
            "title": f"{uni_name} ({country_name})",
            "data": uni_data,
            "raw_text": raw_text,
            "tags": tags,
        })

    return items

# ─── FAQ CSV Parser ────────────────────────────────────────────────────────────

def parse_faq_csv(filepath: Path) -> list[dict]:
    rows = read_csv_rows(filepath)
    full_text = rows_to_text(rows)

    # Split on section headers (uppercase lines ending with ?)
    blocks = []
    current_title = None
    current_lines = []

    for row in rows:
        txt = row_text(row).strip()
        if not txt:
            continue
        # Section header: short, uppercase, may end with ?
        is_header = (
            len(txt) < 80
            and txt == normalize(txt)
            and not PRICE_RE.search(txt)
            and any(c.isalpha() for c in txt)
        )
        if is_header:
            if current_title and current_lines:
                blocks.append({"title": current_title, "content": "\n".join(current_lines)})
            current_title = txt
            current_lines = []
        elif current_title:
            current_lines.append(txt)

    if current_title and current_lines:
        blocks.append({"title": current_title, "content": "\n".join(current_lines)})

    items = []
    for block in blocks:
        if len(block["content"]) < 30:
            continue
        items.append({
            "item_type": "faq",
            "title": block["title"].rstrip("?") + ("?" if block["title"].endswith("?") else ""),
            "data": {"question": block["title"], "answer": block["content"]},
            "raw_text": f"{block['title']}\n\n{block['content']}",
            "tags": ["faq", "denklik", "genel"],
        })

    if not items:
        # Fallback: whole file as one FAQ
        items.append({
            "item_type": "faq",
            "title": "Yurtdışında Eğitim ve Denklik Hakkında",
            "data": {},
            "raw_text": full_text[:4000],
            "tags": ["faq", "denklik", "genel"],
        })

    return items

# ─── Offices CSV Parser ────────────────────────────────────────────────────────

def parse_offices_csv(filepath: Path) -> list[dict]:
    rows = read_csv_rows(filepath)
    items = []
    current = {}

    for row in rows:
        txt = row_text(row).strip()
        if not txt:
            if current.get("city"):
                items.append(dict(current))
                current = {}
            continue

        col1 = row[1].strip() if len(row) > 1 else ""
        if not col1:
            continue

        # City: short uppercase text in col 1
        if len(col1) < 40 and col1 == normalize(col1) and col1.replace(" ", "").replace("-", "").isalpha():
            if current.get("city"):
                items.append(dict(current))
            current = {"city": col1}
        elif current.get("city"):
            if "address" not in current and len(col1) > 10:
                current["address"] = col1
            elif "phones" not in current and any(c.isdigit() for c in col1):
                phones = [p.strip() for p in col1.replace("–", " ").replace("—", " ").split() if p.strip() and any(d.isdigit() for d in p)]
                current["phones"] = phones
            elif "contact_person" not in current and any(k in normalize(col1) for k in ["HANIM", "BEY", "HOCAM"]):
                current["contact_person"] = col1

    if current.get("city"):
        items.append(current)

    result = []
    for office in items:
        data = {
            "city": office.get("city", ""),
            "address": office.get("address", ""),
            "phones": office.get("phones", []),
            "contact_person": office.get("contact_person", ""),
        }
        raw = f"{data['city']}\n{data['address']}\n{', '.join(data['phones'])}"
        result.append({
            "item_type": "office_location",
            "title": f"Temsilcilik: {data['city']}",
            "data": data,
            "raw_text": raw,
            "tags": ["office_location", "temsilcilik", normalize(data["city"]).lower()],
        })

    if not result:
        # Fallback: single item
        full_text = rows_to_text(rows)
        result.append({
            "item_type": "office_location",
            "title": "Eurostar Temsilcilik Ofisleri",
            "data": {"offices_raw": full_text[:2000]},
            "raw_text": full_text[:2000],
            "tags": ["office_location", "temsilcilik"],
        })

    return result

# ─── Supabase upsert ───────────────────────────────────────────────────────────

def upsert_item(supabase, item: dict) -> str:
    """Insert or update knowledge_item. Returns 'inserted' or 'updated'."""
    # Check if exists
    existing = supabase.table("knowledge_items").select("id").eq(
        "organization_id", ORG_ID
    ).eq("item_type", item["item_type"]).eq("title", item["title"]).execute()

    row = {
        "organization_id": ORG_ID,
        "item_type": item["item_type"],
        "title": item["title"],
        "description_for_ai": item["description_for_ai"],
        "data": item["data"],
        "tags": item["tags"],
        "is_active": True,
        "embedding": item["embedding"],
    }

    if existing.data:
        item_id = existing.data[0]["id"]
        supabase.table("knowledge_items").update(row).eq("id", item_id).execute()
        return "updated"
    else:
        supabase.table("knowledge_items").insert(row).execute()
        return "inserted"

# ─── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Eurostar CSV → Supabase KB (v2)")
    parser.add_argument("--dry-run", action="store_true", help="Parse only, don't write to Supabase")
    parser.add_argument("--country", help="Process only this country (e.g. POLONYA)")
    parser.add_argument("--no-llm", action="store_true", help="Skip LLM generation (use raw_text)")
    args = parser.parse_args()

    # Validate env
    if not args.dry_run:
        if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
            print("ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required")
            sys.exit(1)
        if not OPENAI_API_KEY:
            print("ERROR: OPENAI_API_KEY required")
            sys.exit(1)
        if not args.no_llm and not ANTHROPIC_API_KEY:
            print("ERROR: ANTHROPIC_API_KEY required (or pass --no-llm)")
            sys.exit(1)
        from supabase import create_client
        sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    else:
        sb = None

    csv_files = sorted(DATA_DIR.glob("*.csv"))
    print(f"Found {len(csv_files)} CSV files in {DATA_DIR}\n")

    all_items = []

    for filepath in csv_files:
        stem_norm = normalize(filepath.stem)

        # Skip if --country filter specified
        if args.country and normalize(args.country) not in stem_norm:
            continue

        matched_country = None
        for key, country_name in COUNTRY_FILES.items():
            if key in stem_norm:
                matched_country = country_name
                break

        if matched_country:
            print(f"Parsing: {matched_country} ({filepath.name})")
            try:
                items = parse_country_csv(filepath, matched_country)
                all_items.extend(items)
                print(f"  → {len(items)} items ({sum(1 for i in items if i['item_type']=='university_programs')} universities)")
            except Exception as e:
                print(f"  ERROR: {e}", file=sys.stderr)

        elif "TEMSILCILIK" in stem_norm:
            print(f"Parsing: Offices ({filepath.name})")
            items = parse_offices_csv(filepath)
            all_items.extend(items)
            print(f"  → {len(items)} office items")

        elif "DENKLIK" in stem_norm or "EGITIM" in stem_norm:
            print(f"Parsing: FAQ/Denklik ({filepath.name})")
            items = parse_faq_csv(filepath)
            all_items.extend(items)
            print(f"  → {len(items)} FAQ items")

    print(f"\nTotal: {len(all_items)} items parsed")

    if args.dry_run:
        print("\n--- DRY RUN ---")
        for item in all_items:
            print(f"  [{item['item_type']}] {item['title']}")
            if item.get("data", {}).get("programs"):
                print(f"    programs: {len(item['data']['programs'])}")
        return

    # Generate descriptions + embeddings + insert
    print(f"\nGenerating descriptions and embeddings...")
    inserted = updated = errors = 0

    for i, item in enumerate(all_items):
        try:
            print(f"  [{i+1}/{len(all_items)}] {item['item_type']}: {item['title'][:60]}")

            # Generate description_for_ai
            if args.no_llm:
                item["description_for_ai"] = item.get("raw_text", "")[:2000]
            else:
                item["description_for_ai"] = llm_generate_description(
                    item["item_type"], item["data"], item.get("raw_text", "")
                )

            if not item["description_for_ai"]:
                item["description_for_ai"] = item.get("raw_text", item["title"])[:2000]

            # Generate embedding
            embed_text = f"{item['title']}\n\n{item['description_for_ai']}"
            item["embedding"] = generate_embedding(embed_text)

            # Upsert to Supabase
            action = upsert_item(sb, item)
            if action == "inserted":
                inserted += 1
            else:
                updated += 1

            # Rate limiting
            time.sleep(0.3)

        except Exception as e:
            errors += 1
            print(f"    ERROR: {e}", file=sys.stderr)

    print(f"\n✓ Done: {inserted} inserted, {updated} updated, {errors} errors")


if __name__ == "__main__":
    main()
