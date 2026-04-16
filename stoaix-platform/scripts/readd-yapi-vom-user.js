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

  const { error } = await supabase.from('org_users').insert({
    organization_id: 'f9b28ede-ff26-4951-ba94-e020140e9d8d',
    user_id: 'b8c4ce27-e012-4e58-9bc0-7c6b3fa943ec',
    role: 'admin',
  })
  if (error) throw error
  console.log('yapiprefabrik@gmail.vom -> org_users eklendi')
}

main().catch(console.error)
