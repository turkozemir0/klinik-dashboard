/**
 * n8n Workflow Configurator
 * Reads credentials from .env.n8n, patches all WF_*.json files,
 * writes configured versions to ./configured/ (gitignored)
 *
 * Usage: node configure.js
 */

const fs   = require('fs')
const path = require('path')

// ── Load .env.n8n ──────────────────────────────────────────────────────────
const envPath = path.join(__dirname, '.env.n8n')
if (!fs.existsSync(envPath)) {
  console.error('ERROR: .env.n8n not found. Create it first.')
  process.exit(1)
}

const env = {}
fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const [key, ...rest] = line.trim().split('=')
  if (key && rest.length) env[key] = rest.join('=')
})

const required = [
  'SUPABASE_SERVICE_KEY', 'INTERNAL_SECRET',
  'LIVEKIT_URL', 'LIVEKIT_HTTP_URL',
  'LIVEKIT_API_KEY', 'LIVEKIT_API_SECRET',
  'LIVEKIT_AGENT_NAME',
]
const missing = required.filter(k => !env[k])
if (missing.length) {
  console.error('ERROR: Missing values in .env.n8n:', missing.join(', '))
  process.exit(1)
}

// ── Placeholder → real value mapping ──────────────────────────────────────
const replacements = [
  ['YOUR_SUPABASE_SERVICE_ROLE_KEY', env.SUPABASE_SERVICE_KEY],
  ['YOUR_WORKFLOW_INTERNAL_SECRET',  env.INTERNAL_SECRET],
  ['YOUR_LIVEKIT_URL',               env.LIVEKIT_URL],
  ['YOUR_LIVEKIT_HTTP_URL',          env.LIVEKIT_HTTP_URL],
  ['YOUR_LIVEKIT_API_KEY',           env.LIVEKIT_API_KEY],
  ['YOUR_LIVEKIT_API_SECRET',        env.LIVEKIT_API_SECRET],
  ['YOUR_LIVEKIT_AGENT_NAME',        env.LIVEKIT_AGENT_NAME],
]
// Note: LIVEKIT_SIP_TRUNK_ID is per-organization — read from org.channel_config.voice_outbound.livekit_sip_outbound_trunk_id at runtime

// ── Output dir ─────────────────────────────────────────────────────────────
const outDir = path.join(__dirname, 'configured')
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir)

// ── Process files ──────────────────────────────────────────────────────────
const files = fs.readdirSync(__dirname).filter(f => f.startsWith('WF_') && f.endsWith('.json'))

let patched = 0
for (const file of files) {
  let content = fs.readFileSync(path.join(__dirname, file), 'utf8')
  let changed = false

  for (const [placeholder, value] of replacements) {
    if (content.includes(placeholder)) {
      content = content.split(placeholder).join(value)
      changed = true
    }
  }

  fs.writeFileSync(path.join(outDir, file), content, 'utf8')
  console.log(changed ? `✓ Patched: ${file}` : `  Copied:  ${file}`)
  if (changed) patched++
}

console.log(`\nDone. ${patched} files patched → ./configured/`)
console.log('Import the JSON files from the "configured" folder into n8n.')
if (env.LIVEKIT_SIP_TRUNK_ID === 'YOUR_SIP_TRUNK_ID') {
  console.log('\nWARNING: LIVEKIT_SIP_TRUNK_ID not set — voice outbound calls will not work until filled.')
}
