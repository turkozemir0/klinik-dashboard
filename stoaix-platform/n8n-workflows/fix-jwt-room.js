/**
 * Fix: Add room: roomName to JWT video grant for AgentDispatch permission.
 * Moves roomName before JWT claims and injects into video grant.
 * Uses regex to handle different sub values (n8n-outbound-v3/v5/v6/etc.)
 */
const fs   = require('fs')
const path = require('path')

const files = fs.readdirSync(__dirname).filter(f => f.startsWith('WF_') && f.endsWith('.json'))
let fixed = 0

for (const file of files) {
  const raw = fs.readFileSync(path.join(__dirname, file), 'utf8')
  const wf  = JSON.parse(raw)
  let dirty = false

  for (const node of wf.nodes || []) {
    let code = node.parameters?.jsCode
    if (!code) continue
    if (!code.includes('LIVEKIT_API_KEY')) continue
    if (code.includes('room: roomName')) continue   // already fixed

    // Replace: video: { roomCreate: true, roomAdmin: true }
    // With:    video: { roomCreate: true, roomAdmin: true, room: roomName }
    const before = code
    code = code.replace(
      /video:\s*\{\s*roomCreate:\s*true,\s*roomAdmin:\s*true\s*\}/,
      'video: { roomCreate: true, roomAdmin: true, room: roomName }'
    )

    if (code === before) {
      console.log(`SKIP (pattern not found): ${node.name} in ${file}`)
      continue
    }

    // Move roomName definition before 'const now = '
    // First, remove old roomName line wherever it is
    code = code.replace(/\nconst roomName\s*=\s*'wf-'[^;]+;/, '')
    // Then insert before 'const now'
    code = code.replace(
      'const now    = Math.floor',
      "const roomName = 'wf-' + payload.run_id.replace(/-/g,'').slice(0, 12);\nconst now    = Math.floor"
    )

    node.parameters.jsCode = code
    dirty = true
    console.log(`Fixed: ${node.name} in ${file}`)
  }

  if (dirty) {
    fs.writeFileSync(path.join(__dirname, file), JSON.stringify(wf, null, 2))
    fixed++
  }
}
console.log(`\nTotal files fixed: ${fixed}`)
