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

const wf = JSON.parse(fs.readFileSync('n8n-workflows/WF1 - Incoming Message Handler (Simplified) LATEST.json', 'utf-8'));

// ── 1. GHL Tag: Gorsel Alindi → gateway add_tags
// Input: Human Check → has clinicId, contactId at root
const n1 = wf.nodes.find(n => n.name === 'GHL Tag: Gorsel Alindi');
if (n1) {
  n1.parameters = gatewayNode(`={{ JSON.stringify({
  "version": "v1",
  "action": "add_tags",
  "clinic_id": $('Human Check').first().json.clinicId,
  "correlation_id": $('Human Check').first().json.contactId + "_gorsel_" + Date.now(),
  "idempotency_key": $('Human Check').first().json.contactId + "_gorsel_alindi",
  "params": {
    "contact_id": $('Human Check').first().json.contactId,
    "tags": ["gorsel_gonderdi"]
  }
}) }}`);
  n1.credentials = {};
  console.log('GHL Tag: Gorsel Alindi → gateway ✓');
}

// ── 2. CRM Router If node — fix broken .first() reference
// crmType is in the n8n webhook body: $('Webhook Incoming').first().json.body.crmType
// BUT Human Check reads webhook.crmType is NOT forwarded — so reference Webhook Incoming directly
const crmRouter = wf.nodes.find(n => n.name === 'CRM Router');
if (crmRouter) {
  crmRouter.parameters.conditions.conditions[0].leftValue =
    "={{ ($('Webhook Incoming').first().json.body || $('Webhook Incoming').first().json).crmType || 'ghl' }}";
  console.log('CRM Router condition → fixed ✓');
}

// ── 3. Send Custom CRM Reply → gateway send_message
// Input: CRM Router false branch — reference Parse AI + Score for reply data
const n3 = wf.nodes.find(n => n.name === 'Send Custom CRM Reply');
if (n3) {
  n3.parameters = gatewayNode(`={{ JSON.stringify({
  "version": "v1",
  "action": "send_message",
  "clinic_id": $('Parse AI + Score').first().json.clinicId,
  "correlation_id": $('Parse AI + Score').first().json.contactId + "_reply_" + Date.now(),
  "idempotency_key": $('Parse AI + Score').first().json.contactId + "_custom_reply",
  "params": {
    "contact_id": $('Parse AI + Score').first().json.contactId,
    "message": $('Parse AI + Score').first().json.reply,
    "message_type": "SMS"
  }
}) }}`);
  n3.credentials = {};
  console.log('Send Custom CRM Reply → gateway ✓');
}

fs.writeFileSync('n8n-workflows/WF1 - Incoming Message Handler (Simplified) LATEST.json', JSON.stringify(wf, null, 2), 'utf-8');
console.log('\nWF1 kalan sorunlar düzeltildi ✓');
