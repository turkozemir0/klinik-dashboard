'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// ─── Klinik: Değişiklik isteği gönder ────────────────────────────────────────

export async function submitChangeRequest(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Oturum açık değil' };

  // Clinic ID'yi bul
  const { data: cu } = await supabase
    .from('clinic_users')
    .select('clinic_id')
    .eq('user_id', user.id)
    .single();

  if (!cu) return { error: 'Klinik bulunamadı' };

  const payload = {
    clinic_id:    cu.clinic_id,
    requested_by: user.id,
    table_name:   formData.get('table_name') as string,
    record_id:    formData.get('record_id') as string,
    record_label: formData.get('record_label') as string,
    field_name:   formData.get('field_name') as string,
    field_label:  formData.get('field_label') as string,
    old_value:    formData.get('old_value') as string | null,
    new_value:    formData.get('new_value') as string,
    change_note:  formData.get('change_note') as string | null,
  };

  // Validasyon
  if (!payload.table_name || !payload.record_id || !payload.field_name || !payload.new_value) {
    return { error: 'Zorunlu alanlar eksik' };
  }

  if (payload.old_value === payload.new_value) {
    return { error: 'Yeni değer mevcut değerden farklı olmalı' };
  }

  const { error } = await supabase.from('kb_change_requests').insert(payload);
  if (error) return { error: error.message };

  revalidatePath('/dashboard/knowledge');
  return { success: true };
}

// ─── Super Admin: Onayla ─────────────────────────────────────────────────────

export async function approveRequest(requestId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Oturum açık değil' };

  const { data, error } = await supabase.rpc('approve_kb_change', {
    request_id: requestId,
  });

  if (error) return { error: error.message };
  if (!data?.success) return { error: data?.error ?? 'Bilinmeyen hata' };

  revalidatePath('/admin');
  revalidatePath('/dashboard/knowledge');
  return { success: true };
}

// ─── Super Admin: Reddet ──────────────────────────────────────────────────────

export async function rejectRequest(requestId: string, note: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Oturum açık değil' };

  const { data, error } = await supabase.rpc('reject_kb_change', {
    request_id: requestId,
    note: note || null,
  });

  if (error) return { error: error.message };
  if (!data?.success) return { error: data?.error ?? 'Bilinmeyen hata' };

  revalidatePath('/admin');
  return { success: true };
}
