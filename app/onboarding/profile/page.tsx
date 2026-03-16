'use client';

import { useState, useTransition, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { getClientLang } from '@/lib/client-lang';
import { getT } from '@/lib/i18n/messages';
import type { Lang } from '@/lib/i18n/messages';

const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm text-slate-900";

export default function OnboardingProfilePage() {
  const supabase = createClient();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<Lang>('tr');

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
    setLang(getClientLang());
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

  const t = getT(lang);
  const p = t.onboarding.profile;
  const isRequired = !!(phone && greetingMessage && doctorName);

  function handleSubmit() {
    if (!clinicId || !isRequired) { setError(p.requiredError); return; }
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
        <h1 className="text-2xl font-bold text-slate-900">{p.title}</h1>
        <p className="text-slate-500 text-sm mt-1">{p.subtitle}</p>
      </div>

      {submissionStatus === 'pending' && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
          <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">{p.awaitingApproval}</p>
            <p className="text-xs text-amber-600">{p.awaitingHint}</p>
          </div>
        </div>
      )}
      {submissionStatus === 'approved' && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4">
          <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <p className="text-sm font-semibold text-emerald-800">{p.approved}</p>
        </div>
      )}
      {submissionStatus === 'rejected' && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">{p.rejected}</p>
            {rejectionNote && <p className="text-xs text-red-600 mt-1">{p.rejectedHint} {rejectionNote}</p>}
          </div>
        </div>
      )}

      {/* Contact */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">{p.contactInfo}</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
              {p.phone} <span className="text-red-500">*</span>
            </label>
            <input type="text" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder={p.phonePlaceholder} className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">{p.email}</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder={p.emailPlaceholder} className={inputCls} />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">{p.address}</label>
          <input type="text" value={address} onChange={e => setAddress(e.target.value)}
            placeholder={p.addressPlaceholder} className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">{p.parking}</label>
          <input type="text" value={parkingInfo} onChange={e => setParkingInfo(e.target.value)}
            placeholder={p.parkingPlaceholder} className={inputCls} />
        </div>
      </div>

      {/* Policies */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">{p.policies}</h2>
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">{p.consultationFee}</label>
          <input type="text" value={consultationFee} onChange={e => setConsultationFee(e.target.value)}
            placeholder={p.consultationFeePlaceholder} className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">{p.cancellationPolicy}</label>
          <textarea value={cancellationPolicy} onChange={e => setCancellationPolicy(e.target.value)}
            placeholder={p.cancellationPolicyPlaceholder} rows={3} className={`${inputCls} resize-none`} />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">{p.pricingPolicy}</label>
          <textarea value={pricingPolicy} onChange={e => setPricingPolicy(e.target.value)}
            placeholder={p.pricingPolicyPlaceholder} rows={3} className={`${inputCls} resize-none`} />
        </div>
      </div>

      {/* AI Assistant */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">{p.aiAssistant}</h2>
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
            {p.greetingMessage} <span className="text-red-500">*</span>
          </label>
          <textarea value={greetingMessage} onChange={e => setGreetingMessage(e.target.value)}
            placeholder={p.greetingPlaceholder} rows={3} className={`${inputCls} resize-none`} />
        </div>
      </div>

      {/* Doctor */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">{p.doctorInfo}</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
              {p.doctorName} <span className="text-red-500">*</span>
            </label>
            <input type="text" value={doctorName} onChange={e => setDoctorName(e.target.value)}
              placeholder={p.doctorNamePlaceholder} className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">{p.experience}</label>
            <input type="text" value={doctorYears} onChange={e => setDoctorYears(e.target.value)}
              placeholder={p.doctorExpPlaceholder} className={inputCls} />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">{p.title2}</label>
          <input type="text" value={doctorTitle} onChange={e => setDoctorTitle(e.target.value)}
            placeholder={p.doctorTitlePlaceholder} className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">{p.credentials}</label>
          <textarea value={doctorCredentials} onChange={e => setDoctorCredentials(e.target.value)}
            placeholder={p.doctorCredentialsPlaceholder} rows={3} className={`${inputCls} resize-none`} />
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="flex items-center justify-between pt-2">
        <button onClick={() => router.push('/onboarding/type')} className="btn-ghost text-sm">{p.back}</button>
        <div className="flex gap-3">
          <button onClick={() => router.push('/onboarding/services')} className="text-sm text-slate-400 hover:text-slate-600">{p.skip}</button>
          <button onClick={handleSubmit} disabled={isPending || !isRequired} className="btn-primary flex items-center gap-2 text-sm">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {p.submitContinue} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
