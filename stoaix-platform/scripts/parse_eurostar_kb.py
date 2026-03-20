"""
Eurostar CSV → knowledge_items SQL script
- Büyük dosyaları otomatik chunk'lar (RAG için)
- ON CONFLICT DO UPDATE: re-run = güncelleme
- Eksik KB itemları da otomatik ekler

Kullanım: python scripts/parse_eurostar_kb.py
Çıktı:    sql/04_eurostar_kb.sql
"""
import csv
import json
import uuid
import re
from pathlib import Path

ORG_ID = "a1b2c3d4-0000-0000-0000-000000000001"
DATA_DIR = Path(__file__).parent.parent / "data" / "eurostar"
OUTPUT_FILE = Path(__file__).parent.parent / "sql" / "04_eurostar_kb.sql"

# RAG chunk boyutu (~6000 char = ~1500 token, embedding için uygun)
CHUNK_SIZE = 6000

COUNTRY_FILES = {
    "AZERBAYCAN":   "Azerbaycan",
    "BOSNA":        "Bosna Hersek",
    "BULGAR":       "Bulgaristan",
    "GURCISTAN":    "Gürcistan",
    "GRCSTAN":      "Gürcistan",
    "MAKEDONYA":    "Kuzey Makedonya",
    "MOLDOVA":      "Moldova",
    "POLONYA":      "Polonya",
    "ROMANYA":      "Romanya",
    "RUSYA":        "Rusya",
    "SIRBISTAN":    "Sırbistan",
    "KOSOVA":       "Kosova",
    "IRAN":         "İran",
}

def normalize(s: str) -> str:
    """Türkçe karakterleri ASCII'ye indir, büyük harf yap."""
    s = s.upper()
    tr = {"İ":"I","Ğ":"G","Ü":"U","Ş":"S","Ö":"O","Ç":"C",
          "ı":"I","ğ":"g","ü":"u","ş":"s","ö":"o","ç":"c"}
    for k, v in tr.items():
        s = s.replace(k, v)
    return s


def read_csv_as_text(filepath: Path) -> str:
    """CSV'deki tüm dolu hücreleri düz metin olarak topla."""
    lines = []
    with open(filepath, encoding="utf-8-sig", errors="replace") as f:
        reader = csv.reader(f)
        for row in reader:
            cells = [c.strip() for c in row if c and c.strip()]
            if cells:
                lines.append("  ".join(cells))
    return "\n".join(lines)


def chunk_text(text: str, size: int = CHUNK_SIZE) -> list:
    """Metni paragraf sınırlarına göre chunk'la."""
    if len(text) <= size:
        return [text]

    chunks = []
    current = ""
    for para in text.split("\n"):
        if len(current) + len(para) + 1 > size and current:
            chunks.append(current.strip())
            current = para
        else:
            current += "\n" + para
    if current.strip():
        chunks.append(current.strip())
    return chunks


def parse_country_file(filepath: Path, country_name: str) -> list:
    """Her ülke dosyası → 1 veya daha fazla knowledge_item (chunk)."""
    text = read_csv_as_text(filepath)
    chunks = chunk_text(text)

    items = []
    for i, chunk in enumerate(chunks):
        suffix = f" (Bölüm {i+1})" if len(chunks) > 1 else ""
        items.append({
            "item_type": "country",
            "title": f"{country_name} Yurtdışı Eğitim Bilgileri{suffix}",
            "description_for_ai": chunk,
            "data": {"country": country_name, "chunk": i + 1, "total_chunks": len(chunks)},
            "tags": ["ulke", normalize(country_name).lower().replace(" ", "_"), "program", "fiyat"]
        })
    return items


