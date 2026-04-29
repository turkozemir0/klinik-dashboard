const fs = require('fs');
const file = process.argv[2] || 'output/dental-results.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const results = data.results?.results || data.results || [];
const failed = results.filter(r => r.success === false);
console.log('=== FAILED TESTS (' + failed.length + ') ===');
failed.forEach((r, i) => {
  console.log('\n--- ' + (i + 1) + '. ' + (r.description || 'unknown') + ' ---');
  console.log('Message: ' + (r.vars?.message || '').substring(0, 80));
  console.log('Reply: ' + (r.response?.output || '').substring(0, 200));
  const failedAsserts = (r.gradingResult?.componentResults || []).filter(c => c.pass === false);
  failedAsserts.forEach(a => {
    console.log('  FAIL [' + (a.assertion?.type || '') + ']: ' + (a.reason || '').substring(0, 150));
  });
});
