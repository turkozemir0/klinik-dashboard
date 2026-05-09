/**
 * CW2 Callback — Success node'una attempt alanı ekler.
 * Olmadan n8n-result attempt=1 okur → sonsuz döngü.
 *
 * Usage: N8N_API_KEY="..." node n8n-workflows/patch-cw2-callback-attempt.js
 */
const N8N_API_KEY = process.env.N8N_API_KEY
const N8N_BASE = 'https://n8n.stoaix.com'
const CW2_ID = '1yuTf9y3f2CzSsWF'

async function run() {
  const res = await fetch(`${N8N_BASE}/api/v1/workflows/${CW2_ID}`, {
    headers: { 'X-N8N-API-KEY': N8N_API_KEY }
  })
  const wf = await res.json()

  const nodes = wf.nodes.map(n => {
    if (n.name !== 'Callback — Success') return n
    return {
      ...n,
      parameters: {
        ...n.parameters,
        jsonBody: `={\n  "run_id": "{{ $('Webhook').first().json.body.run_id }}",\n  "status": "success",\n  "result": {\n    "notes": "WasenderAPI AI message sent",\n    "attempt": {{ $('Webhook').first().json.body.contact_data?.attempt || 1 }}\n  }\n}`,
      }
    }
  })

  const putRes = await fetch(`${N8N_BASE}/api/v1/workflows/${CW2_ID}`, {
    method: 'PUT',
    headers: { 'X-N8N-API-KEY': N8N_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: wf.name, nodes, connections: wf.connections, settings: wf.settings }),
  })

  if (putRes.ok) {
    console.log('✓ CW2 Callback — Success: attempt alanı eklendi')
  } else {
    console.error('✗ PUT failed:', await putRes.text())
  }
}

run().catch(console.error)