def parse_temsilcilikler(filepath: Path) -> list:
    """Temsilcilik ofisleri → routing için structured data."""
    text = read_csv_as_text(filepath)

    # Şehir adı → bilgi bloğu çıkar
    # Format genellikle: ŞEHİR ADI (büyük harf) → adres → telefon
    offices = []
    current = {}
    lines = text.split("\n")

    for line in lines:
        line = line.strip()
        if not line:
            continue
        # Büyük harf şehir adı (kısa, sadece harf+boşluk)
        if re.match(r'^[A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜ\s\-]+$', line) and len(line) < 35:
            if current.get("city"):
                offices.append(current)
            current = {"city": line.strip()}
        elif current.get("city") and "address" not in current and len(line) > 10:
            current["address"] = line
        elif current.get("city") and "address" in current and "phone" not in current:
            if any(c.isdigit() for c in line):
                current["phone"] = line

    if current.get("city"):
        offices.append(current)

    offices_text = "Eurostar Temsilcilik Ofisleri:\n"
    for o in offices:
        offices_text += f"\n{o.get('city', '')}:\n"
        if "address" in o:
            offices_text += f"  Adres: {o['address']}\n"
        if "phone" in o:
            offices_text += f"  Telefon/WhatsApp: {o['phone']}\n"

    return [{
        "item_type": "policy",
        "title": "Eurostar Temsilcilik Ofisleri",
        "description_for_ai": offices_text.strip(),
        "data": {"offices": offices},
        "tags": ["temsilcilik", "ofis", "iletisim", "sehir", "istanbul", "ankara", "izmir"]
    }]


def parse_denklik(filepath: Path) -> list:
    """Denklik/tanınırlık + SSS içeriğini FAQ itemlara böl."""
    text = read_csv_as_text(filepath)

    items = []

    # Büyük başlıkları bul: "DENKLİK NEDİR?", "TANINIRLIK NEDİR?", "EN ÇOK SORULAN SORULAR" etc.
    # Boş satır + tüm büyük harf + ? veya yok
    section_pattern = re.compile(
        r'\n([A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜ\s\-]{4,60}\??\n)',
        re.MULTILINE
    )

    parts = section_pattern.split(text)

    if len(parts) > 1:
        # [önceki, başlık1, içerik1, başlık2, içerik2, ...]
        for i in range(1, len(parts), 2):
            title = parts[i].strip()
            content = parts[i + 1].strip()[:3000] if i + 1 < len(parts) else ""
            if title and len(content) > 30:
                items.append({
                    "item_type": "faq",
                    "title": title.rstrip('?') + ("?" if title.endswith('?') else ""),
                    "description_for_ai": f"{title}\n\n{content}",
                    "data": {},
                    "tags": ["denklik", "faq", "genel"]
                })

    if not items:
        # Fallback: tek item
        items.append({
            "item_type": "faq",
            "title": "Yurtdışında Eğitim, Denklik ve Tanınırlık",
            "description_for_ai": text[:4000],
            "data": {},
            "tags": ["denklik", "taninirlik", "yok", "faq", "genel"]
        })

    return items


