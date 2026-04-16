'use client'

import { InputHTMLAttributes, ReactNode } from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  description?: string
  error?: string
  success?: string
  icon?: ReactNode
  rightIcon?: ReactNode
  isLoading?: boolean
  variant?: 'default' | 'outlined'
}

export function FormInput({
  label,
  description,
  error,
  success,
  icon,
  rightIcon,
  isLoading,
  variant = 'default',
  className = '',
  disabled,
  ...props
}: FormInputProps) {
  const hasError = !!error
  const hasSuccess = !!success

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
            ${
              variant === 'default'
                ? `
                  border border-slate-200
                  bg-white/90 backdrop-blur
                  hover:border-slate-300 hover:bg-white
                  focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20
                  ${hasError && 'border-red-500 focus-within:ring-red-300/50 focus-within:border-red-500'}
                  ${hasSuccess && 'border-green-500 focus-within:ring-green-300/50'}
                `
                : `
                  border-2 border-slate-200
                  bg-white
                  hover:border-brand-400
                  focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-200/50
                  ${hasError && 'border-red-500'}
                  ${hasSuccess && 'border-green-500'}
                `
            }
            ${disabled && 'opacity-50 cursor-not-allowed bg-slate-100'}
          `}
        >
          {/* Left Icon */}
          {icon && (
            <div className="text-slate-400 flex-shrink-0">
              {icon}
            </div>
          )}

          {/* Input */}
          <input
            {...props}
            disabled={disabled || isLoading}
            className={`
              flex-1 bg-transparent outline-none text-sm
              placeholder:text-slate-400 text-slate-900
              disabled:cursor-not-allowed
              ${className}
            `}
          />

          {/* Right Icon / Status Icon */}
          <div className="flex-shrink-0 flex items-center gap-2">
            {isLoading && (
              <div className="animate-spin">
                <div className="w-4 h-4 border-2 border-brand-300 border-t-brand-500 rounded-full" />
              </div>
            )}
            {hasError && !isLoading && (
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            )}
            {hasSuccess && !isLoading && (
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
            )}
            {rightIcon && !hasError && !hasSuccess && !isLoading && (
              <div className="text-slate-400">
                {rightIcon}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {hasError && (
        <div className="flex items-center gap-2 mt-2">
          <div className="h-1 w-1 rounded-full bg-red-500" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {hasSuccess && !hasError && (
        <div className="flex items-center gap-2 mt-2">
          <div className="h-1 w-1 rounded-full bg-green-500" />
          <p className="text-xs text-green-600">{success}</p>
        </div>
      )}
    </div>
  )
}
