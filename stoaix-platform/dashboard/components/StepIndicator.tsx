'use client'

import { Check } from 'lucide-react'

interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
  steps?: string[]
}

export function StepIndicator({ currentStep, totalSteps, steps }: StepIndicatorProps) {
  return (
    <div className="w-full">
      {/* Visual Progress Bar */}
      <div className="mb-6">
        <div className="flex gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => {
            const stepNum = i + 1
            const isCompleted = stepNum < currentStep
            const isCurrent = stepNum === currentStep

            return (
              <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden bg-slate-200">
                <div
                  className={`
                    h-full rounded-full transition-all duration-700 ease-out
                    ${
                      isCompleted
                        ? 'w-full bg-gradient-to-r from-brand-500 to-accent-400'
                        : isCurrent
                          ? 'w-full bg-gradient-to-r from-brand-500 to-accent-400 shadow-lg shadow-brand-400/50'
                          : 'w-0 bg-slate-200'
                    }
                  `}
                  style={{
                    animation: isCurrent ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none',
                  }}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Step Numbers & Labels */}
      {steps && steps.length > 0 && (
        <div className="flex gap-4 justify-between">
          {steps.map((label, i) => {
            const stepNum = i + 1
            const isCompleted = stepNum < currentStep
            const isCurrent = stepNum === currentStep

            return (
              <div key={i} className="flex-1 flex items-start gap-3 group">
                {/* Step Circle */}
                <div
                  className={`
                    relative w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                    font-semibold text-sm transition-all duration-300
                    ${
                      isCompleted
                        ? 'bg-gradient-to-br from-brand-500 to-accent-400 text-white shadow-lg shadow-brand-500/30'
                        : isCurrent
                          ? 'bg-gradient-to-br from-brand-400 to-pink-500 text-white ring-4 ring-brand-200 scale-110 shadow-lg shadow-brand-500/40'
                          : 'bg-slate-100 text-slate-400'
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span>{stepNum}</span>
                  )}
                </div>

                {/* Label (responsive) */}
                <div className="hidden sm:block text-left">
                  <p
                    className={`
                      text-xs font-medium transition-colors duration-300
                      ${isCurrent ? 'text-brand-600' : isCompleted ? 'text-slate-600' : 'text-slate-400'}
                    `}
                  >
                    {label}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  )
}
