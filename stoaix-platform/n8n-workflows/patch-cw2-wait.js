/**
 * CW2 WasenderAPI workflow'una Wait node ekler.
 * Config → Wait (no_reply_hours) → Working Hours?
 *
 * Usage: N8N_API_KEY="..." node n8n-workflows/patch-cw2-wait.js
 */
const N8N_API_KEY = process.env.N8N_API_KEY
const N8N_BASE = 'https://n8n.stoaix.com'
const CW2_ID = '1yuTf9y3f2CzSsWF'

async function run() {
  // Mevcut workflow'u çek
  const res = await fetch(`${N8N_BASE}/api/v1/workflows/${CW2_ID}`, {
    headers: { 'X-N8N-API-KEY': N8N_API_KEY }
  })
  const wf = await res.json()

  const waitNodeId = 'wait-no-reply-hours'

  // Wait node zaten var mı?
  if (wf.nodes.find(n => n.id === waitNodeId || n.name === 'Wait no_reply_hours')) {
    console.log('Wait node already exists, skipping.')
    return
  }

  // Yeni Wait node
  const waitNode = {
    id: waitNodeId,
    name: 'Wait no_reply_hours',
    type: 'n8n-nodes-base.wait',
    typeVersion: 1.1,
    position: [600, 300],
    parameters: {
      resume: 'timeInterval',
      amount: "={{ parseInt($('Config').first().json.no_reply_hours || '4') }}",
      unit: 'hours',
    },
    webhookId: waitNodeId,
  }

  // Bağlantıları güncelle:
  // Config → Wait (eski: Config → Working Hours?)
  // Wait   → Working Hours?
  const connections = JSON.parse(JSON.stringify(wf.connections))

  // Config'in çıkışını Wait'e yönlendir
  connections['Config'] = {
    main: [[{ node: 'Wait no_reply_hours', type: 'main', index: 0 }]]
  }

  // Wait'in çıkışını Working Hours?'a bağla
  connections['Wait no_reply_hours'] = {
    main: [[{ node: 'Working Hours?', type: 'main', index: 0 }]]
  }

  const body = {
    name: wf.name,
    nodes: [...wf.nodes, waitNode],
    connections,
    settings: wf.settings,
  }

  const putRes = await fetch(`${N8N_BASE}/api/v1/workflows/${CW2_ID}`, {
    method: 'PUT',
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (putRes.ok) {
    console.log('✓ CW2: Wait no_reply_hours node eklendi')
  } else {
    const err = await putRes.text()
    console.error('✗ PUT failed:', err)
  }
}

run().catch(console.error)
