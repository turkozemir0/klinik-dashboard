// @ts-nocheck — Deno Edge Function; Node.js TypeScript derleyicisi tarafından işlenmemeli
// ═══════════════════════════════════════════════════════════════
// stoaix AI Klinik System — EDGE FUNCTION
// Dosya: supabase/functions/handle-incoming-message/index.ts
// Supabase Dashboard → Edge Functions'a deploy edilir
//
// SECRETS (Supabase Dashboard → Settings → Edge Functions → Secrets):
//   N8N_WEBHOOK_URL       → n8n workflow tetikleme URL'i
//   DEFAULT_CLINIC_ID     → GHL location_id yoksa varsayılan klinik UUID'si
//
// OTOMATIK MEVCUT (edge function ortamında):
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
// ═══════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const n8nWebhookUrl = Deno.env.get('N8N_WEBHOOK_URL')
    const defaultClinicId = Deno.env.get('DEFAULT_CLINIC_ID') ?? ''

    if (!n8nWebhookUrl) {
      throw new Error('N8N_WEBHOOK_URL secret eksik!')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Gelen veriyi al (GHL webhook payload)
    const payload = await req.json()
    const { contact_id, message, attachments, location_id } = payload

    if (!contact_id) {
      return new Response(JSON.stringify({ error: 'contact_id eksik' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const clinicId = location_id || defaultClinicId

    // 2. Mesajı buffer'a yaz
    const { error: insertError } = await supabase
      .from('message_buffer')
      .insert({
        ghl_contact_id: contact_id,
        message_text: message || '',
        contains_image: attachments?.length > 0 ? true : false,
        image_url: attachments?.length > 0 ? attachments[0].url : null,
        clinic_id: clinicId,
      })

    if (insertError) throw insertError

    // 3. Kilit kontrolü
    const { data: lockData } = await supabase
      .from('conversation_locks')
      .select('*')
      .eq('ghl_contact_id', contact_id)
      .single()

    const now = new Date()
    let shouldStop = false

    if (lockData) {
      const expiresAt = new Date(lockData.expires_at)
      if (lockData.status !== 'idle' && now < expiresAt) {
        shouldStop = true
      }
    }

    if (shouldStop) {
      return new Response(JSON.stringify({ status: 'buffered', message: 'Mevcut batch\'e eklendi' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // 4. Kilit oluştur (60 saniyelik güvenlik kilidi)
    await supabase
      .from('conversation_locks')
      .upsert({
        ghl_contact_id: contact_id,
        status: 'waiting',
        locked_at: now.toISOString(),
        expires_at: new Date(now.getTime() + 60000).toISOString(),
      }, { onConflict: 'ghl_contact_id' })

    // 5. Debounce beklemesi (4 saniye — arka arkaya mesajları birleştirmek için)
    await new Promise(resolve => setTimeout(resolve, 4000))

    // 6. Buffer'daki tüm mesajları topla
    const { data: messages } = await supabase
      .from('message_buffer')
      .select('*')
      .eq('ghl_contact_id', contact_id)
      .order('received_at', { ascending: true })

    if (!messages || messages.length === 0) {
      await supabase
        .from('conversation_locks')
        .update({ status: 'idle' })
        .eq('ghl_contact_id', contact_id)
      return new Response(JSON.stringify({ status: 'empty' }), { headers: corsHeaders })
    }

    // Spam kontrolü (10'dan fazla mesaj)
    const isSpam = messages.length > 10
    const spamReply = isSpam ? 'Mesajlarınızı aldım, sırayla inceliyorum.' : null

    const fullText = messages.map(m => m.message_text).filter(Boolean).join('\n')
    const hasImage = messages.some(m => m.contains_image)
    const imageCount = messages.filter(m => m.contains_image).length
    const imageUrl = messages.find(m => m.image_url)?.image_url || null
    const bufferIds = messages.map(m => m.id)

    // 7. n8n'e gönder
    const n8nPayload = {
      contactId: contact_id,
      clinicId: clinicId,
      mergedMessage: fullText || (hasImage ? '(Görsel gönderildi)' : ''),
      containsImage: hasImage,
      imageCount: imageCount,
      imageUrl: imageUrl,
      isSpam: isSpam,
      spamReply: spamReply,
      bufferIds: bufferIds,
    }

    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(n8nPayload),
    })

    // 8. Temizlik
    await supabase.from('message_buffer').delete().in('id', bufferIds)
    await supabase
      .from('conversation_locks')
      .update({ status: 'processing' })
      .eq('ghl_contact_id', contact_id)

    return new Response(JSON.stringify({
      status: 'forwarded',
      count: messages.length,
      n8nStatus: n8nResponse.status,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
