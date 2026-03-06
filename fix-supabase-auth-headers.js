const fs = require('fs');

const files = [
  'WF1 - Incoming Message Handler (Simplified) LATEST.json',
  'WF2 - Lead Handoff.json',
  'WF3 - Nurturing Smart Followup.json',
  'WF4 - Daily Stats.json',
  'WF5 - Stale Conversation Check DEMO.json',
];

const GATEWAY_URL = 'crm-gateway';

let totalFixed = 0;

for (const f of files) {
  const path = 'n8n-workflows/' + f;
  const wf = JSON.parse(fs.readFileSync(path, 'utf-8'));
  let fixed = 0;

  for (const n of wf.nodes) {
    const url = n.parameters?.url || '';
    const urlStr = typeof url === 'string' ? url : JSON.stringify(url);

    // Only fix REST API calls, not gateway/edge function calls
    if (!urlStr.includes('supabase') || urlStr.includes(GATEWAY_URL) || urlStr.includes('functions/v1')) continue;

    const params = n.parameters?.headerParameters?.parameters;
    if (!params) continue;

    const hasAuth = params.some(p => (p.name || '').toLowerCase() === 'authorization');
    if (hasAuth) continue;

    // Add Authorization header after apikey
    const apikeyIdx = params.findIndex(p => (p.name || '').toLowerCase() === 'apikey');
    const authHeader = {
      name: 'Authorization',
      value: "=Bearer {{ $('Config').item.json.supabaseKey }}"
    };

    if (apikeyIdx >= 0) {
      params.splice(apikeyIdx + 1, 0, authHeader);
    } else {
      params.unshift(authHeader);
    }

    fixed++;
    console.log('  Fixed: ' + n.name);
  }

  if (fixed > 0) {
    fs.writeFileSync(path, JSON.stringify(wf, null, 2), 'utf-8');
    console.log(f + ': ' + fixed + ' node düzeltildi ✓\n');
    totalFixed += fixed;
  } else {
    console.log(f + ': zaten temiz ✅');
  }
}

console.log('\nToplam ' + totalFixed + ' node düzeltildi ✓');
