'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function DemoRedirect() {
  const searchParams = useSearchParams()
  const ref = searchParams.get('ref')
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    if (!ref) return
    setRedirecting(true)
    window.location.href = `/api/demo/session?ref=${encodeURIComponent(ref)}`
  }, [ref])

  if (!ref) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-sky-50">
        <div className="text-center max-w-md px-6">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <svg className="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <p className="text-lg font-medium text-slate-700">Bu sayfaya erişmek için partner bağlantısı gereklidir.</p>
          <p className="mt-2 text-sm text-slate-400">Lütfen size iletilen demo bağlantısını kullanın.</p>
        </div>
      </div>
    )
  }

  if (redirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-sky-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-sky-200 border-t-sky-600" />
          <p className="text-lg font-medium text-slate-700">Demo Hesabına Bağlanıyor...</p>
          <p className="mt-1 text-sm text-slate-400">Lütfen bekleyin</p>
        </div>
      </div>
    )
  }

  return null
}

export default function DemoPage() {
  return (
    <Suspense fallback={null}>
      <DemoRedirect />
    </Suspense>
  )
}
