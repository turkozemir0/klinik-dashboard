'use client';

import { useState, useTransition, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, User, Phone, Mail, MapPin, Loader2, CheckCircle, ArrowRight } from 'lucide-react';
import { getClientLang } from '@/lib/client-lang';
import { getT } from '@/lib/i18n/messages';
import type { Lang } from '@/lib/i18n/messages';
import LangToggle from '@/components/LangToggle';

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [error, setError] = useState<string | null>(null);
  const [gdprAccepted, setGdprAccepted] = useState(false);
  const [lang, setLang] = useState<Lang>('tr');

  useEffect(() => { setLang(getClientLang()); }, []);

  const t = getT(lang);

  const [form, setForm] = useState({
    clinic_name:   '',
    contact_name:  '',
    contact_phone: '',
    email:         '',
    password:      '',
    city:          '',
    message:       '',
  });

  function set(key: string, val: string) {
    setForm(p => ({ ...p, [key]: val }));
  }

  function handleSubmit() {
    if (!form.clinic_name || !form.contact_name || !form.email || !form.password || !form.contact_phone) {
      setError(t.auth.register.requiredError);
      return;
    }
    if (form.password.length < 8) {
      setError(t.auth.register.passwordLengthError);
      return;
    }
    if (!gdprAccepted) {
      setError(t.auth.register.gdprError);
      return;
    }

    startTransition(async () => {
      setError(null);

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { emailRedirectTo: `${window.location.origin}/login` },
      });

      if (authError) {
        setError(authError.message === 'User already registered'
          ? t.auth.register.emailExistsError
          : authError.message);
        return;
      }

      if (!authData.user) {
        setError(t.common.error);
        return;
      }

      const { error: regError } = await supabase.from('clinic_registrations').insert({
        user_id:       authData.user.id,
        clinic_name:   form.clinic_name,
        contact_name:  form.contact_name,
        contact_phone: form.contact_phone,
        contact_email: form.email,
        city:          form.city || null,
        message:       form.message || null,
      });

      if (regError) {
        setError(regError.message);
        return;
      }

      setStep('success');
    });
  }

  const inputCls = "w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm text-slate-900 bg-white";

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">{t.auth.register.successTitle}</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            {t.auth.register.successDesc(form.clinic_name, form.email)}
          </p>
          <p className="text-xs text-slate-400 mb-6">{t.auth.register.successNote}</p>
          <Link href="/login" className="btn-primary w-full flex items-center justify-center gap-2">
            {t.auth.register.goToLoginBtn}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-600 to-brand-700 px-8 py-7 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg">stoaix</span>
            </div>
            <LangToggle variant="dark" />
          </div>
          <h1 className="text-2xl font-bold mb-1">{t.auth.register.title}</h1>
          <p className="text-brand-100 text-sm">{t.auth.register.subtitle}</p>
        </div>

        {/* Form */}
        <div className="p-8 space-y-4">
          {/* Clinic name */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              {t.auth.register.clinicName} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={form.clinic_name}
                onChange={e => set('clinic_name', e.target.value)}
                placeholder={t.auth.register.clinicNamePlaceholder}
                className={`${inputCls} pl-10`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                {t.auth.register.fullName} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={form.contact_name}
                  onChange={e => set('contact_name', e.target.value)}
                  placeholder={t.auth.register.fullNamePlaceholder}
                  className={`${inputCls} pl-10`}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                {t.auth.register.phone} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  value={form.contact_phone}
                  onChange={e => set('contact_phone', e.target.value)}
                  placeholder={t.auth.register.phonePlaceholder}
                  className={`${inputCls} pl-10`}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              {t.auth.register.email} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder={t.auth.register.emailPlaceholder}
                className={`${inputCls} pl-10`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                {t.auth.register.password} <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={form.password}
                onChange={e => set('password', e.target.value)}
                placeholder={t.auth.register.passwordPlaceholder}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                {t.auth.register.city}
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={form.city}
                  onChange={e => set('city', e.target.value)}
                  placeholder={t.auth.register.cityPlaceholder}
                  className={`${inputCls} pl-10`}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              {t.auth.register.heardAbout}
            </label>
            <input
              type="text"
              value={form.message}
              onChange={e => set('message', e.target.value)}
              placeholder={t.auth.register.heardAboutPlaceholder}
              className={inputCls}
            />
          </div>

          {/* GDPR Checkbox */}
          <div className="flex items-start gap-3 pt-1">
            <input
              id="gdpr"
              type="checkbox"
              checked={gdprAccepted}
              onChange={e => setGdprAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
            />
            <label htmlFor="gdpr" className="text-xs text-slate-500 cursor-pointer leading-relaxed">
              {t.auth.register.gdprText}{' '}
              <Link href="/privacy-policy" className="text-brand-600 hover:underline font-medium" target="_blank">
                {t.auth.register.gdprPrivacy}
              </Link>
              {lang === 'en' ? ' and ' : ' ve '}{' '}
              <Link href="/terms" className="text-brand-600 hover:underline font-medium" target="_blank">
                {t.auth.register.gdprTerms}
              </Link>
              {lang === 'tr' ? "'nı okudum ve kabul ediyorum." : '.'}
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            {isPending ? t.auth.register.submitting : t.auth.register.submit}
          </button>

          <p className="text-center text-xs text-slate-400">
            {t.auth.register.hasAccount}{' '}
            <Link href="/login" className="text-brand-600 hover:underline font-medium">
              {t.auth.register.goToLogin}
            </Link>
          </p>

          <div className="flex items-center justify-center gap-3 text-xs text-slate-300 pt-1">
            <Link href="/privacy-policy" className="hover:text-slate-500 transition-colors">
              {lang === 'en' ? 'Privacy' : 'Gizlilik'}
            </Link>
            <span>·</span>
            <Link href="/terms" className="hover:text-slate-500 transition-colors">
              {lang === 'en' ? 'Terms' : 'Şartlar'}
            </Link>
            <span>·</span>
            <Link href="/cookies" className="hover:text-slate-500 transition-colors">
              {lang === 'en' ? 'Cookies' : 'Çerezler'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
