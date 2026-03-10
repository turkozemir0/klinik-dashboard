import { NextResponse } from 'next/server';
import { AccessToken, RoomServiceClient, AgentDispatchClient } from 'livekit-server-sdk';
import { v4 as uuidv4 } from 'uuid';

const LK_URL    = process.env.LIVEKIT_URL!;
const LK_KEY    = process.env.LIVEKIT_API_KEY!;
const LK_SECRET = process.env.LIVEKIT_API_SECRET!;

export async function POST(req: Request) {
  try {
    const { scenario = 'inbound', lang = 'tr', patient_name = 'Demo Kullanıcı' } = await req.json();

    const clinic_id = process.env.DEMO_CLINIC_ID;
    if (!clinic_id) {
      return NextResponse.json({ error: 'DEMO_CLINIC_ID env var eksik' }, { status: 500 });
    }

    const roomName = `demo-voice-${uuidv4().slice(0, 8)}`;
    const identity = `browser-${uuidv4().slice(0, 6)}`;

    // Inbound için scenario metadata'ya eklenmez → agent.py inbound moduna girer
    const isInbound = scenario === 'inbound';
    const metaObj = isInbound
      ? { clinic_id, lang, is_demo: true }
      : { clinic_id, scenario, patient_name, service_name: 'Demo Hizmet', appointment_time: 'Demo Randevu', phone_number: '', lang, is_demo: true };
    const metadata = JSON.stringify(metaObj);

    // 1. Room oluştur
    const roomService = new RoomServiceClient(LK_URL, LK_KEY, LK_SECRET);
    await roomService.createRoom({
      name: roomName,
      metadata,
      emptyTimeout: 300,
      maxParticipants: 5,
    });

    // 2. Agent dispatch et
    const agentDispatch = new AgentDispatchClient(LK_URL, LK_KEY, LK_SECRET);
    await agentDispatch.createDispatch(roomName, 'stoaix-outbound', { metadata });

    // 3. Browser için token üret
    const at = new AccessToken(LK_KEY, LK_SECRET, {
      identity,
      ttl: '1h',
    });
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });
    const token = await at.toJwt();

    return NextResponse.json({
      token,
      room_name: roomName,
      ws_url: LK_URL,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Bilinmeyen hata';
    console.error('[voice-token]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
