import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabase } from '@supabase/supabase-js'
import { buildClinicPlaybookDefaults } from '@/lib/agent-templates'

function getServiceClient() {
  return createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function isSuperAdmin(userId: string): Promise<boolean> {
  const service = getServiceClient()
  const { data } = await service
    .from('super_admin_users')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()
  return !!data
}

interface MigrateBody {
  org_ids: string[]
  dry_run?: boolean
}

interface MigrateResult {
  org_id: string
  org_name: string
  clinic_type: string
  channel: string
  changes: string[]
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!await isSuperAdmin(user.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body: MigrateBody = await req.json().catch(() => ({ org_ids: [] }))
  const { org_ids, dry_run = false } = body

  if (!Array.isArray(org_ids) || org_ids.length === 0) {
    return NextResponse.json({ error: 'org_ids array required' }, { status: 400 })
  }

  const service = getServiceClient()
  const migrated: MigrateResult[] = []
  const skipped: { org_id: string; reason: string }[] = []
  const errors: { org_id: string; error: string }[] = []

  for (const orgId of org_ids) {
    try {
      // 1. Org bilgisini oku
      const { data: org, error: orgErr } = await service
        .from('organizations')
        .select('id, name, ai_persona')
        .eq('id', orgId)
        .single()

      if (orgErr || !org) {
        skipped.push({ org_id: orgId, reason: 'Organization not found' })
        continue
      }

      const persona = (org.ai_persona as any) ?? {}
      const clinicType = persona.clinic_type || 'other'
      const personaName = persona.persona_name || 'Asistan'

      // 2. Mevcut playbook'ları oku
      const { data: playbooks } = await service
        .from('agent_playbooks')
        .select('id, channel, system_prompt_template, hard_blocks, few_shot_examples, fallback_responses')
        .eq('organization_id', orgId)

      if (!playbooks || playbooks.length === 0) {
        skipped.push({ org_id: orgId, reason: 'No playbooks found' })
        continue
      }

      // 3. Her kanal için güncelle
      for (const pb of playbooks) {
        const channel = pb.channel as 'voice' | 'whatsapp'
        const defaults = buildClinicPlaybookDefaults(
          org.name, personaName, channel, clinicType,
        )

        const hard_blocks = defaults.blocks.map((b: any, i: number) => ({
          trigger_id: `block_${i}`,
          action: 'soft_block',
          keywords: b.keywords.split(',').map((k: string) => k.trim()).filter(Boolean),
          response: b.response.trim(),
        }))

        const changes: string[] = []

        if (pb.system_prompt_template !== defaults.systemPrompt) {
          changes.push('system_prompt_template')
        }
        if (JSON.stringify(pb.hard_blocks) !== JSON.stringify(hard_blocks)) {
          changes.push('hard_blocks')
        }
        if (JSON.stringify(pb.few_shot_examples) !== JSON.stringify(defaults.fewShots)) {
          changes.push('few_shot_examples')
        }
        const newFallback = { no_kb_match: defaults.noKbMatch }
        if (JSON.stringify(pb.fallback_responses) !== JSON.stringify(newFallback)) {
          changes.push('fallback_responses')
        }

        if (changes.length === 0) {
          skipped.push({ org_id: orgId, reason: `${channel} playbook already up-to-date` })
          continue
        }

        migrated.push({
          org_id: orgId,
          org_name: org.name,
          clinic_type: clinicType,
          channel,
          changes,
        })

        // Sadece dry_run değilse uygula
        // opening_message, features, routing_rules dokunulmaz
        if (!dry_run) {
          await service
            .from('agent_playbooks')
            .update({
              system_prompt_template: defaults.systemPrompt,
              hard_blocks,
              few_shot_examples: defaults.fewShots,
              fallback_responses: newFallback,
            })
            .eq('id', pb.id)
        }
      }
    } catch (e: any) {
      errors.push({ org_id: orgId, error: e.message ?? String(e) })
    }
  }

  return NextResponse.json({
    dry_run,
    migrated,
    skipped,
    errors,
  })
}
