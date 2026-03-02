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
} from 'lucide-react';
import clsx from 'clsx';
import type { Clinic } from '@/types';

const navItems = [
  {
    href: '/dashboard',
    label: 'Genel Bakış',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: '/dashboard/leads',
    label: 'Lead Pipeline',
    icon: Users,
  },
  {
    href: '/dashboard/handoffs',
    label: 'Handoff Logları',
    icon: ArrowRightLeft,
  },
  {
    href: '/dashboard/services',
    label: 'Hizmet Analitik',
    icon: BarChart3,
  },
  {
    href: '/dashboard/knowledge',
    label: 'Knowledge Base',
    icon: BookOpen,
  },
];

interface SidebarProps {
  clinic: Clinic;
}

export default function Sidebar({ clinic }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
      {/* Brand */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">{clinic.name}</p>
            <p className="text-xs text-slate-500 truncate">AI Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <item.icon
                className={clsx(
                  'w-4.5 h-4.5 flex-shrink-0',
                  isActive ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'
                )}
                size={18}
              />
              <span className="flex-1">{item.label}</span>
              {isActive && (
                <ChevronRight className="w-3.5 h-3.5 text-brand-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Clinic info + logout */}
      <div className="p-4 border-t border-slate-100 space-y-3">
        {/* Clinic quick info */}
        <div className="bg-slate-50 rounded-xl px-3 py-2.5 space-y-1">
          {clinic.lead_doctor_name && (
            <p className="text-xs font-medium text-slate-700 truncate">
              {clinic.lead_doctor_name}
            </p>
          )}
          {clinic.phone && (
            <p className="text-xs text-slate-500 truncate">{clinic.phone}</p>
          )}
          <div className="flex items-center gap-1.5 pt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-emerald-700 font-medium">Sistem Aktif</span>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Çıkış Yap
        </button>
      </div>
    </aside>
  );
}
