'use client';

import { useState, useTransition, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, Check } from 'lucide-react';
import { getClinicTypes } from '@/lib/clinic-types';
import { getClientLang } from '@/lib/client-lang';
import { getT } from '@/lib/i18n/messages';
import type { Lang } from '@/lib/i18n/messages';

export default function OnboardingTypePage() {
  const supabase = createClient();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<string[]>([]);
  const [otherText, setOtherText] = useState('');
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<Lang>('tr');

  useEffect(() => {
    setLang(getClientLang());
    supabase.from('clinic_users').select('clinic_id').single().then(({ data }) => {
      if (data) setClinicId(data.clinic_id);
    });
  }, []);

  const t = getT(lang);
  const clinicTypes = getClinicTypes(lang);

  function toggle(key: string) {
    setSelected(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  }

  const isValid = selected.length > 0 && (selected.includes('diger') ? otherText.trim().length > 0 : true);

  function handleNext() {
    if (!clinicId || !isValid) return;
    setError(null);

    startTransition(async () => {
      const { error: err } = await supabase.from('clinics').update({
        clinic_types:      selected,
        clinic_type_other: selected.includes('diger') ? otherText : null,
        onboarding_status: 'in_progress',
      }).eq('id', clinicId);

      if (err) { setError(err.message); return; }

      router.push('/onboarding/profile');
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t.onboarding.type.title}</h1>
        <p className="text-slate-500 text-sm mt-1">{t.onboarding.type.subtitle}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {clinicTypes.map(type => {
          const isSelected = selected.includes(type.key);
          return (
            <button
              key={type.key}
              onClick={() => toggle(type.key)}
              className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 text-sm font-medium transition-all ${
                isSelected
                  ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm'
                  : `border-slate-200 bg-white text-slate-600 hover:border-slate-300 ${type.color}`
              }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              <span className="text-2xl">{type.emoji}</span>
              <span className="text-center leading-tight">{type.label}</span>
            </button>
          );
        })}
      </div>

      {selected.includes('diger') && (
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
            {t.onboarding.type.otherLabel} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={otherText}
            onChange={e => setOtherText(e.target.value)}
            placeholder={t.onboarding.type.otherPlaceholder}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            autoFocus
          />
        </div>
      )}

      {selected.length > 0 && (
        <div className="bg-brand-50 border border-brand-100 rounded-xl px-4 py-3">
          <p className="text-xs text-brand-600 font-medium">
            {t.onboarding.type.selectedLabel}{' '}
            {selected.map(k => {
              const ct = clinicTypes.find(c => c.key === k);
              return k === 'diger' && otherText ? otherText : ct?.label;
            }).filter(Boolean).join(', ')}
          </p>
          <p className="text-xs text-brand-500 mt-0.5">{t.onboarding.type.templateHint}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="flex justify-end pt-2">
        <button
          onClick={handleNext}
          disabled={isPending || !isValid}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {t.onboarding.type.continue}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
