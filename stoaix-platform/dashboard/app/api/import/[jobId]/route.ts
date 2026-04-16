import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET /api/import/[jobId] — Job durumu
export async function GET(_req: NextRequest, { params }: { params: { jobId: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('import_jobs')
    .select('id, status, total_rows, processed_rows, inserted_count, duplicate_count, error_count, error_details, source_filename, created_at, completed_at')
    .eq('id', params.jobId)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Job bulunamadı' }, { status: 404 })

  return NextResponse.json(data)
}
