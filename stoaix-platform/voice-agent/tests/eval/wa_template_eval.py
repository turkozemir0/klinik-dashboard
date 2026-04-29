"""
WhatsApp özel şablon kalitesi değerlendirici.
chat_eval.py'den bağımsız — reactivation_wa, noshow_followup_wa, post_consultation_wa şablonlarını test eder.

Kullanım:
    cd stoaix-platform/voice-agent
    python tests/eval/wa_template_eval.py
    python tests/eval/wa_template_eval.py --template reactivation_wa
    python tests/eval/wa_template_eval.py --verbose

Her şablon × 3 senaryo:
  - GPT-4o-mini kullanıcı + agent simülasyonu
  - Judge: şablona özgü boyutlarla puanlama
  - PASS: overall >= 65

Şablona özgü boyutlar:
  reactivation_wa       → naturel, empathy, opt_out_handling, conversion_attempt, compliance, overall
  noshow_followup_wa    → naturel, empathy, reschedule_success, brevity, overall
  post_consultation_wa  → naturel, rapport, conversion_attempt, pressure_avoidance, overall
"""

import os
import sys
import json
import argparse
import time
from pathlib import Path
from datetime import datetime

if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent.parent.parent.parent / ".env")
    load_dotenv(Path(__file__).parent.parent.parent.parent / ".env.txt")
except ImportError:
    pass

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from openai import OpenAI
from tests.eval.production_prompts import WHATSAPP_TEMPLATE_CONTENT

# ── Yapılandırma ───────────────────────────────────────────────────────────────

PASS_THRESHOLD = 65
CONV_TURNS     = 5      # WA özel şablonlar orta uzunlukta
AGENT_MODEL    = "gpt-4o-mini"
PATIENT_MODEL  = "gpt-4o-mini"
JUDGE_MODEL    = "gpt-4o-mini"

ORG_NAME     = "Test Kliniği"
PERSONA_NAME = "Elif"

CLOSING_KEYWORDS = [
    "danışmanımız", "iletişime geçecek", "ekibimiz", "görüşmek üzere",
    "iyi günler", "listeden çıkar", "rahatsız etmeyeceğiz", "görüşürüz"
]

# ── Şablona özgü judge prompt'ları ────────────────────────────────────────────

