const fs = require('fs');

const files = [
  'WF1 - Incoming Message Handler (Simplified) LATEST.json',
  'WF2 - Lead Handoff.json',
  'WF3 - Nurturing Smart Followup.json',
  'WF5 - Stale Conversation Check DEMO.json',
];

const GATEWAY_URL = 'https://iylabpsokydolhuhvvwi.supabase.co/functions/v1/crm-gateway';

for (const f of files) {
  const wf = JSON.parse(fs.readFileSync('n8n-workflows/' + f, 'utf-8'));
  const issues = [];

  for (const n of wf.nodes) {
    const params = n.parameters || {};

    // Check all string values recursively
    function checkStr(val, field) {
      if (typeof val !== 'string') return;
      // Pattern: .first().json without a $ before it
      if (val.includes('.first().json') && !val.includes('$(') && !val.includes('$json') && !val.includes('$input')) {
        issues.push('  [' + n.name + '] ' + field + ': broken .first() — missing $("NodeName")');
      }
      // Pattern: hardcoded GHL token
      if (val.includes('pit-') && val.includes('Bearer')) {
        issues.push('  [' + n.name + '] ' + field + ': hardcoded GHL token');
      }
      // Pattern: ghl_contact_id still present
      if (val.includes('ghl_contact_id')) {
        issues.push('  [' + n.name + '] ' + field + ': ghl_contact_id still present');
      }
      // Pattern: direct GHL API call (not through gateway)
      if ((val.includes('leadconnectorhq.com') || val.includes('msgsndr.com')) && field === 'url') {
        issues.push('  [' + n.name + '] ' + field + ': direct GHL API call (not gateway)');
      }
    }

    function walkObj(obj, path) {
      if (typeof obj === 'string') { checkStr(obj, path); return; }
      if (typeof obj !== 'object' || obj === null) return;
      for (const [k, v] of Object.entries(obj)) {
        walkObj(v, path ? path + '.' + k : k);
      }
    }

    walkObj(params, '');
  }

  if (issues.length) {
    console.log('\n=== ' + f + ' ===');
    issues.forEach(i => console.log(i));
  } else {
    console.log(f + ': TEMIZ ✅');
  }
}
