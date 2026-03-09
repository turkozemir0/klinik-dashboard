"""
LiveKit SIP Outbound Trunk kurulum scripti
Twilio Elastic SIP Trunk üzerinden outbound çağrı için.

ÖN KOŞUL — Twilio Console'da:
  1. Elastic SIP Trunk → TKb40843e6bd1b06bcc9951d98c97af496
     Termination URI: stoaix.pstn.twilio.com  (zaten ayarlı)
  2. Elastic SIP Trunk → Credentials → Add Credential List oluştur
     (Twilio Console → Voice → SIP Trunks → <Trunk> → Origination)
     NOT: Termination (outbound) için Credentials sekmesinden ekle
  3. Oluşturduğun username + password'u .env'e yaz:
       TWILIO_SIP_USERNAME=stoaix-outbound
       TWILIO_SIP_PASSWORD=<güçlü-şifre>

Sonra bu scripti çalıştır:
  python setup_outbound_sip.py

Çıktıdaki LIVEKIT_SIP_OUTBOUND_TRUNK_ID değerini .env'e ekle.
"""

import asyncio
import os
from dotenv import load_dotenv
from livekit.api import LiveKitAPI
from livekit.protocol.sip import (
    CreateSIPOutboundTrunkRequest,
    SIPOutboundTrunkInfo,
)

load_dotenv()


async def main():
    sip_username = os.environ.get("TWILIO_SIP_USERNAME")
    sip_password = os.environ.get("TWILIO_SIP_PASSWORD")
    caller_id    = os.environ.get("OUTBOUND_CALLER_ID", "+13185698481")

    if not sip_username or not sip_password:
        print("HATA: TWILIO_SIP_USERNAME ve TWILIO_SIP_PASSWORD .env'e eklenmeli")
        print("  Twilio Console → Elastic SIP Trunk → Credentials → Credential List oluştur")
        return

    api = LiveKitAPI(
        url=os.environ["LIVEKIT_URL"],
        api_key=os.environ["LIVEKIT_API_KEY"],
        api_secret=os.environ["LIVEKIT_API_SECRET"],
    )

    print("LiveKit SIP Outbound Trunk oluşturuluyor...")
    trunk = await api.sip.create_sip_outbound_trunk(
        CreateSIPOutboundTrunkRequest(
            trunk=SIPOutboundTrunkInfo(
                name="stoaix-outbound",
                address="stoaix.pstn.twilio.com",
                numbers=[caller_id],
                auth_username=sip_username,
                auth_password=sip_password,
            )
        )
    )

    trunk_id = trunk.sip_trunk_id
    print(f"\n✓ Outbound SIP Trunk oluşturuldu!")
    print(f"  Trunk ID: {trunk_id}")
    print(f"\n=== .env'e EKLE ===")
    print(f"LIVEKIT_SIP_OUTBOUND_TRUNK_ID={trunk_id}")
    print(f"TWILIO_SIP_USERNAME={sip_username}")
    print(f"TWILIO_SIP_PASSWORD={sip_password}")
    print(f"OUTBOUND_CALLER_ID={caller_id}")
    print(f"TWILIO_SIP_TERMINATION_URI=stoaix.pstn.twilio.com")

    await api.aclose()


if __name__ == "__main__":
    asyncio.run(main())
