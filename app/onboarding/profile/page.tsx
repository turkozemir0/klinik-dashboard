'use client';

import { useState, useTransition, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, Lightbulb, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm text-slate-900";

const PLACEHOLDERS: Record<string, string> = {
  phone: '+90 212 555 00 00',
  email: 'info@kliniginiz.com',
  address: 'Bağdat Caddesi No: 42 Kat: 3, Kadıköy',
  parking_info: 'Binamızın karşısında ücretsiz otopark mevcuttur.',
  consultation_fee: 'İlk görüşmemiz ücretsizdir.',
  cancellation_policy: 'Randevunuzu en az 24 saat öncesinden iptal edebilirsiniz.',
  pricing_policy: 'Fiyatlarımız kişisel muayene sonrası belirlenmektedir.',
  greeting_message: 'Merhaba! 👋 Kliniğimize hoş geldiniz. Size nasıl yardımcı olabilirim?',
  lead_doctor_name: 'Op. Dr. Adı Soyadı',
  lead_doctor_title: 'Plastik ve Rekonstrüktif Cerrahi Uzmanı',
  lead_doctor_experience_years: '10',
  lead_doctor_credentials: 'İstanbul Üniversitesi Tıp Fakültesi mezunu.',
};

export default function OnboardingProfilePage() {
  const supabase = createClient();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [parkingInfo, setParkingInfo] = useState('');
  const [consultationFee, setConsultationFee] = useState('');
  const [cancellationPolicy, setCancellationPolicy] = useState('');
  const [pricingPolicy, setPricingPolicy] = useState('');
  const [greetingMessage, setGreetingMessage] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [doctorTitle, setDoctorTitle] = useState('');
  const [doctorYears, setDoctorYears] = useState('');
  const [doctorCredentials, setDoctorCredentials] = useState('');

  useEffect(() => {
    supabase.from('clinic_users').select('clinic_id').single().then(async ({ data }) => {
      if (!data) return;
      setClinicId(data.clinic_id);

      const { data: sub } = await supabase
        .from('onboarding_submissions')
        .select('*')
        .eq('clinic_id', data.clinic_id)
        .eq('section', 'profile')
        .single();

      if (sub?.data) {
        const d = sub.data;
        setPhone(d.phone ?? '');
        setEmail(d.email ?? '');
        setAddress(d.address ?? '');
        setParkingInfo(d.parking_info ?? '');
        setConsultationFee(d.consultation_fee ?? '');
        setCancellationPolicy(d.cancellation_policy ?? '');
        setPricingPolicy(d.pricing_policy ?? '');
        setGreetingMessage(d.greeting_message ?? '');
        setDoctorName(d.lead_doctor_name ?? '');
        setDoctorTitle(d.lead_doctor_title ?? '');
        setDoctorYears(d.lead_doctor_experience_years ?? '');
        setDoctorCredentials(d.lead_doctor_credentials ?? '');
        setSubmissionStatus(sub.status);
        setRejectionNote(sub.rejection_note);
      }
    });
  }, []);

  const isRequired = !!(phone && greetingMessage && doctorName);

  function handleSubmit() {
    if (!clinicId || !isRequired) { setError('Zorunlu alanları doldurun'); return; }
    setError(null);

    startTransition(async () => {
      const payload = {
        phone, email, address, parking_info: parkingInfo,
        consultation_fee: consultationFee, cancellation_policy: cancellationPolicy,
        pricing_policy: pricingPolicy, greeting_message: greetingMessage,
        lead_doctor_name: doctorName, lead_doctor_title: doctorTitle,
        lead_doctor_experience_years: doctorYears, lead_doctor_credentials: doctorCredentials,
      };

      const { error: err } = await supabase.from('onboarding_submissions').upsert({
        clinic_id: clinicId, section: 'profile', data: payload, status: 'pending',
        reviewed_by: null, reviewed_at: null, rejection_note: null,
      }, { onConflict: 'clinic_id,section' });

      if (err) { setError(err.message); return; }
      setSubmissionStatus('pending');
      router.push('/onboarding/services');
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Klinik Profili</h1>
        <p className="text-slate-500 text-sm mt-1">Girdiğiniz bilgiler admin onayından sonra sisteme işlenecek.</p>
      </div>

      {submissionStatus === 'pending' && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
          <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Onay Bekleniyor</p>
            <p className="text-xs text-amber-600">Değiştirmek için formu güncelleyip tekrar gönderin.</p>
          </div>
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

      {/* İletişim */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">İletişim Bilgileri</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
              Telefon <span className="text-red-500">*</span>
            </label>
            <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder={PLACEHOLDERS.phone} className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">E-posta</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={PLACEHOLDERS.email} className={inputCls} />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Adres</label>
          <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder={PLACEHOLDERS.address} className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Otopark</label>
          <input type="text" value={parkingInfo} onChange={e => setParkingInfo(e.target.value)} placeholder={PLACEHOLDERS.parking_info} className={inputCls} />
        </div>
      </div>

      {/* Politikalar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">Politikalar</h2>
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Görüşme Ücreti</label>
          <input type="text" value={consultationFee} onChange={e => setConsultationFee(e.target.value)} placeholder={PLACEHOLDERS.consultation_fee} className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">İptal Politikası</label>
          <textarea value={cancellationPolicy} onChange={e => setCancellationPolicy(e.target.value)} placeholder={PLACEHOLDERS.cancellation_policy} rows={3} className={`${inputCls} resize-none`} />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Fiyatlandırma Politikası</label>
          <textarea value={pricingPolicy} onChange={e => setPricingPolicy(e.target.value)} placeholder={PLACEHOLDERS.pricing_policy} rows={3} className={`${inputCls} resize-none`} />
        </div>
      </div>

      {/* AI */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">AI Asistan</h2>
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
            Karşılama Mesajı <span className="text-red-500">*</span>
          </label>
          <textarea value={greetingMessage} onChange={e => setGreetingMessage(e.target.value)} placeholder={PLACEHOLDERS.greeting_message} rows={3} className={`${inputCls} resize-none`} />
        </div>
      </div>

      {/* Doktor */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">Doktor Bilgileri</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
              Doktor Adı <span className="text-red-500">*</span>
            </label>
            <input type="text" value={doctorName} onChange={e => setDoctorName(e.target.value)} placeholder={PLACEHOLDERS.lead_doctor_name} className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Deneyim (yıl)</label>
            <input type="text" value={doctorYears} onChange={e => setDoctorYears(e.target.value)} placeholder={PLACEHOLDERS.lead_doctor_experience_years} className={inputCls} />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Unvan</label>
          <input type="text" value={doctorTitle} onChange={e => setDoctorTitle(e.target.value)} placeholder={PLACEHOLDERS.lead_doctor_title} className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Eğitim & Sertifikalar</label>
          <textarea value={doctorCredentials} onChange={e => setDoctorCredentials(e.target.value)} placeholder={PLACEHOLDERS.lead_doctor_credentials} rows={3} className={`${inputCls} resize-none`} />
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="flex items-center justify-between pt-2">
        <button onClick={() => router.push('/onboarding/type')} className="btn-ghost text-sm">← Geri</button>
        <div className="flex gap-3">
          <button onClick={() => router.push('/onboarding/services')} className="text-sm text-slate-400 hover:text-slate-600">Atla →</button>
          <button onClick={handleSubmit} disabled={isPending || !isRequired} className="btn-primary flex items-center gap-2 text-sm">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Gönder & Devam Et <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
