const fs = require('fs')
const path = require('path')
const { createClient } = require('../dashboard/node_modules/@supabase/supabase-js')

const ORG_ID = 'ecd032a8-f40c-4171-947a-b6417461e987'

function loadEnv() {
  const raw = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const idx = t.indexOf('=')
    if (idx === -1) continue
    process.env[t.slice(0, idx)] = t.slice(idx + 1)
  }
}

async function main() {
  loadEnv()
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

  // Organization
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, slug, sector, phone, email, city, country, ai_persona, channel_config, working_hours, onboarding_status, status')
    .eq('id', ORG_ID)
    .single()
  console.log('\n=== ORGANIZATION ===')
  console.log(JSON.stringify(org, null, 2))

  // Knowledge Items
  const { data: kb } = await supabase
    .from('knowledge_items')
    .select('id, item_type, title, description_for_ai, tags, is_active, created_at')
    .eq('organization_id', ORG_ID)
    .order('item_type')
    .order('created_at')
  console.log('\n=== KNOWLEDGE ITEMS ===')
  console.log(`Toplam: ${kb?.length ?? 0} item`)
  for (const item of (kb ?? [])) {
    console.log(`\n[${item.item_type}] "${item.title}" (active: ${item.is_active})`)
    console.log(`  Tags: ${item.tags?.join(', ') || '-'}`)
    console.log(`  Desc (ilk 200): ${item.description_for_ai?.slice(0, 200)}`)
  }

  // Playbooks
  const { data: playbooks } = await supabase
    .from('agent_playbooks')
    .select('id, name, channel, version, is_active, system_prompt_template, fallback_responses, handoff_triggers, hard_blocks, routing_rules, created_at')
    .eq('organization_id', ORG_ID)
  console.log('\n=== PLAYBOOKS ===')
  for (const pb of (playbooks ?? [])) {
    console.log(`\n[${pb.channel}] "${pb.name}" v${pb.version} (active: ${pb.is_active})`)
    console.log(`  System prompt (ilk 300): ${pb.system_prompt_template?.slice(0, 300)}`)
    console.log(`  Fallbacks: ${JSON.stringify(pb.fallback_responses)}`)
    console.log(`  Handoff triggers: ${JSON.stringify(pb.handoff_triggers)}`)
    console.log(`  Hard blocks: ${JSON.stringify(pb.hard_blocks)}`)
    console.log(`  Routing rules: ${JSON.stringify(pb.routing_rules)}`)
  }

  // Intake Schemas
  const { data: intakes } = await supabase
    .from('intake_schemas')
    .select('id, name, channel, fields, is_active')
    .eq('organization_id', ORG_ID)
  console.log('\n=== INTAKE SCHEMAS ===')
  for (const schema of (intakes ?? [])) {
    console.log(`\n[${schema.channel}] "${schema.name}" (active: ${schema.is_active})`)
    console.log(`  Fields: ${JSON.stringify(schema.fields, null, 2)}`)
  }
}

main().catch(err => { console.error(err); process.exit(1) })
