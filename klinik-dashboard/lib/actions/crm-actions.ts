'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// CRM ayarlarını güncelle (sadece super admin)
export async function saveCrmSettings(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Oturum açık değil' };

  const { data: adminRow } = await supabase
    .from('super_admin_users')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!adminRow) return { error: 'Yetkisiz erişim' };

  const clinicId  = formData.get('clinic_id') as string;
  const crmProvider = formData.get('crm_provider') as string;
  const sendMessageUrl = formData.get('send_message_url') as string;
  const fieldMapRaw    = formData.get('field_map') as string;

  // field_map JSON doğrula
  let fieldMap: Record<string, string> = {};
  if (fieldMapRaw) {
    try {
      fieldMap = JSON.parse(fieldMapRaw);
    } catch {
      return { error: 'field_map geçerli bir JSON değil' };
    }
  }

  // crm_config oluştur
  const crmConfig: Record<string, unknown> = {
    send_message_url: sendMessageUrl || '',
    field_map: fieldMap,
  };

  // GHL için ek alanlar
  if (crmProvider === 'ghl') {
    crmConfig.location_id = formData.get('location_id') as string || '';
    crmConfig.pipeline_id = formData.get('pipeline_id') as string || '';
  }

  const { error } = await supabase
    .from('clinics')
    .update({
      crm_provider: crmProvider,
      crm_config:   crmConfig,
    })
    .eq('id', clinicId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/clinics/${clinicId}/crm-settings`);
  return { success: true };
}

// CRM token'ı kaydet — Vault'a yazar (SECURITY DEFINER fonksiyon üzerinden)
export async function saveCrmToken(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Oturum açık değil' };

  const clinicId = formData.get('clinic_id') as string;
  const token    = formData.get('crm_token') as string;

  if (!token || token.trim() === '') return { error: 'Token boş olamaz' };

  const { data, error } = await supabase.rpc('set_clinic_crm_token', {
    p_clinic_id: clinicId,
    p_token:     token,
  });

  if (error) return { error: error.message };
  if (!data)  return { error: 'Token kaydedilemedi (yetersiz yetki)' };

  revalidatePath(`/admin/clinics/${clinicId}/crm-settings`);
  return { success: true };
}
