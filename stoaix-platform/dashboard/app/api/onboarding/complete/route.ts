import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { buildClinicPlaybookDefaults } from '@/lib/agent-templates'

export async function POST(_request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()

  const { data: orgUser } = await service
    .from('org_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!orgUser) return NextResponse.json({ error: 'Org bulunamadı' }, { status: 404 })

  const orgId = orgUser.organization_id

  const { data: org, error } = await service
    .from('organizations')
    .update({ status: 'active', onboarding_status: 'completed' })
    .eq('id', orgId)
    .select('name, sector, city, country, ai_persona')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const personaName = (org.ai_persona as any)?.persona_name || 'Asistan'

  // Playbook yoksa her iki kanal için oluştur (voice + whatsapp)
  const { data: existingPlaybooks } = await service
    .from('agent_playbooks')
    .select('id, channel')
    .eq('organization_id', orgId)

  const existingChannels = new Set((existingPlaybooks || []).map((p: any) => p.channel))

  const playbookInserts: any[] = []

  if (!existingChannels.has('voice')) {
    const defaults = buildClinicPlaybookDefaults(org.name, personaName, 'voice')
    const hard_blocks = defaults.blocks.map((b, i) => ({
      trigger_id: `block_${i}`,
      action: 'soft_block',
      keywords: b.keywords.split(',').map((k: string) => k.trim()).filter(Boolean),
      response: b.response.trim(),
    }))
    playbookInserts.push({
      organization_id: orgId,
      name: `${org.name} — Sesli Asistan`,
      channel: 'voice',
      system_prompt_template: defaults.systemPrompt,
      opening_message: defaults.openingMessage,
      hard_blocks,
      features: defaults.features,
      few_shot_examples: defaults.fewShots,
      fallback_responses: { no_kb_match: defaults.noKbMatch },
      routing_rules: { transfer_numbers: {}, rules: [] },
      is_active: true,
    })
  }

  if (!existingChannels.has('whatsapp')) {
    const defaults = buildClinicPlaybookDefaults(org.name, personaName, 'whatsapp')
    const hard_blocks = defaults.blocks.map((b, i) => ({
      trigger_id: `block_${i}`,
      action: 'soft_block',
      keywords: b.keywords.split(',').map((k: string) => k.trim()).filter(Boolean),
      response: b.response.trim(),
    }))
    playbookInserts.push({
      organization_id: orgId,
      name: `${org.name} — WhatsApp/Chat`,
      channel: 'whatsapp',
      system_prompt_template: defaults.systemPrompt,
      opening_message: defaults.openingMessage,
      hard_blocks,
      features: defaults.features,
      few_shot_examples: defaults.fewShots,
      fallback_responses: { no_kb_match: defaults.noKbMatch },
      routing_rules: { transfer_numbers: {}, rules: [] },
      is_active: true,
    })
  }

  if (playbookInserts.length > 0) {
    await service.from('agent_playbooks').insert(playbookInserts)
  }

  // Intake schema yoksa her iki kanal için default oluştur
  const { data: existingSchemas } = await service
    .from('intake_schemas')
    .select('id, channel')
    .eq('organization_id', orgId)

  const existingSchemaChannels = new Set((existingSchemas || []).map((s: any) => s.channel))
  const schemaInserts: any[] = []

  const voiceDefaultFields = [
    { key: 'full_name',        label: 'Ad Soyad',           type: 'text',  priority: 'must',   voice_prompt: 'Adınızı ve soyadınızı öğrenebilir miyim?' },
    { key: 'phone',            label: 'Telefon',             type: 'phone', priority: 'must',   voice_prompt: 'Sizi daha sonra arayabilmemiz için telefon numaranızı alabilir miyim?' },
    { key: 'service_interest', label: 'İlgilenilen Hizmet',  type: 'text',  priority: 'must',   voice_prompt: 'Hangi hizmetimiz hakkında bilgi almak istiyorsunuz?' },
    { key: 'timeline',         label: 'Zaman Çizelgesi',     type: 'text',  priority: 'should', voice_prompt: 'Ne zaman başlamayı düşünüyorsunuz?' },
  ]

  // WhatsApp'ta telefon payload'dan otomatik geliyor, sohbetten extract etmeye gerek yok
  const whatsappDefaultFields = [
    { key: 'full_name',        label: 'Ad Soyad',           type: 'text', priority: 'must' },
    { key: 'service_interest', label: 'İlgilenilen Hizmet', type: 'text', priority: 'must' },
    { key: 'timeline',         label: 'Zaman Çizelgesi',    type: 'text', priority: 'should' },
  ]

  if (!existingSchemaChannels.has('voice')) {
    schemaInserts.push({
      organization_id: orgId,
      channel: 'voice',
      name: `${org.name} Voice Başvuru Formu`,
      fields: voiceDefaultFields,
    })
  }
  if (!existingSchemaChannels.has('whatsapp')) {
    schemaInserts.push({
      organization_id: orgId,
      channel: 'whatsapp',
      name: `${org.name} WhatsApp Başvuru Formu`,
      fields: whatsappDefaultFields,
    })
  }
  if (schemaInserts.length > 0) {
    await service.from('intake_schemas').insert(schemaInserts)
  }

  return NextResponse.json({ ok: true })
}
