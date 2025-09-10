import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabaseServer'
import ClientView from './ClientView'

async function getTenant(slug: string) {
  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw error
  return data
}

async function getPhotos(slug: string) {
  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('photos')
    .select('*')
    .eq('tenant_slug', slug)
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return data
}

export const dynamic = 'force-dynamic'
export default async function TenantPage({ params }: { params: { slug: string } }) {
  const tenant = await getTenant(params.slug)
  if (!tenant) return notFound()
  const photos = await getPhotos(params.slug)

  return (
    <div className="container" data-theme-color={tenant.theme_color ?? '#8b5cf6'}>
      <div className="header">
        {tenant.logo_url ? (
          <Image src={tenant.logo_url} alt={tenant.name} width={40} height={40} className="logo" />
        ) : (
          <div className="logo" />
        )}
        <div className="title">{tenant.name}</div>
      </div>

      {tenant.cover_url && (
        <Image src={tenant.cover_url} alt="Kapak" className="cover" width={1200} height={400} />
      )}

    <div className="card" style={{marginTop: 12, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div>
          <strong>Toplu İndirme</strong>
          <div className="muted">Tüm fotoğrafları .zip olarak indir</div>
        </div>
        <div>
      <a className="btn" href={`/api/t/${tenant.slug}/download`}>ZIP indir</a>
      <a className="btn secondary" style={{marginLeft:8}} href={`/t/${tenant.slug}/qr`}>QR Kodlar</a>
        </div>
      </div>

      <ClientView tenantSlug={tenant.slug} initialPhotos={photos as any} />
    </div>
  )
}
