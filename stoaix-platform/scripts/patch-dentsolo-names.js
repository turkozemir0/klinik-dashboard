const fs = require('fs')
const path = require('path')

const file = path.join(__dirname, 'seed-dentsolo-org.js')
let c = fs.readFileSync(file, 'utf8')

// Firma adi
c = c.replace(/Dentsolo Dis Klinigi/g, 'Solo Dent Dis Klinigi')
c = c.replace(/Dentsolo'dan/g, "Solo Dent'ten")
c = c.replace(/Dentsolo'da/g, "Solo Dent'te")
c = c.replace(/Dentsolo'nun/g, "Solo Dent'in")
c = c.replace(/Dentsolo bu/g, 'Solo Dent bu')
c = c.replace(/Dentsolo cocuk/g, 'Solo Dent cocuk')
c = c.replace(/Dentsolo adres/g, 'Solo Dent adres')
c = c.replace(/Dentsolo Turkce/g, 'Solo Dent Turkce')
c = c.replace(/Dentsolo WhatsApp\/Chat Asistani/g, 'Solo Dent WhatsApp/Chat Asistani')
c = c.replace(/Dentsolo Sesli Asistani/g, 'Solo Dent Sesli Asistani')
c = c.replace(/Dentsolo WhatsApp Hasta Formu/g, 'Solo Dent WhatsApp Hasta Formu')
c = c.replace(/Dentsolo Sesli Hasta Formu/g, 'Solo Dent Sesli Hasta Formu')
c = c.replace(/Dentsolo Hasta Asistani/g, 'Solo Dent Hasta Asistani')
c = c.replace(/Dentsolo Hakkinda/g, 'Solo Dent Hakkinda')
// slug
c = c.replace(/slug: 'dentsolo'/g, "slug: 'solo-dent'")
c = c.replace(/name: 'Dentsolo Dis Klinigi'/g, "name: 'Solo Dent Dis Klinigi'")
// Kalan Dentsolo references
c = c.replace(/Dentsolo/g, 'Solo Dent')

// Telefon numaralari (yazili)
c = c.replace(/0506 777 25 77/g, '0533 762 68 70')
c = c.replace(/0501 333 77 56/g, '0533 762 68 70')
c = c.replace(/05067772577/g, '05337626870')

// Telefon array'leri
c = c.replace(/'0506 777 25 77'/g, "'0533 762 68 70'")
c = c.replace(/'0501 333 77 56'/g, "'0533 762 68 70'")

// Sesli telaffuz (voice prompt icinde)
c = c.replace(
  /sifir bes sifir alti, yedi yedi yedi, yirmi bes yetmis yedi/g,
  'sifir bes yuz otuz uc, yedi yuz atmis iki, atmis sekiz, yetmis'
)
// Alternatif yazim
c = c.replace(
  /sifir bes sifir alti yedi yedi yedi yirmi bes yetmis yedi/g,
  'sifir bes yuz otuz uc yedi yuz atmis iki atmis sekiz yetmis'
)

fs.writeFileSync(file, c, 'utf8')
console.log('Patch uygulandi')
