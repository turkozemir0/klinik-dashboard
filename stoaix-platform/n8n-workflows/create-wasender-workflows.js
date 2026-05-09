/**
 * Creates 8 WasenderAPI gateway workflows in n8n.
 * Each workflow: Webhook → Config → [Wait] → Call Gateway → Callback
 *
 * Usage:
 *   N8N_API_KEY="..." node n8n-workflows/create-wasender-workflows.js
 */

const N8N_API_KEY = process.env.N8N_API_KEY
const N8N_BASE_URL = process.env.N8N_BASE_URL || 'https://n8n.stoaix.com'

if (!N8N_API_KEY) {
  console.error('N8N_API_KEY environment variable required')
  process.exit(1)
}

// ── Workflow definitions ────────────────────────────────────────────────
const WORKFLOWS = [
  {
    name: 'stoaix — CW1 Lead First Contact Chat (WasenderAPI)',
    webhookPath: 'lead-first-contact-chat-wa',
    scenario: 'first_contact',
    hasDelay: true,
    delayExpr: "={{ $('Webhook').first().json.body.config?.delay_minutes ?? 2 }}",
    hasWorkingHours: true,
  },
  {
    name: 'stoaix — CW2 Chatbot Follow-up (WasenderAPI)',
    webhookPath: 'chatbot-followup-wa',
    scenario: 'followup',
    hasDelay: false,
    hasWorkingHours: true,
    extraContactData: '  body.contact_data.attempt = body.contact_data?.attempt ?? 1;\n',
  },
  {
    name: 'stoaix — CW3 Appointment Confirm Chat (WasenderAPI)',
    webhookPath: 'appointment-confirm-chat-wa',
    scenario: 'appointment_confirm',
    hasDelay: true,
    delayExpr: '={{ 1 }}',  // minimal delay
    hasWorkingHours: false,
  },
  {
    name: 'stoaix — CW4 Appointment Reminder Chat (WasenderAPI)',
    webhookPath: 'appointment-reminder-chat-wa',
    scenario: 'appointment_reminder',
    hasDelay: false,
    hasWorkingHours: false,
  },
  {
    name: 'stoaix — CW5 Satisfaction Survey Chat (WasenderAPI)',
    webhookPath: 'satisfaction-survey-chat-wa',
    scenario: 'satisfaction_survey',
    hasDelay: false,
    hasWorkingHours: true,
  },
  {
    name: 'stoaix — CW7 Reactivation Chat (WasenderAPI)',
    webhookPath: 'reactivation-chat-wa',
    scenario: 'reactivation',
    hasDelay: false,
    hasWorkingHours: false,
  },
  {
    name: 'stoaix — CW8 Payment Follow-up Chat (WasenderAPI)',
    webhookPath: 'payment-followup-chat-wa',
    scenario: 'payment_followup',
    hasDelay: false,
    hasWorkingHours: false,
  },
  {
    name: 'stoaix — SW1 Call Then WA (WasenderAPI)',
    webhookPath: 'call-then-whatsapp-wa',
    scenario: 'call_fallback',
    hasDelay: false,
    hasWorkingHours: false,
  },
]

// ── Node builders ───────────────────────────────────────────────────────
function makeId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

function webhookNode(path, xPos) {
  return {
    parameters: {
      path,
      httpMethod: 'POST',
      responseMode: 'onReceived',
      responseData: 'firstEntryJson',
      options: {},
    },
    id: makeId(),
    name: 'Webhook',
    type: 'n8n-nodes-base.webhook',
    typeVersion: 2,
    position: [xPos, 300],
    webhookId: makeId(),
  }
}

function configNode(xPos) {
  return {
    parameters: {
      assignments: {
        assignments: [
          {
            id: 'cfg_platform_url',
            name: 'PLATFORM_URL',
            value: 'https://platform.stoaix.com',
            type: 'string',
          },
          {
            id: 'cfg_internal_secret',
            name: 'INTERNAL_SECRET',
            value: 'YOUR_WORKFLOW_INTERNAL_SECRET',
            type: 'string',
          },
        ],
      },
      options: {},
    },
    id: makeId(),
    name: 'Config',
    type: 'n8n-nodes-base.set',
    typeVersion: 3.4,
    position: [xPos, 300],
  }
}

function waitNode(delayExpr, xPos) {
  return {
    parameters: {
      resume: 'timeInterval',
      unit: 'minutes',
      amount: delayExpr,
    },
    id: makeId(),
    name: 'Wait Delay',
    type: 'n8n-nodes-base.wait',
    typeVersion: 1.1,
    position: [xPos, 300],
  }
}

function workingHoursNode(xPos) {
  return {
    parameters: {
      jsCode: [
        "const body = $('Webhook').first().json.body;",
        "const config = body.config || {};",
        "const start = parseInt(config.working_hours_start?.replace(':','') || '0900', 10);",
        "const end   = parseInt(config.working_hours_end?.replace(':','') || '1900', 10);",
        "const now   = new Date();",
        "const hours = now.getHours() * 100 + now.getMinutes();",
        "const inHours = hours >= start && hours < end;",
        "const action  = config.after_hours_action || 'wait';",
        "if (!inHours && action === 'wait') {",
        "  return [];  // empty = stop execution (wait for next trigger)",
        "}",
        "return [{ json: { proceed: true } }];",
      ].join('\n'),
    },
    id: makeId(),
    name: 'Working Hours?',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [xPos, 300],
  }
}

