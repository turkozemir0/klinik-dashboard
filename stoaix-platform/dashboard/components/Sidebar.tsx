'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, MessageSquare, Phone, BookOpen, Settings, LogOut, ShieldCheck } from 'lucide-react'
import { t } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'

interface Props {
  orgName: string
  isSuperAdmin?: boolean
}

const navItems = [
  { href: '/dashboard', label: t.overview, icon: LayoutDashboard },
  { href: '/dashboard/conversations', label: t.conversations, icon: MessageSquare },
  { href: '/dashboard/calls', label: t.calls, icon: Phone },
  { href: '/dashboard/knowledge', label: t.knowledge, icon: BookOpen },
]

export default function Sidebar({ orgName, isSuperAdmin }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-60 flex-shrink-0 bg-white border-r border-slate-100 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">stoaix</p>
            <p className="text-xs text-slate-400 truncate max-w-[140px]">{orgName}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-brand-50 text-brand-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}

        {isSuperAdmin && (
          <>
            <div className="pt-2 pb-1 px-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Admin</p>
            </div>
            <Link
              href="/admin"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith('/admin')
                  ? 'bg-brand-50 text-brand-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <ShieldCheck size={16} />
              {t.admin}
            </Link>
            <Link
              href="/admin/tickets"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/admin/tickets'
                  ? 'bg-brand-50 text-brand-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Settings size={16} />
              {t.tickets}
            </Link>
          </>
        )}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4 border-t border-slate-100 pt-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 w-full transition-colors"
        >
          <LogOut size={16} />
          {t.logout}
        </button>
      </div>
    </aside>
  )
}