JUDGE_PROMPTS = {
    "reactivation_wa": """Bir AI klinik WhatsApp asistanının REAKTİVASYON mesajını değerlendir.
Bu mesajlaşma eski ilgili müşteriyi geri kazanmak için yapılıyor.

KONUŞMA:
{conv_text}

6 boyutta 0-100 puan ver. SADECE JSON döndür:
{{
  "naturel": <0-100>,
  "empathy": <0-100>,
  "opt_out_handling": <0-100>,
  "conversion_attempt": <0-100>,
  "compliance": <0-100>,
  "overall": <0-100>,
  "weakness": "<en kritik zayıflık, Türkçe, max 15 kelime>",
  "strengths": "<en güçlü nokta, Türkçe, max 15 kelime>"
}}

Puanlama rehberi:
- naturel: Samimi ve doğal mı? Satış robotu gibi değil mi? Maks 3 kısa cümle kuralına uydu mu?
- empathy: Baskı yapmadı mı, müşteriyi anladığını gösterdi mi?
- opt_out_handling: Müşteri "mesaj atmayın / istemiyorum" diyince HEMEN kabul edip kapattı mı?
  Israr ettiyse 0. Opt-out gelmedi ise 100 ver.
- conversion_attempt: Opt-out olmayan senaryolarda yeni randevu veya bilgi için kapı açtı mı?
  Opt-out varsa 100 ver (değerlendirme dışı).
- compliance: Kesin fiyat verme, tıbbi tavsiye verme, garanti söylememe. Tıbbi tavsiye verdiyse 0.
- overall: Bu mesajlaşma eski müşteriyi geri kazanabilir mi?""",

    "noshow_followup_wa": """Bir AI klinik WhatsApp asistanının NO-SHOW TAKİP mesajını değerlendir.
Bu mesajlaşma randevusuna gelmemiş müşteriye ulaşmak için yapılıyor.

KONUŞMA:
{conv_text}

5 boyutta 0-100 puan ver. SADECE JSON döndür:
{{
  "naturel": <0-100>,
  "empathy": <0-100>,
  "reschedule_success": <0-100>,
  "brevity": <0-100>,
  "overall": <0-100>,
  "weakness": "<en kritik zayıflık, Türkçe, max 15 kelime>",
  "strengths": "<en güçlü nokta, Türkçe, max 15 kelime>"
}}

Puanlama rehberi:
- naturel: Doğal ve samimi mi? Robot gibi değil mi?
- empathy: Suçlamadı mı, anlayış gösterdi mi, mazeret olmadan da kabul etti mi?
- reschedule_success: Yeni randevu için teklif yaptı mı? Müşteri iptal istedi ise nazikçe kapattı mı?
  Müşteri yanıt vermedi ise 1 kez hatırlatıp bıraktı mı? (bırakmadıysa düşük)
- brevity: Mesajlar kısa ve odaklı mıydı? Gereksiz uzatma yok mu?
- overall: Bu takip randevuyu kurtarabilir mi? Kötü bir izlenim bıraktı mı?""",

    "post_consultation_wa": """Bir AI klinik WhatsApp asistanının KONSÜLTASYON SONRASI TAKİP mesajını değerlendir.
Bu mesajlaşma konsültasyon yaptırmış ama karar vermemiş müşteriyi desteklemek için yapılıyor.

KONUŞMA:
{conv_text}

5 boyutta 0-100 puan ver. SADECE JSON döndür:
{{
  "naturel": <0-100>,
  "rapport": <0-100>,
  "conversion_attempt": <0-100>,
  "pressure_avoidance": <0-100>,
  "overall": <0-100>,
  "weakness": "<en kritik zayıflık, Türkçe, max 15 kelime>",
  "strengths": "<en güçlü nokta, Türkçe, max 15 kelime>"
}}

Puanlama rehberi:
- naturel: Doğal ve samimi mi? Robot gibi değil mi? Maks 3 kısa cümle kuralına uydu mu?
- rapport: Konsültasyonu hatırladığını, müşteriyle bağ kurduğunu gösterdi mi?
- conversion_attempt: Randevu veya ilerleme için doğal bir kapı açtı mı?
  "Hazır olunca buradayız" gibi açık bırakma da olumlu.
- pressure_avoidance: Baskı yapmadı mı, israr etmedi mi, müşterinin kararına saygı gösterdi mi?
  Baskı yaptıysa 0.
- overall: Bu mesajlaşma müşteriyi randevuya yaklaştırabilir mi?""",
}

# ── Renk yardımcıları ──────────────────────────────────────────────────────────

class C:
    GREEN  = "\033[92m"
    RED    = "\033[91m"
    YELLOW = "\033[93m"
    BLUE   = "\033[94m"
    BOLD   = "\033[1m"
    RESET  = "\033[0m"

def clr(text, color): return f"{color}{text}{C.RESET}"

# ── Simülasyon ─────────────────────────────────────────────────────────────────

def simulate_conversation(
    client: OpenAI,
    system_prompt: str,
    patient_persona: str,
    initial_patient_msg: str,
    turns: int = CONV_TURNS,
) -> list[dict]:
    history      = []
    conversation = []

    history.append({"role": "user", "content": initial_patient_msg})
    conversation.append({"role": "patient", "content": initial_patient_msg})

    for turn in range(turns):
        agent_resp = client.chat.completions.create(
            model=AGENT_MODEL,
            messages=[{"role": "system", "content": system_prompt}] + history,
            max_tokens=100,
            temperature=0.3,
        )
        agent_msg = agent_resp.choices[0].message.content.strip()
        history.append({"role": "assistant", "content": agent_msg})
        conversation.append({"role": "agent", "content": agent_msg})

        # Kapanış algılama
        if any(kw in agent_msg.lower() for kw in CLOSING_KEYWORDS):
            break

        if turn == turns - 1:
            break

        patient_history = [
            {
                "role": "user" if m["role"] == "agent" else "assistant",
                "content": m["content"],
            }
            for m in conversation
        ]
        patient_resp = client.chat.completions.create(
            model=PATIENT_MODEL,
            messages=[
                {"role": "system", "content": patient_persona},
                *patient_history,
            ],
            max_tokens=60,
            temperature=0.7,
        )
        patient_msg = patient_resp.choices[0].message.content.strip()
        history.append({"role": "user", "content": patient_msg})
        conversation.append({"role": "patient", "content": patient_msg})

    return conversation


