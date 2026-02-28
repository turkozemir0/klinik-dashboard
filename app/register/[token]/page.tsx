'use client';

import { useState, useTransition, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Building2, User, Phone, Mail, Loader2, CheckCircle, ArrowRight, XCircle } from 'lucide-react';

export default function RegisterWithTokenPage() {
  const params = useParams();
  const token = params.token as string;
  const router = useRouter();
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();
  const [tokenStatus, setTokenStatus] = useState<'checking' | 'valid' | 'invalid'>('checking');
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    clinic_name:   '',
    contact_name:  '',
    contact_phone: '',
    email:         '',
    password:      '',
    city:          '',
  });

  // Token geçerli mi?
  useEffect(() => {
    if (!token) { setTokenStatus('invalid'); return; }
    supabase
      .from('invite_tokens')
      .select('id, is_used, expires_at')
      .eq('token', token)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setTokenStatus('invalid'); return; }
        if (data.is_used || new Date(data.expires_at) < new Date()) {
          setTokenStatus('invalid'); return;
        }
        setTokenStatus('valid');
      });
  }, [token]);

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
      });

      if (authError) {
        setError(authError.message === 'User already registered'
          ? 'Bu email ile zaten kayıt var.'
          : authError.message);
        return;
      }
      if (!authData.user) { setError('Kullanıcı oluşturulamadı'); return; }

      // 2. Token kullan
      const { data: tokenData } = await supabase.rpc('use_invite_token', {
        p_token:   token,
        p_user_id: authData.user.id,
      });

      if (!tokenData?.success) {
        setError(tokenData?.error ?? 'Davetiye kullanılamadı');
        return;
      }

      // 3. Kayıt başvurusu oluştur
      const { error: regError } = await supabase.from('clinic_registrations').insert({
        user_id:       authData.user.id,
        clinic_name:   form.clinic_name,
        contact_name:  form.contact_name,
        contact_phone: form.contact_phone,
        contact_email: form.email,
        city:          form.city || null,
      });

      if (regError) { setError(regError.message); return; }

      setStep('success');
    });
  }

  const inputCls = "w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm text-slate-900";

  // Token kontrol ediliyor
  if (tokenStatus === 'checking') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
      </div>
    );
  }

  // Token geçersiz
  if (tokenStatus === 'invalid') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-3">Geçersiz Davetiye</h2>
          <p className="text-slate-500 text-sm">
            Bu davetiye linki kullanılmış veya süresi dolmuş. Lütfen yetkili kişiyle iletişime geçin.
          </p>
        </div>
      </div>
    );
  }

  // Başarılı kayıt
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Başvurunuz Alındı!</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            Hesabınız oluşturuldu. Yönetici onayının ardından panele erişim sağlayabilirsiniz.
          </p>
          <Link href="/login" className="btn-primary w-full flex items-center justify-center gap-2">
            Giriş Yap <ArrowRight className="w-4 h-4" />
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
          <p className="text-brand-100 text-sm">Davetiye ile özel erişim</p>
        </div>

        <div className="p-8 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Klinik Adı <span className="text-red-500">*</span>
            </label>
            <input type="text" value={form.clinic_name} onChange={e => set('clinic_name', e.target.value)} placeholder="ör: İstanbul Estetik Klinik" className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Ad Soyad <span className="text-red-500">*</span>
              </label>
              <input type="text" value={form.contact_name} onChange={e => set('contact_name', e.target.value)} placeholder="Dr. Adı Soyadı" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Telefon <span className="text-red-500">*</span>
              </label>
              <input type="tel" value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} placeholder="+90 5xx xxx xx xx" className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Email <span className="text-red-500">*</span>
            </label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="doktor@klinik.com" className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Şifre <span className="text-red-500">*</span>
              </label>
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min. 8 karakter" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Şehir</label>
              <input type="text" value={form.city} onChange={e => set('city', e.target.value)} placeholder="İstanbul" className={inputCls} />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <button onClick={handleSubmit} disabled={isPending} className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            Kayıt Ol
          </button>

          <p className="text-center text-xs text-slate-400">
            Zaten hesabınız var mı?{' '}
            <Link href="/login" className="text-brand-600 hover:underline font-medium">Giriş yapın</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
