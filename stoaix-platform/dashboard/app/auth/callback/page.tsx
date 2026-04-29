'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/onboarding'
  const code = searchParams.get('code')
  const [error, setError] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    async function handleAuth() {
      // 1. Try PKCE code exchange
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
          router.replace(next)
          return
        }
      }

      // 2. Try hash tokens (implicit flow from server-generated magic links)
      const hash = window.location.hash.substring(1)
      if (hash) {
        const params = new URLSearchParams(hash)
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          if (!error) {
            router.replace(next)
            return
          }
        }
      }

      // 3. Check if already authenticated
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.replace(next)
        return
      }

      // Nothing worked
      setError(true)
    }

    handleAuth()
  }, [code, next, router])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <p className="text-slate-600">Oturum açılamadı veya link süresi dolmuş.</p>
          <a href="/login" className="text-blue-600 hover:underline font-medium">Giriş sayfasına git</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-500 text-sm">Yönlendiriliyorsunuz...</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  )
}
