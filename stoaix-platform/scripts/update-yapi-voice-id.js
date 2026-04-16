const fs = require('fs')
const path = require('path')
const { createClient } = require('../dashboard/node_modules/@supabase/supabase-js')

const ORG_ID = 'f9b28ede-ff26-4951-ba94-e020140e9d8d'
const TTS_VOICE_ID = '8036098f-cff4-401e-bfba-f0a6a6e5e49b'
const VOICE_LANG = 'tr'

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

  // 1. channel_config güncelle
  const { data: org, error: fetchErr } = await supabase
    .from('organizations')
    .select('channel_config')
    .eq('id', ORG_ID)
    .single()
  if (fetchErr) throw fetchErr

  const cc = org.channel_config || {}
  cc.voice_inbound = {
    ...(cc.voice_inbound || {}),
    active: true,
    voice_language: VOICE_LANG,
    tts_voice_id: TTS_VOICE_ID,
  }

  const { error: ccErr } = await supabase
    .from('organizations')
    .update({ channel_config: cc })
    .eq('id', ORG_ID)
  if (ccErr) throw ccErr
  console.log('channel_config.voice_inbound guncellendi')

  // 2. voice playbook features güncelle (en yüksek öncelik)
  const { data: pb, error: pbFetchErr } = await supabase
    .from('agent_playbooks')
    .select('id, features')
    .eq('organization_id', ORG_ID)
    .eq('channel', 'voice')
    .order('version', { ascending: false })
    .limit(1)
    .single()
  if (pbFetchErr) throw pbFetchErr

  const { error: pbUpdateErr } = await supabase
    .from('agent_playbooks')
    .update({
      features: {
        ...pb.features,
        tts_voice_id: TTS_VOICE_ID,
        voice_language: VOICE_LANG,
        calendar_booking: false,
      },
    })
    .eq('id', pb.id)
  if (pbUpdateErr) throw pbUpdateErr
  console.log('playbook.features guncellendi')

  console.log('TAMAM — voice_id:', TTS_VOICE_ID, '| lang:', VOICE_LANG)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
