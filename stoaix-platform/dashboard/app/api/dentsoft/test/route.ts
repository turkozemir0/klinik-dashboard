import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/dentsoft/test
 * Tests DentSoft credentials and returns doctor list.
 * Body: { api_url, api_key, clinic_id }
 */
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: orgUser } = await supabase
    .from('org_users')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!orgUser) return NextResponse.json({ error: 'No org' }, { status: 403 })
  if (!['admin', 'yönetici'].includes(orgUser.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { api_url, api_key, clinic_id } = body

  if (!api_url || !api_key || !clinic_id) {
    return NextResponse.json({ valid: false, error: 'api_url, api_key ve clinic_id zorunlu' }, { status: 400 })
  }

  const baseUrl = api_url.replace(/\/+$/, '')

  try {
    // 1. Test credentials with Clinic/List
    const clinicRes = await fetch(
      `${baseUrl}/Api/v1/Clinic/List?ID=${encodeURIComponent(clinic_id)}`,
      {
        headers: { Authorization: `Bearer ${api_key}`, Accept: 'application/json' },
        signal: AbortSignal.timeout(10_000),
      }
    )

    if (!clinicRes.ok) {
      return NextResponse.json({
        valid: false,
        error: `DentSoft API yanit vermedi (HTTP ${clinicRes.status})`,
      })
    }

    const clinicData = await clinicRes.json()
    if (clinicData?.Status?.Code !== 100) {
      return NextResponse.json({
        valid: false,
        error: clinicData?.Status?.Message || 'Kimlik dogrulama basarisiz',
      })
    }

    const clinicName = clinicData?.Response?.ClinicName
      ?? clinicData?.Response?.Name
      ?? clinicData?.Response?.[0]?.ClinicName
      ?? 'Bilinmiyor'

    // 2. Fetch doctor list
    const doctorRes = await fetch(
      `${baseUrl}/Api/v1/Doctor/List?ClinicID=${encodeURIComponent(clinic_id)}`,
      {
        headers: { Authorization: `Bearer ${api_key}`, Accept: 'application/json' },
        signal: AbortSignal.timeout(10_000),
      }
    )

    let doctors: { id: string; name: string; nearest_day?: string }[] = []

    if (doctorRes.ok) {
      const doctorData = await doctorRes.json()
      if (doctorData?.Status?.Code === 100) {
        const rawDoctors = Array.isArray(doctorData?.Response)
          ? doctorData.Response
          : doctorData?.Response?.Doctors ?? []
        doctors = rawDoctors.map((d: any) => ({
          id:          String(d.UserID ?? d.DoctorID ?? d.ID ?? ''),
          name:        d.FullName ?? d.DoctorName ?? d.Name ?? 'Bilinmiyor',
          nearest_day: d.NearestAvailableDay ?? d.NearestDay ?? undefined,
        }))
      }
    }

    return NextResponse.json({
      valid: true,
      clinic_name: clinicName,
      doctors,
    })
  } catch (err: any) {
    const message = err?.name === 'TimeoutError'
      ? 'DentSoft API zaman asimina ugradi'
      : `DentSoft API hatasi: ${err?.message ?? String(err)}`
    return NextResponse.json({ valid: false, error: message })
  }
}
