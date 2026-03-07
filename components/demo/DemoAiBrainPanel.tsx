'use client';

import type { Stage, CollectedData, LeadSignals } from '@/lib/demo/claude-demo';
import type { Lang } from '@/lib/i18n/messages';

interface Props {
  stage: Stage;
  score: number;
  scoreBreakdown: Record<string, number>;
  collectedData: CollectedData;
  leadSignals: LeadSignals;
  handoffRecommended: boolean;
  replyGuidance: string;
  lang: Lang;
}

// ── Stage pipeline config ──────────────────────────────────────────────────
const PIPELINE: { key: Stage; tr: string; en: string }[] = [
  { key: 'GREETING',         tr: 'Karşılama', en: 'Greeting'   },
  { key: 'DISCOVERY',        tr: 'Keşif',     en: 'Discovery'  },
  { key: 'TRUST_BUILDING',   tr: 'Güven',     en: 'Trust'      },
  { key: 'INFO_COLLECTION',  tr: 'Bilgi',     en: 'Info'       },
  { key: 'CLOSING',          tr: 'Kapanış',   en: 'Closing'    },
];

function stageIndex(s: Stage) {
  const i = PIPELINE.findIndex(p => p.key === s);
  return i === -1 ? 0 : i;
}

// ── Score arc (SVG semicircle) ─────────────────────────────────────────────
function ScoreArc({ score }: { score: number }) {
  const r = 56;
  const total = Math.PI * r; // ≈ 175.9
  const filled = (score / 100) * total;
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#42c2d5';
  const glow = score >= 70 ? 'rgba(34,197,94,0.6)' : score >= 40 ? 'rgba(245,158,11,0.6)' : 'rgba(66,194,213,0.6)';

  return (
    <svg width="148" height="84" viewBox="0 0 148 84" className="overflow-visible">
      {/* Background arc */}
      <path
        d="M 18 74 A 56 56 0 0 1 130 74"
        fill="none"
        stroke="#1a2878"
        strokeWidth="10"
        strokeLinecap="round"
      />
      {/* Foreground arc */}
      <path
        d="M 18 74 A 56 56 0 0 1 130 74"
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${total}`}
        style={{
          transition: 'stroke-dasharray 0.6s ease, stroke 0.6s ease',
          filter: `drop-shadow(0 0 6px ${glow})`,
        }}
      />
      {/* Score number */}
      <text x="74" y="68" textAnchor="middle" fill="#f4f6fc" fontSize="28" fontWeight="bold" fontFamily="system-ui">
        {score}
      </text>
      {/* /100 label */}
      <text x="74" y="82" textAnchor="middle" fill="#5a72b0" fontSize="10" fontFamily="system-ui">
        / 100
      </text>
    </svg>
  );
}

// ── Signal badge helper ────────────────────────────────────────────────────
function SignalBadge({ value }: { value: string }) {
  const map: Record<string, string> = {
    unknown:      'border-demo-border text-demo-muted',
    low:          'border-demo-border text-demo-muted',
    medium:       'border-amber-700 text-amber-400',
    high:         'border-red-700 text-red-400',
    just_browsing:'border-demo-border text-demo-muted',
    considering:  'border-demo-blue text-blue-400',
    ready:        'border-green-700 text-green-400',
    not_asked:    'border-demo-border text-demo-muted',
    fiyat_sordu:  'border-amber-700 text-amber-400',
    taksit_sordu: 'border-amber-700 text-amber-400',
    butce_belirti:'border-green-700 text-green-400',
  };
  return (
    <span className={`text-xs border rounded px-2 py-0.5 font-mono ${map[value] || 'border-demo-border text-demo-muted'}`}>
      {value}
    </span>
  );
}

export default function DemoAiBrainPanel({
  stage,
  score,
  scoreBreakdown,
  collectedData,
  leadSignals,
  handoffRecommended,
  replyGuidance,
  lang,
}: Props) {
  const isEN = lang === 'en';
  const stageIdx = stageIndex(stage);

  const dataFields: { key: keyof CollectedData; label: string }[] = [
    { key: 'name',              label: isEN ? 'Name'           : 'İsim'       },
    { key: 'interested_service',label: isEN ? 'Service'        : 'Hizmet'     },
    { key: 'pain_point',        label: isEN ? 'Pain Point'     : 'Şikayet'    },
    { key: 'timeline',          label: isEN ? 'Timeline'       : 'Zaman'      },
    { key: 'budget_awareness',  label: isEN ? 'Budget'         : 'Bütçe'      },
    { key: 'preferred_day_time',label: isEN ? 'Appointment'    : 'Randevu'    },
    { key: 'referral_source',   label: isEN ? 'Source'         : 'Kaynak'     },
  ];

  const filledFields = dataFields.filter(({ key }) => {
    const v = collectedData[key];
    return v !== null && v !== undefined && v !== 'not_asked';
  });

  return (
    <div className="flex flex-col gap-4">

      {/* Panel header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-demo-blue flex items-center justify-center shadow-[0_0_10px_rgba(35,61,255,0.5)]">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
            </svg>
          </div>
          <span className="text-xs font-bold text-demo-text uppercase tracking-widest">
            {isEN ? 'Neural Analysis' : 'Neural Analiz'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-demo-cyan animate-pulse_dot" />
          <span className="text-[10px] text-demo-muted uppercase tracking-widest">
            {isEN ? 'live' : 'canlı'}
          </span>
        </div>
      </div>

      {/* Handoff alert */}
      {handoffRecommended && (
        <div
          className="rounded-xl border border-green-700 bg-green-950/60 px-4 py-3"
          style={{ boxShadow: '0 0 20px rgba(34,197,94,0.15)' }}
        >
          <p className="text-sm font-bold text-green-400 tracking-wide">
            {isEN ? '⚡ HANDOFF RECOMMENDED' : '⚡ DEVİR ÖNERİLİYOR'}
          </p>
          <p className="text-xs text-green-600 mt-0.5">
            {isEN ? 'Patient is ready — transfer to sales team.' : 'Hasta hazır — satış ekibine devret.'}
          </p>
        </div>
      )}

      {/* Score arc */}
      <div
        className="rounded-xl border border-demo-border bg-demo-card p-4 flex flex-col items-center"
        style={{ boxShadow: '0 0 24px rgba(35,61,255,0.06)' }}
      >
        <p className="text-[10px] font-medium text-demo-muted uppercase tracking-widest mb-2">
          {isEN ? 'Lead Score' : 'Lead Skoru'}
        </p>
        <ScoreArc score={score} />
        {Object.keys(scoreBreakdown).length > 0 && (
          <div className="mt-2 flex flex-wrap justify-center gap-1">
            {Object.entries(scoreBreakdown).map(([k, v]) => (
              <span key={k} className="text-[9px] border border-demo-border text-demo-muted rounded px-1.5 py-0.5 font-mono">
                {v > 0 ? '+' : ''}{v} {k}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Stage pipeline */}
      <div
        className="rounded-xl border border-demo-border bg-demo-card p-4"
        style={{ boxShadow: '0 0 24px rgba(35,61,255,0.06)' }}
      >
        <p className="text-[10px] font-medium text-demo-muted uppercase tracking-widest mb-4">
          {isEN ? 'Conversation Pipeline' : 'Konuşma Akışı'}
        </p>
        <div className="flex items-center justify-between">
          {PIPELINE.map((p, i) => {
            const isPast    = i < stageIdx;
            const isCurrent = i === stageIdx;
            const isFuture  = i > stageIdx;
            return (
              <div key={p.key} className="flex items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`rounded-full transition-all duration-500 ${
                      isCurrent
                        ? 'w-3.5 h-3.5 bg-demo-cyan'
                        : isPast
                        ? 'w-2.5 h-2.5 bg-demo-cyan opacity-50'
                        : 'w-2.5 h-2.5 bg-demo-border'
                    }`}
                    style={isCurrent ? { boxShadow: '0 0 10px #42c2d5, 0 0 20px rgba(66,194,213,0.4)' } : {}}
                  />
                  <span className={`text-[9px] font-medium text-center w-12 leading-tight ${
                    isCurrent ? 'text-demo-cyan' : isPast ? 'text-demo-muted' : 'text-demo-border'
                  }`}>
                    {p[lang]}
                  </span>
                </div>
                {i < PIPELINE.length - 1 && (
                  <div className={`h-px w-4 mb-4 mx-0.5 transition-all duration-500 ${
                    i < stageIdx ? 'bg-demo-cyan opacity-50' : 'bg-demo-border'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Lead signals */}
      <div
        className="rounded-xl border border-demo-border bg-demo-card p-4"
        style={{ boxShadow: '0 0 24px rgba(35,61,255,0.06)' }}
      >
        <p className="text-[10px] font-medium text-demo-muted uppercase tracking-widest mb-3">
          {isEN ? 'Lead Signals' : 'Lead Sinyalleri'}
        </p>
        <div className="space-y-2.5">
          {[
            { label: isEN ? 'Urgency'       : 'Aciliyet',          value: leadSignals.urgency          },
            { label: isEN ? 'Engagement'    : 'Etkileşim',         value: leadSignals.engagement_level },
            { label: isEN ? 'Buying Intent' : 'Satın Alma Niyeti', value: leadSignals.buying_intent    },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-xs text-demo-muted">{label}</span>
              <SignalBadge value={value} />
            </div>
          ))}
        </div>
      </div>

      {/* Collected data */}
      {filledFields.length > 0 && (
        <div
          className="rounded-xl border border-demo-border bg-demo-card p-4"
          style={{ boxShadow: '0 0 24px rgba(35,61,255,0.06)' }}
        >
          <p className="text-[10px] font-medium text-demo-muted uppercase tracking-widest mb-3">
            {isEN ? 'Collected Data' : 'Toplanan Veriler'}
          </p>
          <div className="space-y-2.5">
            {filledFields.map(({ key, label }) => (
              <div key={key} className="flex items-start justify-between gap-2">
                <span className="text-[10px] text-demo-muted uppercase tracking-wide shrink-0">{label}</span>
                <span className="text-xs text-demo-text font-medium text-right truncate max-w-[60%]">
                  {String(collectedData[key])}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reply guidance */}
      {replyGuidance && (
        <div className="rounded-xl border border-demo-border bg-demo-card/50 p-3">
          <p className="text-[10px] text-demo-muted uppercase tracking-widest mb-1">
            {isEN ? 'Guidance' : 'Yönlendirme'}
          </p>
          <p className="text-xs text-demo-muted italic leading-relaxed">{replyGuidance}</p>
        </div>
      )}

    </div>
  );
}