def extra_policy_items() -> list:
    """Kod içinde tanımlanan, CSV'de olmayan policy/hard-stop ve FAQ itemları."""
    return [
        {
            "item_type": "policy",
            "title": "Hizmet Kapsamı Dışındaki Konular",
            "description_for_ai": """Eurostar Yurtdışı Eğitim Danışmanlığı olarak şu hizmetleri SUNMUYORUZ ve bu konularda kesinlikle bilgi vermiyoruz:

1. LİSE EĞİTİMİ: Yurt dışında lise eğitimi için öğrenci göndermiyoruz. Yalnızca lisans ve yüksek lisans düzeyinde hizmet veriyoruz. Lise soranları nazikçe bilgilendirip kapatıyoruz.

2. ONLİNE EĞİTİM: Online, uzaktan veya e-learning programı sunmuyoruz. Tüm programlarımız yurt dışında yüz yüze eğitim şeklinde.

3. İŞÇİ / ÇALIŞAN GÖNDERME: Yurt dışı iş yerleştirme, çalışma vizesi veya işçi göçü hizmeti sunmuyoruz. Bu konuda kesinlikle yönlendirme yapmayız.

4. UKRAYNA DURUMU: Ukrayna'da diploma kaybı veya Ukraynalı öğrencilerle ilgili sorular için danışmana yönlendirme yapılır — bu konuyu AI olarak yanıtlamıyoruz.

5. ÜNİVERSİTE DEĞİLİZ: Üniversitelere öğrenci yerleştirme danışmanlığı yapıyoruz. Belirli bir fakültenin hocası, rektörü veya akademik personeli değiliz.

6. BURS SORUSU: Üniversiteler kendi burs programlarını yönetir. Burs başvuruları hakkında net bilgimiz yoksa danışmana yönlendiririz.

7. VİZE İŞLEMLERİ: Vize yapımı bizim hizmetimiz dışındadır. Vize şirketlerine yönlendiriyoruz. Vize ücretini biz almıyoruz.""",
            "data": {"type": "hard_stops"},
            "tags": ["kapsam_disi", "policy", "lise", "online", "ukrayna", "vize", "burs"]
        },
        {
            "item_type": "faq",
            "title": "YKS Dönemi ve Sınav Sonrası Başvuru",
            "description_for_ai": """YKS (Yükseköğretim Kurumları Sınavı) dönemi özel durumlar:

YKS sınavı genellikle Haziran ayında yapılır. Sonuçlar Temmuz-Ağustos'ta açıklanır.
Bu dönemde arama hacmi önemli ölçüde artar.

YKS puanıyla yurt dışı başvurusu nasıl işliyor?
- Türkiye'deki üniversiteye YKS ile yerleşemeyen öğrenciler yurt dışı seçeneğini değerlendirebilir.
- Yurt dışı üniversitelerin büyük çoğunluğu YKS puanı değil, lise diploma notu ve diğer kriterler bakar.
- İstisna: Tıp, Diş Hekimliği, Eczacılık, Hukuk bölümlerinde YÖK denklik için YKS puan şartı olabilir.

Sınav sonucu yeni açıklandıysa ne yapmalı?
1. Üniversiteye kayıt dönemleri genellikle Ağustos-Eylül'dür — acele gerekebilir.
2. Bazı üniversitelerin başvuru son tarihleri kapanmış olabilir — danışmanla hemen görüşülmelidir.
3. Diploma notu ve yaş bilgisi hazırlanmalıdır.

Eski öğrenci mi arıyorsunuz?
Daha önce başvurusu olan veya kayıt yaptırmış öğrenciler öncelikli olarak danışmana bağlanır.""",
            "data": {"seasonal": True, "period": "haziran-eylul"},
            "tags": ["yks", "sinav", "sezonsal", "faq", "puan", "mezun"]
        },
        {
            "item_type": "faq",
            "title": "Sık Sorulan Sorular — Genel",
            "description_for_ai": """En sık sorulan sorular ve cevapları:

S: Kayıt danışmanlık ücreti ne kadar?
C: Ülkeye ve üniversiteye göre değişir. Azerbaycan için 1.150-1.500 USD, Polonya için Tıp/Hukuk bölümlerinde 1.550 EUR, diğerleri farklıdır. Net fiyat için danışmana yönlendirilirsiniz.

S: Ücrete neler dahil?
C: Üniversiteye kayıt, havalimanı karşılama, kalacak yer desteği, oturum ve bakanlık işlemlerinde rehberlik. Ücret tek seferlik alınır.

S: Vize işlemleri dahil mi?
C: Hayır. Biz vizeci değiliz. Vize şirketlerine yönlendiriyoruz, ücret onlara ödenir.

S: Denklik alabilecek miyim?
C: Çalıştığımız üniversitelerin büyük çoğunluğu YÖK tarafından tanınmaktadır. Tıp, Diş, Eczacılık, Hukuk için ek şartlar var — denklik bilgileri için detaylı konuşmak gerekiyor.

S: Yurt dışında yardımcı olunuyor mu?
C: Evet. Havalimanı karşılama, yerleşme, oturum işlemleri ve bakanlık işlemlerinde rehberlik sağlanıyor.

S: Kaç yaşında olunmalı?
C: Genel kural 17-25 yaş arası. Bazı ülkeler farklılık gösterir — Azerbaycan'da yaş sınırı yoktur, Rusya'da 25 yaş üstü için sınırlı üniversite vardır.

S: Adli sicil kaydı olursa ne olur?
C: Birçok ülkede adli sicil kaydı başvuruyu engeller. Duruma göre değerlendirme için danışmana görüşülmesi gerekir.

S: İngilizce bilmek şart mı?
C: İngilizce programlar için gereklidir. Ancak birçok programda hazırlık sınıfı mevcuttur. Dil gerekliliği ülke ve üniversiteye göre değişir.""",
            "data": {},
            "tags": ["sss", "faq", "genel", "ucret", "vize", "denklik", "yas"]
        },
        {
            "item_type": "policy",
            "title": "Çalıştığımız Ülkeler",
            "description_for_ai": """Eurostar olarak yurtdışı eğitim için çalıştığımız ülkeler:
Azerbaycan, Bosna Hersek, Bulgaristan, Gürcistan, Kuzey Makedonya, Moldova, Polonya, Romanya, Rusya, Sırbistan, Kosova, İran.

Tıp, Diş Hekimliği, Eczacılık ve Hukuk için YÖK denklik şartı önemlidir.
Bu bölümler için: QS, THE, CWTS, ARWU sıralamalarında ilk binde olan üniversiteler veya Kosova çifte diploma programları tercih edilir.
Bu kriterlere uyan ülkelerimiz: Kosova (çifte diploma hukuk), Sırbistan, İran, Rusya.""",
            "data": {"countries": ["Azerbaycan","Bosna Hersek","Bulgaristan","Gürcistan","Kuzey Makedonya","Moldova","Polonya","Romanya","Rusya","Sırbistan","Kosova","İran"]},
            "tags": ["ulkeler", "genel", "denklik", "policy"]
        },
        {
            "item_type": "faq",
            "title": "Kayıt Danışmanlık Ücreti Ne İçeriyor?",
            "description_for_ai": """Kayıt danışmanlık ücretine dahil hizmetler:
- Üniversiteye kayıt işlemleri
- Havalimanında karşılama
- Kalacak yer arama desteği
- Bakanlık (Diploma denklik/onay) işlemlerinde rehberlik
- Oturum izni işlemlerinde rehberlik

Ücret kayıt esnasında tek seferlik alınır, her yıl tekrarlanmaz.
Vize işlemleri ayrıca ücretlendirilir — biz vizeci değiliz, vize şirketine yönlendiriyoruz.""",
            "data": {},
            "tags": ["fiyat", "ucret", "danismanlik", "faq"]
        },
        {
            "item_type": "faq",
            "title": "Yaşam Maliyeti ve Barınma",
            "description_for_ai": """Ülkelere göre tahmini aylık yaşam maliyetleri (barınma hariç):
- Azerbaycan: 500-600 AZN/ay. Yurt: 250 AZN, Hat+internet: 35 AZN, Sigorta (ilk yıl inşaat/mimarlık): 200 AZN
- Bosna Hersek: Yurt 700-1050 KM/ay (oda tipine göre), Oturum izni 295€ (ilk yıl), 140€ (sonraki yıllar)
- Polonya: Ev kirası 200-300€, Yurt 100-150€
- Rusya: Yurt 100-200 USD/ay

Ülkeye gidildikten sonra yardımcı olunuyor mu?
Evet. Havalimanı karşılama, yerleştirme, oturum ve bakanlık işlemlerinde rehberlik sağlanıyor.""",
            "data": {},
            "tags": ["yasam_maliyeti", "barinma", "yurt", "faq"]
        },
        {
            "item_type": "faq",
            "title": "Başvuru İçin Gerekli Belgeler",
            "description_for_ai": """Başvuru için genel gereklilikler:
- Lise diploması (apostilli, çevrilmiş)
- Pasaport kopyası
- Diploma notu / transkript
- Adli sicil kaydı (suçsuzluk belgesi)
- Fotoğraf

Ülkeye ve üniversiteye göre ek belgeler istenebilir. Öğrencilere evrak listesi ayrıca iletilir,
hangi kurumlardan alınacağı konusunda yönlendirme yapılır.""",
            "data": {},
            "tags": ["evrak", "belge", "basvuru", "faq"]
        }
    ]


