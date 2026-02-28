'use client';

import { useState, useTransition } from 'react';
import { replyToTicket } from '@/lib/actions/ticket-actions';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  Wrench, Lightbulb, AlertTriangle, Building2, Clock,
  MessageSquare, CheckCircle, Loader2, ChevronDown, ChevronUp,
} from 'lucide-react';

const categoryConfig = {
  technical:  { label: 'Teknik Sorun',       icon: Wrench,         color: 'text-orange-600 bg-orange-50 border-orange-200' },
  kb_urgent:  { label: 'KB Güncelleme (Acil)', icon: AlertTriangle, color: 'text-red-600 bg-red-50 border-red-200' },
  general:    { label: 'Genel / Öneri',        icon: Lightbulb,     color: 'text-blue-600 bg-blue-50 border-blue-200' },
};

const statusConfig = {
  open:        { label: 'Açık',      bg: 'bg-amber-100 text-amber-700' },
  in_progress: { label: 'İşlemde',   bg: 'bg-blue-100 text-blue-700' },
  resolved:    { label: 'Çözüldü',   bg: 'bg-emerald-100 text-emerald-700' },
};

const priorityConfig = {
  urgent: 'bg-red-100 text-red-700',
  high:   'bg-orange-100 text-orange-700',
  normal: 'bg-slate-100 text-slate-600',
  low:    'bg-slate-50 text-slate-400',
};

interface TicketCardProps {
  ticket: {
    id: string;
    category: string;
    subject: string;
    description: string;
    priority: string;
    status: string;
    admin_reply: string | null;
    replied_at: string | null;
    resolved_at: string | null;
    created_at: string;
    clinic: { name: string } | null;
  };
}

export default function AdminTicketCard({ ticket }: TicketCardProps) {
  const [expanded, setExpanded] = useState(ticket.status !== 'resolved');
  const [reply, setReply] = useState(ticket.admin_reply ?? '');
  const [newStatus, setNewStatus] = useState(ticket.status);
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cat = categoryConfig[ticket.category as keyof typeof categoryConfig] ?? categoryConfig.general;
  const Icon = cat.icon;
  const statusCfg = statusConfig[ticket.status as keyof typeof statusConfig] ?? statusConfig.open;

  function handleReply() {
    startTransition(async () => {
      const res = await replyToTicket(ticket.id, reply, newStatus);
      if (res.error) setError(res.error);
      else setDone(true);
    });
  }

  return (
    <div className={`card overflow-hidden ${ticket.priority === 'urgent' ? 'ring-1 ring-red-300' : ''}`}>
      {/* Header */}
      <div
        className="flex items-center gap-4 px-6 py-4 bg-slate-50 border-b border-slate-100 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border ${cat.color}`}>
          <Icon className="w-3 h-3" />
          {cat.label}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">{ticket.subject}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <Building2 className="w-3 h-3 text-slate-400" />
            <span className="text-xs text-slate-500">{ticket.clinic?.name ?? '—'}</span>
            <span className="text-slate-300">·</span>
            <Clock className="w-3 h-3 text-slate-400" />
            <span className="text-xs text-slate-400">
              {format(parseISO(ticket.created_at), "d MMM HH:mm", { locale: tr })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${priorityConfig[ticket.priority as keyof typeof priorityConfig]}`}>
            {ticket.priority === 'urgent' ? '🚨 Acil' :
             ticket.priority === 'high'   ? 'Yüksek' :
             ticket.priority === 'normal' ? 'Normal' : 'Düşük'}
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusCfg.bg}`}>
            {statusCfg.label}
          </span>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {expanded && (
        <>
          {/* Ticket body */}
          <div className="px-6 py-5 space-y-4">
            {/* Açıklama */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Açıklama</p>
              <div className="bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-700 whitespace-pre-wrap">
                {ticket.description}
              </div>
            </div>

            {/* Mevcut yanıt varsa göster */}
            {ticket.admin_reply && (
              <div>
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2">Önceki Yanıt</p>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-sm text-slate-700">
                  {ticket.admin_reply}
                </div>
                {ticket.replied_at && (
                  <p className="text-xs text-slate-400 mt-1">
                    {format(parseISO(ticket.replied_at), "d MMM yyyy HH:mm", { locale: tr })}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Reply form */}
          {ticket.status !== 'resolved' && !done && (
            <div className="px-6 pb-5 space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Yanıt Yaz</p>
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={4}
                placeholder="Kliniğe yanıtınızı yazın…"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm resize-none"
              />
              <div className="flex items-center gap-3">
                {/* Durum seçici */}
                <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                  {(['open', 'in_progress', 'resolved'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setNewStatus(s)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        newStatus === s ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {statusConfig[s].label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleReply}
                  disabled={isPending || !reply.trim()}
                  className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-50 ml-auto"
                >
                  {isPending
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : newStatus === 'resolved'
                    ? <CheckCircle className="w-4 h-4" />
                    : <MessageSquare className="w-4 h-4" />}
                  {newStatus === 'resolved' ? 'Çözüldü olarak kapat' : 'Yanıt Gönder'}
                </button>
              </div>

              {error && (
                <p className="text-xs text-red-600">{error}</p>
              )}
            </div>
          )}

          {done && (
            <div className="mx-6 mb-5 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">
              ✓ Yanıt gönderildi
            </div>
          )}
        </>
      )}
    </div>
  );
}
