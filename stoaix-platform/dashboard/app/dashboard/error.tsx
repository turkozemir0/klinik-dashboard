'use client'

import { useEffect } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[dashboard-error]', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-lg font-semibold text-slate-800">
          Bir hata oluştu
        </h2>
        <p className="max-w-md text-sm text-slate-500">
          Sayfa yüklenirken beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.
        </p>
        <button
          onClick={reset}
          className="mt-2 flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600"
        >
          <RotateCcw size={14} />
          Tekrar dene
        </button>
        {error.digest && (
          <p className="mt-2 text-xs text-slate-400">Hata kodu: {error.digest}</p>
        )}
      </div>
    </div>
  )
}
