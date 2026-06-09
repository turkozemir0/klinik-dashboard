import type { IntakeField } from './clinic-intake-schemas'

/**
 * Dinamik qualification section üretir.
 * Sadece soru listesi + kanal iskelet kuralları — objection, escalation, closing'e karışmaz.
 */
export function buildQualificationSection(
  fields: IntakeField[],
  options: { channel: 'voice' | 'whatsapp' | 'instagram' | 'web'; calendar_booking?: boolean }
): string {
  if (!fields || fields.length === 0) return ''

  const isVoice = options.channel === 'voice'

  const filtered = isVoice
    ? fields.filter(f => f.priority === 'must' || f.priority === 'should')
    : fields.filter(f => f.priority === 'must')

  const sorted = [...filtered].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

  if (sorted.length === 0) return ''

  const questions = sorted.map((f, i) => {
    const prompt = isVoice
      ? (f.voice_prompt || f.label)
      : (f.wa_prompt || f.voice_prompt || f.label)
    return `${i + 1}. ${f.label} → "${prompt}"`
  })

  const mustCount = sorted.filter(f => f.priority === 'must').length

  if (isVoice) {
    return `# NİTELEME AKIŞI (sırayla, birer soru)
${questions.join('\n')}

# VERİ TOPLAMA TARZI
- Birer birer, sırayla sor — aynı anda 2 soru sormak YASAK
- Kullanıcı zaten bir bilgiyi verdiyse tekrar sorma
- Tüm zorunlu bilgiler toplandığında ${options.calendar_booking ? 'kullanıcıya randevu teklif et — check_availability çağır' : 'kapanış adımına geç'}`
  }

  // WhatsApp / Instagram
  return `# NİTELEME AKIŞI (sırayla, her turda 1 soru)
${questions.join('\n')}

# ÖNEMLI KURALLAR
- Kullanıcı tek mesajda birden fazla bilgi verirse HEPSİNİ kabul et ve bir sonraki eksik bilgiyi sor
- Kullanıcının zaten verdiği bilgileri ASLA tekrar sorma
- ${mustCount} zorunlu bilgi toplandığında HEMEN devir yap — opsiyonel sorulara geçme

# DEVİR KRİTERİ (${mustCount} zorunlu bilgi toplandığında)
Zorunlu bilgiler tamamlandığında:
${options.calendar_booking
    ? `→ "Teşekkürler [isim], size uygun bir randevu saati ayarlayalım. Hangi gün ve saat aralığı uygun olur?"
→ Bu bilgiler tamamlanmadan randevu önerme`
    : `→ "Teşekkürler [isim], danışmanımız en kısa sürede sizinle iletişime geçecek. Görüşmek üzere!" yaz
→ Bu bilgiler tamamlanmadan devir mesajı gönderme`}`
}
