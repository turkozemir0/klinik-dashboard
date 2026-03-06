const fs = require('fs');

const wf = JSON.parse(fs.readFileSync('n8n-workflows/WF2 - Lead Handoff.json', 'utf-8'));

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
        { name: 'x-gateway-secret', value: "={{ $env.GATEWAY_SECRET }}" }
      ]
    },
    sendBody: true,
    specifyBody: 'json',
    jsonBody: jsonBodyExpr,
    options: { response: { response: { neverError: true } } }
  };
}

const convRef   = "$('Merge Conv Data').first().json";
const parseRef  = "$('Parse Summary').first().json";

// GHL Add Hot Lead Tags → add_tags
const n1 = wf.nodes.find(n => n.name === 'GHL Add Hot Lead Tags');
if (n1) {
  n1.parameters = gatewayNode(`={{ JSON.stringify({
  "version": "v1",
  "action": "add_tags",
  "clinic_id": "${convRef}.clinic_id,
  "correlation_id": ${convRef}.ghl_contact_id + "_hotlead_" + Date.now(),
  "idempotency_key": ${convRef}.ghl_contact_id + "_hotlead",
  "params": {
    "contact_id": ${convRef}.ghl_contact_id,
    "tags": ["hot_lead","human_handoff","appointment_ready"]
  }
}) }}`);
  n1.credentials = {};
  console.log('GHL Add Hot Lead Tags → gateway ✓');
}

// GHL Update Custom Fields → update_contact_fields
const n2 = wf.nodes.find(n => n.name === 'GHL Update Custom Fields');
if (n2) {
  n2.parameters = gatewayNode(`={{ JSON.stringify({
  "version": "v1",
  "action": "update_contact_fields",
  "clinic_id": ${convRef}.clinic_id,
  "correlation_id": ${convRef}.ghl_contact_id + "_handoff_" + Date.now(),
  "idempotency_key": ${convRef}.ghl_contact_id + "_handoff_fields",
  "params": {
    "contact_id": ${convRef}.ghl_contact_id,
    "fields": {
      "lead_score":            ${parseRef}.score,
      "qualification_status":  "qualified",
      "ai_summary":            ${parseRef}.summary,
      "ai_suggested_approach": ${parseRef}.suggested_approach,
      "interested_service":    ${parseRef}.interested_service
    }
  }
}) }}`);
  n2.credentials = {};
  console.log('GHL Update Custom Fields → gateway ✓');
}

// GHL Remove AI Tag → remove_tags
const n3 = wf.nodes.find(n => n.name === 'GHL Remove AI Tag');
if (n3) {
  n3.parameters = gatewayNode(`={{ JSON.stringify({
  "version": "v1",
  "action": "remove_tags",
  "clinic_id": ${convRef}.clinic_id,
  "correlation_id": ${convRef}.ghl_contact_id + "_rmtag_" + Date.now(),
  "idempotency_key": ${convRef}.ghl_contact_id + "_remove_ai_handoff",
  "params": {
    "contact_id": ${convRef}.ghl_contact_id,
    "tags": ["ai_active","warm_lead"]
  }
}) }}`);
  n3.credentials = {};
  console.log('GHL Remove AI Tag → gateway ✓');
}

// GHL Add Note → create_note
const n4 = wf.nodes.find(n => n.name === 'GHL Add Note');
if (n4) {
  n4.parameters = gatewayNode(`={{ JSON.stringify({
  "version": "v1",
  "action": "create_note",
  "clinic_id": ${convRef}.clinic_id,
  "correlation_id": ${convRef}.ghl_contact_id + "_note_" + Date.now(),
  "idempotency_key": ${convRef}.ghl_contact_id + "_handoff_note",
  "params": {
    "contact_id": ${convRef}.ghl_contact_id,
    "note":       ${parseRef}.noteBody,
    "note_type":  "handoff_summary"
  }
}) }}`);
  n4.credentials = {};
  console.log('GHL Add Note → gateway ✓');
}

// GHL Closing Message → send_message
const n5 = wf.nodes.find(n => n.name === 'GHL Closing Message');
if (n5) {
  n5.parameters = gatewayNode(`={{ JSON.stringify({
  "version": "v1",
  "action": "send_message",
  "clinic_id": ${convRef}.clinic_id,
  "correlation_id": ${convRef}.ghl_contact_id + "_closing_" + Date.now(),
  "idempotency_key": ${convRef}.ghl_contact_id + "_closing_msg",
  "params": {
    "contact_id":   ${convRef}.ghl_contact_id,
    "message":      ${parseRef}.closingMessage || "Bilgilerinizi ekibimize ilettim. En kısa sürede sizinle iletişime geçecekler.",
    "message_type": "SMS"
  }
}) }}`);
  n5.credentials = {};
  console.log('GHL Closing Message → gateway ✓');
}

fs.writeFileSync('n8n-workflows/WF2 - Lead Handoff.json', JSON.stringify(wf, null, 2), 'utf-8');
console.log('\nWF2 güncellendi ✓');
