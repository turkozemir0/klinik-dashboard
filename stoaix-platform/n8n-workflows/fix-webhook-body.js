/**
 * Fix: n8n Webhook v2 wraps POST body under .body key
 * $('Webhook').first().json.X  →  $('Webhook').first().json.body.X
 */

const fs = require('fs')
const path = require('path')

const files = fs.readdirSync(__dirname).filter(f => f.startsWith('WF_') && f.endsWith('.json'))
let totalChanged = 0

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8')

  // Replace $('Webhook').first().json NOT already followed by .body
  // Uses a two-pass approach to avoid double-replacing
  const fixed = content.replace(
    /\$\('Webhook'\)\.first\(\)\.json(?!\.body)/g,
    "$('Webhook').first().json.body"
  )

  if (fixed !== content) {
    fs.writeFileSync(file, fixed, 'utf8')
    const count = (content.match(/\$\('Webhook'\)\.first\(\)\.json(?!\.body)/g) || []).length
    console.log(`Fixed: ${file} (${count} occurrences)`)
    totalChanged++
  }
}

console.log(`\nTotal files changed: ${totalChanged}`)
