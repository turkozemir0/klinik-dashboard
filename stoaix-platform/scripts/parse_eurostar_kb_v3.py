"""
Eurostar KB Parser v3 — Eksiksiz & Doğru Yapı

Düzeltilen sorunlar (v2'ye göre):
 - Sıralama tablosu (QS/THE) artık üniversite bloğu sanılmıyor
 - col[1]='ÜCRET' pattern ile kesin üniversite tespiti
 - Çift sütunlu program tabloları (lisans + yüksek lisans yan yana) destekleniyor
 - Ofisler: her şehir ayrı office_location item
 - FAQ: her soru-cevap çifti ayrı faq item
 - Rankings tablosu → üniversite itemlarına ekleniyor
 - description_for_ai: GPT-4o mini ile üretiliyor

Kullanım:
  cd stoaix-platform/
  python scripts/parse_eurostar_kb_v3.py --dry-run
  python scripts/parse_eurostar_kb_v3.py

  # Sadece bir ülke test et:
  python scripts/parse_eurostar_kb_v3.py --dry-run --country POLONYA

  # Eski Eurostar KB'yi sil ve yeniden yükle:
  python scripts/parse_eurostar_kb_v3.py --clean

Gerekli env (stoaix-platform/.env):
  NEXT_PUBLIC_SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  OPENAI_API_KEY
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

OPENAI_API_KEY       = os.getenv("OPENAI_API_KEY")
SUPABASE_URL         = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
DEFAULT_ORG_ID       = "a1b2c3d4-0000-0000-0000-000000000001"
DEFAULT_DATA_SLUG    = "eurostar"
DEFAULT_BRAND_NAME   = "Eurostar"
DEFAULT_ORG_NAME     = "Eurostar Yurtdışı Eğitim Danışmanlığı"
DATA_ROOT            = Path(__file__).parent.parent / "data"
CONFIG_FILENAME      = "source.config.json"

COUNTRY_MAP = {
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

PRICE_RE     = re.compile(r"\d[\d.,]*\s*[€$₺]|[€$₺]\s*\d[\d.,]*|\d[\d.,]*\s*(EUR|USD|TRY|AZN|KM|LEI)\b", re.I)
NUMBER_RE    = re.compile(r"^[\d\-\s,]+$|^\d[\d\s\-,]+\d$")
BARE_PRICE_RE = re.compile(r'^\d[\d.,\s\-\*×x]{2,}\d$')  # "8.000- 2500", "2500-5000" gibi

def is_price(s: str) -> bool:
    """Para birimi varsa veya bare sayı/aralık ise True (Sırbistan gibi €-siz fiyatlar için)."""
    s = s.strip()
    return bool(s) and (bool(PRICE_RE.search(s)) or bool(BARE_PRICE_RE.match(s)))

# ─── Helpers ──────────────────────────────────────────────────────────────────

def norm(s: str) -> str:
    s = s.upper()
    for k, v in {"İ":"I","Ğ":"G","Ü":"U","Ş":"S","Ö":"O","Ç":"C",
                 "ı":"I","ğ":"g","ü":"u","ş":"s","ö":"o","ç":"c"}.items():
        s = s.replace(k, v)
    return s

def cell(row: list, idx: int) -> str:
    return row[idx].strip() if idx < len(row) else ""

def read_csv(filepath: Path) -> list[list[str]]:
    with open(filepath, encoding="utf-8-sig", errors="replace") as f:
        return list(csv.reader(f))

def has_price(row: list) -> bool:
    return any(PRICE_RE.search(c) for c in row if c)

def safe_print(text: str = ""):
    try:
        print(text)
    except UnicodeEncodeError:
        fallback = text.encode("ascii", errors="replace").decode("ascii")
        print(fallback)

def load_source_config(args) -> dict:
    slug = args.slug or DEFAULT_DATA_SLUG
    data_dir = Path(args.data_dir) if args.data_dir else DATA_ROOT / slug
    config_path = data_dir / CONFIG_FILENAME
    config = {}

    if config_path.exists():
        with open(config_path, encoding="utf-8") as f:
            config = json.load(f)

    return {
        "slug": slug,
        "data_dir": data_dir,
        "config_path": config_path,
        "parser_profile": config.get("parser_profile", "education_eurostar_v3"),
        "organization_id": args.org_id or config.get("organization_id") or DEFAULT_ORG_ID,
        "organization_name": args.org_name or config.get("organization_name") or DEFAULT_ORG_NAME,
        "brand_name": args.brand_name or config.get("brand_name") or DEFAULT_BRAND_NAME,
        "sector": config.get("sector", "education"),
    }

def is_uni_header(row: list) -> bool:
    """
    Üniversite blok başlığı tespiti — 6 farklı CSV formatını destekler:
      Format A (Polonya, Makedonya, Gürcistan): col[1]='ÜCRET'
      Format B (Azerbaycan, Bulgaristan):       col[1] starts with 'HAZIRLIK'
      Format C (Moldova):                       col[1] contains 'LİSANS YILLIK'
      Format D (Sırbistan):                     col[1]='' + col[2]='DİL'
      Format E (Rusya):                         col[2]='ÜCRET' veya col[4]='ÜCRET'
      Format F (İran, Romanya):                 col[0] contains 'ÜNİVERSİTESİ' + col[1,2] boş
      Format G (Bosna, Gürcistan sub):          col[1]='' + col[3]='DİL/EK'
    Sıralama tablosu satırları hariç: col[1] saf sayı ise ranking tablosudur.
    """
    c0 = cell(row, 0)
    c1 = cell(row, 1)
    if not c0 or len(c0) < 5:
        return False
    # Not satırları: "--", "(" ile başlıyorsa üniversite değil
    if c0.startswith(("-", "(")):
        return False
    # Sıralama tablosu değil: col[1] saf sayı veya tire ise bu rankings
    if c1 and (c1 == "-" or NUMBER_RE.match(c1.replace(".", "").replace(",", ""))):
        return False

    c2 = cell(row, 2)
    c3 = cell(row, 3)
    c4 = cell(row, 4)

    # Format A: Col[1] = ÜCRET (Polonya, Makedonya, Gürcistan...)
    if norm(c1) in ("UCRET", "FIYAT"):
        return True
    # Format B: Col[1] starts with HAZIRLIK (Azerbaycan, Bulgaristan)
    if norm(c1).startswith("HAZIRLIK"):
        return True
    # Format C: Col[1] contains LİSANS YILLIK (Moldova)
    if "LISANS YILLIK" in norm(c1):
        return True
    # Format D: Col[1] boş, col[2] = DİL (Sırbistan)
    if not c1 and norm(c2) in ("DIL",):
        return True
    # Format E: Col[2] veya col[4] = ÜCRET (Rusya, Bosna alt format)
    if norm(c2) in ("UCRET",) or norm(c4) in ("UCRET",):
        if len(c0) > 5:
            return True
    # Format F: col[0] 'ÜNİVERSİTESİ' içeriyor + col[1] ve col[2] boş (İran, Romanya)
    if ("UNIVERSITESI" in norm(c0) or "ENSTITUSU" in norm(c0)) and not c1 and not c2:
        return True
    # Format G: Col[1] boş ve col[3] = DİL veya EK (Bosna, Gürcistan)
    if not c1 and norm(c3) in ("DIL", "EK", "EK GIDERLER"):
        return True
    return False

# ─── Country CSV Parser ────────────────────────────────────────────────────────

def parse_country_csv(filepath: Path, country_name: str) -> list[dict]:
    rows = read_csv(filepath)
    items = []

    # 1. Rankings tablosunu bul (QS/THE/CWTS başlığından sonra)
    rankings: dict[str, dict] = {}
    rank_header_idx = None
    for i, row in enumerate(rows):
        cells_norm = [norm(c.strip()) for c in row if c.strip()]
        if "QS" in cells_norm and "THE" in cells_norm:
            rank_header_idx = i
            break

    if rank_header_idx is not None:
        for row in rows[rank_header_idx + 1:]:
            c0 = cell(row, 0)
            c1 = cell(row, 1)
            c2 = cell(row, 2)
            c3 = cell(row, 3)
            c4 = cell(row, 4)
            if not c0 or is_uni_header(row):
                break
            # Bu satır bir üniversite sıralaması
            rankings[norm(c0)] = {
                "qs": c1 if c1 != "-" else "",
                "the": c2 if c2 != "-" else "",
                "cwts": c3 if c3 != "-" else "",
                "arwu": c4 if c4 != "-" else "",
            }

    # 2. Üniversite bloklarını bul
    uni_starts = [i for i, row in enumerate(rows) if is_uni_header(row)]

    # 3. Header bölgesi → country_overview
    header_end = uni_starts[0] if uni_starts else len(rows)
    header_rows = rows[:header_end]
    header_lines = [
        " ".join(c.strip() for c in row if c.strip())
        for row in header_rows
        if any(c.strip() for c in row)
    ]
    header_text = "\n".join(header_lines)

    # Package pricing tespiti (HAZIRLIK/DANIŞMANLIK + fiyat içeren satırlar)
    package_pricing = []
    for row in header_rows:
        txt = " ".join(c.strip() for c in row if c.strip())
        n = norm(txt)
        if has_price(row) and any(k in n for k in ["HAZIRLIK", "DANISMANLIK", "PAKET", "KAYIT"]):
            package_pricing.append(txt)

    items.append({
        "item_type": "country_overview",
        "title": f"{country_name} — Genel Bilgi ve Koşullar",
        "data": {
            "country": country_name,
            "header_notes": header_text[:2000],
            "package_pricing_notes": "\n".join(package_pricing),
        },
        "raw_text": header_text,
        "tags": ["country_overview", norm(country_name).lower().replace(" ", "_"), "vize", "kosullar"],
    })

    # 4. Her üniversite bloğunu parse et
    for idx, uni_start in enumerate(uni_starts):
        uni_end = uni_starts[idx + 1] if idx + 1 < len(uni_starts) else len(rows)
        uni_rows = rows[uni_start:uni_end]
        if not uni_rows:
            continue

        uni_name = cell(uni_rows[0], 0).strip()
        if not uni_name or len(uni_name) < 4:
            continue

        # Rankings bilgisini ekle
        uni_rankings = rankings.get(norm(uni_name), {})

        # Program satırlarını parse et
        # Format A: [program, fiyat, dil, notlar]  (tek sütun)
        # Format B: [program, fiyat, dil, notlar, yüksek_lisans_program, fiyat, dil]  (çift sütun)
        lisans_programs = []
        master_programs = []
        extra_costs: dict[str, str] = {}

        for row in uni_rows[1:]:
            c0 = cell(row, 0)
            c1 = cell(row, 1)
            c2 = cell(row, 2)
            c3 = cell(row, 3)
            c4 = cell(row, 4)
            c5 = cell(row, 5)
            c6 = cell(row, 6)
            c7 = cell(row, 7)
            c8 = cell(row, 8)
            c9 = cell(row, 9)

            if not any(row):
                continue

            # Başka üniversite başlığı
            if is_uni_header(row):
                break

            # Sütun başlığı satırı — atla (BÖLÜMLERİ, LİSANS YILLIK header vb.)
            n0_raw = norm(c0)
            if n0_raw in ("BOLUMLERI", "LISANS YILLIK", "YUKSEK LISANS", "DOKTORA") and not is_price(c1):
                continue

            # ── Format A: col[0]=program, col[1]=fiyat, col[2]=dil ──────────────
            if c0 and is_price(c1):
                n0 = norm(c0)
                # Ek masraf satırı mı?
                if any(k in n0 for k in ["YRT", "KIRA", "EV KİRA", "EV KIRA", "OTURUM", "SAGLIK",
                                          "SIGORTA", "BAKANLIK", "HAZIRLIK ATLA", "AVUKAT",
                                          "CEVIRI", "EVRAK", "YURT YOK", "BIREYSEL EV"]):
                    extra_costs[c0] = c1
                else:
                    level = "Lisans"
                    if any(k in n0 for k in ["MASTER", "YUKSEK", "MSC", "MA ", "MBA",
                                               "UZMANLIK", "DOKTORA", "PHD"]):
                        level = "Yüksek Lisans"
                    lisans_programs.append({
                        "name": c0, "level": level,
                        "fee": c1, "language": c2, "notes": c3 or c4,
                    })

                # Format B: YL cols 4-5 (Gürcistan, bazı Polonya/Bosna)
                if c4 and is_price(c5):
                    master_programs.append({
                        "name": c4, "level": "Yüksek Lisans",
                        "fee": c5, "language": c6,
                    })
                # Format B2: YL cols 5-6 (Sırbistan, Moldova)
                elif c5 and is_price(c6):
                    master_programs.append({
                        "name": c5, "level": "Yüksek Lisans",
                        "fee": c6, "language": c7,
                    })
                    # Doktora cols 8-9 (Sırbistan, Moldova)
                    if c8 and is_price(c9):
                        master_programs.append({
                            "name": c8, "level": "Doktora",
                            "fee": c9, "language": cell(row, 10),
                        })

            # ── Format C: col[0]=program, col[1]=dil, col[2]=fiyat ──────────────
            # (Rusya, Bulgaristan, Romanya, Azerbaycan İnşaat)
            elif c0 and c1 and not is_price(c1) and is_price(c2):
                n0 = norm(c0)
                if any(k in n0 for k in ["YRT", "KIRA", "OTURUM", "SAGLIK",
                                          "SIGORTA", "BAKANLIK", "EVRAK"]):
                    extra_costs[c0] = c2
                else:
                    level = "Lisans"
                    if any(k in n0 for k in ["MASTER", "YUKSEK", "MSC", "MA ", "MBA",
                                               "UZMANLIK", "DOKTORA", "PHD"]):
                        level = "Yüksek Lisans"
                    lisans_programs.append({
                        "name": c0, "level": level,
                        "fee": c2, "language": c1, "notes": c3,
                    })

                # Format D: YL cols 4-5-6 (Rusya: prog,dil,fiyat)
                if c4 and is_price(c6):
                    master_programs.append({
                        "name": c4, "level": "Yüksek Lisans",
                        "fee": c6, "language": c5,
                    })
                    # Doktora cols 7+ (Rusya)
                    if c8 and is_price(c9):
                        master_programs.append({
                            "name": c8, "level": "Doktora",
                            "fee": c9, "language": cell(row, 10),
                        })
                # Format D2: YL cols 5-6 fallback
                elif c5 and is_price(c6):
                    master_programs.append({
                        "name": c5, "level": "Yüksek Lisans",
                        "fee": c6, "language": c7,
                    })

        all_programs = lisans_programs + master_programs
        if not all_programs and not extra_costs:
            # Açıklama tabanlı üniversite (Kosova gibi) — raw text al
            raw = "\n".join(
                " ".join(c.strip() for c in r if c.strip())
                for r in uni_rows if any(c.strip() for c in r)
            )
            if len(raw.strip()) < 30:
                continue
            all_programs = []

        raw_text = "\n".join(
            " ".join(c.strip() for c in r if c.strip())
            for r in uni_rows[:60] if any(c.strip() for c in r)
        )

        tags = [
            "university_programs",
            norm(country_name).lower().replace(" ", "_"),
        ]
        # Tıp/hukuk/mühendislik etiketleri
        raw_norm = norm(raw_text)
        for kw, tag in [("TIP", "tıp"), ("DIS HEK", "dis_hekimligi"), ("HUKUK", "hukuk"),
                        ("ECZACILIK", "eczacilik"), ("MUHENDIS", "muhendislik"),
                        ("PSIKOLOJI", "psikoloji"), ("VETERINER", "veterinerlik")]:
            if kw in raw_norm:
                tags.append(tag)

        items.append({
            "item_type": "university_programs",
            "title": f"{uni_name} ({country_name})",
            "data": {
                "country": country_name,
                "university_name": uni_name,
                "rankings": uni_rankings,
                "programs": all_programs,
                "extra_costs": extra_costs,
            },
            "raw_text": raw_text,
            "tags": tags,
        })

    return items

# ─── FAQ CSV Parser ────────────────────────────────────────────────────────────

def parse_faq_csv(filepath: Path) -> list[dict]:
    """Her soru-cevap çiftini ayrı faq item olarak çıkar."""
    rows = read_csv(filepath)
    items = []

    current_q = None
    current_lines = []

    def flush():
        nonlocal current_q, current_lines
        if current_q and current_lines:
            answer = "\n".join(current_lines).strip()
            if len(answer) > 20:
                items.append({
                    "item_type": "faq",
                    "title": current_q,
                    "data": {"question": current_q, "answer": answer},
                    "raw_text": f"Soru: {current_q}\nCevap: {answer}",
                    "tags": ["faq", "denklik", "genel"],
                })
        current_q = None
        current_lines = []

    for row in rows:
        # Sadece col[1] kullan (tüm veriler orada)
        c1 = cell(row, 1).strip()
        if not c1:
            continue

        # Soru tespiti: kısa (< 120 char) + büyük harf ağırlıklı + ? ile bitiyor ya da numberlı başlıyor
        is_question = (
            len(c1) < 120 and (
                c1.endswith("?") or
                (c1 == c1.upper() and any(ch.isalpha() for ch in c1) and len(c1) > 5) or
                re.match(r"^\d+[-\.)]\s+", c1)
            )
        )

        if is_question:
            flush()
            current_q = c1
        elif current_q:
            current_lines.append(c1)

    flush()

    # Denklik tablo öğesi ekle (bölüm bazlı)
    denklik_table = """Denklik Bölüm Tablosu — Fark Dersi ve Sınav Gereksinimleri:

