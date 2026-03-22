'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, MessageSquare, Phone, BookOpen, Settings, LogOut, ShieldCheck, LifeBuoy, Bot, RefreshCw, ClipboardList } from 'lucide-react'
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
  { href: '/dashboard/agent',    label: 'AI Asistan',   icon: Bot },
  { href: '/dashboard/followup', label: 'Follow-up',    icon: RefreshCw },
  { href: '/dashboard/support',  label: t.tickets,      icon: LifeBuoy },
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
      <div className="px-4 py-4 border-b border-slate-100">
        <div className="bg-brand-500 rounded-xl px-3 py-2 flex items-center justify-center">
          <img src="/stoaixlogo-tight.png" alt="stoaix" className="h-9 w-auto brightness-0 invert" />
        </div>
        <p className="text-xs text-slate-400 truncate text-center mt-2">{orgName}</p>
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
            <Link
              href="/admin/checklist"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/admin/checklist'
                  ? 'bg-brand-50 text-brand-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <ClipboardList size={16} />
              Kurulum Checklist
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