function callGatewayNode(scenario, xPos) {
  return {
    parameters: {
      method: 'POST',
      url: "={{ $('Config').first().json.PLATFORM_URL + '/api/wa-send' }}",
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: 'x-internal-secret', value: "={{ $('Config').first().json.INTERNAL_SECRET }}" },
          { name: 'Content-Type', value: 'application/json' },
        ],
      },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: `={
  "org_id": "{{ $('Webhook').first().json.body.org_id }}",
  "phone": "{{ $('Webhook').first().json.body.phone }}",
  "run_id": "{{ $('Webhook').first().json.body.run_id }}",
  "scenario": "${scenario}",
  "contact_data": {{ JSON.stringify($('Webhook').first().json.body.contact_data || {}) }}
}`,
      options: {
        timeout: 30000,
      },
    },
    id: makeId(),
    name: 'Call Gateway',
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.2,
    position: [xPos, 300],
  }
}

function callbackSuccessNode(xPos) {
  return {
    parameters: {
      method: 'POST',
      url: "={{ $('Webhook').first().json.body.callback_url }}",
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: 'Content-Type', value: 'application/json' },
          { name: 'x-n8n-secret', value: "={{ $('Config').first().json.INTERNAL_SECRET }}" },
        ],
      },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: `={
  "run_id": "{{ $('Webhook').first().json.body.run_id }}",
  "status": "success",
  "result": { "notes": "WasenderAPI AI message sent" }
}`,
    },
    id: makeId(),
    name: 'Callback — Success',
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.2,
    position: [xPos, 300],
  }
}

function callbackFailedNode(xPos) {
  return {
    parameters: {
      method: 'POST',
      url: "={{ $('Webhook').first().json.body.callback_url }}",
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: 'Content-Type', value: 'application/json' },
          { name: 'x-n8n-secret', value: "={{ $('Config').first().json.INTERNAL_SECRET }}" },
        ],
      },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: `={
  "run_id": "{{ $('Webhook').first().json.body.run_id }}",
  "status": "failed",
  "result": { "notes": "WasenderAPI gateway call failed" }
}`,
    },
    id: makeId(),
    name: 'Callback — Failed',
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.2,
    position: [xPos, 500],  // offset Y for error branch
  }
}

function gatewayOkNode(xPos) {
  return {
    parameters: {
      conditions: {
        options: { leftValue: '', typeValidation: 'loose' },
        conditions: [
          {
            id: 'gw_ok',
            leftValue: '={{ $json.success }}',
            rightValue: true,
            operator: { type: 'boolean', operation: 'equals' },
          },
        ],
        combinator: 'and',
      },
    },
    id: makeId(),
    name: 'Gateway OK?',
    type: 'n8n-nodes-base.if',
    typeVersion: 2,
    position: [xPos, 300],
  }
}

// ── Build workflow ──────────────────────────────────────────────────────
function buildWorkflow(def) {
  const nodes = []
  const connections = {}
  let x = 200

  // 1. Webhook
  const wh = webhookNode(def.webhookPath, x)
  nodes.push(wh)
  x += 250

  // 2. Config
  const cfg = configNode(x)
  nodes.push(cfg)
  connections['Webhook'] = { main: [[{ node: 'Config', type: 'main', index: 0 }]] }
  x += 250

  let prevNodeName = 'Config'

  // 3. Optional Wait Delay
  if (def.hasDelay) {
    const w = waitNode(def.delayExpr, x)
    nodes.push(w)
    connections[prevNodeName] = { main: [[{ node: 'Wait Delay', type: 'main', index: 0 }]] }
    prevNodeName = 'Wait Delay'
    x += 250
  }

  // 4. Optional Working Hours check
  if (def.hasWorkingHours) {
    const wh2 = workingHoursNode(x)
    nodes.push(wh2)
    connections[prevNodeName] = { main: [[{ node: 'Working Hours?', type: 'main', index: 0 }]] }
    prevNodeName = 'Working Hours?'
    x += 250
  }

  // 5. Call Gateway
  const gw = callGatewayNode(def.scenario, x)
  nodes.push(gw)
  connections[prevNodeName] = { main: [[{ node: 'Call Gateway', type: 'main', index: 0 }]] }
  x += 250

  // 6. Gateway OK? (IF node)
  const ifNode = gatewayOkNode(x)
  nodes.push(ifNode)
  connections['Call Gateway'] = { main: [[{ node: 'Gateway OK?', type: 'main', index: 0 }]] }
  x += 250

  // 7. Callback — Success (true branch)
  const cbOk = callbackSuccessNode(x)
  nodes.push(cbOk)

  // 8. Callback — Failed (false branch)
  const cbFail = callbackFailedNode(x)
  nodes.push(cbFail)

  connections['Gateway OK?'] = {
    main: [
      [{ node: 'Callback — Success', type: 'main', index: 0 }],  // true
      [{ node: 'Callback — Failed', type: 'main', index: 0 }],   // false
    ],
  }

  return {
    name: def.name,
    nodes,
    connections,
    settings: {
      executionOrder: 'v1',
    },
  }
}

// ── Main ────────────────────────────────────────────────────────────────
async function createWorkflow(wfData) {
  const res = await fetch(`${N8N_BASE_URL}/api/v1/workflows`, {
    method: 'POST',
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(wfData),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`POST failed ${res.status}: ${text}`)
  }

  return res.json()
}

async function main() {
  console.log(`Creating ${WORKFLOWS.length} WasenderAPI workflows...\n`)

  for (const def of WORKFLOWS) {
    const wfData = buildWorkflow(def)
    try {
      const result = await createWorkflow(wfData)
      console.log(`✓ ${def.name}`)
      console.log(`  ID: ${result.id}`)
      console.log(`  Webhook: ${def.webhookPath}`)
      console.log()
    } catch (err) {
      console.error(`✗ ${def.name}: ${err.message}`)
      console.log()
    }
  }

  console.log('Done!')
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