- Tıp Fakültesi: fark dersi çıkmaz → TUS 2. oturum
- Diş Hekimliği: fark dersi çıkmaz → DUS 2. oturum
- Eczacılık: 1 ders → İlmi Hüviyet sınavı
- Hukuk: 9-12 ders → STS
- Veterinerlik: çıkabilir → STS
- Diğer bölümler: çıkabilir → STS
- Mühendislikler: proje teslimi de yapabiliyorlar

Önemli notlar:
- Sınavlarda %40 başarı gerekiyor
- Sınavlar yılda 2 kez — sınırsız giriş hakkı
- Öğrenci dönemlik 49 iş günü yurtdışında bulunmalı
- Doktora kaydı alınmıyor
- Yüksek lisans için lisans evrakları okula sorulmalı"""

    items.append({
        "item_type": "faq",
        "title": "Denklik — Bölüme Göre Fark Dersi ve Sınav Gereksinimleri",
        "data": {"question": "Denklik için ne gerekiyor?", "answer": denklik_table},
        "raw_text": denklik_table,
        "tags": ["faq", "denklik", "bölüm", "tus", "dus", "sts"],
    })

    return items

# ─── Offices CSV Parser ────────────────────────────────────────────────────────

def parse_offices_csv(filepath: Path, brand_name: str) -> list[dict]:
    """Her şehir → ayrı office_location item."""
    rows = read_csv(filepath)
    items = []

    current: dict = {}

    def flush():
        if current.get("city"):
            items.append(dict(current))

    for row in rows:
        c1 = cell(row, 1).strip()
        if not c1:
            flush()
            current = {}
            continue

        # Şehir adı tespiti: büyük harf, kısa, sayı yok
        is_city = (
            len(c1) < 50
            and any(ch.isalpha() for ch in c1)
            and not any(ch.isdigit() for ch in c1)
            and (c1 == c1.upper() or any(k in c1.upper() for k in
                 ["İSTANBUL", "ANKARA", "İZMİR", "ANTALYA", "MUĞLA", "HATAY",
                  "ŞANLIURFA", "MARDİN", "GAZİANTEP", "ORDU", "MERSİN"]))
        )

        if is_city and "city" not in current:
            flush()
            current = {"city": c1}
        elif current.get("city"):
            if "address" not in current and len(c1) > 15 and not any(d.isdigit() for d in c1[:5]):
                current["address"] = c1
            elif any(ch.isdigit() for ch in c1):
                # Telefon veya WhatsApp
                if "WhatsApp" in c1 or "whatsapp" in c1.lower():
                    wa = current.get("whatsapp", [])
                    wa.append(c1.replace("WhatsApp -", "").replace("WhatsApp-", "").strip())
                    current["whatsapp"] = wa
                else:
                    phones = current.get("phones", [])
                    # Birden fazla numara olabilir
                    parts = re.split(r"\s{2,}|/|\|", c1)
                    phones.extend([p.strip() for p in parts if p.strip()])
                    current["phones"] = phones
            elif "contact_person" not in current and len(c1) < 30:
                current["contact_person"] = c1

    flush()

    result = []
    for office in items:
        city = office.get("city", "")
        address = office.get("address", "")
        phones = office.get("phones", [])
        whatsapp = office.get("whatsapp", [])
        contact = office.get("contact_person", "")

        # description için ham metin
        parts = [f"Şehir: {city}"]
        if address:
            parts.append(f"Adres: {address}")
        if phones:
            parts.append(f"Telefon: {', '.join(phones)}")
        if whatsapp:
            parts.append(f"WhatsApp: {', '.join(whatsapp)}")
        if contact:
            parts.append(f"Yetkili: {contact}")
        raw = "\n".join(parts)

        result.append({
            "item_type": "office_location",
            "title": f"{brand_name} Temsilcilik — {city}",
            "data": {
                "city": city,
                "address": address,
                "phones": phones,
                "whatsapp": whatsapp,
                "contact_person": contact,
            },
            "raw_text": raw,
            "tags": ["office_location", "temsilcilik", norm(city.split("-")[0]).lower().strip().replace(" ", "_")],
        })

    return result

# ─── Sabit Policy/FAQ Items ────────────────────────────────────────────────────

def static_items(brand_name: str) -> list[dict]:
    return [
        {
            "item_type": "policy",
            "title": "Hizmet Kapsamı Dışındaki Konular (Hard Stop)",
            "data": {},
            "raw_text": f"""{brand_name} olarak SUNMADIĞIMIZ hizmetler:
