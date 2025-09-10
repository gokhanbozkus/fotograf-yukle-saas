import { revalidatePath } from 'next/cache'
import { getSupabaseAdmin } from '@/lib/supabaseServer'

async function createPartner(formData: FormData) {
  'use server'
  const key = process.env.ADMIN_KEY || 'dev'
  if ((formData.get('key') as string) !== key) throw new Error('Yetkisiz')
  const slug = (formData.get('slug') as string)?.trim()
  const name = (formData.get('name') as string)?.trim()
  const email = (formData.get('email') as string)?.trim() || null
  const admin_key = (formData.get('admin_key') as string)?.trim() || ''
  if (!slug || !name || !admin_key) throw new Error('Zorunlu alanlar')
  const sb = getSupabaseAdmin()
  const { error } = await sb.from('partners').insert({ slug, name, email, admin_key })
  if (error) throw error
  revalidatePath('/owner')
}

async function getPartners() {
  const sb = getSupabaseAdmin()
  const { data } = await sb.from('partners').select('*').order('created_at', { ascending: false })
  return data || []
}

async function updatePartner(formData: FormData) {
  'use server'
  const key = process.env.ADMIN_KEY || 'dev'
  if ((formData.get('key') as string) !== key) throw new Error('Yetkisiz')
  const slug = (formData.get('slug') as string)?.trim()
  const name = (formData.get('name') as string)?.trim() || null
  const email = (formData.get('email') as string)?.trim() || null
  const admin_key = (formData.get('admin_key') as string)?.trim() || null
  const logo_url = (formData.get('logo_url') as string)?.trim() || null
  if (!slug) throw new Error('Eksik slug')
  const sb = getSupabaseAdmin()
  const { error } = await sb.from('partners').update({ name, email, admin_key, logo_url }).eq('slug', slug)
  if (error) throw error
  revalidatePath('/owner')
}

export const dynamic = 'force-dynamic'
export default async function OwnerPage() {
  const partners = await getPartners()
  return (
    <div className="container">
      <h2>Sistem Sahibi Paneli</h2>
      <div className="card" style={{marginTop:12}}>
        <form action={createPartner}>
          <div style={{display:'grid', gap:8}}>
            <input className="input" name="key" placeholder="Owner Admin Key" />
            <input className="input" name="slug" placeholder="partner slug (ornekbayi)" />
            <input className="input" name="name" placeholder="Partner adı" />
            <input className="input" name="email" placeholder="Email (opsiyonel)" />
            <input className="input" name="admin_key" placeholder="Partner Admin Key (onların panel girişi)" />
            <button className="btn" type="submit">Partner Ekle</button>
          </div>
        </form>
      </div>

      <div style={{marginTop:16}}>
        <h3>Aktif Partnerler</h3>
        <div style={{display:'grid', gap:12}}>
          {partners.map((p: any) => (
            <div key={p.slug} className="card">
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                  <strong>{p.name}</strong> <span className="muted">({p.slug})</span>
                </div>
                <a className="btn secondary" href={`/partner/${p.slug}`}>Partner Paneli</a>
              </div>
              <form action={updatePartner} style={{marginTop:8}}>
                <input type="hidden" name="slug" defaultValue={p.slug} />
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
                  <input className="input" name="key" placeholder="Owner Admin Key" />
                  <input className="input" name="name" placeholder="Partner adı" defaultValue={p.name || ''} />
                </div>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:8}}>
                  <input className="input" name="email" placeholder="Email" defaultValue={p.email || ''} />
                  <input className="input" name="admin_key" placeholder="Partner Admin Key" defaultValue={p.admin_key || ''} />
                </div>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:8}}>
                  <input className="input" name="logo_url" placeholder="Logo URL" defaultValue={p.logo_url || ''} />
                  <UploadLogo slug={p.slug} type="partner" />
                </div>
                <div style={{marginTop:8}}>
                  <button className="btn" type="submit">Kaydet</button>
                </div>
              </form>
            </div>
          ))}
          {!partners.length && <div className="muted">Kayıt yok.</div>}
        </div>
      </div>
    </div>
  )
}

import UploadLogoClient from '@/app/components/UploadLogoClient'

function UploadLogo({ slug, type }: { slug: string; type: 'partner' | 'tenant' }) {
  return <UploadLogoClient type={type} slug={slug} />
}
