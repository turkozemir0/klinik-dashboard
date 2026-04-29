// Voice SIP trunk provider definitions & credential schemas

export type VoiceProvider = 'netgsm' | 'verimor' | 'twilio' | 'telnyx'

export interface CredentialField {
  key: string
  label: string
  type: 'text' | 'password' | 'tel'
  placeholder: string
  required: boolean
  pattern?: string       // regex for validation hint (client-side)
  helpText?: string
}

export interface ProviderDef {
  id: VoiceProvider
  name: string
  description: string
  region: string         // 'TR' | 'Global'
  color: string          // badge / accent color class
  sipServer?: string     // static SIP server (Netgsm)
  apiUrl?: string        // static REST API URL (Verimor)
  fields: CredentialField[]
  helpUrl?: string
}

export const VOICE_PROVIDERS: Record<VoiceProvider, ProviderDef> = {
  netgsm: {
    id: 'netgsm',
    name: 'Netgsm',
    description: 'Netgsm Sanal Santral (SIP)',
    region: 'TR',
    color: 'text-blue-600',
    sipServer: 'sip.netgsm.com.tr',
    fields: [
      {
        key: 'sip_username',
        label: 'SIP Kullanici Adi',
        type: 'text',
        placeholder: 'ornek: 850XXXXXXX',
        required: true,
      },
      {
        key: 'sip_password',
        label: 'SIP Sifre',
        type: 'password',
        placeholder: '',
        required: true,
      },
      {
        key: 'did_number',
        label: 'DID Numarasi',
        type: 'tel',
        placeholder: '+902121234567',
        required: true,
      },
    ],
    helpUrl: 'https://www.netgsm.com.tr/sanal-santral',
  },
  verimor: {
    id: 'verimor',
    name: 'Verimor',
    description: 'Verimor Bulut Santral (REST API)',
    region: 'TR',
    color: 'text-emerald-600',
    apiUrl: 'https://api.bulutsantralim.com',
    fields: [
      {
        key: 'api_key',
        label: 'API Key',
        type: 'password',
        placeholder: '',
        required: true,
      },
      {
        key: 'phone_number',
        label: 'Telefon Numarasi',
        type: 'tel',
        placeholder: '+902121234567',
        required: true,
      },
    ],
    helpUrl: 'https://oim.verimor.com.tr',
  },
  twilio: {
    id: 'twilio',
    name: 'Twilio',
    description: 'Twilio Elastic SIP Trunking',
    region: 'Global',
    color: 'text-red-500',
    fields: [
      {
        key: 'account_sid',
        label: 'Account SID',
        type: 'text',
        placeholder: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        required: true,
        pattern: '^AC[a-f0-9]{32}$',
      },
      {
        key: 'auth_token',
        label: 'Auth Token',
        type: 'password',
        placeholder: '',
        required: true,
      },
      {
        key: 'sip_trunk_sid',
        label: 'SIP Trunk SID',
        type: 'text',
        placeholder: 'TKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        required: true,
        pattern: '^TK[a-f0-9]{32}$',
      },
      {
        key: 'phone_number',
        label: 'Phone Number',
        type: 'tel',
        placeholder: '+14155551234',
        required: true,
      },
    ],
    helpUrl: 'https://console.twilio.com/us1/develop/sip-trunking/trunks',
  },
  telnyx: {
    id: 'telnyx',
    name: 'Telnyx',
    description: 'Telnyx SIP + API',
    region: 'Global',
    color: 'text-green-600',
    fields: [
      {
        key: 'api_key',
        label: 'API Key',
        type: 'password',
        placeholder: 'KEYxxxxxxxx...',
        required: true,
      },
      {
        key: 'connection_id',
        label: 'Connection ID',
        type: 'text',
        placeholder: '',
        required: true,
      },
      {
        key: 'phone_number',
        label: 'Phone Number',
        type: 'tel',
        placeholder: '+14155551234',
        required: true,
      },
    ],
    helpUrl: 'https://portal.telnyx.com/#/app/sip-connections',
  },
}

export const PROVIDER_LIST = Object.values(VOICE_PROVIDERS)

// Extract credential values from form data for a specific provider
export function getProviderPhoneNumber(
  provider: VoiceProvider,
  credentials: Record<string, string>
): string {
  if (provider === 'netgsm') return credentials.did_number ?? ''
  return credentials.phone_number ?? ''
}

// SIP address for LiveKit trunk creation
export function getProviderSipAddress(provider: VoiceProvider): string | null {
  switch (provider) {
    case 'netgsm':
      return 'sip.netgsm.com.tr'
    case 'verimor':
      return null // REST API, not SIP
    case 'twilio':
      return null // Twilio manages its own SIP trunk, LiveKit peers with it
    case 'telnyx':
      return null // Telnyx manages its own SIP trunk, LiveKit peers with it
    default:
      return null
  }
}
