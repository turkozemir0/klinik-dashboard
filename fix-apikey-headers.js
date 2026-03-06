const fs = require('fs');

const files = [
  'WF1 - Incoming Message Handler (Simplified) LATEST.json',
  'WF2 - Lead Handoff.json',
  'WF3 - Nurturing Smart Followup.json',
  'WF4 - Daily Stats.json',
  'WF5 - Stale Conversation Check DEMO.json',
];

let total = 0;

for (const f of files) {
  const path = 'n8n-workflows/' + f;
  const wf = JSON.parse(fs.readFileSync(path, 'utf-8'));
  let fixed = 0;

  for (const n of wf.nodes) {
    const params = n.parameters && n.parameters.headerParameters && n.parameters.headerParameters.parameters;
    if (!params) continue;

    for (const p of params) {
      if (!p.value) continue;

      // Fix apikey: ={{ .first().json.supabaseKey }} → ={{ $('Config').first().json.supabaseKey }}
      if (p.name === 'apikey' && p.value.indexOf("Config") === -1 && p.value.indexOf('supabaseKey') !== -1) {
        const old = p.value;
        p.value = "={{ $('Config').first().json.supabaseKey }}";
        console.log('  Fixed apikey in: ' + n.name + ' (' + f.split(' ')[0] + ')');
        console.log('    was: ' + old);
        fixed++;
      }
    }
  }

  if (fixed > 0) {
    fs.writeFileSync(path, JSON.stringify(wf, null, 2), 'utf-8');
    total += fixed;
  }
}

console.log('\nToplam ' + total + ' apikey header duzeltildi');
