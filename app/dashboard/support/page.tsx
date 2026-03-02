import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  LifeBuoy, Wrench, Lightbulb, AlertTriangle,
  Clock, Loader, CheckCircle, MessageSquare,
} from 'lucide-react';
import SupportButton from '@/components/dashboard/SupportButton';

const categoryConfig = {
  technical: { label: 'Teknik Sorun',        icon: Wrench,         color: 'text-orange-600 bg-orange-50 border-orange-200' },
  kb_urgent: { label: 'KB Güncelleme (Acil)', icon: AlertTriangle,  color: 'text-red-600 bg-red-50 border-red-200' },
  general:   { label: 'Genel / Öneri',         icon: Lightbulb,     color: 'text-blue-600 bg-blue-50 border-blue-200' },
};

const statusConfig = {
  open:        { label: 'Açık',    bg: 'bg-amber-100 text-amber-700',    icon: Clock },
  in_progress: { label: 'İşlemde', bg: 'bg-blue-100 text-blue-700',      icon: Loader },
  resolved:    { label: 'Çözüldü', bg: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
};

export default async function SupportPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: cu } = await supabase
    .from('clinic_users')
    .select('clinic_id')
    .eq('user_id', user.id)
    .single();
  if (!cu) redirect('/login');

  const { data: tickets } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('clinic_id', cu.clinic_id)
    .order('created_at', { ascending: false });

  const openCount = (tickets ?? []).filter(t => t.status !== 'resolved').length;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <LifeBuoy className="w-6 h-6 text-brand-600" />
            Destek Taleplerim
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Gönderdiğiniz talepler ve yönetici yanıtları
          </p>
        </div>
        <SupportButton openTicketCount={0} />
      </div>

      {/* Özet */}
      {(tickets ?? []).length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {(['open','in_progress','resolved'] as const).map((s) => {
            const count = (tickets ?? []).filter(t => t.status === s).length;
            const cfg = statusConfig[s];
            const Icon = cfg.icon;
            return (
              <div key={s} className="card px-5 py-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${cfg.bg}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{count}</p>
                  <p className="text-xs text-slate-500">{cfg.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ticket listesi */}
      {(tickets ?? []).length === 0 ? (
        <div className="card p-16 text-center">
          <LifeBuoy className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-medium mb-1">Henüz destek talebi yok</p>
          <p className="text-slate-400 text-xs">Sorun veya öneriniz için yukarıdan yeni talep oluşturabilirsiniz</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(tickets ?? []).map((ticket) => {
            const cat = categoryConfig[ticket.category as keyof typeof categoryConfig] ?? categoryConfig.general;
            const CatIcon = cat.icon;
            const statusCfg = statusConfig[ticket.status as keyof typeof statusConfig] ?? statusConfig.open;
            const StatusIcon = statusCfg.icon;
            const hasReply = !!ticket.admin_reply;

            return (
              <div key={ticket.id} className={`card overflow-hidden ${
                ticket.status === 'resolved' ? 'opacity-80' : ''
              } ${ticket.priority === 'urgent' ? 'ring-1 ring-red-300' : ''}`}>
                {/* Card header */}
                <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-100 bg-slate-50">
                  <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border ${cat.color}`}>
                    <CatIcon className="w-3 h-3" />
                    {cat.label}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{ticket.subject}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {format(parseISO(ticket.created_at), "d MMMM yyyy, HH:mm", { locale: tr })}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${statusCfg.bg}`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusCfg.label}
                  </div>
                </div>

                {/* Ticket açıklama */}
                <div className="px-6 py-4 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Talebiniz</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{ticket.description}</p>
                  </div>

                  {/* Admin yanıtı */}
                  {hasReply ? (
                    <div className="bg-brand-50 border border-brand-100 rounded-xl px-5 py-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-3.5 h-3.5 text-brand-600" />
                        <p className="text-xs font-semibold text-brand-700">Destek Ekibi Yanıtı</p>
                        {ticket.replied_at && (
                          <span className="text-xs text-brand-400 ml-auto">
                            {format(parseISO(ticket.replied_at), "d MMM HH:mm", { locale: tr })}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{ticket.admin_reply}</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 rounded-xl px-4 py-3">
                      <Clock className="w-3.5 h-3.5" />
                      Talebiniz alındı, en kısa sürede yanıt verilecek
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
