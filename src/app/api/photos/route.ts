import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseServer'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { tenant_slug, path, public_url } = body || {}
    if (!tenant_slug || !path || !public_url) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    // basit doğrulama: path prefix tenant_slug ile başlamalı
    if (!String(path).startsWith(`${tenant_slug}/`)) {
      return NextResponse.json({ error: 'Invalid path prefix' }, { status: 400 })
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
