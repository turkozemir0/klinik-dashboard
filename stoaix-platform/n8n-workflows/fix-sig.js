const fs   = require('fs')
const path = require('path')

const NEW_SIG = "const sig = Buffer.from(_hmac256(_enc(cfg.LIVEKIT_API_SECRET), _enc(header + '.' + claims))).toString('base64').replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=/g,'');"

const files = fs.readdirSync(__dirname).filter(f => f.startsWith('WF_') && f.endsWith('.json'))
let fixed = 0

for (const file of files) {
  const raw = fs.readFileSync(path.join(__dirname, file), 'utf8')
  const wf  = JSON.parse(raw)
  let dirty = false

  for (const node of wf.nodes || []) {
    const code = node.parameters?.jsCode
    if (!code) continue
    if (!code.includes('_hmac256')) continue           // only our fixed nodes
    if (code.includes('const sig =')) continue          // already has sig
    if (!code.includes('const jwt = header')) continue  // sanity check

    // Insert sig line before 'const jwt = header'
    node.parameters.jsCode = code.replace(
      'const jwt = header',
      NEW_SIG + '\n\nconst jwt = header'
    )
    dirty = true
    console.log('Fixed sig in: ' + node.name + ' (' + file + ')')
  }

  if (dirty) {
    fs.writeFileSync(path.join(__dirname, file), JSON.stringify(wf, null, 2))
    fixed++
  }
}
console.log('Total files fixed: ' + fixed)
