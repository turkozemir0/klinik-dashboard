'use client';

import { useEffect, useRef, useState } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';

type Scenario  = 'inbound' | 'follow_up' | 'appointment_reminder';
type Lang      = 'en' | 'de' | 'ar';
type CallState = 'idle' | 'connecting' | 'ringing' | 'connected' | 'ended' | 'error';
type Step      = 'lang' | 'main';

interface CallSummary {
  ready: boolean;
  duration?: number;
  name?: string | null;
  phone?: string | null;
  interested_service?: string | null;
  lead_score?: number | null;
  lead_score_reason?: string | null;
  buying_signals?: string[];
  objections?: string[];
  next_step?: string | null;
  sales_action?: string | null;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

const LANG_META: Record<Lang, { flag: string; label: string; sublabel: string }> = {
  en: { flag: '🇬🇧', label: 'English',  sublabel: 'English' },
  de: { flag: '🇩🇪', label: 'Deutsch',  sublabel: 'German'  },
  ar: { flag: '🇸🇦', label: 'العربية', sublabel: 'Arabic'  },
};

const SCENARIO_LABELS: Record<Scenario, Record<Lang, string>> = {
  inbound:              { en: 'Receptionist',        de: 'Empfang',              ar: 'الاستقبال'     },
  follow_up:            { en: 'Follow-up Call',       de: 'Nachverfolgungsanruf', ar: 'متابعة'        },
  appointment_reminder: { en: 'Appointment Reminder', de: 'Terminerinnerung',     ar: 'تذكير بالموعد' },
};

const SCENARIO_DESC: Record<Scenario, Record<Lang, string>> = {
  inbound:              { en: 'Receptionist answering your call',        de: 'Rezeptionist beantwortet Ihren Anruf',  ar: 'موظف الاستقبال يرد على مكالمتك'  },
  follow_up:            { en: 'Agent following up on your interest',     de: 'Agent verfolgt Ihr Interesse nach',     ar: 'مساعد يتابع اهتمامك'              },
  appointment_reminder: { en: 'Agent reminding you of your appointment', de: 'Agent erinnert Sie an Ihren Termin',   ar: 'مساعد يذكرك بموعدك'               },
};

const STATUS_LABELS: Record<CallState, Record<Lang, string>> = {
  idle:       { en: 'Ready',           de: 'Bereit',              ar: 'جاهز'            },
  connecting: { en: 'Connecting...',   de: 'Verbinde...',         ar: 'جاري الاتصال...' },
  ringing:    { en: 'Ringing...',      de: 'Klingelt...',         ar: 'يرن...'           },
  connected:  { en: 'Connected',       de: 'Verbunden',           ar: 'متصل'             },
  ended:      { en: 'Call ended',      de: 'Anruf beendet',       ar: 'انتهت المكالمة'   },
  error:      { en: 'Error occurred',  de: 'Fehler aufgetreten',  ar: 'حدث خطأ'          },
};

function SummaryRow({
  icon, label, value, highlight = false,
}: {
  icon: string; label: string; value: string; highlight?: boolean;
}) {
  return (
    <div className={`rounded-lg border px-3 py-2 flex items-start gap-2 ${
      highlight ? 'border-demo-cyan/40 bg-demo-cyan/5' : 'border-demo-border bg-demo-bg/60'
    }`}>
      <span className="text-sm mt-0.5">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] text-demo-muted">{label}</p>
        <p className={`text-xs font-medium mt-0.5 ${highlight ? 'text-demo-cyan' : 'text-demo-text'}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

export default function VoiceDemoPage() {
  const [step, setStep]           = useState<Step>('lang');
  const [lang, setLang]           = useState<Lang>('en');
  const [scenario, setScenario]   = useState<Scenario>('inbound');
  const [callState, setCallState] = useState<CallState>('idle');
  const [error, setError]         = useState('');
  const [duration, setDuration]   = useState(0);
  const [summary, setSummary]     = useState<CallSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const roomRef       = useRef<Room | null>(null);
  const audioElRef    = useRef<HTMLAudioElement | null>(null);
  const timerRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptRef = useRef<{ role: string; content: string }[]>([]);

  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (callState !== 'connecting' && callState !== 'ringing') setDuration(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [callState]);

  function selectLang(l: Lang) {
    setLang(l);
    setStep('main');
  }

  async function startCall() {
    setError('');
    setCallState('connecting');
    try {
      const res = await fetch('/api/demo/voice-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario,
          lang,
          patient_name: 'Demo User',
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to get token');
      }
      const { token, ws_url } = await res.json();
      setCallState('ringing');

      const room = new Room({
        audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true },
        adaptiveStream: true,
        dynacast: true,
      });
      roomRef.current = room;

      transcriptRef.current = [];

      room.on(RoomEvent.ParticipantConnected, () => setCallState('connected'));

      room.on(RoomEvent.DataReceived, (payload) => {
        try {
          const msg = JSON.parse(new TextDecoder().decode(payload));
          if (msg.type === 'transcript_item' && msg.role && msg.content) {
            transcriptRef.current.push({ role: msg.role, content: msg.content });
          }
        } catch { /* ignore malformed messages */ }
      });

      room.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === Track.Kind.Audio) {
          const audioEl = track.attach();
          audioEl.autoplay = true;
          document.body.appendChild(audioEl);
          audioElRef.current = audioEl;
        }
      });

      room.on(RoomEvent.TrackUnsubscribed, (track) => track.detach());

      room.on(RoomEvent.Disconnected, () => {
        setCallState('ended');
        cleanup();
      });

      await room.connect(ws_url, token);
      await room.localParticipant.setMicrophoneEnabled(true);
      if (room.remoteParticipants.size > 0) setCallState('connected');

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection error';
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

  async function fetchSummary(transcript: { role: string; content: string }[], callLang: Lang) {
    if (transcript.length < 2) return;
    setSummaryLoading(true);
    setSummary(null);
    try {
      const res = await fetch('/api/demo/call-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, lang: callLang }),
      });
      const data: CallSummary = await res.json();
      setSummary(data.ready ? data : null);
    } catch {
      setSummary(null);
    }
    setSummaryLoading(false);
  }

  async function endCall() {
    if (roomRef.current) {
      await roomRef.current.disconnect();
      roomRef.current = null;
    }
    cleanup();
    setCallState('ended');
    fetchSummary(transcriptRef.current, lang);
  }

  function reset() {
    setCallState('idle');
    setError('');
    setSummary(null);
    setSummaryLoading(false);
  }

  const isActive = callState === 'connecting' || callState === 'ringing' || callState === 'connected';
  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const m = LANG_META[lang];

  return (
    <div
      className="min-h-screen bg-demo-bg text-demo-text flex flex-col"
      style={{
        backgroundImage: 'radial-gradient(circle, #1a2878 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }}
    >
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
            <span className="text-sm text-demo-muted">Voice Demo</span>
          </div>
          {step === 'main' && (
            <button
              onClick={() => { setStep('lang'); setCallState('idle'); setError(''); setSummary(null); }}
              className="text-xs border border-demo-border rounded-lg px-2.5 py-1.5 text-demo-muted hover:text-demo-text hover:border-demo-cyan transition font-medium flex items-center gap-1.5"
            >
              <span>{m.flag}</span>
              <span>{lang.toUpperCase()}</span>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* ── STEP 1: Language Selection ── */}
          {step === 'lang' && (
            <>
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 border border-demo-border rounded-full px-3 py-1.5 mb-4 bg-demo-card">
                  <span className="w-1.5 h-1.5 rounded-full bg-demo-cyan animate-pulse" />
                  <span className="text-[10px] text-demo-muted uppercase tracking-widest">
                    LiveKit · Deepgram · Cartesia
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-demo-text mb-2">AI Voice Assistant</h1>
                <p className="text-sm text-demo-muted">
                  Select a language to begin your demo
                </p>
              </div>

              <div
                className="rounded-2xl border border-demo-border bg-demo-card/50 p-7"
                style={{ boxShadow: '0 0 50px rgba(35,61,255,0.1)' }}
              >
                <label className="block text-xs font-medium text-demo-muted uppercase tracking-wide mb-4 text-center">
                  Select Language
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['en', 'de', 'ar'] as Lang[]).map(l => {
                    const lm = LANG_META[l];
                    return (
                      <button
                        key={l}
                        onClick={() => selectLang(l)}
                        className="group flex flex-col items-center gap-3 py-6 px-3 rounded-xl border border-demo-border hover:border-demo-cyan hover:bg-demo-cyan/5 transition-all"
                        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 24px rgba(0,229,255,0.15)')}
                        onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                      >
                        <span className="text-3xl">{lm.flag}</span>
                        <div className="text-center">
                          <p className="text-sm font-bold text-demo-text group-hover:text-demo-cyan transition-colors">
                            {lm.label}
                          </p>
                          <p className="text-[10px] text-demo-muted mt-0.5">
                            {lm.sublabel}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <p className="text-center text-[11px] text-demo-muted mt-6">
                Microphone permission required · demo.stoaix.com
              </p>
            </>
          )}

          {/* ── STEP 2: Scenario + Call ── */}
          {step === 'main' && (
            <>
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 border border-demo-border rounded-full px-3 py-1.5 mb-4 bg-demo-card">
                  <span className="w-1.5 h-1.5 rounded-full bg-demo-cyan animate-pulse" />
                  <span className="text-[10px] text-demo-muted uppercase tracking-widest">
                    LiveKit · Deepgram · Cartesia
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-demo-text mb-2">AI Voice Assistant</h1>
                <p className="text-sm text-demo-muted">
                  Real voice AI experience — speak through your microphone
                </p>
              </div>

              <div
                className="rounded-2xl border border-demo-border bg-demo-card/50 p-7"
                style={{ boxShadow: '0 0 50px rgba(35,61,255,0.1)' }}
              >
                {/* Scenario selector */}
                {!isActive && callState !== 'ended' && (
                  <div className="mb-6">
                    <label className="block text-xs font-medium text-demo-muted uppercase tracking-wide mb-3">
                      Scenario
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

                {/* Status indicator */}
                <div className="flex flex-col items-center py-8">
                  <div
                    className={`relative w-24 h-24 rounded-full flex items-center justify-center mb-5 transition-all ${
                      callState === 'connected'
                        ? 'bg-demo-blue/20 shadow-[0_0_60px_rgba(35,61,255,0.35)]'
                        : callState === 'ringing'
                        ? 'bg-demo-cyan/10 shadow-[0_0_40px_rgba(0,229,255,0.2)]'
                        : 'bg-demo-card border border-demo-border'
                    }`}
                  >
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

                  {callState === 'connected' && (
                    <p className="text-2xl font-mono font-bold text-demo-cyan mb-2 tabular-nums">
                      {fmt(duration)}
                    </p>
                  )}

                  <p className={`text-sm font-medium mb-1 ${
                    callState === 'error'     ? 'text-red-400' :
                    callState === 'connected' ? 'text-demo-cyan' :
                    'text-demo-muted'
                  }`}>
                    {STATUS_LABELS[callState][lang]}
                  </p>

                  {callState === 'connected' && (
                    <span className="text-[10px] border border-demo-border text-demo-muted rounded-full px-2 py-0.5 uppercase tracking-widest">
                      {SCENARIO_LABELS[scenario][lang]}
                    </span>
                  )}

                  {error && (
                    <p className="mt-3 text-xs text-red-400 bg-red-950/50 border border-red-800 rounded-lg px-3 py-2 text-center max-w-xs">
                      {error}
                    </p>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex flex-col gap-3">
                  {callState === 'idle' && (
                    <button
                      onClick={startCall}
                      className="w-full rounded-xl bg-demo-blue hover:opacity-90 text-white py-3 text-sm font-semibold transition shadow-[0_0_20px_rgba(35,61,255,0.4)]"
                    >
                      Start Call
                    </button>
                  )}
                  {(callState === 'connecting' || callState === 'ringing') && (
                    <button
                      onClick={endCall}
                      className="w-full rounded-xl bg-red-600/80 hover:bg-red-600 text-white py-3 text-sm font-semibold transition"
                    >
                      Cancel
                    </button>
                  )}
                  {callState === 'connected' && (
                    <button
                      onClick={endCall}
                      className="w-full rounded-xl bg-red-600 hover:bg-red-700 text-white py-3 text-sm font-semibold transition shadow-[0_0_20px_rgba(220,38,38,0.3)]"
                    >
                      End Call
                    </button>
                  )}
                  {(callState === 'ended' || callState === 'error') && (
                    <button
                      onClick={reset}
                      className="w-full rounded-xl border border-demo-border text-demo-muted hover:text-demo-text hover:border-demo-cyan py-3 text-sm font-semibold transition"
                    >
                      New Call
                    </button>
                  )}
                </div>

                {/* ── Call Summary ── */}
                {callState === 'ended' && (
                  <div className="mt-6 border-t border-demo-border pt-6">
                    {summaryLoading && (
                      <div className="flex items-center justify-center gap-2 text-demo-muted text-xs py-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-demo-cyan animate-pulse" />
                        <span className="w-1.5 h-1.5 rounded-full bg-demo-cyan animate-pulse" style={{ animationDelay: '0.2s' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-demo-cyan animate-pulse" style={{ animationDelay: '0.4s' }} />
                        <span className="ml-1">Preparing summary...</span>
                      </div>
                    )}

                    {!summaryLoading && summary?.ready && (
                      <div>
                        <p className="text-[10px] text-demo-muted uppercase tracking-widest mb-3 flex items-center gap-2">
                          <svg className="w-3 h-3 text-demo-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          Call Summary
                          {summary.duration != null && (
                            <span className="ml-auto font-mono">
                              {fmt(summary.duration)}
                            </span>
                          )}
                        </p>

                        <div className="space-y-2">

                          {/* Lead Score */}
                          {summary.lead_score != null && (
                            <div className="rounded-lg border border-demo-border bg-demo-bg/60 px-3 py-2.5">
                              <div className="flex items-center justify-between mb-1.5">
                                <p className="text-[10px] text-demo-muted">🎯 Lead Score</p>
                                <span className={`text-sm font-bold ${
                                  summary.lead_score >= 7 ? 'text-emerald-400' :
                                  summary.lead_score >= 4 ? 'text-yellow-400' :
                                  'text-red-400'
                                }`}>{summary.lead_score}/10</span>
                              </div>
                              <div className="w-full bg-demo-border rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full transition-all ${
                                    summary.lead_score >= 7 ? 'bg-emerald-400' :
                                    summary.lead_score >= 4 ? 'bg-yellow-400' :
                                    'bg-red-400'
                                  }`}
                                  style={{ width: `${summary.lead_score * 10}%` }}
                                />
                              </div>
                              {summary.lead_score_reason && (
                                <p className="text-[10px] text-demo-muted mt-1.5">{summary.lead_score_reason}</p>
                              )}
                            </div>
                          )}

                          {/* Sales Action */}
                          {summary.sales_action && (
                            <div className="rounded-lg border border-demo-cyan/40 bg-demo-cyan/5 px-3 py-2.5">
                              <p className="text-[10px] text-demo-muted mb-0.5">⚡ Sales Action</p>
                              <p className="text-xs font-medium text-demo-cyan">{summary.sales_action}</p>
                            </div>
                          )}

                          {/* Contact Info */}
                          {summary.name && (
                            <SummaryRow icon="👤" label="Name" value={summary.name} />
                          )}
                          {summary.phone && (
                            <SummaryRow icon="📞" label="Phone" value={summary.phone} />
                          )}
                          {summary.interested_service && (
                            <SummaryRow icon="💼" label="Service Interest" value={summary.interested_service} />
                          )}

                          {/* Buying Signals */}
                          {summary.buying_signals && summary.buying_signals.length > 0 && (
                            <div className="rounded-lg bg-demo-bg/60 border border-emerald-800/40 px-3 py-2.5">
                              <p className="text-[10px] text-demo-muted mb-1.5">✅ Buying Signals</p>
                              <ul className="space-y-1">
                                {summary.buying_signals.map((s, i) => (
                                  <li key={i} className="text-xs text-demo-text flex gap-1.5">
                                    <span className="text-emerald-400 mt-0.5">·</span>
                                    <span>{s}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Objections */}
                          {summary.objections && summary.objections.length > 0 && (
                            <div className="rounded-lg bg-demo-bg/60 border border-red-800/40 px-3 py-2.5">
                              <p className="text-[10px] text-demo-muted mb-1.5">⚠️ Objections</p>
                              <ul className="space-y-1">
                                {summary.objections.map((o, i) => (
                                  <li key={i} className="text-xs text-demo-text flex gap-1.5">
                                    <span className="text-red-400 mt-0.5">·</span>
                                    <span>{o}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Next Step + Sentiment */}
                          {summary.next_step && (
                            <SummaryRow icon="📅" label="Next Step" value={summary.next_step} highlight />
                          )}
                          {summary.sentiment && (
                            <div className="flex justify-end">
                              <span className={`text-[10px] rounded-full px-2 py-0.5 border ${
                                summary.sentiment === 'positive'
                                  ? 'text-emerald-400 border-emerald-800 bg-emerald-950/40'
                                  : summary.sentiment === 'negative'
                                  ? 'text-red-400 border-red-800 bg-red-950/40'
                                  : 'text-demo-muted border-demo-border'
                              }`}>
                                {summary.sentiment === 'positive' ? 'Positive'
                                  : summary.sentiment === 'negative' ? 'Negative'
                                  : 'Neutral'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <p className="text-center text-[11px] text-demo-muted mt-6">
                Microphone permission required · Real AI agent · demo.stoaix.com
              </p>
            </>
          )}

        </div>
      </main>
    </div>
  );
}
