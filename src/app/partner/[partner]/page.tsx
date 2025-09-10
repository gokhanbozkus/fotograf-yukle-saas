import { revalidatePath } from 'next/cache'
import { notFound } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabaseServer'
import UploadLogoClient from '@/app/components/UploadLogoClient'

async function getPartner(slug: string) {
  const sb = getSupabaseAdmin()
  const { data } = await sb.from('partners').select('*').eq('slug', slug).maybeSingle()
  return data
}

async function createTenant(formData: FormData) {
  'use server'
  const partner_slug = (formData.get('partner_slug') as string)?.trim()
  const key = (formData.get('key') as string)?.trim()
  const sb = getSupabaseAdmin()
  const { data: partner } = await sb.from('partners').select('*').eq('slug', partner_slug).maybeSingle()
  if (!partner || key !== partner.admin_key) throw new Error('Yetkisiz')

  const slug = (formData.get('slug') as string)?.trim()
  const name = (formData.get('name') as string)?.trim()
  const logo_url = (formData.get('logo_url') as string)?.trim() || null
  const cover_url = (formData.get('cover_url') as string)?.trim() || null
  const theme_color = (formData.get('theme_color') as string)?.trim() || '#8b5cf6'
  const owner_first_name = (formData.get('owner_first_name') as string)?.trim() || null
  const owner_last_name = (formData.get('owner_last_name') as string)?.trim() || null
  const owner_photo_url = (formData.get('owner_photo_url') as string)?.trim() || null
  const pin_code = (formData.get('pin_code') as string)?.trim() || null
  if (!slug || !name) throw new Error('Zorunlu alanlar')
  const { error } = await sb.from('tenants').insert({ slug, name, logo_url, cover_url, theme_color, partner_slug, owner_first_name, owner_last_name, owner_photo_url, pin_code })
  if (error) throw error
  revalidatePath(`/partner/${partner_slug}`)
}

async function getTenants(partner_slug: string) {
  const sb = getSupabaseAdmin()
  const { data } = await sb.from('tenants').select('*').eq('partner_slug', partner_slug).order('created_at', { ascending: false })
  return data || []
}

export const dynamic = 'force-dynamic'
export default async function PartnerAdminPage({ params }: { params: { partner: string } }) {
  const partner = await getPartner(params.partner)
  if (!partner) return notFound()
  const tenants = await getTenants(params.partner)
  return (
    <div className="container">
      <h2>Partner Paneli — {partner.name}</h2>
      <div className="card" style={{marginTop:12}}>
        <form action={createTenant}>
          <input type="hidden" name="partner_slug" value={params.partner} />
          <div style={{display:'grid', gap:8}}>
            <input className="input" name="key" placeholder="Partner Admin Key" />
            <input className="input" name="slug" placeholder="müşteri slug (dugun-ali-ayse)" />
            <input className="input" name="name" placeholder="Müşteri adı (Ali & Ayşe)" />
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
              <input className="input" name="owner_first_name" placeholder="İsim" />
              <input className="input" name="owner_last_name" placeholder="Soyisim" />
            </div>
            <input className="input" name="owner_photo_url" placeholder="Sahip foto URL (opsiyonel)" />
            <input className="input" name="logo_url" placeholder="Logo URL (opsiyonel)" />
            <UploadLogoClient type="tenant" />
            <input className="input" name="cover_url" placeholder="Kapak URL (opsiyonel)" />
            <input className="input" name="theme_color" placeholder="#8b5cf6" />
            <input className="input" name="pin_code" placeholder="Misafir PIN (opsiyonel)" />
            <button className="btn" type="submit">Müşteri Oluştur</button>
          </div>
        </form>
      </div>

      <div style={{marginTop:16}}>
        <h3>Aktif Müşteriler</h3>
        <div style={{display:'grid', gap:12}}>
          {tenants.map((t: any) => (
            <div key={t.slug} className="card">
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                  <strong>{t.name}</strong> <span className="muted">({t.slug})</span>
                </div>
                <div>
                  <a className="btn secondary" href={`/t/${t.slug}/qr`} style={{marginRight:8}}>QR</a>
                  <a className="btn" href={`/t/${t.slug}`}>Galeriyi Aç</a>
                </div>
              </div>
              <TenantEdit t={t} partner={params.partner} />
            </div>
          ))}
          {!tenants.length && <div className="muted">Kayıt yok.</div>}
        </div>
      </div>
    </div>
  )
}

// removed old UploadLogo form (now using UploadLogoClient)

async function updateTenant(formData: FormData) {
  'use server'
  const sb = getSupabaseAdmin()
  const partner_slug = (formData.get('partner_slug') as string)?.trim()
  const key = (formData.get('key') as string)?.trim()
  const { data: partner } = await sb.from('partners').select('admin_key').eq('slug', partner_slug).maybeSingle()
  if (!partner || key !== partner.admin_key) throw new Error('Yetkisiz')
  const slug = (formData.get('slug') as string)?.trim()
  if (!slug) throw new Error('Eksik slug')
  const name = (formData.get('name') as string)?.trim() || null
  const logo_url = (formData.get('logo_url') as string)?.trim() || null
  const cover_url = (formData.get('cover_url') as string)?.trim() || null
  const theme_color = (formData.get('theme_color') as string)?.trim() || '#8b5cf6'
  const owner_first_name = (formData.get('owner_first_name') as string)?.trim() || null
  const owner_last_name = (formData.get('owner_last_name') as string)?.trim() || null
  const owner_photo_url = (formData.get('owner_photo_url') as string)?.trim() || null
  const pin_code = (formData.get('pin_code') as string)?.trim() || null
  const { error } = await sb.from('tenants').update({ name, logo_url, cover_url, theme_color, owner_first_name, owner_last_name, owner_photo_url, pin_code }).eq('slug', slug)
  if (error) throw error
  revalidatePath(`/partner/${partner_slug}`)
}

function TenantEdit({ t, partner }: { t: any; partner: string }) {
  return (
    <form action={updateTenant} style={{marginTop:8}}>
      <input type="hidden" name="partner_slug" value={partner} />
      <input type="hidden" name="slug" defaultValue={t.slug} />
      <div style={{display:'grid', gap:8}}>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
          <input className="input" name="key" placeholder="Partner Admin Key" />
          <input className="input" name="name" placeholder="Ad" defaultValue={t.name || ''} />
        </div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
          <input className="input" name="owner_first_name" placeholder="İsim" defaultValue={t.owner_first_name || ''} />
          <input className="input" name="owner_last_name" placeholder="Soyisim" defaultValue={t.owner_last_name || ''} />
        </div>
        <input className="input" name="owner_photo_url" placeholder="Sahip foto URL" defaultValue={t.owner_photo_url || ''} />
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
          <input className="input" name="logo_url" placeholder="Logo URL" defaultValue={t.logo_url || ''} />
          <UploadLogoClient slug={t.slug} type="tenant" />
        </div>
        <input className="input" name="cover_url" placeholder="Kapak URL" defaultValue={t.cover_url || ''} />
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
          <input className="input" name="theme_color" placeholder="#8b5cf6" defaultValue={t.theme_color || '#8b5cf6'} />
          <input className="input" name="pin_code" placeholder="Misafir PIN" defaultValue={t.pin_code || ''} />
        </div>
        <div>
          <button className="btn" type="submit">Güncelle</button>
        </div>
      </div>
    </form>
  )
}
