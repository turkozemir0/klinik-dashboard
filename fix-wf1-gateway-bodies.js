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

// ── GHL Add Tags (input: Set New Conv ID → clinicId, contactId at root)
const n1 = wf.nodes.find(n => n.name === 'GHL Add Tags');
n1.parameters = gatewayNode(`={{ JSON.stringify({
  "version": "v1",
  "action": "add_tags",
  "clinic_id": $json.clinicId,
  "correlation_id": $json.contactId + "_active_" + Date.now(),
  "idempotency_key": $json.contactId + "_add_ai_active",
  "params": {
    "contact_id": $json.contactId,
    "tags": ["ai_active"]
  }
}) }}`);
n1.credentials = {};
console.log('GHL Add Tags ✓');

// ── GHL Tag Warm (input: Is Nurturing? → Parse AI + Score data: clinicId, contactId, score, metadata)
const n2 = wf.nodes.find(n => n.name === 'GHL Tag Warm');
n2.parameters = gatewayNode(`={{ JSON.stringify({
  "version": "v1",
  "action": "add_tags",
  "clinic_id": $json.clinicId,
  "correlation_id": $json.contactId + "_warm_" + Date.now(),
  "idempotency_key": $json.contactId + "_warm_lead",
  "params": {
    "contact_id": $json.contactId,
    "tags": ["warm_lead"]
  }
}) }}`);
n2.credentials = {};
console.log('GHL Tag Warm ✓');

// ── GHL Remove AI Tag (input: GHL Tag Warm → same data as above)
const n3 = wf.nodes.find(n => n.name === 'GHL Remove AI Tag');
n3.parameters = gatewayNode(`={{ JSON.stringify({
  "version": "v1",
  "action": "remove_tags",
  "clinic_id": $json.clinicId,
  "correlation_id": $json.contactId + "_rmtag_" + Date.now(),
  "idempotency_key": $json.contactId + "_remove_ai_active",
  "params": {
    "contact_id": $json.contactId,
    "tags": ["ai_active"]
  }
}) }}`);
n3.credentials = {};
console.log('GHL Remove AI Tag ✓');

// ── GHL Update Contact (input: Send WhatsApp Reply response → reference Parse AI + Score)
const n4 = wf.nodes.find(n => n.name === 'GHL Update Contact');
n4.parameters = gatewayNode(`={{ JSON.stringify({
  "version": "v1",
  "action": "update_contact_fields",
  "clinic_id": $('Parse AI + Score').first().json.clinicId,
  "correlation_id": $('Parse AI + Score').first().json.contactId + "_update_" + Date.now(),
  "idempotency_key": $('Parse AI + Score').first().json.contactId + "_update_fields",
  "params": {
    "contact_id": $('Parse AI + Score').first().json.contactId,
    "fields": {
      "lead_score":           $('Parse AI + Score').first().json.score,
      "qualification_status": $('Parse AI + Score').first().json.metadata?.qualification_status,
      "interested_service":   $('Parse AI + Score').first().json.metadata?.collected_data?.interested_service,
      "pain_point":           $('Parse AI + Score').first().json.metadata?.collected_data?.pain_point,
      "timeline":             $('Parse AI + Score').first().json.metadata?.collected_data?.timeline,
      "budget_awareness":     $('Parse AI + Score').first().json.metadata?.collected_data?.budget_awareness,
      "ai_summary":           $('Parse AI + Score').first().json.reply
    }
  }
}) }}`);
n4.credentials = {};
console.log('GHL Update Contact ✓');

fs.writeFileSync('n8n-workflows/WF1 - Incoming Message Handler (Simplified) LATEST.json', JSON.stringify(wf, null, 2), 'utf-8');
console.log('\nWF1 gateway bodies düzeltildi ✓');
