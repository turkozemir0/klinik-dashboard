/**
 * Fix: replace all crypto usage in Build JWT nodes with pure JS HMAC-SHA256
 * Works in any JS sandbox without require() or globalThis.crypto
 */

const fs   = require('fs')
const path = require('path')

// Pure JS HMAC-SHA256 helper code injected at top of each Build JWT node
const HMAC_HELPERS = `// Pure JS HMAC-SHA256 — no external modules needed
function _sha256(data){const K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];let b=[...data];const ml=b.length*8;b.push(0x80);while(b.length%64!==56)b.push(0);for(let i=3;i>=0;i--)b.push(0);for(let i=3;i>=0;i--)b.push((ml>>>(i*8))&0xff);const ro=(x,n)=>(x>>>n)|(x<<(32-n));let a=0x6a09e667,bv=0xbb67ae85,c=0x3c6ef372,d=0xa54ff53a,e=0x510e527f,f=0x9b05688c,g=0x1f83d9ab,h=0x5be0cd19;for(let i=0;i<b.length;i+=64){const W=[];for(let j=0;j<16;j++)W[j]=(b[i+j*4]<<24)|(b[i+j*4+1]<<16)|(b[i+j*4+2]<<8)|b[i+j*4+3];for(let j=16;j<64;j++){const s0=ro(W[j-15],7)^ro(W[j-15],18)^(W[j-15]>>>3);const s1=ro(W[j-2],17)^ro(W[j-2],19)^(W[j-2]>>>10);W[j]=(W[j-16]+s0+W[j-7]+s1)>>>0;}let[aa,bb,cc,dd,ee,ff,gg,hh]=[a,bv,c,d,e,f,g,h];for(let j=0;j<64;j++){const S1=ro(ee,6)^ro(ee,11)^ro(ee,25);const ch=(ee&ff)^(~ee&gg);const t1=(hh+S1+ch+K[j]+W[j])>>>0;const S0=ro(aa,2)^ro(aa,13)^ro(aa,22);const maj=(aa&bb)^(aa&cc)^(bb&cc);const t2=(S0+maj)>>>0;hh=gg;gg=ff;ff=ee;ee=(dd+t1)>>>0;dd=cc;cc=bb;bb=aa;aa=(t1+t2)>>>0;}a=(a+aa)>>>0;bv=(bv+bb)>>>0;c=(c+cc)>>>0;d=(d+dd)>>>0;e=(e+ee)>>>0;f=(f+ff)>>>0;g=(g+gg)>>>0;h=(h+hh)>>>0;}const out=[];[a,bv,c,d,e,f,g,h].forEach(v=>{for(let i=3;i>=0;i--)out.push((v>>>(i*8))&0xff)});return out;}
function _hmac256(key,msg){let k=[...key];if(k.length>64)k=_sha256(k);while(k.length<64)k.push(0);return _sha256([...k.map(b=>b^0x5c),..._sha256([...k.map(b=>b^0x36),...msg])]);}
function _enc(s){const b=[];for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);if(c<128)b.push(c);else if(c<2048){b.push(192|(c>>6));b.push(128|(c&63));}else{b.push(224|(c>>12));b.push(128|((c>>6)&63));b.push(128|(c&63));}}return b;}
`

// Old signing patterns to remove (both original and previous fix attempts)
const OLD_PATTERNS = [
  // Original require('crypto')
  "const crypto  = require('crypto');\n",
  "const crypto = require('crypto');\n",
  // Web Crypto API attempt (3 lines)
  "const _key = await crypto.subtle.importKey('raw', new TextEncoder().encode(cfg.LIVEKIT_API_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);\n" +
  "const _buf = await crypto.subtle.sign('HMAC', _key, new TextEncoder().encode(header + '.' + claims));\n" +
  "const sig  = btoa(String.fromCharCode(...new Uint8Array(_buf))).replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=/g,'');",
]

// Old crypto.createHmac line (original)
const OLD_SIGN =
  "const sig = crypto.createHmac('sha256', cfg.LIVEKIT_API_SECRET)\n" +
  "  .update(header + '.' + claims).digest('base64url');"

// New pure JS signing
const NEW_SIGN =
  "const sig = Buffer.from(_hmac256(_enc(cfg.LIVEKIT_API_SECRET), _enc(header + '.' + claims))).toString('base64').replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=/g,'');"

const files = fs.readdirSync(__dirname).filter(f => f.startsWith('WF_') && f.endsWith('.json'))
let changed = 0

for (const file of files) {
  const raw = fs.readFileSync(path.join(__dirname, file), 'utf8')
  const wf  = JSON.parse(raw)
  let dirty = false

  for (const node of wf.nodes || []) {
    let code = node.parameters?.jsCode
    if (!code) continue

    // Skip nodes that don't have JWT-related content
    const needsFix = code.includes("require('crypto')") ||
                     code.includes('crypto.createHmac') ||
                     code.includes('crypto.subtle') ||
                     code.includes('LIVEKIT_API_SECRET')
    if (!needsFix) continue

    // Already fixed with pure JS?
    if (code.includes('_hmac256')) continue

    // Remove old patterns
    for (const pat of OLD_PATTERNS) {
      code = code.split(pat).join('')
    }

    // Replace old sign line if still present
    if (code.includes(OLD_SIGN)) {
      code = code.replace(OLD_SIGN, NEW_SIGN)
    } else if (!code.includes(NEW_SIGN)) {
      // Web Crypto was partially removed, just ensure new sign line at end of base64url section
      // Find the line that still has 'base64url' or similar and replace
      code = code.replace(
        /const sig\s*=\s*[^;]+;/,
        NEW_SIGN
      )
    }

    // Inject HMAC helpers at the top
    code = HMAC_HELPERS + code

    node.parameters.jsCode = code
    dirty = true
    console.log(`Fixed: "${node.name}" in ${file}`)
  }

  if (dirty) {
    fs.writeFileSync(path.join(__dirname, file), JSON.stringify(wf, null, 2), 'utf8')
    changed++
  }
}

console.log(`\nTotal: ${changed} files fixed`)