1. LİSE eğitimi — sadece lisans ve yüksek lisans
2. ONLİNE eğitim — tüm programlar yüz yüze
3. İŞÇİ / ÇALIŞAN gönderme — iş yerleştirme veya çalışma vizesi yok
4. UKRAYNA soruları — bu konuyu AI olarak yanıtlamıyoruz, danışmana yönlendiririz
5. VİZE işlemleri — vize şirketlerine yönlendiriyoruz, ücret onlara
6. BURS başvuruları — üniversiteler kendi yönetir, danışmana yönlendir
7. DOKTORA kaydı — doktora kaydı almıyoruz""",
            "tags": ["policy", "kapsam_disi", "hard_stop"],
        },
        {
            "item_type": "policy",
            "title": "Çalıştığımız Ülkeler ve Özel Durumlar",
            "data": {
                "countries": ["Azerbaycan", "Bosna Hersek", "Bulgaristan", "Gürcistan",
                               "Kuzey Makedonya", "Moldova", "Polonya", "Romanya",
                               "Rusya", "Sırbistan", "Kosova", "İran"],
            },
            "raw_text": f"""{brand_name}'ın çalıştığı ülkeler:
Azerbaycan, Bosna Hersek, Bulgaristan, Gürcistan, Kuzey Makedonya, Moldova, Polonya, Romanya, Rusya, Sırbistan, Kosova, İran.

