'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { t } from '@/lib/i18n'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError(t.passwordTooShort)
      return
    }

    if (password !== confirmPassword) {
      setError(t.passwordMismatch)
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(t.passwordResetError)
      setLoading(false)
      return
    }

    setSuccess(true)
    setTimeout(() => {
      router.push('/dashboard')
      router.refresh()
    }, 2000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="bg-brand-500 rounded-2xl px-4 py-2 inline-flex items-center justify-center mb-4">
            <img src="/stoaixlogo-tight.png" alt="stoaix" className="h-12 w-auto brightness-0 invert" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">stoaix</h1>
          <p className="text-slate-500 text-sm mt-1">{t.resetPasswordTitle}</p>
        </div>

        {success ? (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm text-slate-600">{t.passwordResetSuccess}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t.newPassword}</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t.confirmPassword}</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
                required
                minLength={6}
                autoComplete="new-password"
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
              {loading ? t.loading : t.resetPasswordBtn}
            </button>

            <a
              href="/login"
              className="block text-center text-sm text-slate-500 hover:text-brand-600 font-medium"
            >
              {t.backToLogin}
            </a>
          </form>
        )}
      </div>
    </div>
  )
}
