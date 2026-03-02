import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Shield, ArrowLeft, LifeBuoy, BookOpen, Users, ClipboardList, Link2 } from 'lucide-react';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: adminRow } = await supabase
    .from('super_admin_users')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!adminRow) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="card p-8 max-w-md text-center">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Erişim Reddedildi</h2>
          <p className="text-slate-500 text-sm mb-6">Bu alana erişim yetkiniz bulunmuyor.</p>
          <Link href="/dashboard" className="btn-primary text-sm">Dashboard'a Dön</Link>
        </div>
      </div>
    );
  }

  const [{ count: pendingTickets }, { count: pendingKb }, { count: pendingRegs }, { count: pendingSubmissions }] = await Promise.all([
    supabase.from('support_tickets').select('*', { count: 'exact', head: true }).in('status', ['open', 'in_progress']),
    supabase.from('kb_change_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('clinic_registrations').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('onboarding_submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-slate-900 text-white px-6 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-brand-400" />
          <span className="text-sm font-semibold">Super Admin</span>
        </div>

        <div className="flex items-center gap-1 ml-4">
          <Link href="/admin/registrations" className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors">
            <Users className="w-3.5 h-3.5" />
            Kayıtlar
            {(pendingRegs ?? 0) > 0 && (
              <span className="bg-green-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full ml-1">{pendingRegs}</span>
            )}
          </Link>
          <Link href="/admin" className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors">
            <BookOpen className="w-3.5 h-3.5" />
            KB İstekleri
            {(pendingKb ?? 0) > 0 && (
              <span className="bg-amber-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full ml-1">{pendingKb}</span>
            )}
          </Link>
          <Link href="/admin/tickets" className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors">
            <LifeBuoy className="w-3.5 h-3.5" />
            Destek
            {(pendingTickets ?? 0) > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full ml-1">{pendingTickets}</span>
            )}
          </Link>
          <Link href="/admin/onboarding" className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors">
            <ClipboardList className="w-3.5 h-3.5" />
            Onboarding
            {(pendingSubmissions ?? 0) > 0 && (
              <span className="bg-blue-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full ml-1">{pendingSubmissions}</span>
            )}
          </Link>
          <Link href="/admin/invites" className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors">
            <Link2 className="w-3.5 h-3.5" />
            Davetiyeler
          </Link>
        </div>

        <div className="flex-1" />
        <Link href="/dashboard" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Dashboard'a Dön
        </Link>
      </div>

      <main className="max-w-5xl mx-auto p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