Tıp / Diş / Eczacılık / Hukuk için YÖK denklik şartı:
YKS puanı veya uluslararası sıralamada ilk 1000 üniversite (QS, THE, CWTS, ARWU).
Bu kriterleri sağlayan ülkelerimiz: Kosova (çifte diploma), Sırbistan, İran, Rusya.

Ukrayna: Ukrayna'da diploma kaybı ve Ukraynalı öğrenci soruları için danışmana yönlendir.""",
            "tags": ["policy", "ulkeler", "denklik", "genel"],
        },
        {
            "item_type": "faq",
            "title": "Kayıt Danışmanlık Ücretine Neler Dahil?",
            "data": {
                "question": "Kayıt danışmanlık ücretine neler dahil?",
                "answer": "Üniversiteye kayıt, havalimanı karşılama, kalacak yer desteği, bakanlık ve oturum işlemlerinde rehberlik. Ücret tek seferlik alınır. Vize işlemleri dahil değil."
            },
            "raw_text": "Kayıt danışmanlık ücretine neler dahil?\nÜniversiteye kayıt, havalimanı karşılama, kalacak yer desteği, bakanlık ve oturum işlemlerinde rehberlik. Ücret tek seferlik alınır. Vize işlemleri dahil değil.",
            "tags": ["faq", "ucret", "danismanlik"],
        },
        {
            "item_type": "faq",
            "title": "Diploma Notu Şartı Nedir?",
            "data": {
                "question": "Kaç diploma notu gerekiyor?",
                "answer": "Genel kural: çoğu ülkede diploma puanı 70 ve üzeri olmalıdır. İstisnalar: Azerbaycan ve Kosova'da diploma puanı sınırı yoktur. Ülkeye ve üniversiteye göre değişir."
            },
            "raw_text": "Diploma notu şartı: Genel kural 70 ve üzeri. Azerbaycan ve Kosova'da sınır yok.",
            "tags": ["faq", "diploma", "puan", "sart"],
        },
        {
            "item_type": "faq",
            "title": "Yaş Sınırı Var mı?",
            "data": {
                "question": "Yaş sınırı var mı?",
                "answer": "Genel kural 17-25 yaş arası. Azerbaycan'da yaş sınırı yoktur. Rusya'da 25 yaş üstü için sınırlı üniversite seçeneği var. Bosna ve Kosova'da da yaş sınırı yoktur."
            },
            "raw_text": "Yaş sınırı: Genel 17-25. Azerbaycan ve Kosova'da sınır yok. Rusya'da 25 üstü kısıtlı.",
            "tags": ["faq", "yas", "sinir"],
        },
        {
            "item_type": "faq",
            "title": "Adli Sicil Kaydı Sorunu",
            "data": {
                "question": "Adli sicil kaydı olursa ne olur?",
                "answer": "Bosna Hersek'te adli sicil önemlidir, kayıt engellenebilir. Diğer ülkelerde duruma göre değerlendirme yapılır. Net cevap için danışmana yönlendir."
            },
            "raw_text": "Adli sicil: Bosna'da önemli. Diğer ülkelerde duruma göre.",
            "tags": ["faq", "adli_sicil", "kayit"],
        },
        {
            "item_type": "pricing",
            "title": "Kayıt Danışmanlık Ücretleri — Özet",
            "data": {
                "service_name": "Yurtdışı Üniversite Kayıt Danışmanlığı",
                "pricing_by_country": [
                    {"country": "Azerbaycan", "price": "1.150-1.500 USD"},
                    {"country": "Polonya", "price": "1.550 EUR (Tıp/Hukuk/Eczacılık), diğerleri farklı"},
                    {"country": "Bosna Hersek", "price": "Boşnakça hazırlık 2.500 EUR, İngilizce 3.500 EUR (paket)"},
                    {"country": "Kosova", "price": "1.400 EUR"},
                    {"country": "Romanya", "price": "1.250 EUR"},
                    {"country": "Diğer ülkeler", "price": "Ülkeye göre değişir — danışmana sor"},
                ],
            },
            "raw_text": "Kayıt danışmanlık ücretleri: Azerbaycan 1150-1500 USD, Polonya tıp/hukuk 1550 EUR, Bosna paket 2500-3500 EUR, Kosova 1400 EUR, Romanya 1250 EUR.",
            "tags": ["pricing", "ucret", "danismanlik", "fiyat"],
        },
    ]

