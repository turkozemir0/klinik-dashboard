// Brand SVG icons for integration providers
// All icons render at the given size (default 20) with proper viewBox

interface IconProps {
  size?: number
  className?: string
}

export function WhatsAppIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
        fill="#25D366"
      />
    </svg>
  )
}

export function NetgsmIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect width="24" height="24" rx="6" fill="#1A56DB" />
      <text x="12" y="16.5" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" fontFamily="Arial, sans-serif">
        NET
      </text>
    </svg>
  )
}

export function VerimorIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect width="24" height="24" rx="6" fill="#059669" />
      <text x="12" y="17" textAnchor="middle" fill="white" fontSize="13" fontWeight="700" fontFamily="Arial, sans-serif">
        V
      </text>
    </svg>
  )
}

export function TwilioIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect width="24" height="24" rx="6" fill="#F22F46" />
      <circle cx="9.5" cy="9.5" r="2" fill="white" />
      <circle cx="14.5" cy="9.5" r="2" fill="white" />
      <circle cx="9.5" cy="14.5" r="2" fill="white" />
      <circle cx="14.5" cy="14.5" r="2" fill="white" />
    </svg>
  )
}

export function TelnyxIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect width="24" height="24" rx="6" fill="#00C08B" />
      <path d="M7 7h10v3H14v7h-4v-7H7V7z" fill="white" />
    </svg>
  )
}

export function GoogleCalendarIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M18 3h-1V2a1 1 0 00-2 0v1H9V2a1 1 0 00-2 0v1H6a3 3 0 00-3 3v12a3 3 0 003 3h12a3 3 0 003-3V6a3 3 0 00-3-3z" fill="#4285F4" />
      <rect x="5" y="9" width="14" height="11" rx="1" fill="white" />
      <rect x="7" y="11" width="3" height="2.5" rx="0.5" fill="#EA4335" />
      <rect x="10.5" y="11" width="3" height="2.5" rx="0.5" fill="#34A853" />
      <rect x="14" y="11" width="3" height="2.5" rx="0.5" fill="#FBBC04" />
      <rect x="7" y="14.5" width="3" height="2.5" rx="0.5" fill="#4285F4" />
      <rect x="10.5" y="14.5" width="3" height="2.5" rx="0.5" fill="#EA4335" />
      <rect x="14" y="14.5" width="3" height="2.5" rx="0.5" fill="#34A853" />
    </svg>
  )
}

export function DentSoftIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect width="24" height="24" rx="6" fill="#7C3AED" />
      {/* Tooth shape */}
      <path
        d="M12 5c-1.5 0-2.7.4-3.5 1.2C7.7 7 7.3 8 7.3 9.2c0 1 .2 1.8.5 2.8.3 1 .6 2.2.8 3.5.2 1.2.5 2.2 1 3 .4.7.9 1 1.4 1 .4 0 .7-.3 1-1l.5-1.5h1l.5 1.5c.3.7.6 1 1 1 .5 0 1-.3 1.4-1 .5-.8.8-1.8 1-3 .2-1.3.5-2.5.8-3.5.3-1 .5-1.8.5-2.8 0-1.2-.4-2.2-1.2-3C15.7 5.4 13.5 5 12 5z"
        fill="white"
      />
    </svg>
  )
}

export function HubSpotIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M17.002 9.794V7.39a1.965 1.965 0 001.13-1.768 1.978 1.978 0 00-1.978-1.978 1.978 1.978 0 00-1.978 1.978c0 .762.44 1.42 1.077 1.742v2.43a4.86 4.86 0 00-2.131 1.07l-5.642-4.39a1.946 1.946 0 00.066-.482 1.958 1.958 0 00-1.959-1.958A1.958 1.958 0 003.63 5.993a1.958 1.958 0 001.958 1.958c.312 0 .607-.078.87-.21l5.556 4.322a4.885 4.885 0 00-.526 2.2 4.88 4.88 0 00.603 2.345l-1.76 1.76a1.634 1.634 0 00-.476-.076 1.654 1.654 0 00-1.654 1.654 1.654 1.654 0 001.654 1.654 1.654 1.654 0 001.654-1.654c0-.176-.03-.345-.078-.505l1.723-1.723a4.886 4.886 0 007.023-4.406 4.886 4.886 0 00-2.175-4.518zm-.848 6.736a2.514 2.514 0 01-2.517-2.517 2.514 2.514 0 012.517-2.517 2.514 2.514 0 012.517 2.517 2.514 2.514 0 01-2.517 2.517z" fill="#FF7A59" />
    </svg>
  )
}

export function SalesforceIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M10.006 5.17a4.2 4.2 0 013.072-1.34 4.214 4.214 0 013.977 2.826 3.564 3.564 0 011.313-.249 3.598 3.598 0 013.598 3.598 3.598 3.598 0 01-3.598 3.598c-.248 0-.49-.026-.724-.074a3.182 3.182 0 01-2.985 2.09 3.162 3.162 0 01-1.468-.36 3.89 3.89 0 01-3.471 2.141 3.897 3.897 0 01-3.651-2.542 3.025 3.025 0 01-.538.05A3.032 3.032 0 012.5 11.876a3.032 3.032 0 012.478-2.982 3.652 3.652 0 01-.137-.98A3.73 3.73 0 018.57 4.183a3.72 3.72 0 011.436.987z" fill="#00A1E0" />
    </svg>
  )
}

export function PipedriveIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect width="24" height="24" rx="6" fill="#017737" />
      <path d="M12 5c-2.2 0-4 1.3-4 3.5S9.8 12 12 12s4-1.3 4-3.5S14.2 5 12 5zm0 5.5c-1.1 0-2-.6-2-1.5s.9-1.5 2-1.5 2 .6 2 1.5-.9 1.5-2 1.5zM11 13h2v6h-2v-6z" fill="white" />
    </svg>
  )
}

export function ZapierIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M15.535 8.465l-1.77 1.77a4.476 4.476 0 00-1.53-1.53l1.77-1.77a.75.75 0 011.06 0l.47.47a.75.75 0 010 1.06zM12 10a2 2 0 100 4 2 2 0 000-4zm-3.535 5.535l1.77-1.77a4.476 4.476 0 001.53 1.53l-1.77 1.77a.75.75 0 01-1.06 0l-.47-.47a.75.75 0 010-1.06zm7.07 0l-1.77-1.77a4.476 4.476 0 001.53-1.53l1.77 1.77a.75.75 0 010 1.06l-.47.47a.75.75 0 01-1.06 0zM8.465 8.465l1.77 1.77a4.476 4.476 0 00-1.53 1.53l-1.77-1.77a.75.75 0 010-1.06l.47-.47a.75.75 0 011.06 0zM12 6v2.5a3.5 3.5 0 000 7V18a6 6 0 100-12zm0 0a6 6 0 010 12v-2.5a3.5 3.5 0 000-7V6z" fill="#FF4A00" />
    </svg>
  )
}

export function CalendlyIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M19 4h-1V3a1 1 0 00-2 0v1H8V3a1 1 0 00-2 0v1H5a3 3 0 00-3 3v12a3 3 0 003 3h14a3 3 0 003-3V7a3 3 0 00-3-3z" fill="#006BFF" />
      <rect x="4" y="9" width="16" height="12" rx="2" fill="white" />
      <path d="M12 13a2.5 2.5 0 100 5 2.5 2.5 0 000-5zm0 4a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" fill="#006BFF" />
    </svg>
  )
}
