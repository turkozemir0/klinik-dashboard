'use client'

import { TextareaHTMLAttributes } from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  description?: string
  error?: string
  success?: string
  charLimit?: number
  showCharCount?: boolean
}

export function FormTextarea({
  label,
  description,
  error,
  success,
  charLimit,
  showCharCount = false,
  className = '',
  disabled,
  value,
  ...props
}: FormTextareaProps) {
  const hasError = !!error
  const hasSuccess = !!success
  const charCount = typeof value === 'string' ? value.length : 0
  const isNearLimit = charLimit && charCount > charLimit * 0.8

  return (
    <div className="w-full space-y-2">
      {label && (
        <label className="block text-sm font-medium text-slate-900">
          {label}
          {props.required && <span className="text-pink-500 ml-1">*</span>}
        </label>
      )}

      {description && (
        <p className="text-xs text-slate-500">{description}</p>
      )}

      <div className="relative">
        <textarea
          {...props}
          value={value}
          disabled={disabled}
          className={`
            w-full px-4 py-3 rounded-2xl
            border border-slate-200 bg-white/90 backdrop-blur
            text-sm text-slate-900 placeholder:text-slate-400
            resize-none transition-all duration-200
            hover:border-slate-300 hover:bg-white
            focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none
            disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-100
            ${hasError && 'border-red-500 focus:ring-red-300/50 focus:border-red-500'}
            ${hasSuccess && 'border-green-500 focus:ring-green-300/50'}
            ${isNearLimit && 'border-yellow-500'}
            ${className}
          `}
        />
      </div>

      {/* Footer with char count and status */}
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-2">
          {hasError && (
            <div className="flex items-center gap-2 mt-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}
          {hasSuccess && !hasError && (
            <div className="flex items-center gap-2 mt-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              <p className="text-xs text-green-600">{success}</p>
            </div>
          )}
        </div>

        {showCharCount && charLimit && (
          <p
            className={`text-xs mt-2 ${
              isNearLimit ? 'text-yellow-600 font-medium' : 'text-slate-400'
            }`}
          >
            {charCount}/{charLimit}
          </p>
        )}
      </div>
    </div>
  )
}
