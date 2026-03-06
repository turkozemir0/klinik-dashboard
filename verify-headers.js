const fs = require('fs');
const wf = JSON.parse(fs.readFileSync('n8n-workflows/WF1 - Incoming Message Handler (Simplified) LATEST.json', 'utf-8'));

const restNodes = wf.nodes.filter(function(n) {
  const url = JSON.stringify(n.parameters && n.parameters.url || '');
  return url.includes('supabase') && url.indexOf('crm-gateway') === -1 && url.indexOf('functions/v1/') === -1;
});

let allOk = true;
for (const n of restNodes) {
  const params = (n.parameters.headerParameters && n.parameters.headerParameters.parameters) || [];
  const apikey = params.find(function(p) { return p.name === 'apikey'; });
  const auth = params.find(function(p) { return p.name === 'Authorization'; });
  const apikeyOk = apikey && apikey.value.indexOf('Config') !== -1;
  const authOk = auth && auth.value.indexOf('Config') !== -1;
  const status = (apikeyOk && authOk) ? 'OK ✅' : 'SORUN ❌';
  console.log(status + ' | ' + n.name);
  if (!apikeyOk) console.log('  apikey: ' + (apikey && apikey.value));
  if (!authOk) console.log('  auth: ' + (auth && auth.value));
  if (!apikeyOk || !authOk) allOk = false;
}
if (allOk) console.log('\nTum node\'lar dogru ✅');