# ─── LLM description_for_ai üretici ───────────────────────────────────────────

def gen_description(item: dict, client, org_name: str, brand_name: str) -> str:
    t = item["item_type"]
    d = item["data"]
    raw = item.get("raw_text", "")

    if t == "country_overview":
        prompt = f"""{org_name} için {d['country']} ülkesine ait genel bilgileri AI asistana açıklayıcı, doğal Türkçe metne dönüştür.
Voice agent ve chatbot bu metni referans alacak.

Ham veri:
{raw[:3000]}

Şunları mutlaka dahil et (varsa): vize şartları, diploma puan şartı, banka teminatı, oturum süreci, hazırlık dili, kayıt danışmanlık ücreti, özel koşullar.
200-400 kelime. Sadece metin."""

    elif t == "university_programs":
        programs = d.get("programs", [])
        prog_lines = "\n".join(
            f"  - {p['name']}: {p['fee']} — {p['language']}{' (' + p['notes'] + ')' if p.get('notes') else ''}"
            for p in programs[:40]
        ) if programs else raw[:2000]
        rankings = d.get("rankings", {})
        rank_str = ", ".join(f"{k.upper()}: {v}" for k, v in rankings.items() if v)
        extra = d.get("extra_costs", {})
        extra_str = ", ".join(f"{k}: {v}" for k, v in extra.items()) if extra else ""

        prompt = f"""{org_name} için {d['country']} ülkesindeki {d['university_name']} üniversitesini AI asistana tanıt.
Voice agent öğrencilerle telefon görüşmesi yapıyor; bu metni referans alacak.

Sıralamalar: {rank_str or 'bilinmiyor'}
Programlar:
{prog_lines}
Ek maliyetler: {extra_str or 'belirtilmemiş'}

Şunları dahil et: üniversite adı + ülke, öne çıkan bölümler ve ücretler, dil seçenekleri, varsa ek maliyetler.
150-300 kelime. Madde işareti veya liste YOK — akıcı paragraf yaz. Sadece metin."""

    elif t == "faq":
        prompt = f"""Aşağıdaki soru-cevabı AI asistanı için doğal Türkçe metne dönüştür:

{raw[:2000]}

100-200 kelime. Sadece metin."""

    elif t == "office_location":
        prompt = f"""{brand_name} temsilcilik ofisi bilgisini AI asistanı için kısa açıklayıcı metne dönüştür:

{raw[:500]}

2-3 cümle. Sadece metin."""

    elif t == "policy":
        prompt = f"""{brand_name} politika/kural bilgisini AI asistanı için açıklayıcı metne dönüştür:

{raw[:2000]}

Sadece metin."""

    elif t == "pricing":
        prompt = f"""{brand_name} kayıt danışmanlık ücret bilgisini AI asistanı için açıklayıcı metne dönüştür:

{raw[:1000]}

Sadece metin."""
    else:
        return raw[:500]

    for attempt in range(3):
        try:
            resp = client.chat.completions.create(
                model="gpt-4o-mini",
                max_tokens=600,
                messages=[{"role": "user", "content": prompt}],
            )
            return resp.choices[0].message.content.strip()
        except Exception as e:
            if attempt == 2:
                print(f"    LLM hata: {e}", file=sys.stderr)
                return raw[:800]
            time.sleep(2 ** attempt)

