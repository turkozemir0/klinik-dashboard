'use client'

import { useState } from 'react'
import { Shield, FileText, Mail } from 'lucide-react'
import Link from 'next/link'

interface Props {
  onAccepted: () => void
}

export default function ConsentModal({ onAccepted }: Props) {
  const [privacyChecked, setPrivacyChecked] = useState(false)
  const [dataChecked, setDataChecked] = useState(false)
  const [marketingChecked, setMarketingChecked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const canSubmit = privacyChecked && dataChecked

  async function handleAccept() {
    if (!canSubmit) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          privacy_policy: privacyChecked,
          data_processing: dataChecked,
          marketing: marketingChecked,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Bir hata oluştu')
        return
      }
      onAccepted()
    } catch {
      setError('Bağlantı hatası. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-sky-100 rounded-xl">
            <Shield className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800 text-base">Gizlilik ve Veri İşleme Onayı</h2>
            <p className="text-xs text-slate-500">KVKK kapsamında zorunlu onay</p>
          </div>
        </div>

        <p className="text-sm text-slate-600 mb-5 leading-relaxed">
          stoaix platformunu kullanmaya devam etmek için aşağıdaki onayları vermeniz gerekmektedir.
          Kişisel verileriniz 6698 sayılı KVKK kapsamında işlenmektedir.
        </p>

        {/* Checkboxes */}
        <div className="space-y-3 mb-5">
          {/* Zorunlu 1 */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={privacyChecked}
              onChange={e => setPrivacyChecked(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
            />
            <span className="text-sm text-slate-700 leading-relaxed">
              <Link href="/privacy" target="_blank" className="text-sky-600 hover:underline font-medium">
                Gizlilik Politikası
              </Link>
              &apos;nı ve{' '}
              <Link href="/terms" target="_blank" className="text-sky-600 hover:underline font-medium">
                Kullanım Koşulları
              </Link>
              &apos;nı okudum, kabul ediyorum.{' '}
              <span className="text-red-500 text-xs">(Zorunlu)</span>
            </span>
          </label>

          {/* Zorunlu 2 */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={dataChecked}
              onChange={e => setDataChecked(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
            />
            <span className="text-sm text-slate-700 leading-relaxed">
              Kişisel verilerimin (kimlik, iletişim, işlem verileri) hizmetin sağlanması amacıyla
              işlenmesine{' '}
              <strong>açık rıza</strong> veriyorum.{' '}
              <span className="text-red-500 text-xs">(Zorunlu)</span>
            </span>
          </label>

          {/* Opsiyonel */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={marketingChecked}
              onChange={e => setMarketingChecked(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
            />
            <span className="text-sm text-slate-600 leading-relaxed">
              Platform güncellemeleri ve kampanyalar hakkında e-posta almak istiyorum.{' '}
              <span className="text-slate-400 text-xs">(İsteğe bağlı)</span>
            </span>
          </label>
        </div>

        {/* KVKK hakları notu */}
        <div className="bg-slate-50 rounded-xl p-3 mb-5 text-xs text-slate-500 flex gap-2">
          <FileText className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
          <span>
            KVKK Madde 11 kapsamında verilerinize erişme, düzeltme ve silme haklarınız mevcuttur.
            Talepler için:{' '}
            <a href="mailto:privacy@stoaix.com" className="text-sky-600 hover:underline">
              privacy@stoaix.com
            </a>
          </span>
        </div>

        {error && (
          <p className="text-red-600 text-sm mb-3">{error}</p>
        )}

        <button
          onClick={handleAccept}
          disabled={!canSubmit || loading}
          className="w-full py-2.5 rounded-xl text-sm font-medium transition-all
            bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'Kaydediliyor...' : 'Onaylıyorum ve Devam Ediyorum'}
        </button>

        <p className="text-center text-xs text-slate-400 mt-3">
          Zorunlu onaylar verilmeden platforma erişim sağlanamamaktadır.
        </p>
      </div>
    </div>
  )
}
