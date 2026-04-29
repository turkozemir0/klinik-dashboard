/**
 * Fetch-Merge-Push: n8n workflow updater that preserves Config node credentials
 *
 * For each workflow:
 *   1. GET current workflow from n8n (has real credentials in Config node)
 *   2. Merge: keep Config node from n8n, take everything else from local JSON
 *   3. PUT merged workflow back to n8n
 *
 * Usage: N8N_API_KEY="..." node fetch-merge-push.js
 */

const fs    = require('fs')
const path  = require('path')
const https = require('https')

const API_KEY = process.env.N8N_API_KEY

if (!API_KEY) {
  console.error('ERROR: N8N_API_KEY env var required')
  console.error('Usage: N8N_API_KEY="eyJhbGci..." node fetch-merge-push.js')
  process.exit(1)
}

// --- Target workflows: [localFile, n8nId] ---
const WORKFLOWS = [
  ['WF_appointment_confirm_chat.json',   '3ScNHTsWa7WzdJsh'],
  ['WF_lead_first_contact_chat.json',    '1fPZ7x4QH7kWqCUA'],
  ['WF_chatbot_followup.json',           'ecFleUmnZkC9uBSJ'],
  ['WF_appointment_reminder_chat.json',  'yrjpt1YMW8e3ratt'],
  ['WF_satisfaction_survey_chat.json',   'Dno0a6fIFgpIXahH'],
  ['WF_reactivation_chat.json',         'QCUIdU7ywb8McTzQ'],
  ['WF_payment_followup_chat.json',     'vIXKosem6nrjQLJU'],
  ['WF_call_then_whatsapp.json',        'YhsEBP2GXKDiNZeE'],
  ['WF_drip_reactivation.json',         'DhBrDEoPKfRppbuy'],
]

function apiRequest(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null
    const options = {
      hostname: 'n8n.stoaix.com',
      path: urlPath,
      method,
      headers: {
        'X-N8N-API-KEY': API_KEY,
        'Content-Type': 'application/json',
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
      },
    }
    const req = https.request(options, res => {
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(chunks.join('')) })
        } catch {
          resolve({ status: res.statusCode, data: chunks.join('') })
        }
      })
    })
    req.on('error', reject)
    if (bodyStr) req.write(bodyStr)
    req.end()
  })
}

async function main() {
  const dir = __dirname
  let ok = 0, fail = 0

  for (const [file, id] of WORKFLOWS) {
    const localPath = path.join(dir, file)
    if (!fs.existsSync(localPath)) {
      console.log(`✗ SKIP   ${file} — file not found`)
      fail++
      continue
    }

    const local = JSON.parse(fs.readFileSync(localPath, 'utf8'))

    // 1. Fetch current workflow from n8n
    console.log(`  Fetching ${id} (${file})...`)
    const { status: getStatus, data: n8nWf } = await apiRequest('GET', `/api/v1/workflows/${id}`)
    if (getStatus !== 200) {
      console.log(`✗ FAIL   ${file} — GET returned HTTP ${getStatus}`)
      fail++
      continue
    }

    // 2. Find Config node in n8n version (preserve credentials)
    const n8nConfigNode = (n8nWf.nodes || []).find(n => n.name === 'Config')

    // 3. Merge: local nodes but keep Config from n8n
    const mergedNodes = local.nodes.map(n => {
      if (n.name === 'Config' && n8nConfigNode) {
        return n8nConfigNode
      }
      return n
    })

    // 4. PUT merged workflow
    const putBody = {
      name: local.name,
      nodes: mergedNodes,
      connections: local.connections,
      settings: local.settings || {},
    }

    const { status: putStatus, data: putData } = await apiRequest('PUT', `/api/v1/workflows/${id}`, putBody)
    if (putStatus === 200) {
      const configKept = n8nConfigNode ? '(Config preserved)' : '(no Config node)'
      console.log(`✓ OK     ${file} ${configKept}`)
      ok++
    } else {
      console.log(`✗ FAIL   ${file} — PUT returned HTTP ${putStatus}`, JSON.stringify(putData).slice(0, 300))
      fail++
    }
  }

  console.log(`\nDone. Success: ${ok}, Failed: ${fail}`)

  // --- Verification ---
  if (ok > 0) {
    console.log('\n--- Verification ---')

    // Check C3: appointment_confirm should have "Send WA Template", not "Send WA Text"
    const { data: c3 } = await apiRequest('GET', '/api/v1/workflows/3ScNHTsWa7WzdJsh')
    const nodeNames = (c3.nodes || []).map(n => n.name)
    const hasTemplate = nodeNames.includes('Send WA Template')
    const hasOldText  = nodeNames.includes('Send WA Text')
    console.log(`C3 "Send WA Template": ${hasTemplate ? '✓' : '✗'}`)
    console.log(`C3 "Send WA Text" removed: ${!hasOldText ? '✓' : '✗ STILL PRESENT'}`)

    // Check LANG_MAP in C1 (lead_first_contact)
    const { data: c1 } = await apiRequest('GET', '/api/v1/workflows/1fPZ7x4QH7kWqCUA')
    const c1Code = JSON.stringify(c1.nodes)
    const hasLangMap = c1Code.includes('LANG_MAP')
    console.log(`C1 LANG_MAP present: ${hasLangMap ? '✓' : '✗'}`)

    // Check Config node credentials preserved
    const configNode = (c3.nodes || []).find(n => n.name === 'Config')
    if (configNode) {
      const configStr = JSON.stringify(configNode)
      const hasPlaceholder = configStr.includes('YOUR_')
      console.log(`C3 Config credentials: ${hasPlaceholder ? '✗ HAS PLACEHOLDERS' : '✓ real values preserved'}`)
    } else {
      console.log(`C3 Config: not found`)
    }
  }
}

main().catch(console.error)
