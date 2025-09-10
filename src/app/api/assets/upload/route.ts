import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const sb = getSupabaseAdmin()
  const contentType = req.headers.get('content-type') || ''
  if (!contentType.startsWith('multipart/form-data')) {
    return NextResponse.json({ error: 'multipart/form-data required' }, { status: 400 })
  }
  const form = await req.formData()
  const type = (form.get('type') as string) || 'tenant'
  const slug = (form.get('slug') as string) || ''
  const file = form.get('file') as File | null
  if (!slug || !file) return NextResponse.json({ error: 'missing slug or file' }, { status: 400 })

  const ext = (file.name.split('.').pop() || 'png').toLowerCase()
  const safe = `${type}/${slug}/logo.${ext}`
  const { error: upErr } = await sb.storage.from('assets').upload(safe, file, { upsert: true, contentType: file.type || 'image/png' })
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })
  const { data: pub } = sb.storage.from('assets').getPublicUrl(safe)
  return NextResponse.json({ url: pub.publicUrl })
}
