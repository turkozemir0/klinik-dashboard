'use client';

import { useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { CheckCircle, XCircle, ChevronDown, ChevronUp, Loader2, Building2 } from 'lucide-react';

interface Props {
  submission: any;
  sectionLabel: string;
}

export default function AdminSubmissionCard({ submission: sub, sectionLabel }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clinic = sub.clinic;

  function handleApprove() {
    startTransition(async () => {
      const { data, error: err } = await supabase.rpc('approve_onboarding_submission', { p_submission_id: sub.id });
      if (err || !data?.success) { setError(err?.message ?? data?.error); return; }
      setDone(true);
      router.refresh();
    });
  }

  function handleReject() {
    startTransition(async () => {
      const { data, error: err } = await supabase.rpc('reject_onboarding_submission', {
        p_submission_id: sub.id,
        p_note: rejectNote || null,
      });
      if (err || !data?.success) { setError(err?.message ?? data?.error); return; }
      setDone(true);
      router.refresh();
    });
  }

  if (done) return (
    <div className="card p-4 flex items-center gap-3">
      <CheckCircle className="w-4 h-4 text-emerald-500" />
      <span className="text-sm text-emerald-700">İşlendi: {clinic?.name} — {sectionLabel}</span>
    </div>
  );

  // Veriyi okunabilir şekilde göster
  function renderData() {
    const d = sub.data;
    if (sub.section === 'profile') {
      return (
        <div className="grid grid-cols-2 gap-3 text-xs">
          {Object.entries(d).filter(([, v]) => v).map(([k, v]) => (
            <div key={k}>
              <span className="text-slate-400 font-semibold uppercase text-xs">{k.replace(/_/g, ' ')}</span>
              <p className="text-slate-700 mt-0.5 whitespace-pre-wrap">{String(v)}</p>
            </div>
          ))}
        </div>
      );
    }
    if (sub.section === 'services') {
      return (
        <div className="space-y-4">
          {d.services?.map((s: any, i: number) => (
            <div key={i} className="bg-slate-50 rounded-xl p-4 text-xs space-y-1">
              <p className="font-semibold text-slate-800">{s.display_name}</p>
              {s.description_for_ai && <p className="text-slate-500">{s.description_for_ai}</p>}
              <div className="flex gap-4 text-slate-400 mt-2">
                {s.procedure_duration && <span>⏱ {s.procedure_duration}</span>}
                {s.anesthesia_type && <span>💉 {s.anesthesia_type}</span>}
                {s.recovery_time && <span>🔄 {s.recovery_time}</span>}
              </div>
              {s.pricing_response && <p className="text-slate-500 italic mt-1">💬 {s.pricing_response}</p>}
            </div>
          ))}
        </div>
      );
    }
    if (sub.section === 'faqs') {
      return (
        <div className="space-y-3">
          {d.faqs?.map((f: any, i: number) => (
            <div key={i} className="bg-slate-50 rounded-xl p-4 text-xs">
              <p className="text-slate-400 mb-1">Soru kalıpları: {f.question_patterns?.join(', ')}</p>
              <p className="text-slate-700">{f.answer}</p>
            </div>
          ))}
        </div>
      );
    }
    return <pre className="text-xs text-slate-500 overflow-auto">{JSON.stringify(d, null, 2)}</pre>;
  }

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 bg-slate-50 border-b border-slate-100">
        <div className="w-9 h-9 bg-brand-100 rounded-xl flex items-center justify-center">
          <Building2 className="w-4 h-4 text-brand-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-900">{clinic?.name}</p>
          <p className="text-xs text-slate-400">
            {sectionLabel} · {format(parseISO(sub.submitted_at), "d MMM yyyy HH:mm", { locale: tr })}
          </p>
        </div>
        {clinic?.clinic_types?.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {clinic.clinic_types.map((t: string) => (
              <span key={t} className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">{t}</span>
            ))}
          </div>
        )}
        <button onClick={() => setExpanded(!expanded)} className="text-slate-400 hover:text-slate-600 p-1">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* İçerik */}
      {expanded && (
        <div className="px-6 py-5 border-b border-slate-100">
          {renderData()}
        </div>
      )}

      {/* Aksiyonlar */}
      {!showReject ? (
        <div className="flex items-center gap-3 px-6 py-4">
          <button onClick={() => setShowReject(true)}
            className="flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl border border-red-200 transition-colors">
            <XCircle className="w-4 h-4" /> Reddet
          </button>
          {!expanded && (
            <button onClick={() => setExpanded(true)} className="text-sm text-slate-400 hover:text-slate-600">
              İçeriği Gör
            </button>
          )}
          <button onClick={handleApprove} disabled={isPending}
            className="ml-auto flex items-center gap-2 text-sm text-white bg-emerald-600 hover:bg-emerald-700 px-5 py-2 rounded-xl transition-colors">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Onayla — Sisteme İşle
          </button>
        </div>
      ) : (
        <div className="px-6 py-4 space-y-3">
          <textarea value={rejectNote} onChange={e => setRejectNote(e.target.value)} rows={2}
            placeholder="Red sebebi (klinik görecek)…"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-400 text-sm resize-none" />
          <div className="flex gap-3">
            <button onClick={() => setShowReject(false)} className="btn-ghost text-sm">İptal</button>
            <button onClick={handleReject} disabled={isPending}
              className="flex items-center gap-2 text-sm text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Reddet
            </button>
          </div>
        </div>
      )}

      {error && <div className="px-6 py-3 bg-red-50 border-t border-red-100 text-xs text-red-600">{error}</div>}
    </div>
  );
}
