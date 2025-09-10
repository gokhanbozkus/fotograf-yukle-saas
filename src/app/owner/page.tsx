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
        <ul>
          {partners.map((p: any) => (
            <li key={p.slug}>
              <a href={`/partner/${p.slug}`}>{p.name} ({p.slug})</a>
            </li>
          ))}
          {!partners.length && <li className="muted">Kayıt yok.</li>}
        </ul>
      </div>
    </div>
  )
}
