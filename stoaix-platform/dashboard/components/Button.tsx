'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
  rounded?: 'sm' | 'md' | 'lg' | 'full'
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  iconPosition = 'right',
  fullWidth = false,
  rounded = 'lg',
  className = '',
  disabled,
  children,
  ...props
}: ButtonProps) {
  const baseStyles = `
    inline-flex items-center justify-center gap-2 font-medium
    transition-all duration-200
    active:scale-[0.99]
    disabled:opacity-60 disabled:cursor-not-allowed
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white
  `

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  const roundedStyles = {
    sm: 'rounded-md',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    full: 'rounded-full',
  }

  const variantStyles = {
    primary: `
      bg-slate-950 text-white
      hover:bg-slate-800
      shadow-[0_12px_30px_rgba(15,23,42,0.16)]
      focus:ring-slate-300
    `,
    secondary: `
      bg-white text-slate-900 border border-slate-200
      hover:bg-slate-50
      focus:ring-slate-300
    `,
    danger: `
      bg-red-600 text-white
      hover:bg-red-700
      shadow-[0_12px_30px_rgba(220,38,38,0.22)]
      focus:ring-red-300
    `,
    success: `
      bg-emerald-600 text-white
      hover:bg-emerald-700
      shadow-[0_12px_30px_rgba(5,150,105,0.20)]
      focus:ring-green-300
    `,
    outline: `
      bg-white/70 border border-slate-200 text-slate-700 backdrop-blur
      hover:bg-slate-50
      focus:ring-brand-300
    `,
  }

  const widthStyle = fullWidth ? 'w-full' : ''

  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={`
        ${baseStyles}
        ${sizeStyles[size]}
        ${roundedStyles[rounded]}
        ${variantStyles[variant]}
        ${widthStyle}
        ${className}
      `}
    >
      {isLoading ? (
        <>
          <div className="animate-spin">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
          </div>
          <span>Yükleniyor...</span>
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          {children}
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </button>
  )
}
