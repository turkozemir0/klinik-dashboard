'use client';

import { useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Building2, Phone, Mail, MapPin, CheckCircle, XCircle, Loader2, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface RegistrationCardProps {
  registration: {
    id: string;
    clinic_name: string;
    contact_name: string;
    contact_phone: string;
    contact_email: string;
    city: string | null;
    message: string | null;
    status: string;
    rejection_note: string | null;
    created_at: string;
  };
}

export default function AdminRegistrationCard({ registration: reg }: RegistrationCardProps) {
  const supabase = createClient();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleApprove() {
    startTransition(async () => {
      const { data, error: err } = await supabase.rpc('approve_registration', { reg_id: reg.id });
      if (err || !data?.success) {
        setError(err?.message ?? data?.error ?? 'Hata oluştu');
        return;
      }
      setDone(true);
      router.refresh();
    });
  }

  function handleReject() {
    startTransition(async () => {
      const { data, error: err } = await supabase.rpc('reject_registration', {
        reg_id: reg.id,
        note: rejectNote || null,
      });
      if (err || !data?.success) {
        setError(err?.message ?? data?.error ?? 'Hata oluştu');
        return;
      }
      setDone(true);
      router.refresh();
    });
  }

  if (done) {
    return (
      <div className="card p-5 flex items-center gap-3">
        <CheckCircle className="w-5 h-5 text-emerald-500" />
        <span className="text-sm text-emerald-700 font-medium">
          {action === 'approve' ? `${reg.clinic_name} onaylandı — klinik ve onboarding oluşturuldu` : 'Reddedildi'}
        </span>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-4 px-6 py-5 bg-slate-50 border-b border-slate-100">
        <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Building2 className="w-5 h-5 text-brand-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-slate-900">{reg.clinic_name}</h3>
          <p className="text-sm text-slate-500">{reg.contact_name}</p>
        </div>
        <span className="text-xs text-slate-400">
          {format(parseISO(reg.created_at), "d MMM yyyy, HH:mm", { locale: tr })}
        </span>
      </div>

      {/* Details */}
      <div className="px-6 py-4 grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Phone className="w-3.5 h-3.5 text-slate-400" />
          {reg.contact_phone}
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Mail className="w-3.5 h-3.5 text-slate-400" />
          {reg.contact_email}
        </div>
        {reg.city && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            {reg.city}
          </div>
        )}
        {reg.message && (
          <div className="flex items-start gap-2 text-sm text-slate-600 col-span-2">
            <MessageSquare className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
            <span className="italic text-slate-500">{reg.message}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      {reg.status === 'pending' && !action && (
        <div className="flex items-center gap-3 px-6 py-4 border-t border-slate-100">
          <button
            onClick={() => setAction('reject')}
            className="flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl border border-red-200 transition-colors"
          >
            <XCircle className="w-4 h-4" />
            Reddet
          </button>
          <button
            onClick={() => { setAction('approve'); handleApprove(); }}
            disabled={isPending}
            className="flex items-center gap-2 text-sm text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-xl transition-colors ml-auto"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Onayla — Klinik Oluştur
          </button>
        </div>
      )}

      {action === 'reject' && (
        <div className="px-6 py-4 border-t border-slate-100 space-y-3">
          <textarea
            value={rejectNote}
            onChange={e => setRejectNote(e.target.value)}
            rows={3}
            placeholder="Red sebebi (isteğe bağlı, klinik görecek)…"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-400 text-sm resize-none"
          />
          <div className="flex gap-3">
            <button onClick={() => setAction(null)} className="btn-ghost text-sm">İptal</button>
            <button
              onClick={handleReject}
              disabled={isPending}
              className="flex items-center gap-2 text-sm text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl transition-colors"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Reddet
            </button>
          </div>
        </div>
      )}

      {reg.status === 'rejected' && reg.rejection_note && (
        <div className="px-6 py-3 border-t border-slate-100 bg-red-50">
          <p className="text-xs text-red-600">Red sebebi: {reg.rejection_note}</p>
        </div>
      )}

      {error && (
        <div className="px-6 py-3 border-t border-red-100 bg-red-50">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
