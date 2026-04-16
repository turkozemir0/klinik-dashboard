'use client'

import { useState, useEffect } from 'react'
import { Shield, Download, Trash2, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface ConsentRecord {
  consent_type: string
  version: string
  accepted_at: string
}

interface DataRequest {
  id: string
  request_type: string
  status: string
  created_at: string
  completed_at: string | null
}

const requestTypeLabels: Record<string, string> = {
  deletion: 'Veri Silme',
  export: 'Veri Dışa Aktarma',
  rectification: 'Veri Düzeltme',
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'Bekliyor', color: 'text-amber-600 bg-amber-50' },
  processing: { label: 'İşleniyor', color: 'text-blue-600 bg-blue-50' },
  completed: { label: 'Tamamlandı', color: 'text-green-600 bg-green-50' },
}

export default function PrivacySettingsPage() {
  const [consents, setConsents] = useState<ConsentRecord[]>([])
  const [requests, setRequests] = useState<DataRequest[]>([])
  const [loadingConsents, setLoadingConsents] = useState(true)
  const [loadingRequests, setLoadingRequests] = useState(true)
  const [submitting, setSubmitting] = useState('')
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    fetch('/api/consent')
      .then(r => r.json())
      .then(d => { setConsents(d.records ?? []); setLoadingConsents(false) })
      .catch(() => setLoadingConsents(false))

    fetch('/api/data-request')
      .then(r => r.json())
      .then(d => { setRequests(d.requests ?? []); setLoadingRequests(false) })
      .catch(() => setLoadingRequests(false))
  }, [])

  async function sendRequest(type: 'deletion' | 'export' | 'rectification') {
    setSubmitting(type)
    setMessage(null)
    try {
      const res = await fetch('/api/data-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_type: type }),
      })
      const d = await res.json()
      if (!res.ok) {
        setMessage({ type: 'err', text: d.error ?? 'Hata oluştu' })
      } else {
        setMessage({ type: 'ok', text: 'Talebiniz alındı. privacy@stoaix.com adresinden size dönüş yapılacaktır.' })
        setRequests(prev => [{
          id: d.id,
          request_type: type,
          status: 'pending',
          created_at: new Date().toISOString(),
          completed_at: null,
        }, ...prev])
      }
    } catch {
      setMessage({ type: 'err', text: 'Bağlantı hatası' })
    } finally {
      setSubmitting('')
    }
  }

  const consentTypeLabels: Record<string, string> = {
    privacy_policy: 'Gizlilik Politikası',
    data_processing: 'Veri İşleme Açık Rızası',
    marketing: 'Pazarlama İletişimleri',
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="w-5 h-5 text-sky-600" />
        <h1 className="text-xl font-semibold text-slate-800">Gizlilik & Veri Yönetimi</h1>
      </div>

      {/* Consent History */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Rıza Geçmişi</h2>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {loadingConsents ? (
            <div className="p-4 text-sm text-slate-400">Yükleniyor...</div>
          ) : consents.length === 0 ? (
            <div className="p-4 text-sm text-slate-400">Henüz rıza kaydı bulunmuyor.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Tür</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Versiyon</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Tarih</th>
                </tr>
              </thead>
              <tbody>
                {consents.map((c, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 text-slate-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                      {consentTypeLabels[c.consent_type] ?? c.consent_type}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{c.version}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {new Date(c.accepted_at).toLocaleDateString('tr-TR', {
                        day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Data Requests */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-slate-700 mb-1">Veri Talepleri</h2>
        <p className="text-xs text-slate-500 mb-3">
          KVKK Madde 11 kapsamında veri silme, dışa aktarma veya düzeltme talebinde bulunabilirsiniz.
          Talepler <strong>privacy@stoaix.com</strong> adresiyle 30 gün içinde yanıtlanır.
        </p>

        <div className="flex gap-2 mb-4 flex-wrap">
          <button
            onClick={() => sendRequest('export')}
            disabled={!!submitting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 hover:bg-slate-50 text-slate-700 disabled:opacity-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            {submitting === 'export' ? 'Gönderiliyor...' : 'Verilerimi İndir'}
          </button>
          <button
            onClick={() => sendRequest('deletion')}
            disabled={!!submitting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-red-200 hover:bg-red-50 text-red-600 disabled:opacity-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {submitting === 'deletion' ? 'Gönderiliyor...' : 'Hesabımı ve Verilerimi Sil'}
          </button>
        </div>

        {message && (
          <div className={`flex items-start gap-2 p-3 rounded-lg text-xs mb-4 ${message.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
            {message.type === 'ok' ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
            {message.text}
          </div>
        )}

        {loadingRequests ? (
          <div className="text-sm text-slate-400">Yükleniyor...</div>
        ) : requests.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Talep</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Durum</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Tarih</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 text-slate-700">{requestTypeLabels[r.request_type] ?? r.request_type}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusLabels[r.status]?.color ?? 'text-slate-500'}`}>
                        {statusLabels[r.status]?.label ?? r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {new Date(r.created_at).toLocaleDateString('tr-TR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-xs text-slate-400">
        Gizlilik politikasının tamamı için:{' '}
        <Link href="/privacy" className="text-sky-600 hover:underline" target="_blank">
          /privacy
        </Link>
        {' '}— İletişim:{' '}
        <a href="mailto:privacy@stoaix.com" className="text-sky-600 hover:underline">
          privacy@stoaix.com
        </a>
      </p>
    </div>
  )
}
