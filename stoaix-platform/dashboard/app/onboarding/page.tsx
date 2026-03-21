'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, Plus, Trash2 } from 'lucide-react'

type Step = 1 | 2 | 3 | 4 | 5

interface KbItem {
  id: string
  title: string
  description_for_ai: string
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [orgId, setOrgId] = useState('')
  const [orgName, setOrgName] = useState('')
  const [loading, setLoading] = useState(false)
  const [step1Error, setStep1Error] = useState('')

  // Step 1 — İşletme Bilgileri
  const [phone, setPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('TR')

  // Step 2 — Genel Tanıtım
  const [about, setAbout] = useState('')
  const [workingHours, setWorkingHours] = useState('')
  const [genLoading, setGenLoading] = useState(false)

  // Step 3 — Hizmetler
  const [services, setServices] = useState<KbItem[]>([])
  const [svcTitle, setSvcTitle] = useState('')
  const [svcDesc, setSvcDesc] = useState('')
  const [svcLoading, setSvcLoading] = useState(false)

  // Step 4 — SSS
  const [faqs, setFaqs] = useState<KbItem[]>([])
  const [faqQ, setFaqQ] = useState('')
  const [faqA, setFaqA] = useState('')
  const [faqLoading, setFaqLoading] = useState(false)

  // Step 5 — Politika & Fiyatlandırma
  const [pricing, setPricing] = useState('')
  const [policy, setPolicy] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      supabase
        .from('org_users')
        .select('organization_id, organizations(id, name)')
        .eq('user_id', data.user.id)
        .maybeSingle()
        .then(({ data: ou }) => {
          if (!ou) return
          const org = ou.organizations as unknown as { id: string; name: string } | null
          if (org) { setOrgId(org.id); setOrgName(org.name) }
        })
    })
  }, [router])

  async function handleStep1(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setStep1Error('')
    try {
      const res = await fetch('/api/onboarding/business-info', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, email: contactEmail, city, country }),
      })
      if (res.ok) {
        setStep(2)
      } else {
        const d = await res.json()
        setStep1Error(d.error || `Hata (${res.status})`)
      }
    } catch {
      setStep1Error('Bağlantı hatası. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  async function handleStep2General() {
    if (!orgId) { setStep(3); return }
    setGenLoading(true)
    if (about.trim()) {
      await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Hakkımızda',
          description_for_ai: about.trim(),
          item_type: 'general',
          organization_id: orgId,
        }),
      })
    }
    if (workingHours.trim()) {
      await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Çalışma Saatleri & İletişim',
          description_for_ai: workingHours.trim(),
          item_type: 'general',
          organization_id: orgId,
        }),
      })
    }
    setGenLoading(false)
    setStep(3)
  }

  async function addService() {
    if (!svcTitle.trim() || !svcDesc.trim() || !orgId) return
    setSvcLoading(true)
    const res = await fetch('/api/knowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: svcTitle, description_for_ai: svcDesc, item_type: 'service', organization_id: orgId }),
    })
    if (res.ok) {
      const d = await res.json()
      setServices(prev => [...prev, d])
      setSvcTitle('')
      setSvcDesc('')
    }
    setSvcLoading(false)
  }

  async function deleteService(id: string) {
    await fetch(`/api/knowledge/${id}`, { method: 'DELETE' })
    setServices(prev => prev.filter(s => s.id !== id))
  }

  async function addFaq() {
    if (!faqQ.trim() || !faqA.trim() || !orgId) return
    setFaqLoading(true)
    const res = await fetch('/api/knowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: faqQ, description_for_ai: faqA, item_type: 'faq', organization_id: orgId }),
    })
    if (res.ok) {
      const d = await res.json()
      setFaqs(prev => [...prev, d])
      setFaqQ('')
      setFaqA('')
    }
    setFaqLoading(false)
  }

  async function deleteFaq(id: string) {
    await fetch(`/api/knowledge/${id}`, { method: 'DELETE' })
    setFaqs(prev => prev.filter(f => f.id !== id))
  }

  async function handleComplete(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    if (pricing.trim() && orgId) {
      await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Fiyatlandırma', description_for_ai: pricing, item_type: 'pricing', organization_id: orgId }),
      })
    }
    if (policy.trim() && orgId) {
      await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Genel Politika', description_for_ai: policy, item_type: 'policy', organization_id: orgId }),
      })
    }

    await fetch('/api/onboarding/complete', { method: 'POST' })
    router.push('/dashboard')
  }

  const steps = [
    { n: 1, label: 'İşletme Bilgileri' },
    { n: 2, label: 'Genel Tanıtım' },
    { n: 3, label: 'Hizmetler' },
    { n: 4, label: 'Sık Sorulan Sorular' },
    { n: 5, label: 'Politika & Fiyat' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-slate-100 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-brand-500 rounded-2xl px-4 py-2 inline-flex items-center justify-center mb-3">
            <img src="/stoaixlogo-tight.png" alt="stoaix" className="h-11 w-auto brightness-0 invert" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            {orgName ? `Hoş Geldiniz, ${orgName}` : 'Hoş Geldiniz'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">AI asistanınızı kurmak için birkaç adımı tamamlayın</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.n} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 ${step === s.n ? 'text-brand-600' : step > s.n ? 'text-green-600' : 'text-slate-400'}`}>
                {step > s.n ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 ${step === s.n ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-300 text-slate-400'}`}>
                    {s.n}
                  </div>
                )}
                <span className="text-xs font-medium hidden sm:inline">{s.label}</span>
              </div>
              {i < steps.length - 1 && <div className="w-8 h-px bg-slate-200" />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">

          {/* Step 1 — İşletme Bilgileri */}
          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-4">
              <div className="mb-2">
                <h2 className="text-base font-semibold text-slate-800">İşletme Bilgileri</h2>
                {orgName && <p className="text-sm text-slate-500 mt-0.5">{orgName}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+90 555 000 0000"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">İletişim E-postası</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={e => setContactEmail(e.target.value)}
                    placeholder="info@sirket.com"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Şehir</label>
                  <input
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="İstanbul"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ülke</label>
                  <select
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                  >
                    <option value="TR">Türkiye</option>
                    <option value="US">ABD</option>
                    <option value="DE">Almanya</option>
                    <option value="GB">İngiltere</option>
                    <option value="NL">Hollanda</option>
                    <option value="FR">Fransa</option>
                    <option value="AE">BAE</option>
                  </select>
                </div>
              </div>

              {step1Error && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{step1Error}</p>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition-colors"
                >
                  {loading ? 'Kaydediliyor...' : 'Devam Et →'}
                </button>
              </div>
            </form>
          )}

          {/* Step 2 — Genel Tanıtım */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-slate-800">Genel Tanıtım</h2>
                <p className="text-sm text-slate-500 mt-0.5">İşletmenizi tanıtın. Bu bilgiler AI asistanınızın müşterilere kendini tanıtmasında kullanılır.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Hakkımızda</label>
                <textarea
                  value={about}
                  onChange={e => setAbout(e.target.value)}
                  rows={4}
                  placeholder="İşletmeniz ne yapar? Kaç yıldır faaliyette? Neden tercih edilmeli? Kısaca tanıtın..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Çalışma Saatleri & Adres <span className="text-slate-400 font-normal">(isteğe bağlı)</span></label>
                <textarea
                  value={workingHours}
                  onChange={e => setWorkingHours(e.target.value)}
                  rows={3}
                  placeholder="Örn: Hafta içi 09:00–18:00, Cumartesi 10:00–14:00. Adres: Bağcılar, İstanbul"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm resize-none"
                />
              </div>

              <div className="flex justify-between pt-2">
                <button onClick={() => setStep(1)} className="text-sm text-slate-500 hover:text-slate-700">← Geri</button>
                <button
                  onClick={handleStep2General}
                  disabled={genLoading}
                  className="bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition-colors"
                >
                  {genLoading ? 'Kaydediliyor...' : 'Devam Et →'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Hizmetler */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-slate-800">Hizmetleriniz</h2>
                <p className="text-sm text-slate-500 mt-0.5">AI asistanınız bu bilgileri kullanarak müşterilere hizmetlerinizi tanıtacak.</p>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <input
                  value={svcTitle}
                  onChange={e => setSvcTitle(e.target.value)}
                  placeholder="Hizmet adı (ör. Dil Okulu Yerleştirme)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                />
                <textarea
                  value={svcDesc}
                  onChange={e => setSvcDesc(e.target.value)}
                  rows={3}
                  placeholder="Hizmet açıklaması — AI bu metni bağlam olarak kullanır"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm resize-none"
                />
                <button
                  onClick={addService}
                  disabled={svcLoading || !svcTitle.trim() || !svcDesc.trim()}
                  className="flex items-center gap-1.5 text-sm text-brand-600 font-medium disabled:opacity-50 hover:text-brand-700"
                >
                  <Plus size={16} />
                  {svcLoading ? 'Ekleniyor...' : 'Hizmet Ekle'}
                </button>
              </div>

              {services.length > 0 && (
                <div className="space-y-2">
                  {services.map(s => (
                    <div key={s.id} className="flex items-start justify-between gap-3 p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{s.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{s.description_for_ai}</p>
                      </div>
                      <button onClick={() => deleteService(s.id)} className="text-slate-400 hover:text-red-500 flex-shrink-0 mt-0.5">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between pt-2">
                <button onClick={() => setStep(2)} className="text-sm text-slate-500 hover:text-slate-700">← Geri</button>
                <button
                  onClick={() => setStep(4)}
                  className="bg-brand-500 hover:bg-brand-600 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition-colors"
                >
                  Devam Et →
                </button>
              </div>
            </div>
          )}

          {/* Step 4 — SSS */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-slate-800">Sık Sorulan Sorular</h2>
                <p className="text-sm text-slate-500 mt-0.5">Müşterilerin en çok sorduğu sorular ve cevapları ekleyin.</p>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <input
                  value={faqQ}
                  onChange={e => setFaqQ(e.target.value)}
                  placeholder="Soru (ör. Ücretsiz danışmanlık veriyor musunuz?)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                />
                <textarea
                  value={faqA}
                  onChange={e => setFaqA(e.target.value)}
                  rows={3}
                  placeholder="Cevap"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm resize-none"
                />
                <button
                  onClick={addFaq}
                  disabled={faqLoading || !faqQ.trim() || !faqA.trim()}
                  className="flex items-center gap-1.5 text-sm text-brand-600 font-medium disabled:opacity-50 hover:text-brand-700"
                >
                  <Plus size={16} />
                  {faqLoading ? 'Ekleniyor...' : 'SSS Ekle'}
                </button>
              </div>

              {faqs.length > 0 && (
                <div className="space-y-2">
                  {faqs.map(f => (
                    <div key={f.id} className="flex items-start justify-between gap-3 p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{f.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{f.description_for_ai}</p>
                      </div>
                      <button onClick={() => deleteFaq(f.id)} className="text-slate-400 hover:text-red-500 flex-shrink-0 mt-0.5">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between pt-2">
                <button onClick={() => setStep(3)} className="text-sm text-slate-500 hover:text-slate-700">← Geri</button>
                <button
                  onClick={() => setStep(5)}
                  className="bg-brand-500 hover:bg-brand-600 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition-colors"
                >
                  Devam Et →
                </button>
              </div>
            </div>
          )}

          {/* Step 5 — Politika & Fiyatlandırma */}
          {step === 5 && (
            <form onSubmit={handleComplete} className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-slate-800">Politika & Fiyatlandırma</h2>
                <p className="text-sm text-slate-500 mt-0.5">Bu adım isteğe bağlıdır, isterseniz atlayabilirsiniz.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fiyatlandırma Notu</label>
                <textarea
                  value={pricing}
                  onChange={e => setPricing(e.target.value)}
                  rows={4}
                  placeholder="Fiyat aralıklarınız, paketleriniz veya fiyatlandırma politikanız hakkında genel bilgi..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Genel Politika & Kurallar</label>
                <textarea
                  value={policy}
                  onChange={e => setPolicy(e.target.value)}
                  rows={4}
                  placeholder="İptal politikası, AI asistanın yanıt vermemesi gereken konular, garantiler, çalışma koşulları vb..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm resize-none"
                />
              </div>

              <div className="flex justify-between pt-2">
                <button type="button" onClick={() => setStep(4)} className="text-sm text-slate-500 hover:text-slate-700">← Geri</button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2"
                >
                  <CheckCircle2 size={16} />
                  {loading ? 'Tamamlanıyor...' : 'Kurulumu Tamamla'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
