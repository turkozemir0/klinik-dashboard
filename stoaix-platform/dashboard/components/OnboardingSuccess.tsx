'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function OnboardingSuccess({ clinicName }: { clinicName: string }) {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    const timer = setTimeout(() => {
      router.push('/dashboard')
    }, 5000)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-success-50 via-white to-green-50 flex items-center justify-center px-4 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-success-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30" style={{ animationDelay: '2s' }} />
      </div>

      <div
        className={`
          max-w-2xl w-full transform transition-all duration-700
          ${isVisible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}
        `}
      >
        {/* Success Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 animate-pulse">
              <div className="w-32 h-32 bg-success-400 rounded-full blur-2xl opacity-40" />
            </div>
            <div className="relative w-32 h-32 bg-gradient-to-br from-success-500 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl shadow-success-400/50">
              <CheckCircle2 className="w-16 h-16 text-white animate-bounce" style={{ animationDelay: '0.3s' }} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-3 leading-tight">
            Tebrikler! 🎉
          </h1>
          <p className="text-xl text-slate-600 mb-2">
            <span className="font-semibold text-success-600">{clinicName}</span> kurulumu tamamlandı
          </p>
          <p className="text-slate-600">
            Harika! Artık hastalarınız size danışma talebinde bulunabilir
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          <div className="bg-white rounded-lg p-4 border border-slate-200 text-center">
            <p className="text-2xl font-bold text-brand-600 mb-1">24/7</p>
            <p className="text-xs text-slate-600">Danışma Hizmeti</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-slate-200 text-center">
            <p className="text-2xl font-bold text-accent-600 mb-1">∞</p>
            <p className="text-xs text-slate-600">Sınırsız Hastalar</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-slate-200 text-center">
            <p className="text-2xl font-bold text-success-600 mb-1">✓</p>
            <p className="text-xs text-slate-600">AI Asistanı</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => router.push('/dashboard')}
            className={`
              w-full flex items-center justify-center gap-2 px-6 py-4
              bg-gradient-to-r from-brand-500 to-accent-400 hover:from-brand-600 hover:to-accent-500
              text-white font-semibold rounded-lg
              transition-all duration-300 transform hover:scale-105 hover:-translate-y-1
              shadow-lg shadow-brand-500/30
              ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}
            style={{ transitionDelay: '0.3s' }}
          >
            Dashboard'a Git
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-center text-sm text-slate-500">
            Otomatik yönlendirileceksiniz...
          </p>
        </div>
      </div>
    </div>
  )
}
