import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Building2, Settings2, CheckCircle2, Clock } from 'lucide-react';

export default async function AdminClinicsPage() {
  const supabase = createClient();

  const { data: clinics } = await supabase
    .from('clinics')
    .select('id, name, slug, status, crm_provider, crm_config, webhook_token, is_approved')
    .order('name');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Klinikler</h1>
        <p className="text-slate-500 text-sm mt-1">
          CRM entegrasyonlarını ve webhook ayarlarını yönet
        </p>
      </div>

      <div className="space-y-3">
        {(clinics ?? []).map((clinic) => {
          const hasToken     = !!(clinic.crm_config?.send_message_url);
          const hasWebhook   = !!clinic.webhook_token;

          return (
            <div key={clinic.id} className="card p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{clinic.name}</span>
                    {clinic.is_approved ? (
                      <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">Aktif</span>
                    ) : (
                      <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">Onay Bekliyor</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-400 font-mono bg-slate-50 px-2 py-0.5 rounded">{clinic.crm_provider || 'ghl'}</span>
                    {hasWebhook ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Webhook aktif
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-amber-600">
                        <Clock className="w-3.5 h-3.5" />
                        Webhook ayarlanmadı
                      </span>
                    )}
                    {!hasToken && (
                      <span className="text-xs text-red-500">Token eksik</span>
                    )}
                  </div>
                </div>
              </div>

              <Link
                href={`/admin/clinics/${clinic.id}/crm-settings`}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white border border-slate-200 hover:border-brand-300 hover:text-brand-600 transition-colors"
              >
                <Settings2 className="w-4 h-4" />
                CRM Ayarları
              </Link>
            </div>
          );
        })}

        {(clinics ?? []).length === 0 && (
          <div className="card p-16 text-center">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Henüz klinik yok</p>
          </div>
        )}
      </div>
    </div>
  );
}
