const fs = require('fs');

const files = [
  'WF3 - Nurturing Smart Followup.json',
  'WF4 - Daily Stats.json',
  'WF5 - Stale Conversation Check DEMO.json',
  'KB Backfill (FAQs + Services) - Fixed.json',
];

for (const f of files) {
  const wf = JSON.parse(fs.readFileSync('n8n-workflows/' + f, 'utf-8'));
  const content = JSON.stringify(wf);

  const ghlContactId = (content.match(/ghl_contact_id/g) || []).length;

  const directGHL = wf.nodes.filter(n => {
    const url = n.parameters && n.parameters.url || '';
    return url.includes('leadconnectorhq.com') || url.includes('msgsndr.com');
  }).map(n => n.name);

  const gatewayNodes = wf.nodes.filter(n => {
    const url = n.parameters && n.parameters.url || '';
    return url.includes('crm-gateway');
  }).map(n => n.name);

  const supabaseNodes = wf.nodes.filter(n => {
    const url = n.parameters && n.parameters.url || '';
    return url.includes('supabase.co');
  }).map(n => n.name);

  console.log('=== ' + f + ' ===');
  console.log('ghl_contact_id refs:', ghlContactId);
  console.log('Direkt GHL API:', directGHL.length ? directGHL.join(', ') : 'YOK');
  console.log('Gateway:', gatewayNodes.length ? gatewayNodes.join(', ') : 'YOK');
  console.log('Supabase direkt:', supabaseNodes.length ? supabaseNodes.join(', ') : 'YOK');
  console.log('Node sayisi:', wf.nodes.length);
  console.log('');
}
