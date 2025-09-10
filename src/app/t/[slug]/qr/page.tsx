import { notFound } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabaseServer'
import QrShare from '../QrShare'

export const dynamic = 'force-dynamic'

async function getTenant(slug: string) {
  const sb = getSupabaseAdmin()
  const { data } = await sb.from('tenants').select('*').eq('slug', slug).maybeSingle()
  return data
}

export default async function QrPage({ params }: { params: { slug: string } }) {
  const tenant = await getTenant(params.slug)
  if (!tenant) return notFound()
  return (
    <div className="container" data-theme-color={tenant.theme_color ?? '#8b5cf6'}>
      <div className="card">
        <h2>{tenant.name} — Paylaşım QR Kodları</h2>
        <p className="muted">Misafirlerin yükleme sayfasına hızlı geçmesi ve sahiplerin toplu indirmesi için QR kodları.</p>
        <QrShare slug={tenant.slug} />
        <div style={{display:'flex', gap:8, marginTop:16}}>
          <a className="btn" href={`/t/${tenant.slug}/guest`}>Misafir Yükleme</a>
          <a className="btn" href={`/t/${tenant.slug}`}>Sahip Galerisi</a>
        </div>
        <div style={{marginTop:16}}>
          <a className="btn" href={`/t/${tenant.slug}`}>Geri Dön</a>
        </div>
      </div>
    </div>
  )
}
