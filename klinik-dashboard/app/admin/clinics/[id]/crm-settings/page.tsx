import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { saveCrmSettings, saveCrmToken } from '@/lib/actions/crm-actions';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import CopyButton from './CopyButton';

interface PageProps {
  params: { id: string };
  searchParams: { saved?: string; error?: string };
}

const CRM_PROVIDERS = [
  { value: 'ghl',        label: 'GoHighLevel' },
  { value: 'hubspot',    label: 'HubSpot' },
  { value: 'kommo',      label: 'Kommo (amoCRM)' },
  { value: 'zoho',       label: 'Zoho CRM' },
  { value: 'salesforce', label: 'Salesforce' },
  { value: 'custom',     label: 'Custom (özel entegrasyon)' },
];

export default async function CrmSettingsPage({ params, searchParams }: PageProps) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: adminRow } = await supabase
    .from('super_admin_users')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!adminRow) redirect('/dashboard');

  const { data: clinic } = await supabase
    .from('clinics')
    .select('id, name, crm_provider, crm_config, crm_token, webhook_token')
    .eq('id', params.id)
    .single();

  if (!clinic) notFound();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const webhookUrl  = `${supabaseUrl}/functions/v1/handle-incoming-message?token=${clinic.webhook_token ?? ''}`;
  const crmConfig   = (clinic.crm_config || {}) as Record<string, unknown>;
  const fieldMapStr = JSON.stringify(
    crmConfig.field_map || { contact_id: 'contactId', message: 'mergedMessage' },
    null,
    2
  );

  const rawToken    = clinic.crm_token || '';
  const maskedToken = rawToken.length > 4
    ? '*'.repeat(rawToken.length - 4) + rawToken.slice(-4)
    : rawToken ? '****' : '';

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/clinics" className="text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">CRM Ayarları</h1>
          <p className="text-slate-500 text-sm mt-0.5">{clinic.name}</p>
        </div>
      </div>

      {searchParams.saved && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          Ayarlar kaydedildi.
        </div>
      )}
      {searchParams.error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {decodeURIComponent(searchParams.error)}
        </div>
      )}

      {/* Webhook URL */}
      <div className="card p-5 space-y-3">
        <div>
          <h2 className="font-semibold text-slate-900">Webhook URL</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Bu URL&apos;i CRM&apos;inizde webhook olarak tanımlayın.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-700 break-all">
            {webhookUrl}
          </code>
          <CopyButton text={webhookUrl} />
        </div>
      </div>

      {/* CRM Ayarları */}
      <div className="card p-5 space-y-5">
        <h2 className="font-semibold text-slate-900">CRM Konfigürasyonu</h2>

        <form action={saveCrmSettings} className="space-y-4">
          <input type="hidden" name="clinic_id" value={clinic.id} />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">CRM Tipi</label>
            <select
              name="crm_provider"
              defaultValue={clinic.crm_provider || 'ghl'}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              {CRM_PROVIDERS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Location ID <span className="text-slate-400 font-normal">(GHL için)</span>
            </label>
            <input
              type="text"
              name="location_id"
              defaultValue={(crmConfig.location_id as string) || ''}
              placeholder="GHL Location ID"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Mesaj Gönderme URL</label>
            <input
              type="text"
              name="send_message_url"
              defaultValue={(crmConfig.send_message_url as string) || ''}
              placeholder="https://crm.example.com/api/send"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <p className="text-xs text-slate-400 mt-1">
              GHL: https://services.leadconnectorhq.com/conversations/messages
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Field Map <span className="text-slate-400 font-normal">(JSON)</span>
            </label>
            <textarea
              name="field_map"
              defaultValue={fieldMapStr}
              rows={5}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              spellCheck={false}
            />
            <p className="text-xs text-slate-400 mt-1">
              Gelen webhook&apos;tan alan eşlemesi. Nokta notasyonu desteklenir: <code className="bg-slate-100 px-1 rounded">data.contact.id</code>
            </p>
          </div>

          <button type="submit" className="w-full btn-primary">
            Ayarları Kaydet
          </button>
        </form>
      </div>

      {/* CRM Token */}
      <div className="card p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-slate-900">CRM API Token</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Mevcut token:{' '}
            {maskedToken ? (
              <code className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{maskedToken}</code>
            ) : (
              <span className="text-amber-600">Henüz girilmedi</span>
            )}
          </p>
        </div>

        <form action={saveCrmToken} className="flex gap-3">
          <input type="hidden" name="clinic_id" value={clinic.id} />
          <input
            type="password"
            name="crm_token"
            placeholder="Yeni token girin..."
            className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            autoComplete="off"
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors"
          >
            Kaydet
          </button>
        </form>
      </div>
    </div>
  );
}
