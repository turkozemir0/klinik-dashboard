'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// CRM ayarlarını güncelle (sadece super admin)
export async function saveCrmSettings(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: adminRow } = await supabase
    .from('super_admin_users')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!adminRow) redirect('/dashboard');

  const clinicId       = formData.get('clinic_id') as string;
  const crmProvider    = formData.get('crm_provider') as string;
  const sendMessageUrl = formData.get('send_message_url') as string;
  const fieldMapRaw    = formData.get('field_map') as string;

  let fieldMap: Record<string, string> = {};
  if (fieldMapRaw) {
    try {
      fieldMap = JSON.parse(fieldMapRaw);
    } catch {
      redirect(`/admin/clinics/${clinicId}/crm-settings?error=${encodeURIComponent('field_map geçerli bir JSON değil')}`);
    }
  }

  const crmConfig: Record<string, unknown> = {
    send_message_url: sendMessageUrl || '',
    field_map: fieldMap,
  };

  if (crmProvider === 'ghl') {
    crmConfig.location_id = (formData.get('location_id') as string) || '';
    crmConfig.pipeline_id = (formData.get('pipeline_id') as string) || '';
  }

  const { error } = await supabase
    .from('clinics')
    .update({ crm_provider: crmProvider, crm_config: crmConfig })
    .eq('id', clinicId);

  if (error) {
    redirect(`/admin/clinics/${clinicId}/crm-settings?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/admin/clinics/${clinicId}/crm-settings`);
  redirect(`/admin/clinics/${clinicId}/crm-settings?saved=1`);
}

// CRM token'ı kaydet
export async function saveCrmToken(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: adminRow } = await supabase
    .from('super_admin_users')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!adminRow) redirect('/dashboard');

  const clinicId = formData.get('clinic_id') as string;
  const token    = formData.get('crm_token') as string;

  if (!token || token.trim() === '') {
    redirect(`/admin/clinics/${clinicId}/crm-settings?error=${encodeURIComponent('Token boş olamaz')}`);
  }

  const { data, error } = await supabase.rpc('set_clinic_crm_token', {
    p_clinic_id: clinicId,
    p_token:     token,
  });

  if (error) {
    redirect(`/admin/clinics/${clinicId}/crm-settings?error=${encodeURIComponent(error.message)}`);
  }
  if (!data) {
    redirect(`/admin/clinics/${clinicId}/crm-settings?error=${encodeURIComponent('Token kaydedilemedi')}`);
  }

  revalidatePath(`/admin/clinics/${clinicId}/crm-settings`);
  redirect(`/admin/clinics/${clinicId}/crm-settings?saved=1`);
}
