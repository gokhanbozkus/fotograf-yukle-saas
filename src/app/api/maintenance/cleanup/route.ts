import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseServer'

// Deletes photos/videos older than RETENTION_DAYS (default 7)
export async function POST(req: Request) {
  const auth = req.headers.get('authorization') || ''
  const key = process.env.CRON_KEY || process.env.ADMIN_KEY
  if (!key || !auth.endsWith(key)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const days = parseInt(process.env.RETENTION_DAYS || '7', 10)
  const sb = getSupabaseAdmin()
  try {
    // 1) Find old rows
    const { data: rows, error } = await sb
      .from('photos')
      .select('id, path, created_at')
      .lt('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .limit(1000)
    if (error) throw error

    if (!rows?.length) {
      return NextResponse.json({ ok: true, deleted: 0 })
    }

    // 2) Remove from storage in batches
    const paths = rows.map(r => r.path)
    const rem = await sb.storage.from('photos').remove(paths)
    if (rem.error) throw rem.error

    // 3) Delete DB rows
    const ids = rows.map(r => r.id)
    const del = await sb.from('photos').delete().in('id', ids)
    if (del.error) throw del.error

    return NextResponse.json({ ok: true, deleted: rows.length })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'cleanup failed' }, { status: 500 })
  }
}
