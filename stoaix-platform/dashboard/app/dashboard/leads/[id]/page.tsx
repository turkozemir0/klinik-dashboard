import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import LeadBadge from '@/components/LeadBadge'
import { t } from '@/lib/i18n'
import { ArrowLeft } from 'lucide-react'
import LeadDetailClient from './LeadDetailClient'
import LeadAppointmentsClient from './LeadAppointmentsClient'
import LeadPipelinesClient from './LeadPipelinesClient'

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orgUser } = await supabase
    .from('org_users')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle()

  const userRole = orgUser?.role ?? null

  const { data: lead } = await supabase
    .from('leads')
    .select(`
      id, qualification_score, status, source_channel, collected_data,
      data_completeness, missing_fields, notes, created_at, updated_at,
      contact:contacts(id, full_name, phone, email, status, source_channel, created_at)
    `)
    .eq('id', params.id)
    .maybeSingle()

  if (!lead) notFound()

  // Fetch conversations for this lead
  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, channel, status, mode, taken_over_by, taken_over_at, started_at, ended_at')
    .eq('lead_id', lead.id)
    .order('started_at', { ascending: false })
    .limit(5)

  // Active conversation (most recent)
  const activeConv = conversations?.[0] ?? null

  // Fetch messages from first conversation
  let messages: any[] = []
  if (activeConv) {
    const { data: msgs } = await supabase
      .from('messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', activeConv.id)
      .order('created_at', { ascending: true })
      .limit(100)
    messages = msgs ?? []
  }

  // Fetch handoff log
  const { data: handoff } = await supabase
    .from('handoff_logs')
    .select('id, trigger_reason, summary, missing_at_handoff, routing_target, status, created_at')
    .eq('lead_id', lead.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Fetch proposals
  const { data: proposals } = await supabase
    .from('proposals')
    .select('id, title, total_amount, currency, status, created_at')
    .eq('lead_id', lead.id)
    .order('created_at', { ascending: false })

  const contact = lead.contact as any

  return (
    <div className="p-6 space-y-5 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/leads" className="text-slate-500 hover:text-slate-700 flex items-center gap-1 text-sm">
          <ArrowLeft size={15} /> {t.back}
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-lg font-bold text-slate-600 flex-shrink-0">
            {(contact?.full_name || contact?.phone || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900">{contact?.full_name || contact?.phone || 'Bilinmeyen'}</h1>
              <LeadBadge score={lead.qualification_score} />
            </div>
            <p className="text-sm text-slate-500 mt-0.5">{contact?.phone} {contact?.email ? `· ${contact.email}` : ''}</p>
          </div>
        </div>

        {/* Handoff controls */}
        {activeConv && (
          <LeadDetailClient
            conversationId={activeConv.id}
            initialMode={activeConv.mode ?? 'ai'}
            initialTakenOverBy={activeConv.taken_over_by ?? null}
            currentUserId={user.id}
            userRole={userRole}
          />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contact Info */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">{t.contactInfo}</h2>
          <dl className="space-y-2">
            {[
              ['Telefon', contact?.phone],
              ['E-posta', contact?.email],
              ['Kaynak', contact?.source_channel],
              ['Durum', contact?.status],
              ['Kayıt', contact?.created_at ? new Date(contact.created_at).toLocaleDateString('tr-TR') : '—'],
            ].map(([label, value]) => value ? (
              <div key={label} className="flex text-sm">
                <dt className="w-24 text-slate-500 flex-shrink-0">{label}</dt>
                <dd className="text-slate-800 font-medium">{value}</dd>
              </div>
            ) : null)}
          </dl>
        </div>

        {/* Collected Data */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">{t.collectedData}</h2>
          {Object.keys(lead.collected_data).length === 0 ? (
            <p className="text-sm text-slate-400">{t.noData}</p>
          ) : (
            <dl className="space-y-2">
              {Object.entries(lead.collected_data).map(([key, value]) => (
                value != null ? (
                  <div key={key} className="flex text-sm">
                    <dt className="w-36 text-slate-500 flex-shrink-0 truncate capitalize">{key.replace(/_/g, ' ')}</dt>
                    <dd className="text-slate-800 font-medium">{String(value)}</dd>
                  </div>
                ) : null
              ))}
            </dl>
          )}
        </div>
      </div>

      {/* Handoff */}
      {handoff && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-amber-800 mb-2">{t.handoffInfo}</h2>
          <div className="text-sm text-amber-700 space-y-1">
            <p><span className="font-medium">Neden:</span> {handoff.trigger_reason}</p>
            {handoff.routing_target && <p><span className="font-medium">Yönlendirme:</span> {handoff.routing_target}</p>}
            {handoff.summary && <p className="mt-2">{handoff.summary}</p>}
            {handoff.missing_at_handoff?.length > 0 && (
              <p><span className="font-medium">Eksik:</span> {handoff.missing_at_handoff.join(', ')}</p>
            )}
          </div>
        </div>
      )}

      {/* Pipeline Atamaları */}
      <LeadPipelinesClient leadId={lead.id} />

      {/* Randevular */}
      <LeadAppointmentsClient leadId={lead.id} />

      {/* Proposals */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Teklifler</h2>
          {['admin', 'yönetici', 'satisci'].includes(userRole ?? '') && (
            <Link
              href={`/dashboard/proposals/new?lead_id=${lead.id}`}
              className="text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              + Yeni Teklif
            </Link>
          )}
        </div>
        <div className="p-5">
          {!proposals?.length ? (
            <p className="text-sm text-slate-400 text-center py-4">Henüz teklif oluşturulmadı.</p>
          ) : (
            <div className="space-y-2">
              {proposals.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{p.title}</p>
                    <p className="text-xs text-slate-400">{new Date(p.created_at).toLocaleDateString('tr-TR')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      p.status === 'accepted' || p.status === 'signed' ? 'bg-green-100 text-green-700' :
                      p.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      p.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {p.status}
                    </span>
                    <span className="text-sm font-semibold text-slate-800">
                      {p.total_amount.toLocaleString('tr-TR')} {p.currency}
                    </span>
                    <Link href={`/dashboard/proposals/${p.id}`} className="text-xs text-brand-600 hover:underline">
                      Detay
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50">
          <h2 className="text-sm font-semibold text-slate-700">{t.messagesHistory}</h2>
        </div>
        <div className="p-5 space-y-3 max-h-[500px] overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">{t.noData}</p>
          ) : messages.map((msg: any) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-start' : msg.role === 'assistant' ? 'justify-end' : 'justify-center'}`}
            >
              {msg.role === 'system' ? (
                <div className="text-xs text-slate-400 italic">{msg.content}</div>
              ) : (
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === 'user'
                    ? 'bg-slate-100 text-slate-800 rounded-bl-sm'
                    : 'bg-brand-500 text-white rounded-br-sm'
                }`}>
                  <p>{msg.content}</p>
                  <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-slate-400' : 'text-blue-200'}`}>
                    {new Date(msg.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
