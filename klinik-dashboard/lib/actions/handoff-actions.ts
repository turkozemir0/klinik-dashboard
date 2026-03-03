'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function triggerHandoff(conversationId: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Oturum açık değil' };

  // Clinic validation
  const { data: cu } = await supabase
    .from('clinic_users')
    .select('clinic_id')
    .eq('user_id', user.id)
    .single();
  if (!cu) return { error: 'Klinik bulunamadı' };

  // Ensure conversation belongs to this clinic and isn't already handed off
  const { data: conv } = await supabase
    .from('conversations')
    .select('id, clinic_id, handoff_triggered, status')
    .eq('id', conversationId)
    .eq('clinic_id', cu.clinic_id)
    .single();

  if (!conv) return { error: 'Konuşma bulunamadı' };
  if (conv.handoff_triggered) return { error: 'Bu konuşma için handoff zaten yapıldı' };
  if (conv.status === 'handed_off') return { error: 'Bu konuşma zaten devredildi' };

  const webhookUrl = process.env.N8N_HANDOFF_WEBHOOK_URL;
  if (!webhookUrl) return { error: 'Handoff webhook URL yapılandırılmamış' };

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversationId,
      triggeredBy: user.email,
    }),
  });

  if (!res.ok) return { error: `Handoff tetiklenemedi (HTTP ${res.status})` };

  revalidatePath('/dashboard/leads');
  return { success: true };
}
