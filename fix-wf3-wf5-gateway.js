const fs = require('fs');

const GATEWAY_URL = 'https://iylabpsokydolhuhvvwi.supabase.co/functions/v1/crm-gateway';

function gatewayNode(jsonBodyExpr) {
  return {
    method: 'POST',
    url: GATEWAY_URL,
    authentication: 'genericCredentialType',
    genericAuthType: 'httpHeaderAuth',
    sendHeaders: true,
    headerParameters: {
      parameters: [
        { name: 'Content-Type', value: 'application/json' },
      ],
    },
    sendBody: true,
    specifyBody: 'json',
    jsonBody: jsonBodyExpr,
    options: { response: { response: { neverError: true } } },
  };
}

// ── WF3 ──────────────────────────────────────────────────────
const wf3 = JSON.parse(fs.readFileSync('n8n-workflows/WF3 - Nurturing Smart Followup.json', 'utf-8'));

// 1. ghl_contact_id → contact_id (Find Conversations select=* but jsonBody references)
const sendFollowup = wf3.nodes.find(n => n.name === 'Send Followup');
if (sendFollowup) {
  sendFollowup.parameters = gatewayNode(`={{ JSON.stringify({
  "version": "v1",
  "action": "send_message",
  "clinic_id": $json.clinic_id,
  "correlation_id": $json.contact_id + "_followup_" + Date.now(),
  "idempotency_key": $json.contact_id + "_nurture_followup",
  "params": {
    "contact_id": $json.contact_id,
    "message": $json.followupMessage,
    "message_type": "SMS"
  }
}) }}`);
  sendFollowup.credentials = {};
  console.log('WF3 Send Followup → gateway ✓');
}

// 2. ghl_contact_id → contact_id in any remaining refs
const wf3Str = JSON.stringify(wf3).replace(/ghl_contact_id/g, 'contact_id');
const wf3Fixed = JSON.parse(wf3Str);
fs.writeFileSync('n8n-workflows/WF3 - Nurturing Smart Followup.json', JSON.stringify(wf3Fixed, null, 2), 'utf-8');
console.log('WF3 ghl_contact_id → contact_id ✓');

// ── WF5 ──────────────────────────────────────────────────────
const wf5 = JSON.parse(fs.readFileSync('n8n-workflows/WF5 - Stale Conversation Check DEMO.json', 'utf-8'));

// 1. Fix Find Stale Conversations select query
const findStale = wf5.nodes.find(n => n.name === 'Find Stale Conversations');
if (findStale) {
  findStale.parameters.url = findStale.parameters.url.replace(
    'select=id,ghl_contact_id,message_count,lead_score,clinic_id',
    'select=id,contact_id,message_count,lead_score,clinic_id'
  );
  console.log('WF5 Find Stale Conversations select → contact_id ✓');
}

// 2. GHL Add Cold Lead Tag → gateway add_tags
const addColdTag = wf5.nodes.find(n => n.name === 'GHL Add Cold Lead Tag');
if (addColdTag) {
  addColdTag.parameters = gatewayNode(`={{ JSON.stringify({
  "version": "v1",
  "action": "add_tags",
  "clinic_id": $json.clinic_id,
  "correlation_id": $json.contact_id + "_coldtag_" + Date.now(),
  "idempotency_key": $json.contact_id + "_cold_lead_tag",
  "params": {
    "contact_id": $json.contact_id,
    "tags": [$json.newTag]
  }
}) }}`);
  addColdTag.credentials = {};
  console.log('WF5 GHL Add Cold Lead Tag → gateway ✓');
}

// 3. Remove AI Active Tag → gateway remove_tags
const removeAI = wf5.nodes.find(n => n.name === 'Remove AI Active Tag');
if (removeAI) {
  removeAI.parameters = gatewayNode(`={{ JSON.stringify({
  "version": "v1",
  "action": "remove_tags",
  "clinic_id": $json.clinic_id,
  "correlation_id": $json.contact_id + "_rmtag_" + Date.now(),
  "idempotency_key": $json.contact_id + "_remove_ai_active",
  "params": {
    "contact_id": $json.contact_id,
    "tags": ["ai_active"]
  }
}) }}`);
  removeAI.credentials = {};
  console.log('WF5 Remove AI Active Tag → gateway ✓');
}

// 4. ghl_contact_id → contact_id in remaining refs
const wf5Str = JSON.stringify(wf5).replace(/ghl_contact_id/g, 'contact_id');
const wf5Fixed = JSON.parse(wf5Str);
fs.writeFileSync('n8n-workflows/WF5 - Stale Conversation Check DEMO.json', JSON.stringify(wf5Fixed, null, 2), 'utf-8');
console.log('WF5 ghl_contact_id → contact_id ✓');

console.log('\nWF3 ve WF5 güncellendi ✓');
