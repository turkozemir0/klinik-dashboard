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
  let content = fs.readFileSync(path, 'utf-8');

  // Fix: $('Config').item.json.supabaseKey → $('Config').first().json.supabaseKey
  const before = (content.split("Config').item.json.supabaseKey").length - 1);
  content = content.split("Config').item.json.supabaseKey").join("Config').first().json.supabaseKey");

  fs.writeFileSync(path, content, 'utf-8');

  if (before > 0) {
    console.log(f + ': ' + before + ' ref düzeltildi ✓');
    total += before;
  } else {
    console.log(f + ': temiz ✅');
  }
}

console.log('\nToplam: ' + total + ' ref düzeltildi');
