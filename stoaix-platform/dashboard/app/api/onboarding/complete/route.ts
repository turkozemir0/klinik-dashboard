import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { buildClinicPlaybookDefaults } from '@/lib/agent-templates'
import { CLINIC_INTAKE_SCHEMAS, getChatIntakeFields } from '@/lib/clinic-intake-schemas'
import { demoWriteBlock } from '@/lib/demo-guard'

// Klinik tipine göre acil durum anahtar kelimeleri (multi-lang)
const CLINIC_EMERGENCY_MAP: Record<string, string[]> = {
  dental:    ['ağrı', 'kanama', 'şişlik', 'apse', 'ateş', 'kırık diş', 'pain', 'bleeding', 'abscess', 'schmerzen', 'blutung', 'abszess'],
  aesthetic: ['ağrı', 'şişlik', 'enfeksiyon', 'morarma', 'ateş', 'alerji', 'pain', 'infection', 'swelling', 'infektion', 'schwellung'],
  hair:      ['enfeksiyon', 'alerji', 'şişlik', 'kanama', 'ateş', 'infection', 'allergic', 'bleeding', 'infektion', 'allergie'],
  eye:       ['görme kaybı', 'ağrı', 'kanama', 'şişlik', 'vision loss', 'pain', 'sehverlust', 'schmerzen'],
  other:     ['ağrı', 'kanama', 'şişlik', 'ateş', 'enfeksiyon', 'pain', 'bleeding', 'swelling', 'fever', 'schmerzen', 'blutung'],
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()

  const body = await request.json().catch(() => ({}))
  const bodyClinicType = (body.clinic_type as string) || null

  const { data: orgUser } = await service
    .from('org_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!orgUser) return NextResponse.json({ error: 'Org bulunamadı' }, { status: 404 })

  const orgId = orgUser.organization_id

  const blocked = demoWriteBlock(orgId)
  if (blocked) return blocked

  // Önce mevcut ai_persona'yı oku
  const { data: existing } = await service
    .from('organizations')
    .select('ai_persona')
    .eq('id', orgId)
    .single()

  const existingPersona = (existing?.ai_persona as any) ?? {}
  const clinicType = bodyClinicType ?? existingPersona.clinic_type ?? 'other'

  // clinic_type'ı ai_persona'ya kaydet + onboarding tamamla
  const { data: org, error } = await service
    .from('organizations')
    .update({
      status: 'active',
      onboarding_status: 'completed',
      ai_persona: { ...existingPersona, clinic_type: clinicType },
    })
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
    const defaults = buildClinicPlaybookDefaults(org.name, personaName, 'voice', clinicType)
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
      handoff_triggers: {
        keywords: ['insan', 'danışman', 'müdür', 'temsilci', 'yönetici', 'uzman', 'aranmak', 'arasın'],
        emergency_keywords: CLINIC_EMERGENCY_MAP[clinicType] ?? CLINIC_EMERGENCY_MAP['other'],
        frustration_keywords: ['saçma', 'berbat', 'anlayamıyorsunuz'],
        missing_required_after_turns: 10,
        kb_empty_consecutive: 3,
      },
      is_active: true,
    })
  }

  if (!existingChannels.has('whatsapp')) {
    const waFields = getChatIntakeFields(clinicType, 'whatsapp')
    const defaults = buildClinicPlaybookDefaults(org.name, personaName, 'whatsapp', clinicType, false, waFields)
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
      handoff_triggers: {
        keywords: ['insan', 'danışman', 'müdür', 'temsilci', 'yönetici', 'uzman', 'aranmak', 'arasın'],
        emergency_keywords: CLINIC_EMERGENCY_MAP[clinicType] ?? CLINIC_EMERGENCY_MAP['other'],
        frustration_keywords: ['saçma', 'berbat', 'anlayamıyorsunuz'],
        missing_required_after_turns: 10,
        kb_empty_consecutive: 3,
      },
      is_active: true,
    })
  }

  if (!existingChannels.has('instagram')) {
    const igFields = getChatIntakeFields(clinicType, 'instagram')
    const defaults = buildClinicPlaybookDefaults(org.name, personaName, 'whatsapp', clinicType, false, igFields)
    const hard_blocks = defaults.blocks.map((b, i) => ({
      trigger_id: `block_${i}`,
      action: 'soft_block',
      keywords: b.keywords.split(',').map((k: string) => k.trim()).filter(Boolean),
      response: b.response.trim(),
    }))
    playbookInserts.push({
      organization_id: orgId,
      name: `${org.name} — Instagram/Chat`,
      channel: 'instagram',
      system_prompt_template: defaults.systemPrompt,
      opening_message: defaults.openingMessage,
      hard_blocks,
      features: defaults.features,
      few_shot_examples: defaults.fewShots,
      fallback_responses: { no_kb_match: defaults.noKbMatch },
      routing_rules: { transfer_numbers: {}, rules: [] },
      handoff_triggers: {
        keywords: ['insan', 'danışman', 'müdür', 'temsilci', 'yönetici', 'uzman', 'aranmak', 'arasın'],
        emergency_keywords: CLINIC_EMERGENCY_MAP[clinicType] ?? CLINIC_EMERGENCY_MAP['other'],
        frustration_keywords: ['saçma', 'berbat', 'anlayamıyorsunuz'],
        missing_required_after_turns: 10,
        kb_empty_consecutive: 3,
      },
      is_active: true,
    })
  }

  if (!existingChannels.has('web')) {
    const webFields = getChatIntakeFields(clinicType, 'web')
    const defaults = buildClinicPlaybookDefaults(org.name, personaName, 'web', clinicType, false, webFields)
    const hard_blocks = defaults.blocks.map((b, i) => ({
      trigger_id: `block_${i}`,
      action: 'soft_block',
      keywords: b.keywords.split(',').map((k: string) => k.trim()).filter(Boolean),
      response: b.response.trim(),
    }))
    playbookInserts.push({
      organization_id: orgId,
      name: `${org.name} — Web Chat`,
      channel: 'web',
      system_prompt_template: defaults.systemPrompt,
      opening_message: defaults.openingMessage,
      hard_blocks,
      features: defaults.features,
      few_shot_examples: defaults.fewShots,
      fallback_responses: { no_kb_match: defaults.noKbMatch },
      routing_rules: { transfer_numbers: {}, rules: [] },
      handoff_triggers: {
        keywords: ['insan', 'danışman', 'müdür', 'temsilci', 'yönetici', 'uzman', 'aranmak', 'arasın'],
        emergency_keywords: CLINIC_EMERGENCY_MAP[clinicType] ?? CLINIC_EMERGENCY_MAP['other'],
        frustration_keywords: ['saçma', 'berbat', 'anlayamıyorsunuz'],
        missing_required_after_turns: 10,
        kb_empty_consecutive: 3,
      },
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

  const voiceDefaultFields = CLINIC_INTAKE_SCHEMAS[clinicType] ?? CLINIC_INTAKE_SCHEMAS['other']

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
      fields: getChatIntakeFields(clinicType, 'whatsapp'),
    })
  }
  if (!existingSchemaChannels.has('instagram')) {
    schemaInserts.push({
      organization_id: orgId,
      channel: 'instagram',
      name: `${org.name} Instagram Başvuru Formu`,
      fields: getChatIntakeFields(clinicType, 'instagram'),
    })
  }
  if (!existingSchemaChannels.has('web')) {
    schemaInserts.push({
      organization_id: orgId,
      channel: 'web',
      name: `${org.name} Web Chat Başvuru Formu`,
      fields: getChatIntakeFields(clinicType, 'web'),
    })
  }
  if (schemaInserts.length > 0) {
    await service.from('intake_schemas').insert(schemaInserts)
  }

  return NextResponse.json({ ok: true })
}
