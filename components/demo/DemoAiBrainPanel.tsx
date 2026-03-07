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

const stageColors: Record<Stage, string> = {
  GREETING: 'bg-slate-100 text-slate-600',
  DISCOVERY: 'bg-blue-100 text-blue-700',
  TRUST_BUILDING: 'bg-purple-100 text-purple-700',
  APPOINTMENT_OFFER: 'bg-amber-100 text-amber-700',
  INFO_COLLECTION: 'bg-cyan-100 text-cyan-700',
  CLOSING: 'bg-green-100 text-green-700',
  NURTURING: 'bg-rose-100 text-rose-700',
};

const stageLabels: Record<Stage, { tr: string; en: string }> = {
  GREETING: { tr: 'Karşılama', en: 'Greeting' },
  DISCOVERY: { tr: 'Keşif', en: 'Discovery' },
  TRUST_BUILDING: { tr: 'Güven İnşası', en: 'Trust Building' },
  APPOINTMENT_OFFER: { tr: 'Randevu Teklifi', en: 'Appointment Offer' },
  INFO_COLLECTION: { tr: 'Bilgi Toplama', en: 'Info Collection' },
  CLOSING: { tr: 'Kapanış', en: 'Closing' },
  NURTURING: { tr: 'Nurturing', en: 'Nurturing' },
};

const signalBadge: Record<string, string> = {
  unknown: 'bg-slate-100 text-slate-500',
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
  just_browsing: 'bg-slate-100 text-slate-500',
  considering: 'bg-blue-100 text-blue-700',
  ready: 'bg-green-100 text-green-700',
};

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

  const scoreBarColor =
    score >= 70 ? 'bg-green-500' : score >= 40 ? 'bg-amber-500' : 'bg-brand-500';

  const scoreLabelColor =
    score >= 70 ? 'text-green-600' : score >= 40 ? 'text-amber-600' : 'text-brand-600';

  const dataFields: { key: keyof CollectedData; label: string }[] = [
    { key: 'name', label: isEN ? 'Name' : 'İsim' },
    { key: 'interested_service', label: isEN ? 'Service Interest' : 'İlgili Hizmet' },
    { key: 'pain_point', label: isEN ? 'Pain Point' : 'Şikayet' },
    { key: 'timeline', label: isEN ? 'Timeline' : 'Zaman' },
    { key: 'budget_awareness', label: isEN ? 'Budget' : 'Bütçe' },
    { key: 'preferred_day_time', label: isEN ? 'Preferred Time' : 'Tercih' },
    { key: 'referral_source', label: isEN ? 'Referral Source' : 'Kaynak' },
  ];

  const nonNullFields = dataFields.filter(({ key }) => {
    const v = collectedData[key];
    return v !== null && v !== undefined && v !== 'not_asked';
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Panel header */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
          </svg>
        </div>
        <h2 className="text-sm font-semibold text-slate-700">
          {isEN ? 'AI Brain — Live Analysis' : 'AI Beyin — Canlı Analiz'}
        </h2>
      </div>

      {/* Handoff alert */}
      {handoffRecommended && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3">
          <p className="text-sm font-bold text-green-700">
            {isEN ? '🎯 HANDOFF RECOMMENDED' : '🎯 DEVİR ÖNERİLİYOR'}
          </p>
          <p className="text-xs text-green-600 mt-0.5">
            {isEN
              ? 'Patient is ready — transfer to the sales team.'
              : 'Hasta hazır — satış ekibine devret.'}
          </p>
        </div>
      )}

      {/* Score */}
      <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex items-end justify-between mb-2">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            {isEN ? 'Lead Score' : 'Lead Skoru'}
          </span>
          <span className={`text-2xl font-bold ${scoreLabelColor}`}>{score}</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full transition-all duration-500 ${scoreBarColor}`}
            style={{ width: `${score}%` }}
          />
        </div>
        {Object.keys(scoreBreakdown).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {Object.entries(scoreBreakdown).map(([k, v]) => (
              <span
                key={k}
                className="text-[10px] bg-slate-50 border border-slate-200 text-slate-500 rounded px-1.5 py-0.5"
              >
                {v > 0 ? '+' : ''}{v} {k}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Stage */}
      <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
          {isEN ? 'Conversation Stage' : 'Konuşma Aşaması'}
        </p>
        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-medium ${stageColors[stage]}`}>
          {stageLabels[stage][lang]}
        </span>
      </div>

      {/* Lead signals */}
      <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
          {isEN ? 'Lead Signals' : 'Lead Sinyalleri'}
        </p>
        <div className="space-y-2">
          {[
            { label: isEN ? 'Urgency' : 'Aciliyet', value: leadSignals.urgency },
            { label: isEN ? 'Engagement' : 'Etkileşim', value: leadSignals.engagement_level },
            { label: isEN ? 'Buying Intent' : 'Satın Alma Niyeti', value: leadSignals.buying_intent },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-xs text-slate-500">{label}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${signalBadge[value] || 'bg-slate-100 text-slate-500'}`}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Collected data */}
      {nonNullFields.length > 0 && (
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
            {isEN ? 'Collected Data' : 'Toplanan Veriler'}
          </p>
          <div className="space-y-2">
            {nonNullFields.map(({ key, label }) => (
              <div key={key}>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</p>
                <p className="text-xs text-slate-700 font-medium">{String(collectedData[key])}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reply guidance */}
      {replyGuidance && (
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-1">
            {isEN ? 'Reply Guidance' : 'Yanıt Yönlendirme'}
          </p>
          <p className="text-xs text-slate-500 italic">{replyGuidance}</p>
        </div>
      )}
    </div>
  );
}
