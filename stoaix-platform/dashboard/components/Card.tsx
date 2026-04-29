import { type ReactNode } from 'react'

interface Props {
  title?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  noPadding?: boolean
}

export default function Card({ title, action, children, className = '', noPadding }: Props) {
  return (
    <div className={`bg-white rounded-xl border border-slate-100 shadow-[0_1px_3px_rgba(14,165,233,0.03)] ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
          {title && <h2 className="text-sm font-semibold text-slate-700">{title}</h2>}
          {action}
        </div>
      )}
      {noPadding ? children : <div className="p-5">{children}</div>}
    </div>
  )
}
