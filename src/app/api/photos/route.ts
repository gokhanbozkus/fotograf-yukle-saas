import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseServer'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { tenant_slug, path, public_url, size, content_type } = body || {}
    if (!tenant_slug || !path || !public_url) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    // basit doğrulama: path prefix tenant_slug ile başlamalı
    if (!String(path).startsWith(`${tenant_slug}/`)) {
      return NextResponse.json({ error: 'Invalid path prefix' }, { status: 400 })
    }
    // boyut ve tür sınırı (sunucu tarafı güvenlik jeli)
    const maxMbStr = process.env.MAX_UPLOAD_MB || process.env.NEXT_PUBLIC_MAX_UPLOAD_MB || '25'
    const maxBytes = Math.max(1, parseInt(maxMbStr, 10)) * 1024 * 1024
    if (typeof size === 'number' && size > maxBytes) {
      // Aşırı büyükse yüklenen objeyi silmeyi dene
      try {
        const sbDel = getSupabaseAdmin()
        await sbDel.storage.from('photos').remove([path])
      } catch {}
      return NextResponse.json({ error: `File too large (> ${Math.floor(maxBytes/1024/1024)} MB)` }, { status: 413 })
    }
    if (content_type && !/^image\//.test(content_type) && !/^video\//.test(content_type)) {
      return NextResponse.json({ error: 'Unsupported content type' }, { status: 415 })
    }
    const sb = getSupabaseAdmin()
    const { data, error } = await sb
      .from('photos')
      .insert({ tenant_slug, path, public_url })
      .select('*')
      .single()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true, photo: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}
