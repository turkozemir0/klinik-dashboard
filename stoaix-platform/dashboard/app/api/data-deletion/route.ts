import { createHmac } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

// Meta Data Deletion Callback
// https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback
//
// Meta bu endpoint'e POST atar, signed_request parametresi ile.
// Biz imzayı doğrular, bir confirmation_code üretiriz ve status URL döneriz.

function parseSignedRequest(signedRequest: string, appSecret: string) {
  const [encodedSig, encodedPayload] = signedRequest.split('.')
  if (!encodedSig || !encodedPayload) return null

  // Base64url → Buffer
  const toBuffer = (s: string) =>
    Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64')

  const sig = toBuffer(encodedSig)
  const expectedSig = createHmac('sha256', appSecret).update(encodedPayload).digest()

  if (!sig.equals(expectedSig)) return null

  try {
    return JSON.parse(toBuffer(encodedPayload).toString('utf8'))
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const appSecret = process.env.META_APP_SECRET
  if (!appSecret) {
    console.error('[data-deletion] META_APP_SECRET env var eksik')
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  let signedRequest: string | null = null

  // Meta form-encoded veya JSON olarak gönderebilir
  const contentType = req.headers.get('content-type') || ''
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const text = await req.text()
    const params = new URLSearchParams(text)
    signedRequest = params.get('signed_request')
  } else {
    try {
      const body = await req.json()
      signedRequest = body.signed_request ?? null
    } catch {
      signedRequest = null
    }
  }

  if (!signedRequest) {
    return NextResponse.json({ error: 'signed_request missing' }, { status: 400 })
  }

  const payload = parseSignedRequest(signedRequest, appSecret)
  if (!payload) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
  }

  // confirmation_code: user_id + timestamp — yeterince benzersiz
  const userId: string = payload.user_id ?? 'unknown'
  const confirmationCode = Buffer.from(`${userId}:${Date.now()}`).toString('base64url')

  const statusUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://platform.stoaix.com'}/data-deletion?code=${confirmationCode}`

  console.log(`[data-deletion] Silme talebi alındı. user_id=${userId} code=${confirmationCode}`)

  // Meta'nın beklediği response formatı
  return NextResponse.json({
    url: statusUrl,
    confirmation_code: confirmationCode,
  })
}
