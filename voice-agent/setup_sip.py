"""
LiveKit SIP Trunk + Dispatch Rule kurulum scripti
Bir kez çalıştır, sonra Twilio'da yapılandır.
"""

import asyncio
import os
from dotenv import load_dotenv
from livekit.api import LiveKitAPI
from livekit.protocol.sip import (
    CreateSIPInboundTrunkRequest,
    SIPInboundTrunkInfo,
    CreateSIPDispatchRuleRequest,
    SIPDispatchRule,
    SIPDispatchRuleIndividual,
)

load_dotenv()


async def main():
    api = LiveKitAPI(
        url=os.environ["LIVEKIT_URL"],
        api_key=os.environ["LIVEKIT_API_KEY"],
        api_secret=os.environ["LIVEKIT_API_SECRET"],
    )

    # 1. Inbound SIP Trunk oluştur
    print("SIP Trunk oluşturuluyor...")
    trunk = await api.sip.create_sip_inbound_trunk(
        CreateSIPInboundTrunkRequest(
            trunk=SIPInboundTrunkInfo(
                name="stoaix-inbound",
                numbers=["+13185698481"],
            )
        )
    )
    print(f"✓ Trunk oluşturuldu: {trunk.sip_trunk_id}")

    # 2. Dispatch Rule — her çağrı ayrı bir room'a yönlensin
    print("Dispatch Rule oluşturuluyor...")
    rule = await api.sip.create_sip_dispatch_rule(
        CreateSIPDispatchRuleRequest(
            rule=SIPDispatchRule(
                dispatch_rule_individual=SIPDispatchRuleIndividual(
                    room_prefix="call-",
                )
            ),
            trunk_ids=[trunk.sip_trunk_id],
            name="stoaix-inbound-rule",
        )
    )
    print(f"✓ Dispatch Rule oluşturuldu: {rule.sip_dispatch_rule_id}")

    print("\n=== TWILIO YAPILACAKLAR ===")
    print(f"Twilio Console → Phone Numbers → +1 318 569 8481")
    print(f"'A call comes in' → SIP seç")
    print(f"SIP URI: sip:stoaix-ai-infra-wgd3xles.sip.livekit.cloud")
    print(f"\nTrunk ID (kaydet): {trunk.sip_trunk_id}")
    print(f"Rule ID  (kaydet): {rule.sip_dispatch_rule_id}")

    await api.aclose()


if __name__ == "__main__":
    asyncio.run(main())