def judge_conversation(
    client: OpenAI,
    conversation: list[dict],
    template_key: str,
) -> dict:
    conv_text = "\n".join(
        f"{'Kullanıcı' if m['role'] == 'patient' else 'Agent'}: {m['content']}"
        for m in conversation
    )
    prompt_template = JUDGE_PROMPTS[template_key]
    judge_prompt = prompt_template.format(conv_text=conv_text)

    resp = client.chat.completions.create(
        model=JUDGE_MODEL,
        messages=[{"role": "user", "content": judge_prompt}],
        max_tokens=220,
        temperature=0,
        response_format={"type": "json_object"},
    )
    try:
        return json.loads(resp.choices[0].message.content)
    except json.JSONDecodeError:
        return {"overall": 0, "weakness": "JSON parse hatası", "strengths": ""}


# ── Şablon eval ────────────────────────────────────────────────────────────────

def run_template_eval(
    client: OpenAI,
    template_key: str,
) -> dict:
    tc = WHATSAPP_TEMPLATE_CONTENT[template_key]
    system_prompt = (
        tc["system_prompt"]
        .replace("{org_name}", ORG_NAME)
        .replace("{persona_name}", PERSONA_NAME)
    )

    results = {}
    for sc_key, scenario in tc["scenarios"].items():
        conversation = simulate_conversation(
            client,
            system_prompt,
            scenario["patient_persona"],
            scenario["initial"],
        )
        scores = judge_conversation(client, conversation, template_key)
        results[sc_key] = {
            "label": scenario["label"],
            "conversation": conversation,
            "scores": scores,
            "passed": scores.get("overall", 0) >= PASS_THRESHOLD,
        }
        time.sleep(0.5)

    avg_overall = (
        sum(r["scores"].get("overall", 0) for r in results.values()) / len(results)
        if results else 0
    )

    return {
        "template_key": template_key,
        "avg_overall": round(avg_overall, 1),
        "passed": avg_overall >= PASS_THRESHOLD,
        "scenarios": results,
    }


# ── Rapor ──────────────────────────────────────────────────────────────────────

TEMPLATE_LABELS = {
    "reactivation_wa":      "WA Reaktivasyon",
    "noshow_followup_wa":   "WA No-Show Takip",
    "post_consultation_wa": "WA Konsültasyon Sonrası",
}

SCORE_KEYS = {
    "reactivation_wa":      ["empathy", "opt_out_handling", "conversion_attempt", "compliance"],
    "noshow_followup_wa":   ["empathy", "reschedule_success", "brevity"],
    "post_consultation_wa": ["rapport", "conversion_attempt", "pressure_avoidance"],
}