def to_sql(item: dict) -> str:
    """Tek knowledge_item → ON CONFLICT DO UPDATE SQL."""
    tags_sql = "ARRAY[" + ",".join(f"'{t}'" for t in item["tags"]) + "]"
    data_json = json.dumps(item["data"], ensure_ascii=False).replace("'", "''")
    title_safe = item["title"].replace("'", "''")
    desc_safe = item["description_for_ai"].replace("'", "''")
    item_type = item["item_type"]

    return f"""INSERT INTO public.knowledge_items
  (id, organization_id, item_type, title, description_for_ai, data, tags, is_active)
VALUES (
  gen_random_uuid(),
  '{ORG_ID}',
  '{item_type}',
  '{title_safe}',
  '{desc_safe}',
  '{data_json}'::jsonb,
  {tags_sql},
  true
)
ON CONFLICT (organization_id, item_type, title)
DO UPDATE SET
  description_for_ai = EXCLUDED.description_for_ai,
  data               = EXCLUDED.data,
  tags               = EXCLUDED.tags,
  updated_at         = now();
"""


def main():
    all_items = []
    csv_files = list(DATA_DIR.glob("*.csv"))

    print(f"{len(csv_files)} CSV dosyası bulundu\n")

    for filepath in sorted(csv_files):
        stem_norm = normalize(filepath.stem)

        # Ülke eşleşmesi
        matched_country = None
        for key, country_name in COUNTRY_FILES.items():
            if key in stem_norm:
                matched_country = country_name
                break

        if matched_country:
            items = parse_country_file(filepath, matched_country)
            all_items.extend(items)
            print(f"  [ulke] {matched_country}: {len(items)} item (chunk)")

        elif "TEMSILCILIK" in stem_norm:
            items = parse_temsilcilikler(filepath)
            all_items.extend(items)
            print(f"  [temsilcilik]: {len(items)} item")

        elif "DENKLIK" in stem_norm or "EGITIM" in stem_norm:
            items = parse_denklik(filepath)
            all_items.extend(items)
            print(f"  [denklik/faq]: {len(items)} item")

        else:
            text = read_csv_as_text(filepath)
            title = filepath.stem.split(" - ")[-1].strip()
            all_items.append({
                "item_type": "faq",
                "title": title,
                "description_for_ai": text[:4000],
                "data": {},
                "tags": ["genel"]
            })
            print(f"  [genel]: {title}")

    # Kod içi policy/faq itemları
    extra = extra_policy_items()
    all_items.extend(extra)
    print(f"\n  [policy/faq - kod icinde]: {len(extra)} item")

    # SQL yaz
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write("-- ═══════════════════════════════════════════════════════════════\n")
        f.write("-- Eurostar Knowledge Base — Otomatik üretildi (parse_eurostar_kb.py)\n")
        f.write(f"-- Toplam: {len(all_items)} knowledge item\n")
        f.write("-- ON CONFLICT DO UPDATE: yeniden çalıştırınca güncelleme yapar\n")
        f.write("-- ═══════════════════════════════════════════════════════════════\n\n")
        for item in all_items:
            f.write(to_sql(item))
            f.write("\n")

    print(f"\nToplam {len(all_items)} item → {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
