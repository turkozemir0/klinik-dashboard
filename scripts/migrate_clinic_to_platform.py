"""
Klinik sisteminden (panel.stoaix.com) Platform'a (stoaix-platform) müşteri migration scripti.

Kullanım:
  python scripts/migrate_clinic_to_platform.py

Ne yapar:
  1. Eski sistemdeki tüm klinikleri listeler
  2. Seçilen kliniğin onboarding datasını çeker
  3. Platform'da org + knowledge_items + agent_playbook oluşturur
  4. onboarding_status = 'completed' → müşteri direkt /dashboard'a gider
  5. Invite token oluşturur → müşteriye gönderilecek link basılır
"""

import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
import json
import secrets
from datetime import datetime, timedelta, timezone

# ── Credentials ────────────────────────────────────────────────────────────
import os

OLD_SUPABASE_URL = os.getenv("OLD_SUPABASE_URL", "https://iylabpsokydolhuhvvwi.supabase.co")
OLD_SERVICE_KEY  = os.getenv("OLD_SERVICE_KEY", "")

NEW_SUPABASE_URL = os.getenv("NEW_SUPABASE_URL", "https://ablntzdbsrzbqyrnfwpl.supabase.co")
NEW_SERVICE_KEY  = os.getenv("NEW_SERVICE_KEY", "")

OPENAI_API_KEY   = os.getenv("OPENAI_API_KEY", "")

# Platform dashboard URL (invite link için)
PLATFORM_URL = os.getenv("PLATFORM_URL", "http://localhost:3000")

# Credentials eksikse .env.migrate dosyasından oku
_env_file = os.path.join(os.path.dirname(__file__), ".env.migrate")
if os.path.exists(_env_file):
    for line in open(_env_file).readlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())
    OLD_SERVICE_KEY  = os.getenv("OLD_SERVICE_KEY", OLD_SERVICE_KEY)
    NEW_SERVICE_KEY  = os.getenv("NEW_SERVICE_KEY", NEW_SERVICE_KEY)
    OPENAI_API_KEY   = os.getenv("OPENAI_API_KEY", OPENAI_API_KEY)
    PLATFORM_URL     = os.getenv("PLATFORM_URL", PLATFORM_URL)

# ── Imports ────────────────────────────────────────────────────────────────
try:
    import httpx
except ImportError:
    print("httpx yüklü değil. Yükleniyor...")
    import subprocess
    subprocess.run([sys.executable, "-m", "pip", "install", "httpx", "-q"])
    import httpx


# ── Supabase HTTP helpers ──────────────────────────────────────────────────

def old_headers():
    return {"apikey": OLD_SERVICE_KEY, "Authorization": f"Bearer {OLD_SERVICE_KEY}", "Content-Type": "application/json"}

def new_headers():
    return {"apikey": NEW_SERVICE_KEY, "Authorization": f"Bearer {NEW_SERVICE_KEY}", "Content-Type": "application/json", "Prefer": "return=representation"}

def old_get(table, params=""):
    r = httpx.get(f"{OLD_SUPABASE_URL}/rest/v1/{table}?{params}", headers=old_headers())
    r.raise_for_status()
    return r.json()

def new_get(table, params=""):
    r = httpx.get(f"{NEW_SUPABASE_URL}/rest/v1/{table}?{params}", headers=new_headers())
    r.raise_for_status()
    return r.json()

def new_post(table, data):
    r = httpx.post(f"{NEW_SUPABASE_URL}/rest/v1/{table}", headers=new_headers(), json=data)
    r.raise_for_status()
    return r.json()

def new_patch(table, params, data):
    r = httpx.patch(f"{NEW_SUPABASE_URL}/rest/v1/{table}?{params}", headers=new_headers(), json=data)
    r.raise_for_status()
    return r.json()


# ── OpenAI Embedding ───────────────────────────────────────────────────────

def get_embedding(text: str) -> list[float]:
    r = httpx.post(
        "https://api.openai.com/v1/embeddings",
        headers={"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"},
        json={"model": "text-embedding-3-small", "input": text[:8000]},
        timeout=30,
    )
    r.raise_for_status()
    return r.json()["data"][0]["embedding"]


# ── Description generator (Claude Haiku) ──────────────────────────────────
# Aynı endpoint'i OpenAI ile yapıyoruz (daha pratik)