def print_report(all_results: list[dict]) -> None:
    print(f"\n{clr('━' * 65, C.BLUE)}")
    print(clr("  WA ŞABLON KALİTE RAPORU", C.BOLD))
    print(clr("━" * 65, C.BLUE))
    print(f"  Eşik: overall >= {PASS_THRESHOLD} → PASS  |  Model: {AGENT_MODEL}\n")

    failures = []

    for res in all_results:
        tk    = res["template_key"]
        avg   = res["avg_overall"]
        label = TEMPLATE_LABELS.get(tk, tk)
        status = clr("✓ PASS", C.GREEN) if res["passed"] else clr("✗ FAIL", C.RED)
        print(f"  {clr(label.ljust(32), C.BOLD)} {status}  avg={avg}")

        keys = SCORE_KEYS.get(tk, ["overall"])
        for sc_key, sc in res["scenarios"].items():
            s = sc["scores"]
            sc_pass = clr("✓", C.GREEN) if sc["passed"] else clr("✗", C.RED)
            score_str = "  ".join(f"{k}={s.get(k, 0):3d}" for k in keys)
            print(f"    {sc_pass} {sc['label'].ljust(32)} overall={s.get('overall',0):3d}  {score_str}")
            if not sc["passed"]:
                weak = s.get("weakness", "")
                if weak:
                    print(f"      {clr('⚠ Zayıflık:', C.YELLOW)} {weak}")
                failures.append((tk, sc_key, sc["label"], s))

        strength_sample = next(
            (sc["scores"].get("strengths", "") for sc in res["scenarios"].values()
             if sc["scores"].get("strengths")), ""
        )
        if strength_sample:
            print(f"    {clr('★ Güçlü:', C.BLUE)} {strength_sample}")
        print()

    passed = sum(1 for r in all_results if r["passed"])
    total  = len(all_results)
    print(clr("━" * 65, C.BLUE))
    print(f"  Sonuç: {clr(f'{passed}/{total} şablon PASS', C.GREEN if passed == total else C.YELLOW)}")

    if failures:
        print(f"\n{clr('  İyileştirme Gereken Alanlar:', C.RED)}")
        for tk, sk, label, scores in failures:
            keys = SCORE_KEYS.get(tk, [])
            if keys:
                weakest = min([(k, scores.get(k, 0)) for k in keys], key=lambda x: x[1])
                print(f"  • {TEMPLATE_LABELS.get(tk, tk)} / {label}: en zayıf = {weakest[0]} ({weakest[1]})")
    print(clr("━" * 65, C.BLUE))


def print_conversation(result: dict, sc_key: str) -> None:
    sc = result["scenarios"][sc_key]
    tk = result["template_key"]
    label = sc["label"]
    print(f"\n{clr(f'── {tk} / {label} ──', C.BOLD)}")
    for msg in sc["conversation"]:
        role_color = C.BLUE if msg["role"] == "agent" else C.RESET
        role_label = "Agent    " if msg["role"] == "agent" else "Kullanıcı"
        print(f"  {clr(role_label, role_color)}: {msg['content']}")
    print(f"\n  {clr('Puanlar:', C.BOLD)} {json.dumps(sc['scores'], ensure_ascii=False, indent=4)}")


# ── Entry point ────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="WA şablon kalite değerlendirici")
    parser.add_argument(
        "--template",
        help="Tek şablon (reactivation_wa|noshow_followup_wa|post_consultation_wa)"
    )
    parser.add_argument("--verbose", action="store_true", help="Konuşmaları da yazdır")
    args = parser.parse_args()

    api_key = os.environ.get("OPENAI_API_KEY", "")
    if not api_key or api_key == "test-openai-key":
        print(clr("HATA: OPENAI_API_KEY bulunamadı.", C.RED))
        sys.exit(1)

    client = OpenAI(api_key=api_key)

    template_keys = (
        [args.template] if args.template else list(WHATSAPP_TEMPLATE_CONTENT.keys())
    )

    print(f"\n{clr('WA şablon eval başlatılıyor...', C.BLUE)} "
          f"{len(template_keys)} şablon × 3 senaryo × {CONV_TURNS} tur")

    all_results = []
    for tk in template_keys:
        label = TEMPLATE_LABELS.get(tk, tk)
        print(f"  → {label}...", end=" ", flush=True)
        try:
            res = run_template_eval(client, tk)
            all_results.append(res)
            avg = res["avg_overall"]
            status = clr(f"avg={avg}", C.GREEN if res["passed"] else C.RED)
            print(status)
        except Exception as e:
            print(clr(f"HATA: {e}", C.RED))
            all_results.append({
                "template_key": tk, "avg_overall": 0, "passed": False,
                "scenarios": {}, "error": str(e)
            })

    print_report(all_results)

    if args.verbose:
        for res in all_results:
            for sc_key in res.get("scenarios", {}):
                print_conversation(res, sc_key)


if __name__ == "__main__":
    main()
