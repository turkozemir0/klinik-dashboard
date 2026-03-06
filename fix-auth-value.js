const fs = require('fs');

const files = [
  'WF1 - Incoming Message Handler (Simplified) LATEST.json',
  'WF2 - Lead Handoff.json',
  'WF3 - Nurturing Smart Followup.json',
  'WF4 - Daily Stats.json',
  'WF5 - Stale Conversation Check DEMO.json',
];

const BROKEN = '=Bearer {{ .first().json.supabaseKey }}';
const FIXED   = "={{ 'Bearer ' + $('Config').first().json.supabaseKey }}";

let total = 0;

for (const f of files) {
  const path = 'n8n-workflows/' + f;
  const wf = JSON.parse(fs.readFileSync(path, 'utf-8'));
  let fixed = 0;

  for (const n of wf.nodes) {
    const params = n.parameters?.headerParameters?.parameters;
    if (!params) continue;
    for (const p of params) {
      if (p.name === 'Authorization' && p.value === BROKEN) {
        p.value = FIXED;
        fixed++;
        console.log('  Fixed: ' + n.name + ' (' + f.split(' ')[0] + ')');
      }
    }
  }

  if (fixed > 0) {
    fs.writeFileSync(path, JSON.stringify(wf, null, 2), 'utf-8');
    total += fixed;
  }
}

console.log('\nToplam ' + total + ' Authorization header düzeltildi ✓');