def generate_description(content_json: dict) -> str:
    text = json.dumps(content_json, ensure_ascii=False)
    r = httpx.post(
        "https://api.openai.com/v1/chat/completions",
        headers={"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"},
        json={
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": "Sen bir AI asistan için bilgi tabanı oluşturuyorsun. Verilen JSON içeriğini, bir AI chatbot'un müşteri sorularını yanıtlarken kullanabileceği kısa ve net bir özet metne dönüştür. Maksimum 3 cümle. Türkçe veya orijinal dilde yaz."},
                {"role": "user", "content": text}
            ],
            "max_tokens": 300,
        },
        timeout=30,
    )
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"].strip()


# ── Main ───────────────────────────────────────────────────────────────────

def main():
    print("\n" + "="*60)
    print("  stoaix Klinik → Platform Migration")
    print("="*60 + "\n")

    # 1. Eski sistemdeki klinikleri listele
    print("Eski sistemdeki klinikler yükleniyor...")
    clinics = old_get("clinics", "select=id,name,slug,clinic_type,phone,email,city,ghl_location_id,ghl_pit_token,ghl_pipeline_id,onboarding_status,status&order=name")

    if not clinics:
        print("Hiç klinik bulunamadı.")
        return

    print(f"\n{len(clinics)} klinik bulundu:\n")
    for i, c in enumerate(clinics):
        ghl = "GHL ✓" if c.get("ghl_location_id") else "GHL ✗"
        onb = c.get("onboarding_status", "?")
        print(f"  [{i+1}] {c['name']} (slug: {c['slug']}) — {ghl} — onboarding: {onb}")

    print()
    try:
        choice = int(input("Migrate edilecek kliniğin numarasını girin: ")) - 1
        if choice < 0 or choice >= len(clinics):
            print("Geçersiz seçim.")
            return
    except (ValueError, KeyboardInterrupt):
        print("\nİptal edildi.")
        return

    clinic = clinics[choice]
    clinic_id = clinic["id"]
    print(f"\nSeçilen: {clinic['name']} ({clinic['slug']})\n")

    # 2. Onboarding submissions'ı çek
    print("Onboarding verileri çekiliyor...")
    submissions = old_get("onboarding_submissions", f"select=section,data,status&clinic_id=eq.{clinic_id}")
    subs_by_section = {s["section"]: s for s in submissions}
    print(f"  Bulunan section'lar: {list(subs_by_section.keys())}")

    # 3. Platform'da organizasyon slug'ı belirle
    slug_base = clinic["slug"].lower().replace("_", "-")

    # Slug çakışması kontrolü
    existing = new_get("organizations", f"select=id&slug=eq.{slug_base}")
    if existing:
        slug_base = slug_base + "-2"
        print(f"  Slug çakışması — '{slug_base}' kullanılacak")

    # 4. Müşteri email'i öğren (invite token için)
    print("\nMüşteri email adresi (invite gönderilecek):")
    customer_email = input("  Email: ").strip()
    if not customer_email:
        print("Email boş bırakılamaz.")
        return

    # 5. Ülke seçimi
    print("\nKlinik ülkesi [TR/DE/GB/US/NL/FR/AE, default: TR]:")
    country = input("  Ülke: ").strip().upper() or "TR"

    # 6. GHL config
    crm_config = {"provider": "none"}
    if clinic.get("ghl_location_id"):
        crm_config = {
            "provider": "ghl",
            "location_id": clinic["ghl_location_id"],
            "pit_token": clinic.get("ghl_pit_token", ""),
            "pipeline_id": clinic.get("ghl_pipeline_id", ""),
            "stage_mapping": {}
        }
        print(f"  GHL config aktarıldı (location: {clinic['ghl_location_id']})")

    # 7. Profil datasından alanları çıkar
    profile_data = subs_by_section.get("profile", {}).get("data", {})
    phone   = profile_data.get("phone") or clinic.get("phone", "")
    email   = profile_data.get("email") or clinic.get("email", "")
    city    = clinic.get("city", "")

    # 8. AI persona: dil seçimi
    print(f"\nAI dili [tr/de/en, default: tr]:")
    ai_lang = input("  Dil: ").strip().lower() or "tr"

    print(f"\nAI persona adı [default: AI Asistan]:")
    persona_name = input("  İsim: ").strip() or "AI Asistan"

    # 9. Platform'da org oluştur
    print("\n" + "-"*40)
    print("Platform'da organizasyon oluşturuluyor...")

    ai_persona = {
        "persona_name": persona_name,
        "language": ai_lang,
        "tone": "warm-professional",
        "never_hallucinate": True,
        "fallback_instruction": "Bilgi tabanında net bir cevap bulamazsan KESİNLİKLE uydurma. Fallback yanıtı kullan.",
        "fallback_responses": {
            "no_kb_match": "Diese Information liegt mir leider nicht vor. Ich leite Ihre Anfrage an unser Team weiter." if ai_lang == "de" else "Bu konuda elimde net bir bilgi yok. Uzman ekibimize iletiyorum.",
            "off_topic": "Das liegt leider außerhalb meines Fachgebiets." if ai_lang == "de" else "Bu konu uzmanlık alanımın dışında.",
            "kb_empty_3x": "Mehrere Fragen konnte ich nicht beantworten. Ich verbinde Sie mit unserem Team." if ai_lang == "de" else "Birkaç soruyu yanıtlayamadım. Sizi ekibimize bağlayayım."
        }
    }

    org_payload = {
        "name": clinic["name"],
        "slug": slug_base,
        "sector": "clinic",
        "status": "active",
        "onboarding_status": "completed",
        "phone": phone,
        "email": email,
        "city": city,
        "country": country,
        "ai_persona": ai_persona,
        "crm_config": crm_config,
        "channel_config": {
            "voice_inbound":  {"active": False},
            "voice_outbound": {"active": False},
            "whatsapp":       {"active": bool(clinic.get("ghl_location_id"))},
            "instagram":      {"active": False}
        }
    }

    org_result = new_post("organizations", org_payload)
    if isinstance(org_result, list):
        org_result = org_result[0]
    org_id = org_result["id"]
    print(f"  Org oluşturuldu: {org_id}")

    # 10. Knowledge items oluştur
    kb_items = []

    # Profile → genel bilgi KB item'ları
    if profile_data:
        # Doktor bilgisi
        doctor_name = profile_data.get("lead_doctor_name", "")
        if doctor_name:
            doctor_content = {
                "name": doctor_name,
                "title": profile_data.get("lead_doctor_title", ""),
                "experience_years": profile_data.get("lead_doctor_experience_years", ""),
                "credentials": profile_data.get("lead_doctor_credentials", ""),
            }
            kb_items.append({"title": f"Dr. {doctor_name}", "item_type": "doctor", "data": doctor_content})

        # İletişim / Adres
        if profile_data.get("address") or clinic.get("phone"):
            contact_content = {
                "title": "İletişim & Adres",
                "content": f"Adres: {profile_data.get('address', '')}\nTelefon: {phone}\nE-posta: {email}\nPark: {profile_data.get('parking_info', '')}".strip()
            }
            kb_items.append({"title": "İletişim & Adres", "item_type": "general", "data": contact_content})

        # Politikalar
        if profile_data.get("cancellation_policy") or profile_data.get("pricing_policy"):
            policy_content = {
                "title": "Klinik Politikaları",
                "content": f"İptal Politikası: {profile_data.get('cancellation_policy', '')}\nFiyatlandırma: {profile_data.get('pricing_policy', '')}\nKonsültasyon: {profile_data.get('consultation_fee', 'Ücretsiz')}".strip()
            }
            kb_items.append({"title": "Klinik Politikaları", "item_type": "policy", "data": policy_content})

        # Karşılama mesajı
        if profile_data.get("greeting_message"):
            kb_items.append({
                "title": "Karşılama & Genel Bilgi",
                "item_type": "general",
                "data": {"title": "Karşılama & Genel Bilgi", "content": profile_data["greeting_message"]}
            })

    # Hizmetler
    services_data = subs_by_section.get("services", {}).get("data", {}).get("services", [])
    for svc in services_data:
        if not svc.get("display_name"):
            continue
        kb_items.append({
            "title": svc["display_name"],
            "item_type": "service",
            "data": {
                "name": svc["display_name"],
                "category": svc.get("category", ""),
                "description": svc.get("description_for_ai", ""),
                "duration": svc.get("procedure_duration", ""),
                "anesthesia": svc.get("anesthesia_type", ""),
                "recovery": svc.get("recovery_time", ""),
                "result_time": svc.get("final_result_time", ""),
                "pricing": svc.get("pricing_response", ""),
            }
        })

    # SSS
    faqs_data = subs_by_section.get("faqs", {}).get("data", {})
    faqs_list = faqs_data.get("faqs", []) if isinstance(faqs_data, dict) else []
    for faq in faqs_list:
        q = faq.get("question", "")
        a = faq.get("answer", "")
        if q and a:
            kb_items.append({
                "title": q,
                "item_type": "faq",
                "data": {"question": q, "answer": a}
            })

    print(f"\n{len(kb_items)} KB item oluşturulacak:")
    for item in kb_items:
        print(f"  [{item['item_type']:12}] {item['title'][:60]}")

    print("\nEmbedding'ler oluşturuluyor... (her item için OpenAI API çağrısı)")

    created_kb = 0
    for item in kb_items:
        try:
            desc = generate_description(item["data"])
            embedding = get_embedding(desc)

            kb_payload = {
                "organization_id": org_id,
                "item_type": item["item_type"],
                "title": item["title"],
                "data": item["data"],
                "description_for_ai": desc,
                "embedding": embedding,
            }
            new_post("knowledge_items", kb_payload)
            created_kb += 1
            print(f"  ✓ {item['title'][:50]}")
        except Exception as e:
            print(f"  ✗ {item['title'][:50]} — HATA: {e}")

    print(f"\n  {created_kb}/{len(kb_items)} KB item eklendi.")

    # 11. Agent playbook oluştur
    print("\nAgent playbook oluşturuluyor...")

    lang_instruction = {
        "de": "Antworte IMMER auf Deutsch, außer der Nutzer schreibt auf Türkisch oder Englisch — dann antworte in der Sprache des Nutzers.",
        "tr": "Her zaman Türkçe yanıt ver.",
        "en": "Always respond in English unless the user writes in another language.",
    }.get(ai_lang, "Always respond in the same language as the user.")

    system_prompt = f"""Sen {clinic['name']} kliniğinin yapay zeka destekli hasta iletişim asistanısın. Adın {persona_name}.

{lang_instruction}

Görevin:
- Gelen mesajlara sıcak ve profesyonel bir şekilde yanıt ver
- Randevu almak isteyen hastaları yönlendir
- Klinik hizmetleri, fiyatlar ve doktor bilgileri hakkında bilgi ver
- Bilgi tabanında olmayan soruları "Bu konuda sizi uzman ekibimize yönlendireceğim" diyerek geç
- Asla uydurma bilgi verme

Önemli kurallar:
- Kesin fiyat taahhüdünde bulunma, "muayene sonrası belirlenir" de
- Tıbbi teşhis koyma
- Klinik dışındaki konulara girme"""

    playbook_payload = {
        "organization_id": org_id,
        "name": f"{clinic['name']} — {ai_lang.upper()} Chatbot",
        "channel": "whatsapp",
        "system_prompt_template": system_prompt,
        "hard_blocks": [],
        "routing_rules": {},
        "is_active": True,
    }
    try:
        new_post("agent_playbooks", playbook_payload)
        print("  ✓ Playbook oluşturuldu")
    except Exception as e:
        print(f"  ✗ Playbook hatası: {e}")

    # 12. Invite token oluştur (30 gün geçerli)
    print("\nInvite token oluşturuluyor...")
    token = secrets.token_hex(24)
    expires_at = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()

    token_payload = {
        "token": token,
        "email": customer_email,  # not — bu field'ı store etmek için
        "note": f"Migration: {clinic['name']} | {datetime.now().strftime('%Y-%m-%d')}",
        "expires_at": expires_at,
        "organization_id": org_id,  # varsa — yoksa ignore edilir
    }

    # Token'da hangi alanlar var kontrol et — sadece var olanları gönder
    try:
        # Basit token — schema'ya göre ayarla
        token_payload_clean = {
            "token": token,
            "note": f"Migration: {clinic['name']} | {customer_email} | {datetime.now().strftime('%Y-%m-%d')}",
            "expires_at": expires_at,
        }
        # organization_id var mı kontrol et
        try:
            new_post("invite_tokens", {**token_payload_clean, "organization_id": org_id})
        except Exception:
            new_post("invite_tokens", token_payload_clean)
        print("  ✓ Token oluşturuldu")
    except Exception as e:
        print(f"  ✗ Token hatası: {e}")

    # 13. Özet
    invite_url = f"{PLATFORM_URL}/register?token={token}"

    print("\n" + "="*60)
    print("  MİGRASYON TAMAMLANDI!")
    print("="*60)
    print(f"\n  Klinik: {clinic['name']}")
    print(f"  Org ID: {org_id}")
    print(f"  Slug:   {slug_base}")
    print(f"  KB:     {created_kb} item")
    print(f"\n  ─── MÜŞTERİYE GÖNDERİLECEK LİNK ───")
    print(f"\n  {invite_url}\n")
    print(f"  Bu link 30 gün geçerlidir.")
    print(f"  Müşteri linke tıklar, şifre oluşturur → direkt /dashboard'a gider.")
    print(f"  Onboarding YOK — tüm data önceden yüklendi.")
    print("\n" + "="*60 + "\n")

    # 14. Kontrol — invite_tokens tablosunda organization_id var mı?
    print("NOT: Eğer invite_tokens tablosunda 'organization_id' kolonu yoksa,")
    print("     token'ı register aşamasında org ile manuel ilişkilendirmen gerekebilir.")
    print("     Supabase'deki invite_tokens tablosunu kontrol et.\n")


if __name__ == "__main__":
    main()
