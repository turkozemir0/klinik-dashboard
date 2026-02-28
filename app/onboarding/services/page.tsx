'use client';

import { useState, useTransition, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { ArrowRight, Plus, Trash2, ChevronDown, ChevronUp, Loader2, Sparkles, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { CLINIC_SERVICE_TEMPLATES, CLINIC_TYPES } from '@/lib/clinic-types';

interface ServiceForm {
  display_name: string; service_key: string; category: string;
  description_for_ai: string; procedure_duration: string; anesthesia_type: string;
  recovery_time: string; final_result_time: string; pricing_response: string;
  expanded: boolean; sort_order: number;
}

export default function OnboardingServicesPage() {
  const supabase = createClient();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [clinicTypes, setClinicTypes] = useState<string[]>([]);
  const [services, setServices] = useState<ServiceForm[]>([]);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [submissionStatus, setSubmissionStatus] = useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        const init: Record<string, boolean> = {};
        types.forEach(t => { init[t] = true; });
        setOpenGroups(init);

        const { data: sub } = await supabase
          .from('onboarding_submissions')
          .select('*').eq('clinic_id', data.clinic_id).eq('section', 'services').single();

        if (sub) {
          setSubmissionStatus(sub.status);
          setRejectionNote(sub.rejection_note);
          if (sub.data?.services) setServices(sub.data.services.map((s: any) => ({ ...s, expanded: false })));
        }
      });
  }, []);

  // Klinik tiplerine göre gruplu şablonlar
  const templateGroups = clinicTypes
    .filter(t => CLINIC_SERVICE_TEMPLATES[t]?.length > 0)
    .map(t => ({
      key: t,
      label: CLINIC_TYPES.find(ct => ct.key === t)?.label ?? t,
      emoji: CLINIC_TYPES.find(ct => ct.key === t)?.emoji ?? '🏥',
      templates: CLINIC_SERVICE_TEMPLATES[t] ?? [],
    }));

  function addFromTemplate(t: any) {
    if (services.some(s => s.service_key === t.service_key)) return;
    setServices(prev => [...prev, { ...t, expanded: false, sort_order: prev.length + 1 }]);
  }

  function addBlank() {
    setServices(prev => [...prev, {
      display_name: '', service_key: '', category: '', description_for_ai: '',
      procedure_duration: '', anesthesia_type: '', recovery_time: '',
      final_result_time: '', pricing_response: '', expanded: true, sort_order: prev.length + 1,
    }]);
  }

  function update(i: number, key: string, val: string) {
    setServices(prev => prev.map((s, idx) => idx === i ? { ...s, [key]: val } : s));
  }

  function toggleExpand(i: number) {
    setServices(prev => prev.map((s, idx) => idx === i ? { ...s, expanded: !s.expanded } : s));
  }

  function handleSubmit() {
    if (!clinicId) return;
    const valid = services.filter(s => s.display_name.trim());
    if (valid.length === 0) { setError('En az 1 hizmet ekleyin'); return; }
    setError(null);

    startTransition(async () => {
      const { error: err } = await supabase.from('onboarding_submissions').upsert({
        clinic_id: clinicId,
        section: 'services',
        data: { services: valid.map(({ expanded, ...s }) => s) },
        status: 'pending',
        reviewed_by: null, reviewed_at: null, rejection_note: null,
      }, { onConflict: 'clinic_id,section' });

      if (err) { setError(err.message); return; }
      setSubmissionStatus('pending');
      router.push('/onboarding/faqs');
    });
  }

  const inputCls = "w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-400 text-sm";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Hizmetlerinizi Ekleyin</h1>
        <p className="text-slate-500 text-sm mt-1">Şablondan ekle veya sıfırdan oluştur. Admin onayından sonra sisteme işlenir.</p>
      </div>

      {submissionStatus === 'pending' && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
          <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <p className="text-sm font-semibold text-amber-800">Onay Bekleniyor — Admin inceliyor.</p>
        </div>
      )}
      {submissionStatus === 'approved' && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4">
          <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <p className="text-sm font-semibold text-emerald-800">Onaylandı ✓</p>
        </div>
      )}
      {submissionStatus === 'rejected' && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">Reddedildi — Düzenleyip tekrar gönderin.</p>
            {rejectionNote && <p className="text-xs text-red-600 mt-1">Not: {rejectionNote}</p>}
          </div>
        </div>
      )}

      {/* Şablonlar — klinik tipine göre gruplu */}
      {templateGroups.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-600" />
            <span className="text-sm font-semibold text-slate-700">Klinik Tipinize Göre Önerilen Şablonlar</span>
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
                <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {group.templates.map(t => {
                    const already = services.some(s => s.service_key === t.service_key);
                    return (
                      <button
                        key={t.service_key}
                        onClick={() => !already && addFromTemplate(t)}
                        disabled={already}
                        className={`text-left px-4 py-3 rounded-xl border text-xs font-medium transition-all ${
                          already
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-600 cursor-default'
                            : 'border-brand-200 bg-white hover:bg-brand-50 hover:border-brand-400 text-slate-700 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold">{already ? '✓ ' : '+ '}{t.display_name}</span>
                        </div>
                        {t.category && <span className="text-slate-400 mt-0.5 block">{t.category}</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Eklenen hizmetler */}
      {services.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-700">Eklenen Hizmetler ({services.filter(s => s.display_name).length})</p>
          {services.map((svc, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div
                className="flex items-center gap-3 px-5 py-3.5 cursor-pointer hover:bg-slate-50"
                onClick={() => toggleExpand(i)}
              >
                <span className="flex-1 text-sm font-medium text-slate-800">
                  {svc.display_name || <span className="text-slate-400 italic">İsimsiz</span>}
                  {svc.category && <span className="text-xs text-slate-400 ml-2">· {svc.category}</span>}
                </span>
                <button
                  onClick={e => { e.stopPropagation(); setServices(prev => prev.filter((_, idx) => idx !== i)); }}
                  className="text-slate-300 hover:text-red-500 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                {svc.expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>
              {svc.expanded && (
                <div className="px-5 pb-5 pt-1 space-y-3 border-t border-slate-50">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs font-semibold text-slate-400 block mb-1">Hizmet Adı *</label><input className={inputCls} value={svc.display_name} onChange={e => update(i, 'display_name', e.target.value)} /></div>
                    <div><label className="text-xs font-semibold text-slate-400 block mb-1">Kategori</label><input className={inputCls} value={svc.category} onChange={e => update(i, 'category', e.target.value)} /></div>
                  </div>
                  <div><label className="text-xs font-semibold text-slate-400 block mb-1">AI Açıklaması</label><textarea className={`${inputCls} resize-none`} rows={3} value={svc.description_for_ai} onChange={e => update(i, 'description_for_ai', e.target.value)} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs font-semibold text-slate-400 block mb-1">İşlem Süresi</label><input className={inputCls} value={svc.procedure_duration} onChange={e => update(i, 'procedure_duration', e.target.value)} /></div>
                    <div><label className="text-xs font-semibold text-slate-400 block mb-1">Anestezi</label><input className={inputCls} value={svc.anesthesia_type} onChange={e => update(i, 'anesthesia_type', e.target.value)} /></div>
                    <div><label className="text-xs font-semibold text-slate-400 block mb-1">İyileşme</label><input className={inputCls} value={svc.recovery_time} onChange={e => update(i, 'recovery_time', e.target.value)} /></div>
                    <div><label className="text-xs font-semibold text-slate-400 block mb-1">Sonuç</label><input className={inputCls} value={svc.final_result_time} onChange={e => update(i, 'final_result_time', e.target.value)} /></div>
                  </div>
                  <div><label className="text-xs font-semibold text-slate-400 block mb-1">Fiyat Yanıtı</label><textarea className={`${inputCls} resize-none`} rows={2} value={svc.pricing_response} onChange={e => update(i, 'pricing_response', e.target.value)} /></div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <button
        onClick={addBlank}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-slate-200 hover:border-brand-300 hover:bg-brand-50 text-slate-400 hover:text-brand-600 text-sm font-medium transition-all"
      >
        <Plus className="w-4 h-4" /> Boş Hizmet Ekle
      </button>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="flex items-center justify-between pt-2">
        <button onClick={() => router.push('/onboarding/profile')} className="btn-ghost text-sm">← Geri</button>
        <div className="flex gap-3">
          <button onClick={() => router.push('/onboarding/faqs')} className="text-sm text-slate-400 hover:text-slate-600">Atla →</button>
          <button onClick={handleSubmit} disabled={isPending} className="btn-primary flex items-center gap-2 text-sm">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Gönder & Devam <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
