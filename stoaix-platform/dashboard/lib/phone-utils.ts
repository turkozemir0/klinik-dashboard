/**
 * Telefon numarasını E.164 formatına normalize eder.
 *
 * Öncelik sırası:
 * 1. + işareti varsa → zaten uluslararası format, doğrudan kullan
 * 2. 00 ile başlıyorsa → uluslararası prefix, + ile değiştir
 * 3. 0 ile başlıyorsa → yerel format, defaultCC uygula (ör: 0532... → +90532...)
 * 4. 10 hane → defaultCC uygula
 * 5. 11-15 hane → ülke kodu dahil varsayılır, + ekle
 */
export function normalizePhone(raw: string, defaultCC = '90'): string | null {
  if (!raw) return null
  const trimmed = raw.trim()

  // + işareti varsa → E.164 veya uluslararası format
  if (trimmed.includes('+')) {
    const d = trimmed.replace(/\D/g, '')
    return d.length >= 7 && d.length <= 15 ? `+${d}` : null
  }

  // 00 ile başlıyorsa → uluslararası prefix (ör: 0049... → +49...)
  if (trimmed.startsWith('00')) {
    const d = trimmed.slice(2).replace(/\D/g, '')
    return d.length >= 7 && d.length <= 15 ? `+${d}` : null
  }

  const d = trimmed.replace(/\D/g, '')
  if (!d) return null

  // 0 ile başlıyorsa → ülke kodu yok, defaultCC ile birleştir (ör: 05551234567 → +905551234567)
  if (d.startsWith('0')) {
    const local = d.slice(1)
    const full = `${defaultCC}${local}`
    return full.length >= 7 && full.length <= 15 ? `+${full}` : null
  }

  // 10 hane → yerel numara, defaultCC ekle
  if (d.length === 10) return `+${defaultCC}${d}`

  // 11-15 hane → ülke kodu dahil varsayılır
  if (d.length >= 11 && d.length <= 15) return `+${d}`

  return null
}

/** Yaygın ülke kodları listesi (import UI dropdown için) */
export const COUNTRY_CODES = [
  { code: '90',  flag: '🇹🇷', label: 'Türkiye' },
  { code: '49',  flag: '🇩🇪', label: 'Almanya' },
  { code: '7',   flag: '🇷🇺', label: 'Rusya / Kazakistan' },
  { code: '1',   flag: '🇺🇸', label: 'ABD / Kanada' },
  { code: '44',  flag: '🇬🇧', label: 'İngiltere' },
  { code: '33',  flag: '🇫🇷', label: 'Fransa' },
  { code: '31',  flag: '🇳🇱', label: 'Hollanda' },
  { code: '32',  flag: '🇧🇪', label: 'Belçika' },
  { code: '41',  flag: '🇨🇭', label: 'İsviçre' },
  { code: '43',  flag: '🇦🇹', label: 'Avusturya' },
  { code: '48',  flag: '🇵🇱', label: 'Polonya' },
  { code: '966', flag: '🇸🇦', label: 'Suudi Arabistan' },
  { code: '971', flag: '🇦🇪', label: 'BAE (Dubai)' },
  { code: '20',  flag: '🇪🇬', label: 'Mısır' },
  { code: '212', flag: '🇲🇦', label: 'Fas' },
  { code: '216', flag: '🇹🇳', label: 'Tunus' },
  { code: '213', flag: '🇩🇿', label: 'Cezayir' },
  { code: '380', flag: '🇺🇦', label: 'Ukrayna' },
] as const
