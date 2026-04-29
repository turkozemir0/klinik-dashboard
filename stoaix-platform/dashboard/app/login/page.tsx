'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { t } from '@/lib/i18n'

type View = 'login' | 'forgot' | 'link-sent'

export default function LoginPage() {
  const router = useRouter()
  const [view, setView] = useState<View>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sentType, setSentType] = useState<'magic' | 'reset'>('magic')

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(t.loginError)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  async function handleMagicLink() {
    if (!email) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    })

    setLoading(false)
    if (error) {
      console.error('Magic link error:', error.message, error)
      setError(`${t.magicLinkError} (${error.message})`)
      return
    }

    setSentType('magic')
    setView('link-sent')
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })

    setLoading(false)
    if (error) {
      console.error('Reset password error:', error.message, error)
      setError(`${t.resetEmailError} (${error.message})`)
      return
    }

    setSentType('reset')
    setView('link-sent')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="bg-brand-500 rounded-2xl px-4 py-2 inline-flex items-center justify-center mb-4">
            <img src="/stoaixlogo-tight.png" alt="stoaix" className="h-12 w-auto brightness-0 invert" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">stoaix</h1>
          <p className="text-slate-500 text-sm mt-1">
            {view === 'forgot' ? t.forgotTitle : view === 'link-sent' ? t.linkSentTitle : t.loginTitle}
          </p>
        </div>

        {/* === LOGIN VIEW === */}
        {view === 'login' && (
          <>
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t.email}</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-700">{t.password}</label>
                  <button
                    type="button"
                    onClick={() => { setError(''); setView('forgot') }}
                    className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                  >
                    {t.forgotPassword}
                  </button>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
              >
                {loading ? t.loading : t.loginBtn}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center my-5">
              <div className="flex-1 border-t border-slate-200" />
              <span className="px-3 text-xs text-slate-400 uppercase">{t.orDivider}</span>
              <div className="flex-1 border-t border-slate-200" />
            </div>

            {/* Magic Link */}
            <button
              onClick={handleMagicLink}
              disabled={loading || !email}
              className="w-full border border-slate-200 hover:border-brand-300 hover:bg-brand-50 disabled:opacity-60 text-slate-700 font-medium py-2.5 rounded-lg transition-colors text-sm"
            >
              {t.sendMagicLink}
            </button>
            {!email && (
              <p className="text-xs text-slate-400 text-center mt-2">
                Giriş linki almak için yukarıya e-posta adresinizi girin
              </p>
            )}
          </>
        )}

        {/* === FORGOT VIEW === */}
        {view === 'forgot' && (
          <>
            <p className="text-sm text-slate-500 mb-5">{t.forgotDesc}</p>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t.email}</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
                  required
                  autoComplete="email"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
              >
                {loading ? t.loading : t.sendResetLink}
              </button>
            </form>

            <button
              onClick={() => { setError(''); setView('login') }}
              className="w-full text-sm text-slate-500 hover:text-brand-600 mt-4 font-medium"
            >
              {t.backToLogin}
            </button>
          </>
        )}

        {/* === LINK SENT VIEW === */}
        {view === 'link-sent' && (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-slate-600">
              {sentType === 'magic' ? t.magicLinkSent : t.resetLinkSent}
            </p>
            <button
              onClick={() => { setError(''); setView('login') }}
              className="text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              {t.backToLogin}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
