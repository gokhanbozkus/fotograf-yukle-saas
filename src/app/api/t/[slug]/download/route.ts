import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseServer'
import archiver from 'archiver'

export const dynamic = 'force-dynamic'

export async function GET(_: Request, { params }: { params: { slug: string } }) {
  const slug = params.slug
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 })

  const sb = getSupabaseAdmin()
  const { data: photos, error } = await sb
    .from('photos')
    .select('id, path, public_url, created_at')
    .eq('tenant_slug', slug)
    .order('created_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Create a streaming zip
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  const archive = archiver('zip', { zlib: { level: 9 } })

  archive.on('data', (chunk) => writer.write(chunk))
  archive.on('end', () => writer.close())
  archive.on('warning', () => {})
  archive.on('error', (err) => {
    try { writer.close() } catch {}
    console.error('zip error', err)
  })

  // Add files by URL (they are public)
  for (const p of photos || []) {
    const name = p.path.split('/').slice(-1)[0] || `${p.id}.jpg`
    archive.append(await fetch(p.public_url).then((r) => r.body as any), { name })
  }
  archive.finalize()

  return new NextResponse(readable as any, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${slug}-photos.zip"`,
    },
  })
}
