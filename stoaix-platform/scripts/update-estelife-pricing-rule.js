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
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Mevcut playbook'u çek
  const { data: pb, error: fetchErr } = await supabase
    .from('agent_playbooks')
    .select('id, routing_rules, hard_blocks, system_prompt_template')
    .eq('organization_id', ORG_ID)
    .eq('channel', 'whatsapp')
    .eq('is_active', true)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (fetchErr) throw fetchErr
  if (!pb) throw new Error('Aktif whatsapp playbook bulunamadı')

  // price_inquiry routing rule'unu güncelle
  const updatedRules = pb.routing_rules.map(rule => {
    if (rule.id !== 'price_inquiry') return rule
    return {
      ...rule,
      action:
        'Fiyat aralığı ver: Greft sayısına ve yönteme göre genel bir fikir ver ' +
        '(örn. "500–1500 Grafts genellikle 1.500–3.500 € bandında, 3.000+ Grafts için 4.500 €\'dan başlıyor"). ' +
        'Ardından kesin fiyatın ücretsiz analizde netleşeceğini belirt ve randevuya yönlendir. ' +
        'Asla kesin teklif verme, garanti etme.',
    }
  })

  // Hard block: kesin teklif/fatura isteklerini engelle
  const updatedHardBlocks = [
    ...(pb.hard_blocks || []),
    {
      trigger_id: 'kesin_teklif',
      keywords: [
        'genaues Angebot',
        'konkreter Preis',
        'schriftliches Angebot',
        'Kostenvoranschlag schicken',
        'wie viel genau',
        'exakter Preis',
      ],
      response:
        'Einen genauen Kostenvoranschlag können wir erst nach der kostenlosen Haaranalyse erstellen – ' +
        'da der Preis von Ihrer individuellen Spenderdichte und Graftzahl abhängt. ' +
        'Soll ich gleich einen Termin für Sie vormerken?',
    },
  ]

  // System prompt'a fiyat politikası notu ekle (sona)
  const pricingNote = `

## FİYAT POLİTİKASI
Fiyat sorusunda:
1. Genel aralık ver (KB'deki Preisgestaltung kaleminden)
2. "Der genaue Preis hängt von Ihrer Spenderdichte und der benötigten Graftzahl ab – das klären wir in der kostenlosen Analyse." de
3. Randevuya / WhatsApp analizine yönlendir
ASLA kesin teklif, yazılı fiyat veya garanti verme.`

  const updatedPrompt = pb.system_prompt_template.includes('FİYAT POLİTİKASI')
    ? pb.system_prompt_template
    : pb.system_prompt_template + pricingNote

  const { error } = await supabase
    .from('agent_playbooks')
    .update({
      routing_rules: updatedRules,
      hard_blocks: updatedHardBlocks,
      system_prompt_template: updatedPrompt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', pb.id)

  if (error) throw error

  console.log('Playbook güncellendi:')
  console.log('  - price_inquiry routing rule: aralık ver + konsültasyona yönlendir')
  console.log('  - hard_block eklendi: kesin_teklif (yazılı teklif isteklerini engeller)')
  console.log('  - system_prompt\'a fiyat politikası notu eklendi')
}

main().catch(err => { console.error(err); process.exit(1) })
