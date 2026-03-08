'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutDashboard,
  Users,
  ArrowRightLeft,
  BarChart3,
  LogOut,
  Activity,
  ChevronRight,
  BookOpen,
  Settings,
  Menu,
  X,
  Phone,
} from 'lucide-react';
import clsx from 'clsx';
import { useState } from 'react';
import { useTranslation } from '@/lib/i18n/LanguageProvider';
import type { Clinic } from '@/types';

interface SidebarProps {
  clinic: Clinic;
}

export default function Sidebar({ clinic }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useTranslation();

  const navItems = [
    { href: '/dashboard',           label: t.sidebar.overview,        icon: LayoutDashboard, exact: true },
    { href: '/dashboard/leads',     label: t.sidebar.leadPipeline,    icon: Users },
    { href: '/dashboard/handoffs',  label: t.sidebar.handoffLogs,     icon: ArrowRightLeft },
    { href: '/dashboard/calls',     label: t.sidebar.callLogs,        icon: Phone },
    { href: '/dashboard/services',  label: t.sidebar.serviceAnalytics, icon: BarChart3 },
    { href: '/dashboard/knowledge', label: t.sidebar.knowledgeBase,   icon: BookOpen },
    { href: '/dashboard/settings',  label: t.sidebar.settings,        icon: Settings },
  ];

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const navList = (
    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
      {navItems.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
              isActive
                ? 'bg-brand-50 text-brand-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            )}
          >
            <item.icon
              className={clsx(
                'flex-shrink-0',
                isActive ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'
              )}
              size={18}
            />
            <span className="flex-1">{item.label}</span>
            {isActive && <ChevronRight className="w-3.5 h-3.5 text-brand-400" />}
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <div className="p-6 border-b border-slate-100">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">{clinic.name}</p>
          <p className="text-xs text-slate-500 truncate">{t.sidebar.aiPanel}</p>
        </div>
      </div>
    </div>
  );

  const footer = (
    <div className="p-4 border-t border-slate-100 space-y-3">
      <div className="bg-slate-50 rounded-xl px-3 py-2.5 space-y-1">
        {clinic.lead_doctor_name && (
          <p className="text-xs font-medium text-slate-700 truncate">{clinic.lead_doctor_name}</p>
        )}
        {clinic.phone && (
          <p className="text-xs text-slate-500 truncate">{clinic.phone}</p>
        )}
        <div className="flex items-center gap-1.5 pt-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-xs text-emerald-700 font-medium">{t.sidebar.systemActive}</span>
        </div>
      </div>
      <button
        onClick={handleSignOut}
        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
      >
        <LogOut className="w-4 h-4" />
        {t.common.signOut}
      </button>
    </div>
  );

  return (
    <>
      {/* ── Desktop Sidebar ──────────────────────────────────────── */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 bg-white border-r border-slate-200 flex-col h-screen sticky top-0">
        {brand}
        {navList}
        {footer}
      </aside>

      {/* ── Mobile Top Bar ───────────────────────────────────────── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 flex items-center gap-3 px-4 h-14">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
          aria-label="Menüyü aç"
        >
          <Menu className="w-5 h-5 text-slate-700" />
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <p className="text-sm font-bold text-slate-900 truncate">{clinic.name}</p>
        </div>
      </div>

      {/* ── Mobile Drawer ────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <aside className="relative w-72 bg-white flex flex-col h-full shadow-2xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Kapat"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
            {brand}
            {navList}
            {footer}
          </aside>
        </div>
      )}
    </>
  );
}
