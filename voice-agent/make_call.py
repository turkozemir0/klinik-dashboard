"""
stoaix Outbound Call Trigger
Outbound çağrı başlatır: Room oluştur → SIP dial → Agent dispatch

Kullanım (test):
  python make_call.py --phone +905xxxxxxxxx --scenario follow_up \
    --clinic-id <uuid> --patient-name "Ali Veli" --service "Saç Ekimi"

  python make_call.py --phone +905xxxxxxxxx --scenario appointment_reminder \
    --clinic-id <uuid> --patient-name "Ayşe Hanım" --appointment-time "10 Mart 14:00"

n8n entegrasyonu için import:
  from make_call import trigger_outbound_call
  await trigger_outbound_call(phone=..., scenario=..., ...)
"""

import argparse
import asyncio
import json
import logging
import os
import uuid
from datetime import datetime

from dotenv import load_dotenv
from livekit.api import LiveKitAPI
from livekit.protocol.room import CreateRoomRequest
from livekit.protocol.sip import CreateSIPParticipantRequest
from livekit.protocol.agent_dispatch import CreateAgentDispatchRequest

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("make-call")


async def trigger_outbound_call(
    phone: str,
    scenario: str,
    clinic_id: str,
    patient_name: str = "",
    service_name: str = "",
    appointment_time: str = "",
    lang: str = "tr",
) -> dict:
    """
    Outbound çağrıyı başlatır.

    Returns: {"room_name": ..., "sip_participant_id": ..., "dispatch_id": ...}
    """
    api = LiveKitAPI(
        url=os.environ["LIVEKIT_URL"],
        api_key=os.environ["LIVEKIT_API_KEY"],
        api_secret=os.environ["LIVEKIT_API_SECRET"],
    )

    outbound_trunk_id = os.environ.get("LIVEKIT_SIP_OUTBOUND_TRUNK_ID")
    if not outbound_trunk_id:
        raise ValueError("LIVEKIT_SIP_OUTBOUND_TRUNK_ID env var gerekli — setup_outbound_sip.py çalıştır")

    # 1. Room oluştur
    room_name = f"outbound-{scenario}-{uuid.uuid4().hex[:8]}"
    metadata = json.dumps({
        "clinic_id": clinic_id,
        "scenario": scenario,
        "patient_name": patient_name,
        "service_name": service_name,
        "appointment_time": appointment_time,
        "phone_number": phone,
        "lang": lang,
    })

    logger.info(f"Room oluşturuluyor: {room_name}")
    await api.room.create_room(CreateRoomRequest(
        name=room_name,
        metadata=metadata,
        empty_timeout=60,      # 1 dk — cevap gelmezse room kapansın
        max_participants=2,
    ))
    logger.info(f"✓ Room oluşturuldu: {room_name}")

    # 2. Outbound SIP çağrısı başlat
    # phone format: E.164  (+905xxxxxxxxx)
    # Twilio Elastic SIP Trunk termination URI: stoaix.pstn.twilio.com
    twilio_termination = os.environ.get("TWILIO_SIP_TERMINATION_URI", "stoaix.pstn.twilio.com")
    sip_call_to = f"sip:{phone}@{twilio_termination}"

    logger.info(f"SIP çağrısı başlatılıyor: {sip_call_to}")
    sip_participant = await api.sip.create_sip_participant(
        CreateSIPParticipantRequest(
            sip_trunk_id=outbound_trunk_id,
            sip_call_to=sip_call_to,
            room_name=room_name,
            participant_identity=f"phone-{phone}",
            participant_name=patient_name or phone,
            play_ringtone=True,
            wait_for_answer=False,   # async — agent da hazır olsun
        )
    )
    logger.info(f"✓ SIP participant oluşturuldu: {sip_participant.participant_id}")

    # 3. Outbound agent'ı dispatch et
    logger.info("Agent dispatch ediliyor...")
    dispatch = await api.agent.create_agent_dispatch(
        CreateAgentDispatchRequest(
            agent_name="stoaix-outbound",
            room=room_name,
            metadata=metadata,
        )
    )
    logger.info(f"✓ Agent dispatched: {dispatch.dispatch_id}")

    await api.aclose()

    return {
        "room_name": room_name,
        "sip_participant_id": sip_participant.participant_id,
        "dispatch_id": dispatch.dispatch_id,
        "started_at": datetime.utcnow().isoformat(),
    }


# ── CLI ────────────────────────────────────────────────────────────────────────

async def main():
    parser = argparse.ArgumentParser(description="stoaix Outbound Call Trigger")
    parser.add_argument("--phone", required=True, help="E.164 format (+905xxxxxxxxx)")
    parser.add_argument("--scenario", required=True, choices=["follow_up", "appointment_reminder"])
    parser.add_argument("--clinic-id", required=True, dest="clinic_id")
    parser.add_argument("--patient-name", default="", dest="patient_name")
    parser.add_argument("--service", default="", dest="service_name")
    parser.add_argument("--appointment-time", default="", dest="appointment_time")
    parser.add_argument("--lang", default="tr", choices=["tr", "en"])
    args = parser.parse_args()

    result = await trigger_outbound_call(
        phone=args.phone,
        scenario=args.scenario,
        clinic_id=args.clinic_id,
        patient_name=args.patient_name,
        service_name=args.service_name,
        appointment_time=args.appointment_time,
        lang=args.lang,
    )

    print("\n=== OUTBOUND CALL STARTED ===")
    for k, v in result.items():
        print(f"  {k}: {v}")


if __name__ == "__main__":
    asyncio.run(main())
