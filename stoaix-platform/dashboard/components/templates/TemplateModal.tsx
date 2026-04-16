'use client'

import { useState } from 'react'
import { X, Loader2, Send, Save } from 'lucide-react'

interface Props {
  onClose:  () => void
  onSaved:  (template: any, submit?: boolean) => void
}

const CATEGORY_LABELS: Record<string, string> = {
  MARKETING:      'Pazarlama',
  UTILITY:        'Hizmet',
  AUTHENTICATION: 'Kimlik Doğrulama',
}

const LANG_LABELS: Record<string, string> = {
  tr: 'Türkçe (tr)',
  en: 'İngilizce (en)',
}

const PURPOSE_LABELS: Record<string, string> = {
  followup:             'Takip Mesajı',
  reengagement:         'Yeniden Bağlama',
  unsubscribe:          'Listeden Çıkma',
  appointment_reminder: 'Randevu Hatırlatma',
  other:                'Diğer',
}

export default function TemplateModal({ onClose, onSaved }: Props) {
  const [name, setName]           = useState('')
  const [language, setLanguage]   = useState('tr')
  const [category, setCategory]   = useState('UTILITY')
  const [purpose, setPurpose]     = useState('followup')
  const [bodyText, setBodyText]   = useState('')
  const [saving, setSaving]       = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]         = useState('')

  const nameError = name && !/^[a-z0-9_]+$/.test(name)
    ? 'Sadece küçük harf, rakam ve alt çizgi (_) kullanılabilir'
    : ''

  function buildComponents() {
    return [{ type: 'BODY', text: bodyText.trim() }]
  }

  async function save(andSubmit = false) {
    if (!name.trim() || !bodyText.trim()) {
      setError('Template adı ve mesaj içeriği zorunludur.')
      return
    }
    if (nameError) return

    const setter = andSubmit ? setSubmitting : setSaving
    setter(true)
    setError('')

    try {
      const res = await fetch('/api/templates', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:       name.trim(),
          language,
          category,
          purpose,
          components: buildComponents(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Kayıt başarısız')

      const template = data.template

      if (andSubmit) {
        const submitRes = await fetch(`/api/templates/${template.id}/submit`, { method: 'POST' })
        const submitData = await submitRes.json()
        if (!submitRes.ok) throw new Error(submitData.error ?? 'Meta gönderimi başarısız')
        onSaved({ ...template, status: 'pending' }, true)
      } else {
        onSaved(template, false)
      }
    } catch (e: any) {
      setError(e.message ?? 'Bir hata oluştu')
    } finally {
      setSaving(false)
      setSubmitting(false)
    }
  }

  const preview = bodyText.replace(/\{\{(\d+)\}\}/g, (_, n) => `[Değişken ${n}]`)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">Yeni Template</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Template Adı <span className="text-red-500">*</span>
              <span className="ml-1 text-slate-400 font-normal">(küçük harf, rakam, alt çizgi)</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
              placeholder="klinik_hatirlatma"
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                nameError ? 'border-red-300' : 'border-slate-200'
              }`}
            />
            {nameError && <p className="text-xs text-red-500 mt-1">{nameError}</p>}
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Kullanım Amacı</label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {Object.entries(PURPOSE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          {/* Language + Category row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Dil</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {Object.entries(LANG_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Body text */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Mesaj İçeriği <span className="text-red-500">*</span>
              <span className="ml-1 text-slate-400 font-normal">— değişkenler: {'{{1}}'}, {'{{2}}'}</span>
            </label>
            <textarea
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              placeholder={`Merhaba {{1}}, randevunuz yarın saat {{2}}'de. İyi günler dileriz.`}
              rows={4}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Preview */}
          {bodyText.trim() && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1.5">Önizleme</p>
              <div className="bg-[#dcf8c6] rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-slate-800 max-w-xs shadow-sm">
                {preview}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
          >
            İptal
          </button>
          <button
            onClick={() => save(false)}
            disabled={saving || submitting || !name.trim() || !bodyText.trim() || !!nameError}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Taslak Kaydet
          </button>
          <button
            onClick={() => save(true)}
            disabled={saving || submitting || !name.trim() || !bodyText.trim() || !!nameError}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Kaydet &amp; Meta&apos;ya Gönder
          </button>
        </div>
      </div>
    </div>
  )
}
