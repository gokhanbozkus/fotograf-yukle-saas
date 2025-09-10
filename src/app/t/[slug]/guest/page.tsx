import { notFound } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabaseServer'
import ClientView from '../ClientView'

export const dynamic = 'force-dynamic'

async function getTenant(slug: string) {
  const sb = getSupabaseAdmin()
  const { data } = await sb.from('tenants').select('*').eq('slug', slug).maybeSingle()
  return data
}

async function getPhotos(slug: string) {
  const sb = getSupabaseAdmin()
  const { data } = await sb
    .from('photos')
    .select('*')
    .eq('tenant_slug', slug)
    .order('created_at', { ascending: false })
    .limit(100)
  return data || []
}

export default async function GuestPage({ params }: { params: { slug: string } }) {
  const tenant = await getTenant(params.slug)
  if (!tenant) return notFound()
  const photos = await getPhotos(params.slug)
  return (
    <div className="container" data-theme-color={tenant.theme_color ?? '#8b5cf6'}>
      <div className="card" style={{marginTop:12}}>
        <h2>{tenant.name}</h2>
        <p className="muted">Lütfen etkinlikten çektiğiniz 1-2 güzel fotoğrafı yükleyin. Teşekkürler! 📸</p>
      </div>

      {/* Uploader + canlı galeri */}
      <ClientView tenantSlug={tenant.slug} initialPhotos={photos as any} />
    </div>
  )
}
