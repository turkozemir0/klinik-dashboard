import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { EditableField } from '@/components/dashboard/EditableField';
import KnowledgeActions from '@/components/dashboard/KnowledgeActions';
import { BookOpen, Building2, Stethoscope, HelpCircle, Clock } from 'lucide-react';
import type { KbChangeRequest } from '@/types';

async function getClinicId(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data } = await supabase.from('clinic_users').select('clinic_id').eq('user_id', userId).single();
  return data?.clinic_id as string | undefined;
}

function findPending(
  requests: KbChangeRequest[],
  recordId: string,
  fieldName: string
): KbChangeRequest | undefined {
  return requests.find(
    (r) => r.record_id === recordId && r.field_name === fieldName
  );
}

export default async function KnowledgePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const clinicId = await getClinicId(supabase, user.id);
  if (!clinicId) redirect('/login');

  const [
    { data: clinic },
    { data: services },
    { data: faqs },
    { data: requests },
  ] = await Promise.all([
    supabase.from('clinics').select('*').eq('id', clinicId).single(),
    supabase.from('services').select('*').eq('clinic_id', clinicId).eq('is_active', true).order('sort_order'),
    supabase.from('faqs').select('*').eq('clinic_id', clinicId).eq('is_active', true),
    supabase
      .from('kb_change_requests')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false })
      .limit(200),
  ]);

  const allRequests: KbChangeRequest[] = requests ?? [];
  const pendingCount = allRequests.filter((r) => r.status === 'pending').length;

  const clinicFields = [
    { key: 'phone',               label: 'Telefon' },
    { key: 'email',               label: 'E-posta' },
    { key: 'address',             label: 'Adres' },
    { key: 'parking_info',        label: 'Otopark Bilgisi' },
    { key: 'consultation_fee',    label: 'Ön Görüşme Ücreti' },
    { key: 'cancellation_policy', label: 'İptal Politikası' },
    { key: 'pricing_policy',      label: 'Fiyatlandırma Politikası' },
    { key: 'greeting_message',    label: 'Karşılama Mesajı' },
  ];

  const serviceFields = [
    { key: 'description_for_ai', label: 'AI Açıklaması' },
    { key: 'procedure_duration', label: 'İşlem Süresi' },
    { key: 'recovery_time',      label: 'İyileşme Süreci' },
    { key: 'final_result_time',  label: 'Sonuç Görülme Süresi' },
    { key: 'pricing_response',   label: 'Fiyat Yanıtı' },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-brand-600" />
            Knowledge Base
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Bilgileri görüntüle ve değişiklik öner — onaylandıktan sonra sisteme yansır
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
            <Clock className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-700">
              {pendingCount} onay bekliyor
            </span>
          </div>
        )}
      </div>

      {/* Nasıl çalışır */}
      <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-brand-800 mb-2">Nasıl Çalışır?</h3>
        <div className="flex flex-wrap items-center gap-4 text-xs text-brand-700">
          <span>1️⃣ Alanın üzerine gel → <strong>Öner</strong> butonuna tıkla</span>
          <span>→</span>
          <span>2️⃣ Yeni değeri yaz → Gönder</span>
          <span>→</span>
          <span>3️⃣ Yönetici onaylayınca sisteme yansır</span>
        </div>
      </div>

      {/* ── KLİNİK PROFİLİ ─────────────────────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50">
          <Building2 className="w-4 h-4 text-slate-600" />
          <h2 className="text-sm font-semibold text-slate-700">Klinik Profili</h2>
        </div>
        <div className="px-6 py-2">
          {clinic && clinicFields.map((field) => (
            <EditableField
              key={field.key}
              tableName="clinics"
              recordId={clinic.id}
              recordLabel={clinic.name}
              fieldName={field.key}
              fieldLabel={field.label}
              value={(clinic as Record<string, string>)[field.key] ?? ''}
              pendingRequest={findPending(allRequests, clinic.id, field.key)}
            />
          ))}
        </div>
      </div>

      {/* ── SERVİSLER ───────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-slate-600" />
            <h2 className="text-sm font-semibold text-slate-700">Hizmetler</h2>
            <span className="text-xs text-slate-400">({services?.length ?? 0} aktif)</span>
          </div>
          <KnowledgeActions type="service" clinicId={clinicId} clinicName={clinic?.name ?? ''} />
        </div>

        {(services ?? []).map((service) => (
          <div key={service.id} className="card overflow-hidden">
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 bg-slate-50">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">{service.display_name}</h3>
                {service.category && (
                  <span className="text-xs text-slate-400">{service.category}</span>
                )}
              </div>
              <span className="text-xs text-slate-400 font-mono bg-white border border-slate-200 px-2 py-0.5 rounded">
                {service.service_key}
              </span>
            </div>
            <div className="px-6 py-2">
              {serviceFields.map((field) => (
                <EditableField
                  key={field.key}
                  tableName="services"
                  recordId={service.id}
                  recordLabel={service.display_name}
                  fieldName={field.key}
                  fieldLabel={field.label}
                  value={(service as Record<string, string>)[field.key] ?? ''}
                  pendingRequest={findPending(allRequests, service.id, field.key)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── SSS ─────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-slate-600" />
            <h2 className="text-sm font-semibold text-slate-700">Sık Sorulan Sorular</h2>
            <span className="text-xs text-slate-400">({faqs?.length ?? 0} kayıt)</span>
          </div>
          <KnowledgeActions type="faq" clinicId={clinicId} clinicName={clinic?.name ?? ''} />
        </div>

        {(faqs ?? []).map((faq) => (
          <div key={faq.id} className="card overflow-hidden">
            <div className="px-6 py-2">
              <EditableField
                tableName="faqs"
                recordId={faq.id}
                recordLabel={faq.question_patterns?.[0] ?? 'SSS'}
                fieldName="answer"
                fieldLabel={`Soru: ${faq.question_patterns?.[0] ?? ''}${(faq.question_patterns?.length ?? 0) > 1 ? ` (+${(faq.question_patterns?.length ?? 1) - 1})` : ''}`}
                value={faq.answer ?? ''}
                pendingRequest={findPending(allRequests, faq.id, 'answer')}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Son İstekler */}
      {allRequests.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800">Son Değişiklik İsteklerim</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {allRequests.slice(0, 10).map((req) => {
              // JSON new_value'yu okunabilir hale getir
              let displayValue = req.new_value ?? '';
              if (req.field_name === '__new_service__' || req.field_name === '__new_faq__') {
                try {
                  const parsed = JSON.parse(req.new_value ?? '');
                  displayValue = req.field_name === '__new_faq__'
                    ? `Soru: "${parsed.question_patterns?.[0] ?? ''}" → ${parsed.answer?.substring(0, 40) ?? ''}`
                    : `Yeni hizmet: ${parsed.display_name ?? ''}`;
                } catch { /* ham göster */ }
              }
              return (
                <div key={req.id} className="flex items-center gap-4 px-6 py-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    req.status === 'pending'  ? 'bg-amber-400' :
                    req.status === 'approved' ? 'bg-emerald-400' :
                    'bg-red-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">
                      <span className="font-medium">{req.record_label}</span>
                      {' → '}
                      <span className="text-slate-500">{req.field_label}</span>
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {displayValue.substring(0, 70)}{displayValue.length > 70 ? '…' : ''}
                    </p>
                    {req.status === 'rejected' && req.rejection_note && (
                      <p className="text-xs text-red-500 mt-0.5 truncate">
                        Red sebebi: {req.rejection_note}
                      </p>
                    )}
                  </div>
                  <span className={`text-xs font-medium flex-shrink-0 ${
                    req.status === 'pending'  ? 'text-amber-600' :
                    req.status === 'approved' ? 'text-emerald-600' :
                    'text-red-600'
                  }`}>
                    {req.status === 'pending'  ? 'Bekliyor' :
                     req.status === 'approved' ? 'Onaylandı' : 'Reddedildi'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
