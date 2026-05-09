'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, AlertCircle, Loader2, Unplug, RefreshCw } from 'lucide-react'
import { useLang } from '@/lib/lang-context'

interface Props {
  onStatusChange?: (connected: boolean) => void
}

export function CapiConfig({ onStatusChange }: Props) {
  const { lang } = useLang()
  const isTr = lang === 'tr'

  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [pixelId, setPixelId] = useState('')
  const [connectedAt, setConnectedAt] = useState<string | null>(null)

  // Form state
  const [inputPixelId, setInputPixelId] = useState('')
  const [inputToken, setInputToken] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)

  useEffect(() => {
    fetchStatus()
  }, [])

  async function fetchStatus() {
    setLoading(true)
    try {
      const res = await fetch('/api/capi/status')
      const data = await res.json()
      setConnected(data.connected)
      setPixelId(data.pixel_id || '')
      setConnectedAt(data.connected_at)
      onStatusChange?.(data.connected)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  async function handleConnect() {
    setError(null)
    setSaving(true)
    try {
      const res = await fetch('/api/capi/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pixel_id: inputPixelId.trim(), access_token: inputToken.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.detail || data.error || 'Bağlantı başarısız')
        return
      }
      setConnected(true)
      setPixelId(inputPixelId.trim())
      setConnectedAt(new Date().toISOString())
      setInputPixelId('')
      setInputToken('')
      onStatusChange?.(true)
    } catch {
      setError(isTr ? 'Bağlantı hatası' : 'Connection error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDisconnect() {
    setSaving(true)
    try {
      await fetch('/api/capi/disconnect', { method: 'DELETE' })
      setConnected(false)
      setPixelId('')
      setConnectedAt(null)
      onStatusChange?.(false)
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  async function handleTest() {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/capi/status')
      const data = await res.json()
      setTestResult(data.connected ? 'success' : 'error')
    } catch {
      setTestResult('error')
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
        <Loader2 size={16} className="animate-spin" />
        {isTr ? 'Yükleniyor...' : 'Loading...'}
      </div>
    )
  }

  // Connected state
  if (connected) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
          <CheckCircle2 size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-800">
              {isTr ? 'Meta CAPI Bağlı' : 'Meta CAPI Connected'}
            </p>
            <p className="text-xs text-green-600 mt-0.5">
              Pixel ID: <span className="font-mono">{pixelId}</span>
            </p>
            {connectedAt && (
              <p className="text-xs text-green-600 mt-0.5">
                {isTr ? 'Bağlanma:' : 'Connected:'} {new Date(connectedAt).toLocaleDateString(isTr ? 'tr-TR' : 'en-US')}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleTest}
            disabled={testing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
          >
            {testing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            {isTr ? 'Bağlantıyı Test Et' : 'Test Connection'}
          </button>
          <button
            onClick={handleDisconnect}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            <Unplug size={13} />
            {isTr ? 'Bağlantıyı Kes' : 'Disconnect'}
          </button>
        </div>

        {testResult === 'success' && (
          <p className="text-xs text-green-600">{isTr ? 'Bağlantı başarılı ✓' : 'Connection successful ✓'}</p>
        )}
        {testResult === 'error' && (
          <p className="text-xs text-red-600">{isTr ? 'Bağlantı doğrulanamadı' : 'Connection validation failed'}</p>
        )}
      </div>
    )
  }

  // Disconnected — manual setup form
  return (
    <div className="space-y-4">
      {/* Mode tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
        <button className="flex-1 px-3 py-1.5 text-xs font-medium rounded-md bg-white shadow-sm text-slate-800">
          {isTr ? 'Manuel' : 'Manual'}
        </button>
        <button disabled className="flex-1 px-3 py-1.5 text-xs font-medium rounded-md text-slate-400 cursor-not-allowed">
          {isTr ? 'Otomatik (Yakında)' : 'Automatic (Coming Soon)'}
        </button>
      </div>

      <p className="text-sm text-slate-600">
        {isTr
          ? 'Meta Business Manager → Etkinlik Yöneticisi → Pixel ID ve Sistem Kullanıcıları → Token bilgilerini girin.'
          : 'Enter Pixel ID from Meta Events Manager and System User Token from Business Manager.'}
      </p>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Pixel ID</label>
          <input
            type="text"
            value={inputPixelId}
            onChange={(e) => setInputPixelId(e.target.value)}
            placeholder="123456789012345"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Access Token</label>
          <input
            type="password"
            value={inputToken}
            onChange={(e) => setInputToken(e.target.value)}
            placeholder="EAAxxxxxx..."
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200">
          <AlertCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      <button
        onClick={handleConnect}
        disabled={saving || !inputPixelId.trim() || !inputToken.trim()}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving && <Loader2 size={14} className="animate-spin" />}
        {isTr ? 'Bağla & Doğrula' : 'Connect & Validate'}
      </button>

      <p className="text-xs text-slate-400">
        {isTr
          ? 'Token doğrulaması için Pixel\'e okuma erişimi test edilecektir.'
          : 'Read access to the Pixel will be tested for token validation.'}
      </p>
    </div>
  )
}
