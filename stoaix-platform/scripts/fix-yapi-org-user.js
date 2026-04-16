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

  // yapiprefabrik@gmail.com — asıl kullanıcı
  const CORRECT_USER_ID = 'e46f3a2b-608e-4eda-b79a-65bc7f2e2122'

  // Mevcut kayıtları temizle (typo olanlar dahil)
  const { error: delErr } = await supabase
    .from('org_users')
    .delete()
    .eq('organization_id', ORG_ID)
  if (delErr) throw delErr
  console.log('Eski org_users kayitlari silindi')

  // Doğru user'ı ekle
  const { error: insErr } = await supabase
    .from('org_users')
    .insert({ organization_id: ORG_ID, user_id: CORRECT_USER_ID, role: 'admin' })
  if (insErr) throw insErr
  console.log('yapiprefabrik@gmail.com -> org_users admin olarak eklendi')
}

main().catch(console.error)
