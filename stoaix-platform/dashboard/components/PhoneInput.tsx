'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { COUNTRY_CODES } from '@/lib/phone-utils'

interface Props {
  value: string
  onChange: (e164: string) => void
  defaultCountryCode?: string
  className?: string
  placeholder?: string
}

/** E.164 string'den ülke kodunu parse et */
function parseE164(e164: string): { countryCode: string; digits: string } {
  if (!e164 || !e164.startsWith('+')) {
    return { countryCode: '90', digits: e164.replace(/\D/g, '') }
  }

  const raw = e164.slice(1) // drop +

  // Uzun kodları önce dene (3 haneli → 2 haneli → 1 haneli)
  for (const len of [3, 2, 1]) {
    const prefix = raw.slice(0, len)
    const match = COUNTRY_CODES.find(c => c.code === prefix)
    if (match) {
      return { countryCode: match.code, digits: raw.slice(len) }
    }
  }

  return { countryCode: '90', digits: raw }
}

export default function PhoneInput({
  value,
  onChange,
  defaultCountryCode = '90',
  className = '',
  placeholder = '5XX XXX XXXX',
}: Props) {
  const parsed = value ? parseE164(value) : { countryCode: defaultCountryCode, digits: '' }
  const [countryCode, setCountryCode] = useState(parsed.countryCode)
  const [digits, setDigits] = useState(parsed.digits)
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Sync from external value changes
  useEffect(() => {
    if (value) {
      const p = parseE164(value)
      setCountryCode(p.countryCode)
      setDigits(p.digits)
    } else {
      setDigits('')
    }
  }, [value])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function emitChange(cc: string, d: string) {
    const clean = d.replace(/\D/g, '')
    if (!clean) {
      onChange('')
      return
    }
    onChange(`+${cc}${clean}`)
  }

  function handleDigitsChange(e: React.ChangeEvent<HTMLInputElement>) {
    const clean = e.target.value.replace(/\D/g, '')
    setDigits(clean)
    emitChange(countryCode, clean)
  }

  function handleSelectCountry(code: string) {
    setCountryCode(code)
    setOpen(false)
    emitChange(code, digits)
  }

  const selectedCountry = COUNTRY_CODES.find(c => c.code === countryCode) || COUNTRY_CODES[0]

  return (
    <div className={`flex ${className}`}>
      {/* Country code dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 px-3 py-2.5 border border-slate-200 border-r-0 rounded-l-lg bg-slate-50 hover:bg-slate-100 text-sm whitespace-nowrap h-full"
        >
          <span>{selectedCountry.flag}</span>
          <span className="text-slate-700">+{selectedCountry.code}</span>
          <ChevronDown size={12} className="text-slate-400" />
        </button>

        {open && (
          <div className="absolute z-50 top-full left-0 mt-1 w-56 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg">
            {COUNTRY_CODES.map(c => (
              <button
                key={c.code}
                type="button"
                onClick={() => handleSelectCountry(c.code)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 ${
                  c.code === countryCode ? 'bg-brand-50 text-brand-700' : 'text-slate-700'
                }`}
              >
                <span>{c.flag}</span>
                <span className="flex-1">{c.label}</span>
                <span className="text-slate-400">+{c.code}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Number input */}
      <input
        type="tel"
        value={digits}
        onChange={handleDigitsChange}
        placeholder={placeholder}
        className="flex-1 min-w-0 px-3 py-2.5 border border-slate-200 rounded-r-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
    </div>
  )
}
