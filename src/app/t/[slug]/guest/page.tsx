import { notFound } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabaseServer'
import TenantUploader from '../uploader'

export const dynamic = 'force-dynamic'

async function getTenant(slug: string) {
  const sb = getSupabaseAdmin()
  const { data } = await sb.from('tenants').select('*').eq('slug', slug).maybeSingle()
  return data
}

export default async function GuestPage({ params }: { params: { slug: string } }) {
  const tenant = await getTenant(params.slug)
  if (!tenant) return notFound()
  return (
    <div className="container" data-theme-color={tenant.theme_color ?? '#8b5cf6'}>
      <div className="card" style={{marginTop:12}}>
        <h2>{tenant.name}</h2>
        <p className="muted">Lütfen etkinlikten çektiğiniz 1-2 güzel fotoğrafı yükleyin. Teşekkürler! 📸</p>
        <TenantUploader tenantSlug={tenant.slug} />
        <div style={{marginTop:12}}>
          <a className="btn" href={`/t/${tenant.slug}`}>Galeriyi Gör</a>
        </div>
      </div>
    </div>
  )
}
