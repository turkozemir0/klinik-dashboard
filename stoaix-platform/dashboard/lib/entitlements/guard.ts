import { NextRequest, NextResponse } from 'next/server'
import { checkEntitlement } from './check'

type RouteHandler = (req: NextRequest, ctx: any) => Promise<NextResponse>

// API route'a feature guard sarar
// Kullanım: export const GET = withFeatureGuard('calendar_manage', handler)
export function withFeatureGuard(featureKey: string, handler: RouteHandler): RouteHandler {
  return async (req: NextRequest, ctx: any) => {
    const orgId = req.headers.get('x-org-id')
    if (!orgId) {
      return NextResponse.json({ error: 'org_id_required' }, { status: 401 })
    }

    const ent = await checkEntitlement(orgId, featureKey)

    if (!ent.enabled) {
      return NextResponse.json(
        { error: 'upgrade_required', feature: featureKey },
        { status: 403 }
      )
    }

    if (ent.remaining !== null && ent.remaining <= 0) {
      return NextResponse.json(
        {
          error: 'usage_limit_exceeded',
          feature: featureKey,
          limit: ent.limit,
          used: ent.used,
        },
        { status: 403 }
      )
    }

    return handler(req, ctx)
  }
}
