// Temporary script to parse promptfoo eval results
const { readFileSync } = require('fs');

const filePath = process.argv[2] || 'output/estelife-results.json';
const raw = readFileSync(filePath, 'utf-8');
const data = JSON.parse(raw);
const results = data.results?.results || [];
const total = results.length;
const passed = results.filter(r => r.success).length;

console.log(`\n=== RESULTS: ${passed}/${total} PASS (${Math.round(passed/total*100)}%) ===\n`);

results.forEach((r, i) => {
  const s = r.success ? 'PASS' : 'FAIL';
  const d = (r.description || '').substring(0, 70);
  console.log(`${String(i+1).padStart(2)}. [${s}] ${d}`);
});

console.log('\n=== FAILED TEST DETAILS ===\n');
results.filter(r => r.success === false).forEach(r => {
  console.log(`[FAIL] ${r.description}`);
  console.log(`  Input: ${(r.vars?.message || '').substring(0, 100)}`);
  console.log(`  Output: ${(r.response?.output || '').substring(0, 300)}`);
  const comps = r.gradingResult?.componentResults || [];
  comps.filter(c => c.pass === false).forEach(c => {
    console.log(`  Failed assertion: ${(c.reason || '').substring(0, 300)}`);
  });
  console.log('');
});
