/**
 * Patches the INTERNAL_SECRET in all WasenderAPI workflows.
 * Reads from .env.n8n to get the actual secret value.
 *
 * Usage:
 *   N8N_API_KEY="..." node n8n-workflows/patch-wasender-secrets.js
 */

const fs = require('fs')
const path = require('path')

const N8N_API_KEY = process.env.N8N_API_KEY
const N8N_BASE_URL = process.env.N8N_BASE_URL || 'https://n8n.stoaix.com'

if (!N8N_API_KEY) {
  console.error('N8N_API_KEY environment variable required')
  process.exit(1)
}

// Read .env.n8n
const envFile = fs.readFileSync(path.join(__dirname, '.env.n8n'), 'utf8')
const envVars = {}
envFile.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=')
  if (key?.trim()) envVars[key.trim()] = vals.join('=').trim()
})

const INTERNAL_SECRET = envVars.INTERNAL_SECRET
if (!INTERNAL_SECRET) {
  console.error('INTERNAL_SECRET not found in .env.n8n')
  process.exit(1)
}

// New workflow IDs from the creation script output
const WORKFLOW_IDS = [
  'zydA9m4AZd6oxFn9',  // CW1
  '1yuTf9y3f2CzSsWF',  // CW2
  '1ZxzwHrLueFSnIRX',  // CW3
  'MGXZJoxo2IlaIDsW',  // CW4
  '00ciEpJJHvI707w1',  // CW5
  'awMlKwYkgtiRqvn1',  // CW7
  'DwmV35Gv6E08jonh',  // CW8
  'Jk0I8urA5F46eaww',  // SW1
]

async function patchWorkflow(wfId) {
  // GET current workflow
  const getRes = await fetch(`${N8N_BASE_URL}/api/v1/workflows/${wfId}`, {
    headers: { 'X-N8N-API-KEY': N8N_API_KEY },
  })
  if (!getRes.ok) throw new Error(`GET ${wfId} failed: ${getRes.status}`)
  const wf = await getRes.json()

  // Find Config node and replace placeholder
  let patched = false
  for (const node of wf.nodes) {
    if (node.name === 'Config' && node.parameters?.assignments?.assignments) {
      for (const a of node.parameters.assignments.assignments) {
        if (a.name === 'INTERNAL_SECRET' && a.value === 'YOUR_WORKFLOW_INTERNAL_SECRET') {
          a.value = INTERNAL_SECRET
          patched = true
        }
      }
    }
  }

  if (!patched) {
    console.log(`  ${wfId}: already patched or no placeholder found`)
    return
  }

  // PUT back — only allowed fields
  const body = {
    name: wf.name,
    nodes: wf.nodes,
    connections: wf.connections,
    settings: wf.settings,
  }
  const putRes = await fetch(`${N8N_BASE_URL}/api/v1/workflows/${wfId}`, {
    method: 'PUT',
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!putRes.ok) {
    const text = await putRes.text()
    throw new Error(`PUT ${wfId} failed: ${putRes.status}: ${text}`)
  }

  console.log(`  ${wfId}: ✓ patched`)
}

async function main() {
  console.log('Patching INTERNAL_SECRET in WasenderAPI workflows...\n')

  for (const wfId of WORKFLOW_IDS) {
    try {
      await patchWorkflow(wfId)
    } catch (err) {
      console.error(`  ${wfId}: ✗ ${err.message}`)
    }
  }

  console.log('\nDone!')
}

main()