def gen_embedding(text: str, client) -> list[float]:
    for attempt in range(3):
        try:
            resp = client.embeddings.create(
                model="text-embedding-3-small",
                input=text[:8000],
                dimensions=1536,
            )
            return resp.data[0].embedding
        except Exception as e:
            if attempt == 2:
                raise
            time.sleep(2 ** attempt)

# ─── Supabase ──────────────────────────────────────────────────────────────────

def delete_old_kb(sb, org_id: str):
    """Configured org'un tüm KB itemlarını sil."""
    resp = sb.table("knowledge_items").delete().eq("organization_id", org_id).execute()
    count = len(resp.data) if resp.data else "?"
    print(f"  {count} eski item silindi.")

def upsert_item(sb, item: dict, org_id: str) -> str:
    existing = sb.table("knowledge_items").select("id") \
        .eq("organization_id", org_id) \
        .eq("item_type", item["item_type"]) \
        .eq("title", item["title"]).execute()

    row = {
        "organization_id": org_id,
        "item_type": item["item_type"],
        "title": item["title"],
        "description_for_ai": item["description_for_ai"],
        "data": item["data"],
        "tags": item["tags"],
        "is_active": True,
        "embedding": item["embedding"],
    }
    if existing.data:
        sb.table("knowledge_items").update(row).eq("id", existing.data[0]["id"]).execute()
        return "updated"
    else:
        sb.table("knowledge_items").insert(row).execute()
        return "inserted"

