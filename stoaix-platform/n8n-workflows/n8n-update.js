/**
 * n8n Workflow Updater
 * Gets all n8n workflows, matches by name with configured/ folder, updates via API
 */

const fs   = require('fs')
const path = require('path')
const https = require('https')

const N8N_URL = 'https://n8n.stoaix.com'
const API_KEY = process.env.N8N_API_KEY

if (!API_KEY) {
  console.error('ERROR: N8N_API_KEY env var required')
  process.exit(1)
}

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

async function getAllWorkflows() {
  const all = []
  let cursor = null
  do {
    const qs = cursor ? `/api/v1/workflows?limit=250&cursor=${cursor}` : '/api/v1/workflows?limit=250'
    const { data } = await apiRequest('GET', qs)
    all.push(...(data.data || []))
    cursor = data.nextCursor || null
  } while (cursor)
  return all
}

async function main() {
  const configuredDir = path.join(__dirname, 'configured')
  const localFiles = fs.readdirSync(configuredDir).filter(f => f.startsWith('WF_') && f.endsWith('.json'))

  console.log(`Found ${localFiles.length} local workflow files`)

  const n8nWorkflows = await getAllWorkflows()
  console.log(`Found ${n8nWorkflows.length} workflows in n8n\n`)

  // Build name → id map
  const nameToId = {}
  for (const wf of n8nWorkflows) nameToId[wf.name] = wf.id

  let updated = 0, created = 0, skipped = 0

  for (const file of localFiles) {
    const local = JSON.parse(fs.readFileSync(path.join(configuredDir, file), 'utf8'))
    const name  = local.name
    const id    = nameToId[name]

    if (id) {
      const body = {
        name,
        nodes:       local.nodes,
        connections: local.connections,
        settings:    local.settings || {},
        staticData:  null,
      }

      const { status, data } = await apiRequest('PUT', `/api/v1/workflows/${id}`, body)
      if (status === 200) {
        console.log(`✓ Updated  [${id}]: ${name}`)
        updated++
      } else {
        console.log(`✗ Failed   [${id}]: ${name} — HTTP ${status}`, JSON.stringify(data).slice(0, 200))
        skipped++
      }
    } else {
      // Create new
      const body = {
        name,
        nodes:       local.nodes,
        connections: local.connections,
        settings:    local.settings || {},
        staticData:  null,
      }
      const { status, data } = await apiRequest('POST', '/api/v1/workflows', body)
      if (status === 200 || status === 201) {
        console.log(`+ Created  [${data.id}]: ${name}`)
        created++
      } else {
        console.log(`✗ Failed create: ${name} — HTTP ${status}`, JSON.stringify(data).slice(0, 200))
        skipped++
      }
    }
  }

  console.log(`\nDone. Updated: ${updated}, Created: ${created}, Failed: ${skipped}`)
}

main().catch(console.error)
