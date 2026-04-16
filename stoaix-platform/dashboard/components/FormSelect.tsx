'use client'

import { SelectHTMLAttributes, ReactNode } from 'react'
import { ChevronDown, AlertCircle } from 'lucide-react'

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  description?: string
  error?: string
  options: Array<{ value: string; label: string }>
  icon?: ReactNode
}

export function FormSelect({
  label,
  description,
  error,
  options,
  icon,
  className = '',
  disabled,
  ...props
}: FormSelectProps) {
  const hasError = !!error

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
        <div
          className={`
            relative flex items-center gap-3 px-4 py-3
            rounded-2xl transition-all duration-200
            border border-slate-200 bg-white/90 backdrop-blur
            hover:border-slate-300 hover:bg-white
            focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20
            ${hasError && 'border-red-500 focus-within:ring-red-300/50 focus-within:border-red-500'}
            ${disabled && 'opacity-50 cursor-not-allowed bg-slate-100'}
          `}
        >
          {icon && (
            <div className="text-slate-400 flex-shrink-0">
              {icon}
            </div>
          )}

          <select
            {...props}
            disabled={disabled}
            className={`
              flex-1 bg-transparent outline-none text-sm
              text-slate-900 disabled:cursor-not-allowed
              appearance-none cursor-pointer
              ${className}
            `}
          >
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none flex-shrink-0" />
        </div>
      </div>

      {hasError && (
        <div className="flex items-center gap-2 mt-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}
    </div>
  )
}
