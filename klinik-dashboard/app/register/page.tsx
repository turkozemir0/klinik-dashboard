'use client';

import { useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, User, Phone, Mail, MapPin, Loader2, CheckCircle, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [error, setError] = useState<string | null>(null);

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
      setError('Zorunlu alanları doldurunuz');
      return;
    }
    if (form.password.length < 8) {
      setError('Şifre en az 8 karakter olmalı');
      return;
    }

    startTransition(async () => {
      setError(null);

      // 1. Auth user oluştur
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { emailRedirectTo: `${window.location.origin}/login` },
      });

      if (authError) {
        setError(authError.message === 'User already registered'
          ? 'Bu email ile zaten kayıt var. Giriş yapmayı deneyin.'
          : authError.message);
        return;
      }

      if (!authData.user) {
        setError('Kullanıcı oluşturulamadı');
        return;
      }

      // 2. Kayıt başvurusu oluştur
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
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Başvurunuz Alındı!</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            <strong>{form.clinic_name}</strong> için başvurunuz incelemeye alındı.
            Onaylandığında <strong>{form.email}</strong> adresinize bildirim gönderilecek.
            Genellikle <strong>1 iş günü</strong> içinde dönüş yapılır.
          </p>
          <p className="text-xs text-slate-400 mb-6">
            Email'inizi onaylamanız gerekebilir, lütfen gelen kutunuzu kontrol edin.
          </p>
          <Link href="/login" className="btn-primary w-full flex items-center justify-center gap-2">
            Giriş Sayfasına Git
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
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg">stoaix</span>
          </div>
          <h1 className="text-2xl font-bold mb-1">Kliniğinizi Kaydedin</h1>
          <p className="text-brand-100 text-sm">
            Başvurunuz onaylandıktan sonra panele erişim sağlayabilirsiniz
          </p>
        </div>

        {/* Form */}
        <div className="p-8 space-y-4">
          {/* Klinik adı */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Klinik Adı <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={form.clinic_name}
                onChange={e => set('clinic_name', e.target.value)}
                placeholder="ör: İstanbul Estetik Klinik"
                className={`${inputCls} pl-10`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Ad Soyad */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Ad Soyad <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={form.contact_name}
                  onChange={e => set('contact_name', e.target.value)}
                  placeholder="Dr. Adı Soyadı"
                  className={`${inputCls} pl-10`}
                />
              </div>
            </div>
            {/* Telefon */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Telefon <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  value={form.contact_phone}
                  onChange={e => set('contact_phone', e.target.value)}
                  placeholder="+90 5xx xxx xx xx"
                  className={`${inputCls} pl-10`}
                />
              </div>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="doktor@klinik.com"
                className={`${inputCls} pl-10`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Şifre */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Şifre <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={form.password}
                onChange={e => set('password', e.target.value)}
                placeholder="Min. 8 karakter"
                className={inputCls}
              />
            </div>
            {/* Şehir */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Şehir
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={form.city}
                  onChange={e => set('city', e.target.value)}
                  placeholder="İstanbul"
                  className={`${inputCls} pl-10`}
                />
              </div>
            </div>
          </div>

          {/* Not */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Bizi Nasıl Duydunuz? (isteğe bağlı)
            </label>
            <input
              type="text"
              value={form.message}
              onChange={e => set('message', e.target.value)}
              placeholder="ör: Referans, sosyal medya, arama…"
              className={inputCls}
            />
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
            Başvuru Gönder
          </button>

          <p className="text-center text-xs text-slate-400">
            Zaten hesabınız var mı?{' '}
            <Link href="/login" className="text-brand-600 hover:underline font-medium">
              Giriş yapın
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
