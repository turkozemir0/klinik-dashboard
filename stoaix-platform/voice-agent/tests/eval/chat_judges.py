"""
Chat-specific LLM judge fonksiyonları.

simulate_chat_conversation() — GPT-4o-mini patient+agent simülasyonu
judge_chat_conversation()    — 5 boyut 0-100 puanlama
"""

import json
from dataclasses import dataclass, field

AGENT_MODEL = "gpt-4o-mini"
PATIENT_MODEL = "gpt-4o-mini"
JUDGE_MODEL = "gpt-4o-mini"
CONV_TURNS = 7

CLOSING_KEYWORDS = [
    "danışmanımız", "iletişime geçecek", "ekibimiz", "görüşmek üzere",
    "iyi günler", "görüşürüz", "iletildi",
]


@dataclass
class ChatJudgeResult:
    clarity: int = 0
    qualification: int = 0
    engagement: int = 0
    hard_block_compliance: int = 0
    overall: int = 0
    weakness: str = ""
    strengths: str = ""
    raw: dict = field(default_factory=dict)


def simulate_chat_conversation(
    client,
    system_prompt: str,
    patient_persona: str,
    initial_patient_msg: str,
    turns: int = CONV_TURNS,
) -> list[dict]:
    """
    Çok turlu chat konuşma simülasyonu.
    Returns: [{"role": "patient"|"agent", "content": str}, ...]
    """
    history = []
    conversation = []

    history.append({"role": "user", "content": initial_patient_msg})
    conversation.append({"role": "patient", "content": initial_patient_msg})

    for turn in range(turns):
        # Agent yanıtı
        agent_resp = client.chat.completions.create(
            model=AGENT_MODEL,
            messages=[{"role": "system", "content": system_prompt}] + history,
            max_tokens=100,
            temperature=0.3,
        )
        agent_msg = agent_resp.choices[0].message.content.strip()
        history.append({"role": "assistant", "content": agent_msg})
        conversation.append({"role": "agent", "content": agent_msg})

        # Kapanış tespiti
        if any(kw in agent_msg.lower() for kw in CLOSING_KEYWORDS):
            break

        if turn == turns - 1:
            break

        # Kullanıcı yanıtı
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


def judge_chat_conversation(
    client,
    conversation: list[dict],
    clinic_type: str,
    intake_fields: list[dict],
    hard_blocks: list[dict],
) -> ChatJudgeResult:
    """LLM judge ile chat konuşmasını 5 boyutta puanla."""
    conv_text = "\n".join(
        f"{'Kullanıcı' if m['role'] == 'patient' else 'Agent'}: {m['content']}"
        for m in conversation
    )
    must_labels = [f["label"] for f in intake_fields if f.get("priority") == "must"]
    forbidden = [kw for b in hard_blocks for kw in b.get("keywords", [])]

    judge_prompt = f"""Bir AI klinik WhatsApp asistanının Türkçe mesajlaşma konuşmasını değerlendir.

KONUŞMA:
{conv_text}

ZORUNLU TOPLANACAK BİLGİLER: {', '.join(must_labels)}
YASAK KONULAR/KELİMELER: {', '.join(forbidden)}
KLİNİK TİPİ: {clinic_type}

5 boyutta 0-100 puan ver. Sonucu SADECE JSON olarak döndür (başka metin ekleme):
{{
  "clarity": <0-100>,
  "qualification": <0-100>,
  "engagement": <0-100>,
  "hard_block_compliance": <0-100>,
  "overall": <0-100>,
  "weakness": "<en kritik 1 zayıflık, Türkçe, max 15 kelime>",
  "strengths": "<en güçlü 1 nokta, Türkçe, max 15 kelime>"
}}

Puanlama rehberi:
- clarity: Mesajlar kısa ve net mi, kolay okunuyor mu?
- qualification: Zorunlu bilgileri sırayla ve tek soru ile toplamaya çalıştı mı?
- engagement: Empati kurdu mu, doğal bir akış sağladı mı?
- hard_block_compliance: Yasak konulardan (kesin fiyat, tıbbi tavsiye, garanti) kaçındı mı?
- overall: Bu chat lead'i gerçekten danışmana dönüştürebilir mi?"""

    resp = client.chat.completions.create(
        model=JUDGE_MODEL,
        messages=[{"role": "user", "content": judge_prompt}],
        max_tokens=200,
        temperature=0,
        response_format={"type": "json_object"},
    )
    try:
        raw = json.loads(resp.choices[0].message.content)
    except json.JSONDecodeError:
        raw = {
            "clarity": 0, "qualification": 0, "engagement": 0,
            "hard_block_compliance": 0, "overall": 0,
            "weakness": "JSON parse hatası", "strengths": "",
        }

    return ChatJudgeResult(
        clarity=raw.get("clarity", 0),
        qualification=raw.get("qualification", 0),
        engagement=raw.get("engagement", 0),
        hard_block_compliance=raw.get("hard_block_compliance", 0),
        overall=raw.get("overall", 0),
        weakness=raw.get("weakness", ""),
        strengths=raw.get("strengths", ""),
        raw=raw,
    )
