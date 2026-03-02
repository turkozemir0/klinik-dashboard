'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function submitSupportTicket(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Oturum açık değil' };

  const { data: cu } = await supabase
    .from('clinic_users')
    .select('clinic_id')
    .eq('user_id', user.id)
    .single();
  if (!cu) return { error: 'Klinik bulunamadı' };

  const category = formData.get('category') as string;
  const subject   = formData.get('subject') as string;
  const description = formData.get('description') as string;

  if (!category || !subject || !description) {
    return { error: 'Tüm alanlar zorunludur' };
  }

  // kb_urgent ise priority = urgent, technical = high, general = normal
  const priority =
    category === 'kb_urgent' ? 'urgent' :
    category === 'technical' ? 'high' : 'normal';

  const { error } = await supabase.from('support_tickets').insert({
    clinic_id:    cu.clinic_id,
    submitted_by: user.id,
    category,
    subject,
    description,
    priority,
  });

  if (error) return { error: error.message };

  revalidatePath('/dashboard');
  return { success: true };
}

export async function replyToTicket(ticketId: string, reply: string, status: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Oturum açık değil' };

  const { data, error } = await supabase.rpc('reply_support_ticket', {
    ticket_id:  ticketId,
    reply_text: reply,
    new_status: status,
  });

  if (error) return { error: error.message };
  if (!data?.success) return { error: data?.error ?? 'Hata' };

  revalidatePath('/admin/tickets');
  revalidatePath('/dashboard/support');
  return { success: true };
}
