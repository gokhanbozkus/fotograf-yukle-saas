import { getSupabaseAdmin } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

export default async function DebugPage({ searchParams }: { searchParams: { key?: string; slug?: string } }) {
  const provided = searchParams?.key || ''
  const adminKey = process.env.ADMIN_KEY || ''
  const authorized = adminKey && provided === adminKey

  const envReport = [
    ['NEXT_PUBLIC_SUPABASE_URL', !!process.env.NEXT_PUBLIC_SUPABASE_URL],
    ['NEXT_PUBLIC_SUPABASE_ANON_KEY', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY],
    ['SUPABASE_SERVICE_ROLE_KEY', !!process.env.SUPABASE_SERVICE_ROLE_KEY],
    ['ADMIN_KEY', !!process.env.ADMIN_KEY],
  ] as const

  let supabaseOk: null | boolean = null
  let supabaseError: string | null = null
  let photosCount: number | null = null
  if (authorized) {
    try {
      const sb = getSupabaseAdmin()
      const { error } = await sb.from('tenants').select('slug', { count: 'exact', head: true })
      if (error) throw error
      supabaseOk = true
      // Optional: photos count for a tenant
      if (searchParams?.slug) {
        const { count, error: err2 } = await sb
          .from('photos')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_slug', searchParams.slug)
        if (!err2) photosCount = count ?? 0
      }
    } catch (e: any) {
      supabaseOk = false
      supabaseError = e?.message || String(e)
    }
  }

  return (
    <div className="container">
      <h2>Debug</h2>
      {!authorized ? (
        <p className="muted">Yetkisiz. URL'ye ?key=ADMIN_KEY ekleyin.</p>
      ) : (
        <div className="card" style={{marginTop:12}}>
          <h3>Environment</h3>
          <ul>
            {envReport.map(([k, v]) => (
              <li key={k}>
                <code>{k}</code>: {v ? 'OK' : 'MISSING'}
              </li>
            ))}
          </ul>
          <h3>Supabase</h3>
          <p>DB erişimi: {supabaseOk === null ? '-' : supabaseOk ? 'OK' : 'ERROR'}</p>
          {typeof photosCount === 'number' && (
            <p>Foto sayısı (tenant="{searchParams.slug}"): {photosCount}</p>
          )}
          {supabaseError && <pre style={{whiteSpace:'pre-wrap'}}>{supabaseError}</pre>}
        </div>
      )}
    </div>
  )
}
