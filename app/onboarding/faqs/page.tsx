'use client';

import { useState, useTransition, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { ArrowRight, Plus, Trash2, ChevronDown, ChevronUp, Loader2, Sparkles, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { CLINIC_FAQ_TEMPLATES, GENERAL_FAQ_TEMPLATES, CLINIC_TYPES } from '@/lib/clinic-types';

interface FaqForm {
  question_patterns: string[];
  answer: string;
  category: string;
  expanded: boolean;
}

export default function OnboardingFaqsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [clinicTypes, setClinicTypes] = useState<string[]>([]);
  const [faqs, setFaqs] = useState<FaqForm[]>([]);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [submissionStatus, setSubmissionStatus] = useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('clinic_users')
      .select('clinic_id, clinic:clinic_id(clinic_types)')
      .single()
      .then(async ({ data }) => {
        if (!data) return;
        setClinicId(data.clinic_id);
        const types: string[] = (data.clinic as any)?.clinic_types ?? [];
        setClinicTypes(types);
        // Tüm grupları açık başlat
        const init: Record<string, boolean> = { genel: true };
        types.forEach(t => { init[t] = true; });
        setOpenGroups(init);

        const { data: sub } = await supabase
          .from('onboarding_submissions')
          .select('*').eq('clinic_id', data.clinic_id).eq('section', 'faqs').single();

        if (sub) {
          setSubmissionStatus(sub.status);
          setRejectionNote(sub.rejection_note);
          if (sub.data?.faqs) setFaqs(sub.data.faqs.map((f: any) => ({ ...f, expanded: false })));
        }
      });
  }, []);

  // Gruplu şablonlar
  const templateGroups = [
    ...clinicTypes
      .filter(t => CLINIC_FAQ_TEMPLATES[t]?.length > 0)
      .map(t => ({
        key: t,
        label: CLINIC_TYPES.find(ct => ct.key === t)?.label ?? t,
        emoji: CLINIC_TYPES.find(ct => ct.key === t)?.emoji ?? '🏥',
        templates: CLINIC_FAQ_TEMPLATES[t] ?? [],
      })),
    { key: 'genel', label: 'Genel', emoji: '💬', templates: GENERAL_FAQ_TEMPLATES },
  ];

  function addFromTemplate(t: any) {
    if (faqs.some(f => f.answer === t.answer)) return;
    setFaqs(prev => [...prev, { ...t, expanded: false }]);
  }

  function addBlank() {
    setFaqs(prev => [...prev, { question_patterns: [''], answer: '', category: '', expanded: true }]);
  }

  function updatePattern(fi: number, pi: number, val: string) {
    setFaqs(prev => prev.map((f, idx) => {
      if (idx !== fi) return f;
      const p = [...f.question_patterns]; p[pi] = val;
      return { ...f, question_patterns: p };
    }));
  }

  function handleSubmit() {
    if (!clinicId) return;
    const valid = faqs.filter(f => f.answer.trim());

    startTransition(async () => {
      await supabase.from('onboarding_submissions').upsert({
        clinic_id: clinicId,
        section: 'faqs',
        data: { faqs: valid.map(({ expanded, ...f }) => f) },
        status: 'pending',
        reviewed_by: null, reviewed_at: null, rejection_note: null,
      }, { onConflict: 'clinic_id,section' });

      setSubmissionStatus('pending');
      router.push('/onboarding/done');
    });
  }

  const inputCls = "w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-400 text-sm";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Sık Sorulan Sorular</h1>
        <p className="text-slate-500 text-sm mt-1">Şablondan ekle veya kendi SSS'lerinizi oluşturun. Admin onayından sonra işlenir.</p>
      </div>

      {submissionStatus === 'pending' && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
          <Clock className="w-5 h-5 text-amber-500" />
          <p className="text-sm font-semibold text-amber-800">Onay Bekleniyor</p>
        </div>
      )}
      {submissionStatus === 'approved' && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4">
          <CheckCircle className="w-5 h-5 text-emerald-500" />
          <p className="text-sm font-semibold text-emerald-800">Onaylandı ✓</p>
        </div>
      )}
      {submissionStatus === 'rejected' && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <div>
            <p className="text-sm font-semibold text-red-800">Reddedildi — Düzenleyip tekrar gönderin.</p>
            {rejectionNote && <p className="text-xs text-red-600 mt-1">Not: {rejectionNote}</p>}
          </div>
        </div>
      )}

      {/* Gruplu şablonlar */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-600" />
          <span className="text-sm font-semibold text-slate-700">Önerilen SSS Şablonları</span>
          <span className="text-xs text-slate-400 ml-1">— tıklayarak ekle</span>
        </div>

        {templateGroups.map(group => (
          <div key={group.key} className="bg-brand-50 border border-brand-100 rounded-2xl overflow-hidden">
            <button
              onClick={() => setOpenGroups(p => ({ ...p, [group.key]: !p[group.key] }))}
              className="w-full flex items-center gap-3 px-5 py-3 hover:bg-brand-100/50 transition-colors text-left"
            >
              <span className="text-lg">{group.emoji}</span>
              <span className="text-sm font-semibold text-brand-800 flex-1">{group.label}</span>
              <span className="text-xs text-brand-500 mr-2">{group.templates.length} şablon</span>
              {openGroups[group.key] ? <ChevronUp className="w-4 h-4 text-brand-400" /> : <ChevronDown className="w-4 h-4 text-brand-400" />}
            </button>

            {openGroups[group.key] && (
              <div className="px-4 pb-4 space-y-2">
                {group.templates.map((t, i) => {
                  const already = faqs.some(f => f.answer === t.answer);
                  return (
                    <button
                      key={i}
                      onClick={() => !already && addFromTemplate(t)}
                      disabled={already}
                      className={`w-full text-left px-4 py-3 rounded-xl border text-xs transition-all ${
                        already ? 'border-emerald-200 bg-emerald-50 text-emerald-600 cursor-default' : 'border-brand-100 bg-white hover:bg-brand-50 hover:border-brand-300 text-slate-700 cursor-pointer'
                      }`}
                    >
                      <p className="font-semibold mb-0.5">{already ? '✓ ' : '+ '}{t.question_patterns[0]}</p>
                      <p className="text-slate-400 line-clamp-2">{t.answer}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Eklenen SSS'ler */}
      {faqs.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-700">Eklenen SSS'ler ({faqs.length})</p>
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div
                className="flex items-center gap-3 px-5 py-3.5 cursor-pointer hover:bg-slate-50"
                onClick={() => setFaqs(prev => prev.map((f, idx) => idx === i ? { ...f, expanded: !f.expanded } : f))}
              >
                <span className="flex-1 text-sm font-medium text-slate-800 truncate">
                  {faq.question_patterns[0] || <span className="text-slate-400 italic">Soru girilmedi</span>}
                </span>
                <button onClick={e => { e.stopPropagation(); setFaqs(prev => prev.filter((_, idx) => idx !== i)); }} className="text-slate-300 hover:text-red-500 p-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                {faq.expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>
              {faq.expanded && (
                <div className="px-5 pb-5 pt-1 space-y-3 border-t border-slate-50">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-slate-400">Soru Kalıpları</label>
                      <button onClick={() => setFaqs(prev => prev.map((f, idx) => idx === i ? { ...f, question_patterns: [...f.question_patterns, ''] } : f))} className="text-xs text-brand-600">+ Ekle</button>
                    </div>
                    {faq.question_patterns.map((p, pi) => (
                      <div key={pi} className="flex gap-2 mb-2">
                        <input className={inputCls} value={p} onChange={e => updatePattern(i, pi, e.target.value)} placeholder={`ör: ${pi === 0 ? 'fiyat nedir' : 'ne kadar tutar'}`} />
                        {faq.question_patterns.length > 1 && (
                          <button onClick={() => setFaqs(prev => prev.map((f, idx) => idx === i ? { ...f, question_patterns: f.question_patterns.filter((_, pIdx) => pIdx !== pi) } : f))} className="text-slate-300 hover:text-red-500 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Cevap *</label>
                    <textarea className={`${inputCls} resize-none`} rows={4} value={faq.answer}
                      onChange={e => setFaqs(prev => prev.map((f, idx) => idx === i ? { ...f, answer: e.target.value } : f))}
                      placeholder="AI asistanının vereceği yanıt…" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Kategori</label>
                    <input className={inputCls} value={faq.category}
                      onChange={e => setFaqs(prev => prev.map((f, idx) => idx === i ? { ...f, category: e.target.value } : f))}
                      placeholder="fiyat / medikal / genel" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <button onClick={addBlank} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-slate-200 hover:border-brand-300 hover:bg-brand-50 text-slate-400 hover:text-brand-600 text-sm font-medium transition-all">
        <Plus className="w-4 h-4" /> Boş SSS Ekle
      </button>

      <div className="flex items-center justify-between pt-2">
        <button onClick={() => router.push('/onboarding/services')} className="btn-ghost text-sm">← Geri</button>
        <div className="flex gap-3">
          <button onClick={() => router.push('/onboarding/done')} className="text-sm text-slate-400 hover:text-slate-600">Atla →</button>
          <button onClick={handleSubmit} disabled={isPending} className="btn-primary flex items-center gap-2 text-sm">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Gönder & Tamamla <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
