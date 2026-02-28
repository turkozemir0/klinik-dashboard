'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { CheckCircle, ArrowRight, BookOpen, BarChart3, Loader2 } from 'lucide-react';

export default function OnboardingDonePage() {
  const supabase = createClient();
  const router = useRouter();
  const [pct, setPct] = useState(0);
  const [missing, setMissing] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('clinic_users').select('clinic_id').single().then(async ({ data }) => {
      if (!data) return;
      const { data: prog } = await supabase
        .from('onboarding_progress')
        .select('*')
        .eq('clinic_id', data.clinic_id)
        .single();

      if (prog) {
        setPct(prog.completion_pct ?? 0);
        const m: string[] = [];
        if (!prog.profile_done)   m.push('Klinik profili (telefon, karşılama mesajı)');
        if (!prog.services_done)  m.push('En az 1 hizmet');
        setMissing(m);
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
      </div>
    );
  }

  const isFullyDone = missing.length === 0;

  return (
    <div className="max-w-lg mx-auto text-center space-y-8 py-6">
      {/* Icon */}
      <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${
        isFullyDone ? 'bg-emerald-100' : 'bg-amber-100'
      }`}>
        {isFullyDone
          ? <CheckCircle className="w-10 h-10 text-emerald-600" />
          : <span className="text-3xl">🎯</span>}
      </div>

      {/* Başlık */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {isFullyDone ? 'Kurulum Tamamlandı!' : `%${pct} Tamamlandı`}
        </h1>
        <p className="text-slate-500 text-sm mt-2">
          {isFullyDone
            ? 'AI asistanınız artık kliniğinizi tanıyor ve hastalara doğru bilgi verebilir.'
            : 'Harika bir başlangıç! Eksik alanları istediğiniz zaman tamamlayabilirsiniz.'}
        </p>
      </div>

      {/* Progress bar */}
      <div className="bg-slate-100 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            isFullyDone ? 'bg-emerald-500' : 'bg-amber-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Eksikler */}
      {missing.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 text-left">
          <p className="text-sm font-semibold text-amber-800 mb-3">Tamamlanmayı bekleyenler:</p>
          <ul className="space-y-2">
            {missing.map((m, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-amber-700">
                <span className="w-5 h-5 rounded-full border-2 border-amber-300 flex-shrink-0" />
                {m}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sonraki adımlar */}
      <div className="grid grid-cols-2 gap-3 text-left">
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <BookOpen className="w-5 h-5 text-brand-500 mb-2" />
          <p className="text-sm font-semibold text-slate-800">Knowledge Base</p>
          <p className="text-xs text-slate-400 mt-1">
            Bilgileri istediğiniz zaman güncelleyebilir, değişiklik önerebilirsiniz.
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <BarChart3 className="w-5 h-5 text-brand-500 mb-2" />
          <p className="text-sm font-semibold text-slate-800">Dashboard</p>
          <p className="text-xs text-slate-400 mt-1">
            Lead skorlarını, konuşmaları ve handoff loglarını takip edin.
          </p>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={() => router.push('/dashboard')}
        className="btn-primary w-full flex items-center justify-center gap-2 py-3"
      >
        Panele Git
        <ArrowRight className="w-4 h-4" />
      </button>

      {missing.length > 0 && (
        <button
          onClick={() => router.push('/onboarding/profile')}
          className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
        >
          ← Geri dön, eksikleri tamamla
        </button>
      )}
    </div>
  );
}
