'use client';

import { useState, useTransition, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, Check } from 'lucide-react';
import { CLINIC_TYPES } from '@/lib/clinic-types';

export default function OnboardingTypePage() {
  const supabase = createClient();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<string[]>([]);
  const [otherText, setOtherText] = useState('');
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('clinic_users').select('clinic_id').single().then(({ data }) => {
      if (data) setClinicId(data.clinic_id);
    });
  }, []);

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
        <h1 className="text-2xl font-bold text-slate-900">Kliniğiniz ne tür hizmet veriyor?</h1>
        <p className="text-slate-500 text-sm mt-1">
          Birden fazla seçebilirsiniz. Seçiminize göre size özel şablonlar önerilecek.
        </p>
      </div>

      {/* Klinik tipi seçimi */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {CLINIC_TYPES.map(type => {
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

      {/* Diğer text input */}
      {selected.includes('diger') && (
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
            Klinik türünüzü belirtin <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={otherText}
            onChange={e => setOtherText(e.target.value)}
            placeholder="ör: Fizik Tedavi ve Rehabilitasyon"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            autoFocus
          />
        </div>
      )}

      {/* Seçilen tipler özeti */}
      {selected.length > 0 && (
        <div className="bg-brand-50 border border-brand-100 rounded-xl px-4 py-3">
          <p className="text-xs text-brand-600 font-medium">
            Seçilen: {selected.map(k => {
              const t = CLINIC_TYPES.find(ct => ct.key === k);
              return k === 'diger' && otherText ? otherText : t?.label;
            }).filter(Boolean).join(', ')}
          </p>
          <p className="text-xs text-brand-500 mt-0.5">
            Bir sonraki adımda bu türlere uygun hizmet şablonları önerilecek ✨
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Footer */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleNext}
          disabled={isPending || !isValid}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Devam Et
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
