const fs = require('fs')
const path = require('path')
const { createClient } = require('../dashboard/node_modules/@supabase/supabase-js')

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
  const { data } = await supabase
    .from('organizations')
    .select('crm_config, channel_config')
    .eq('id', 'ecd032a8-f40c-4171-947a-b6417461e987')
    .single()
  console.log(JSON.stringify(data, null, 2))
}
main().catch(err => { console.error(err); process.exit(1) })
