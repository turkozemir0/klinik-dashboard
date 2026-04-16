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
  const ORG_ID = 'f9b28ede-ff26-4951-ba94-e020140e9d8d'

  const { data: orgUsers } = await supabase
    .from('org_users')
    .select('user_id, role')
    .eq('organization_id', ORG_ID)

  console.log('org_users (Yapi Prefabrik):', JSON.stringify(orgUsers, null, 2))

  // Auth users listesi
  const { data: { users } } = await supabase.auth.admin.listUsers()
  const yapi = users.filter(u =>
    u.email && (u.email.includes('yapi') || u.email.includes('prefabrik'))
  )
  console.log('Yapi ile eslesen auth users:', JSON.stringify(yapi.map(u => ({ id: u.id, email: u.email })), null, 2))
}

main().catch(console.error)
