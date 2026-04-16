const https = require('https')

const API_KEY = process.env.N8N_API_KEY

function get(urlPath) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'n8n.stoaix.com',
      path: urlPath,
      method: 'GET',
      headers: { 'X-N8N-API-KEY': API_KEY },
    }
    const req = https.request(options, res => {
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => resolve(JSON.parse(chunks.join(''))))
    })
    req.on('error', reject)
    req.end()
  })
}

async function main() {
  // Get last execution of C1
  const execs = await get('/api/v1/executions?workflowId=1fPZ7x4QH7kWqCUA&limit=3&includeData=true')
  const exec = execs.data?.[0]
  if (!exec) { console.log('No executions'); return }

  console.log('Execution ID:', exec.id, '| Status:', exec.status)
  const runData = exec.data?.resultData?.runData || {}
  console.log('Nodes with data:', Object.keys(runData))

  const webhookData = runData['Webhook']
  if (webhookData) {
    const item = webhookData[0]?.data?.main?.[0]?.[0]?.json
    console.log('\nWebhook node output (json):')
    console.log(JSON.stringify(item, null, 2))
  } else {
    console.log('No Webhook node data found')
  }
}

main().catch(console.error)
