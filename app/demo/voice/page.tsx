'use client';

import { useEffect, useRef, useState } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';

type Scenario = 'inbound' | 'follow_up' | 'appointment_reminder';
type Lang = 'tr' | 'en';
type CallState = 'idle' | 'connecting' | 'ringing' | 'connected' | 'ended' | 'error';

const SCENARIO_LABELS: Record<Scenario, Record<Lang, string>> = {
  inbound: {
    tr: 'Resepsiyon',
    en: 'Receptionist',
  },
  follow_up: {
    tr: 'Takip Araması',
    en: 'Follow-up Call',
  },
  appointment_reminder: {
    tr: 'Randevu Hatırlatma',
    en: 'Appointment Reminder',
  },
};

const SCENARIO_DESC: Record<Scenario, Record<Lang, string>> = {
  inbound: {
    tr: 'Klinigi aradığında karşılayan resepsiyonist',
    en: 'Receptionist answering your call',
  },
  follow_up: {
    tr: 'İlgilendiğin hizmet için seni arayan asistan',
    en: 'Agent following up on your interest',
  },
  appointment_reminder: {
    tr: 'Randevundan önce seni arayan hatırlatma asistanı',
    en: 'Agent reminding you of your appointment',
  },
};

const STATUS_LABELS: Record<CallState, Record<Lang, string>> = {
  idle:       { tr: 'Hazır',           en: 'Ready'         },
  connecting: { tr: 'Bağlanıyor...',   en: 'Connecting...' },
  ringing:    { tr: 'Çalıyor...',      en: 'Ringing...'    },
  connected:  { tr: 'Bağlandı',        en: 'Connected'     },
  ended:      { tr: 'Görüşme bitti',   en: 'Call ended'    },
  error:      { tr: 'Hata oluştu',     en: 'Error occurred'},
};

