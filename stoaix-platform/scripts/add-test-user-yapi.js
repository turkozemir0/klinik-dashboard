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

  // Auth user oluştur
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email: 'testtesttest@gmail.com',
    password: 'testtest123',
    email_confirm: true,
  })
  if (createErr) throw createErr
  const userId = created.user.id
  console.log('Auth user olusturuldu:', userId)

  // org_users'a ekle
  const { error: ouErr } = await supabase.from('org_users').insert({
    organization_id: ORG_ID,
    user_id: userId,
    role: 'admin',
  })
  if (ouErr) throw ouErr
  console.log('org_users eklendi — testtesttest@gmail.com / Yapi Prefabrik admin')
}

main().catch(console.error)
