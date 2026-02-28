'use client';

import { useState, useTransition } from 'react';
import { approveRequest, rejectRequest } from '@/lib/actions/kb-actions';
import { CheckCircle, XCircle, Loader2, Building2, Tag, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

interface AdminRequestCardProps {
  request: {
    id: string;
    status: string;
    table_name: string;
    record_label: string | null;
    field_label: string | null;
    field_name: string;
    old_value: string | null;
    new_value: string;
    change_note: string | null;
    rejection_note: string | null;
    created_at: string;
    reviewed_at: string | null;
    clinic: { name: string; slug: string } | null;
  };
}

export default function AdminRequestCard({ request }: AdminRequestCardProps) {
  const [isPending, startTransition] = useTransition();
  const [rejectNote, setRejectNote] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tableLabels: Record<string, string> = {
    clinics: 'Klinik Profili',
    services: 'Hizmet',
    faqs: 'SSS',
  };

  function handleApprove() {
    startTransition(async () => {
      const res = await approveRequest(request.id);
      if (res.error) setError(res.error);
      else setDone(true);
    });
  }

  function handleReject() {
    startTransition(async () => {
      const res = await rejectRequest(request.id, rejectNote);
      if (res.error) setError(res.error);
      else setDone(true);
    });
  }

  if (done) {
    return (
      <div className="card p-5 border-emerald-200 bg-emerald-50">
        <p className="text-sm text-emerald-700 font-medium">✓ İşlem tamamlandı</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      {/* Card header */}
      <div className="flex items-center gap-4 px-6 py-4 bg-slate-50 border-b border-slate-100">
        <div className="flex-1 flex items-center gap-3 flex-wrap">
          {/* Klinik */}
          <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
            <Building2 className="w-3.5 h-3.5 text-brand-600" />
            {request.clinic?.name ?? '—'}
          </div>

          <span className="text-slate-300">›</span>

          {/* Tablo */}
          <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-medium">
            {tableLabels[request.table_name] ?? request.table_name}
          </span>

          {/* Alan */}
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Tag className="w-3 h-3" />
            {request.field_label ?? request.field_name}
          </div>
        </div>

        {/* Tarih */}
        <div className="flex items-center gap-1 text-xs text-slate-400 flex-shrink-0">
          <Clock className="w-3 h-3" />
          {format(parseISO(request.created_at), "d MMM HH:mm", { locale: tr })}
        </div>
      </div>

      {/* Değişiklik karşılaştırma */}
      <div className="px-6 py-5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
          {request.record_label ?? 'Kayıt'}
        </p>

        {(request.field_name === '__new_service__' || request.field_name === '__new_faq__') ? (
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
            <p className="text-xs font-semibold text-emerald-700 mb-2">
              {request.field_name === '__new_service__' ? '➕ Yeni Hizmet Ekleme Talebi' : '➕ Yeni SSS Ekleme Talebi'}
            </p>
            <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono bg-white rounded-lg p-3 border border-emerald-100 overflow-auto max-h-60">
              {(() => {
                try { return JSON.stringify(JSON.parse(request.new_value), null, 2); }
                catch { return request.new_value; }
              })()}
            </pre>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-slate-400 mb-1.5">Mevcut</p>
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-slate-700 min-h-12">
                {request.old_value || <span className="text-slate-300 italic">Boş</span>}
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1.5">Önerilen</p>
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-sm text-slate-700 min-h-12">
                {request.new_value}
              </div>
            </div>
          </div>
        )}

        {/* Klinik notu */}
        {request.change_note && (
          <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5">
            <p className="text-xs text-blue-600 font-semibold mb-0.5">Klinik Notu</p>
            <p className="text-sm text-blue-800">{request.change_note}</p>
          </div>
        )}

        {/* Hata */}
        {error && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Actions */}
      {request.status === 'pending' && (
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          {!showRejectForm ? (
            <div className="flex items-center gap-3">
              <button
                onClick={handleApprove}
                disabled={isPending}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Onayla ve Uygula
              </button>
              <button
                onClick={() => setShowRejectForm(true)}
                disabled={isPending}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                Reddet
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="Red sebebi (isteğe bağlı, klinik görecek)…"
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleReject}
                  disabled={isPending}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                  Reddet
                </button>
                <button
                  onClick={() => setShowRejectForm(false)}
                  className="btn-ghost text-sm"
                >
                  İptal
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Onaylanmış / reddedilmiş bilgisi */}
      {request.status !== 'pending' && request.reviewed_at && (
        <div className={`px-6 py-3 border-t text-xs ${
          request.status === 'approved'
            ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
            : 'border-red-100 bg-red-50 text-red-700'
        }`}>
          {request.status === 'approved' ? '✓ Onaylandı' : '✗ Reddedildi'}
          {' — '}
          {format(parseISO(request.reviewed_at), "d MMM yyyy HH:mm", { locale: tr })}
          {request.rejection_note && ` — ${request.rejection_note}`}
        </div>
      )}
    </div>
  );
}