export default function VoiceDemoPage() {
  const [lang, setLang]         = useState<Lang>('tr');
  const [scenario, setScenario] = useState<Scenario>('inbound');
  const [callState, setCallState] = useState<CallState>('idle');
  const [error, setError]       = useState('');
  const [duration, setDuration] = useState(0);

  const roomRef       = useRef<Room | null>(null);
  const audioElRef    = useRef<HTMLAudioElement | null>(null);
  const timerRef      = useRef<ReturnType<typeof setInterval> | null>(null);

  // Konuşma süresi sayacı
  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (callState !== 'connecting' && callState !== 'ringing') setDuration(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [callState]);

  async function startCall() {
    setError('');
    setCallState('connecting');

    try {
      // Token al + room oluştur + agent dispatch
      const res = await fetch('/api/demo/voice-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, lang, patient_name: 'Demo Kullanıcı' }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Token alınamadı');
      }
      const { token, ws_url } = await res.json();

      setCallState('ringing');

      // LiveKit room'a bağlan
      const room = new Room({
        audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true },
        adaptiveStream: true,
        dynacast: true,
      });
      roomRef.current = room;

      room.on(RoomEvent.ParticipantConnected, () => {
        setCallState('connected');
      });

      room.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === Track.Kind.Audio) {
          const audioEl = track.attach();
          audioEl.autoplay = true;
          document.body.appendChild(audioEl);
          audioElRef.current = audioEl;
        }
      });

      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        track.detach();
      });

      room.on(RoomEvent.Disconnected, () => {
        setCallState('ended');
        cleanup();
      });

      await room.connect(ws_url, token);
      await room.localParticipant.setMicrophoneEnabled(true);

      // Agent henüz bağlanmadıysa ringing state'de bekle
      if (room.remoteParticipants.size > 0) {
        setCallState('connected');
      }

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Bağlantı hatası';
      setError(msg);
      setCallState('error');
    }
  }

  function cleanup() {
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.remove();
      audioElRef.current = null;
    }
  }

  async function endCall() {
    if (roomRef.current) {
      await roomRef.current.disconnect();
      roomRef.current = null;
    }
    cleanup();
    setCallState('ended');
  }

  function reset() {
    setCallState('idle');
    setError('');
  }

  const isActive = callState === 'connecting' || callState === 'ringing' || callState === 'connected';

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;

  return (
    <div
      className="min-h-screen bg-demo-bg text-demo-text flex flex-col"
      style={{
        backgroundImage: 'radial-gradient(circle, #1a2878 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }}
    >
      {/* Ambient glow */}
      <div className="fixed top-1/4 left-1/3 w-96 h-96 rounded-full bg-demo-blue opacity-[0.04] blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-demo-cyan opacity-[0.04] blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="border-b border-demo-border bg-demo-bg/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/demo" className="flex items-center gap-2 hover:opacity-80 transition">
              <div className="w-7 h-7 rounded-lg bg-demo-blue flex items-center justify-center shadow-[0_0_14px_rgba(35,61,255,0.5)]">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-base font-bold text-demo-text tracking-tight">stoaix</span>
            </a>
            <span className="text-demo-muted">/</span>
            <span className="text-sm text-demo-muted">
              {lang === 'tr' ? 'Sesli Demo' : 'Voice Demo'}
            </span>
          </div>
          <button
            onClick={() => setLang(l => l === 'tr' ? 'en' : 'tr')}
            className="text-xs border border-demo-border rounded-lg px-2.5 py-1.5 text-demo-muted hover:text-demo-text hover:border-demo-cyan transition font-medium"
          >
            {lang === 'tr' ? 'EN' : 'TR'}
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* Title */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 border border-demo-border rounded-full px-3 py-1.5 mb-4 bg-demo-card">
              <span className="w-1.5 h-1.5 rounded-full bg-demo-cyan animate-pulse" />
              <span className="text-[10px] text-demo-muted uppercase tracking-widest">
                {lang === 'tr' ? 'LiveKit · Deepgram · Cartesia' : 'LiveKit · Deepgram · Cartesia'}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-demo-text mb-2">
              {lang === 'tr' ? 'AI Sesli Asistan' : 'AI Voice Assistant'}
            </h1>
            <p className="text-sm text-demo-muted">
              {lang === 'tr'
                ? 'Gerçek sesli AI deneyimi — mikrofon üzerinden konuş'
                : 'Real voice AI experience — speak through your microphone'}
            </p>
          </div>

          {/* Card */}
          <div
            className="rounded-2xl border border-demo-border bg-demo-card/50 p-7"
            style={{ boxShadow: '0 0 50px rgba(35,61,255,0.1)' }}
          >

            {/* Senaryo seçici */}
            {!isActive && callState !== 'ended' && (
              <div className="mb-6">
                <label className="block text-xs font-medium text-demo-muted uppercase tracking-wide mb-3">
                  {lang === 'tr' ? 'Senaryo' : 'Scenario'}
                </label>
                <div className="flex flex-col gap-2">
                  {(['inbound', 'follow_up', 'appointment_reminder'] as Scenario[]).map(s => (
                    <button
                      key={s}
                      onClick={() => setScenario(s)}
                      className={`w-full py-2.5 px-4 rounded-xl text-left border transition ${
                        scenario === s
                          ? 'border-demo-cyan bg-demo-cyan/10'
                          : 'border-demo-border hover:border-demo-cyan/50'
                      }`}
                    >
                      <span className={`block text-xs font-semibold mb-0.5 ${scenario === s ? 'text-demo-cyan' : 'text-demo-text'}`}>
                        {SCENARIO_LABELS[s][lang]}
                      </span>
                      <span className="block text-[11px] text-demo-muted">
                        {SCENARIO_DESC[s][lang]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Durum göstergesi */}
            <div className="flex flex-col items-center py-8">

              {/* Avatar / animasyon */}
              <div
                className={`relative w-24 h-24 rounded-full flex items-center justify-center mb-5 transition-all ${
                  callState === 'connected'
                    ? 'bg-demo-blue/20 shadow-[0_0_60px_rgba(35,61,255,0.35)]'
                    : callState === 'ringing'
                    ? 'bg-demo-cyan/10 shadow-[0_0_40px_rgba(0,229,255,0.2)]'
                    : 'bg-demo-card border border-demo-border'
                }`}
              >
                {/* Pulse ring — sadece active durumda */}
                {(callState === 'connected' || callState === 'ringing') && (
                  <span className="absolute inset-0 rounded-full animate-ping bg-demo-blue/20" />
                )}
                <svg
                  className={`w-10 h-10 ${
                    callState === 'connected' ? 'text-demo-cyan' :
                    callState === 'ringing'   ? 'text-demo-cyan/70' :
                    callState === 'ended'     ? 'text-demo-muted' :
                    callState === 'error'     ? 'text-red-400' :
                    'text-demo-muted'
                  }`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              </div>

              {/* Süre */}
              {callState === 'connected' && (
                <p className="text-2xl font-mono font-bold text-demo-cyan mb-2 tabular-nums">
                  {fmt(duration)}
                </p>
              )}

              {/* Status text */}
              <p className={`text-sm font-medium mb-1 ${
                callState === 'error' ? 'text-red-400' :
                callState === 'connected' ? 'text-demo-cyan' :
                'text-demo-muted'
              }`}>
                {STATUS_LABELS[callState][lang]}
              </p>

              {/* Senaryo badge — connected durumda */}
              {callState === 'connected' && (
                <span className="text-[10px] border border-demo-border text-demo-muted rounded-full px-2 py-0.5 uppercase tracking-widest">
                  {SCENARIO_LABELS[scenario][lang]}
                </span>
              )}

              {/* Hata mesajı */}
              {error && (
                <p className="mt-3 text-xs text-red-400 bg-red-950/50 border border-red-800 rounded-lg px-3 py-2 text-center max-w-xs">
                  {error}
                </p>
              )}
            </div>

            {/* Butonlar */}
            <div className="flex flex-col gap-3">
              {callState === 'idle' && (
                <button
                  onClick={startCall}
                  className="w-full rounded-xl bg-demo-blue hover:opacity-90 text-white py-3 text-sm font-semibold transition shadow-[0_0_20px_rgba(35,61,255,0.4)]"
                >
                  {lang === 'tr' ? 'Aramayı Başlat' : 'Start Call'}
                </button>
              )}

              {(callState === 'connecting' || callState === 'ringing') && (
                <button
                  onClick={endCall}
                  className="w-full rounded-xl bg-red-600/80 hover:bg-red-600 text-white py-3 text-sm font-semibold transition"
                >
                  {lang === 'tr' ? 'İptal' : 'Cancel'}
                </button>
              )}

              {callState === 'connected' && (
                <button
                  onClick={endCall}
                  className="w-full rounded-xl bg-red-600 hover:bg-red-700 text-white py-3 text-sm font-semibold transition shadow-[0_0_20px_rgba(220,38,38,0.3)]"
                >
                  {lang === 'tr' ? 'Görüşmeyi Kapat' : 'End Call'}
                </button>
              )}

              {(callState === 'ended' || callState === 'error') && (
                <button
                  onClick={reset}
                  className="w-full rounded-xl border border-demo-border text-demo-muted hover:text-demo-text hover:border-demo-cyan py-3 text-sm font-semibold transition"
                >
                  {lang === 'tr' ? 'Yeni Arama' : 'New Call'}
                </button>
              )}
            </div>
          </div>

          {/* Bilgi */}
          <p className="text-center text-[11px] text-demo-muted mt-6">
            {lang === 'tr'
              ? 'Mikrofon izni gereklidir · Gerçek AI asistan · demo.stoaix.com'
              : 'Microphone permission required · Real AI agent · demo.stoaix.com'}
          </p>
        </div>
      </main>
    </div>
  );
}