# ─── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Parse et, Supabase'e yazma")
    parser.add_argument("--country", help="Sadece bu ülkeyi işle (ör: POLONYA)")
    parser.add_argument("--clean", action="store_true", help="Önce eski Eurostar KB'yi sil")
    parser.add_argument("--slug", help="data/ altındaki kaynak klasör slug'ı")
    parser.add_argument("--data-dir", help="CSV klasörü path'i")
    parser.add_argument("--org-id", help="Hedef organization UUID")
    parser.add_argument("--org-name", help="LLM promptlarında kullanılacak organizasyon adı")
    parser.add_argument("--brand-name", help="Başlık ve policy metinlerinde kullanılacak marka adı")
    args = parser.parse_args()
    source = load_source_config(args)

    if source["parser_profile"] != "education_eurostar_v3":
        safe_print(
            f"HATA: parser_profile={source['parser_profile']} bu script tarafından desteklenmiyor. "
            "Yeni işletme için uygun parser ekleyin veya manual_onboarding kullanın."
        )
        sys.exit(1)

    if not args.dry_run:
        if not all([SUPABASE_URL, SUPABASE_SERVICE_KEY, OPENAI_API_KEY]):
            safe_print("HATA: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY gerekli")
            sys.exit(1)
        from supabase import create_client
        from openai import OpenAI
        sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        oai = OpenAI(api_key=OPENAI_API_KEY)

        if args.clean:
            safe_print("Eski KB siliniyor...")
            delete_old_kb(sb, source["organization_id"])
    else:
        sb = oai = None

    csv_files = sorted(source["data_dir"].glob("*.csv"))
    safe_print(f"Kaynak klasör: {source['data_dir']}")
    safe_print(f"{len(csv_files)} CSV bulundu\n")

    all_items = []

    for filepath in csv_files:
        stem_norm = norm(filepath.stem)

        if args.country and norm(args.country) not in stem_norm:
            continue

        # Ülke CSVleri
        matched = next((name for key, name in COUNTRY_MAP.items() if key in stem_norm), None)
        if matched:
            safe_print(f"[{matched}] parse ediliyor...")
            items = parse_country_csv(filepath, matched)
            all_items.extend(items)
            unis = sum(1 for i in items if i["item_type"] == "university_programs")
            safe_print(f"  -> {len(items)} item ({unis} universite, 1 country_overview)")

        elif "TEMSILCILIK" in stem_norm:
            safe_print("[Temsilcilikler] parse ediliyor...")
            items = parse_offices_csv(filepath, source["brand_name"])
            all_items.extend(items)
            safe_print(f"  -> {len(items)} ofis")

        elif "DENKLIK" in stem_norm or "EGITIM" in stem_norm:
            safe_print("[FAQ/Denklik] parse ediliyor...")
            items = parse_faq_csv(filepath)
            all_items.extend(items)
            safe_print(f"  -> {len(items)} FAQ item")

    # Sabit policy/faq itemlar
    statics = static_items(source["brand_name"])
    all_items.extend(statics)
    safe_print(f"\n[Sabit itemlar] {len(statics)} policy/faq/pricing eklendi")

    # Özet
    from collections import Counter
    counts = Counter(i["item_type"] for i in all_items)
    safe_print(f"\nToplam: {len(all_items)} item")
    for itype, cnt in sorted(counts.items()):
        safe_print(f"  {itype}: {cnt}")

    if args.dry_run:
        safe_print("\n--- DRY RUN ---")
        for item in all_items:
            prog_count = len(item["data"].get("programs", []))
            extra = f" ({prog_count} program)" if prog_count else ""
            safe_print(f"  [{item['item_type']}] {item['title']}{extra}")
        return

    # LLM + embedding + upsert
    safe_print("\nLLM aciklamalari + embedding uretiliyor...")
    inserted = updated = errors = 0

    for i, item in enumerate(all_items):
        try:
            safe_print(f"  [{i+1}/{len(all_items)}] {item['item_type']}: {item['title'][:65]}")

            item["description_for_ai"] = gen_description(item, oai, source["organization_name"], source["brand_name"])
            embed_text = f"{item['title']}\n\n{item['description_for_ai']}"
            item["embedding"] = gen_embedding(embed_text, oai)

            action = upsert_item(sb, item, source["organization_id"])
            inserted += action == "inserted"
            updated  += action == "updated"
            time.sleep(0.2)

        except Exception as e:
            errors += 1
            safe_print(f"    HATA: {e}")

    safe_print(f"\nTamamlandi: {inserted} eklendi, {updated} guncellendi, {errors} hata")


if __name__ == "__main__":
    main()
