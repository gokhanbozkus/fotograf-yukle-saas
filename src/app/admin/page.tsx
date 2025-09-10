import { revalidatePath } from 'next/cache'
import { getSupabaseAdmin } from '@/lib/supabaseServer'

async function createTenant(formData: FormData) {
  'use server'
  const adminKey = process.env.ADMIN_KEY || 'dev'
  if ((formData.get('key') as string) !== adminKey) {
    throw new Error('Yetkisiz')
  }
  const slug = (formData.get('slug') as string)?.trim()
  const name = (formData.get('name') as string)?.trim()
  const logo_url = (formData.get('logo_url') as string)?.trim() || null
  const cover_url = (formData.get('cover_url') as string)?.trim() || null
  const theme_color = (formData.get('theme_color') as string)?.trim() || '#8b5cf6'
  if (!slug || !name) throw new Error('Zorunlu alanlar eksik')
  const supabaseAdmin = getSupabaseAdmin()
  const { error } = await supabaseAdmin.from('tenants').insert({ slug, name, logo_url, cover_url, theme_color })
  if (error) throw error
  revalidatePath('/admin')
}

async function getTenants() {
  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin.from('tenants').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export const dynamic = 'force-dynamic'
export default async function AdminPage() {
  const tenants = await getTenants()
  return (
    <div className="container">
      <h2>Admin (Eski)</h2>
      <div className="card" style={{marginTop:12, background:'linear-gradient(180deg, rgba(139,92,246,.12), rgba(0,0,0,.0))'}}>
        <strong>Yeni paneller burada:</strong>
        <ul style={{marginTop:8}}>
          <li><a className="btn secondary" href="/owner">Owner Paneli</a> — Partner oluştur/düzenle, logo yükle</li>
          <li style={{marginTop:6}} className="muted">Partner özel paneline erişim: /partner/&lt;partner-slug&gt;?key=&lt;partner_admin_key&gt;</li>
        </ul>
        <div className="muted" style={{marginTop:8}}>Bu sayfa eski akış içindir; yeni geliştirmeler Owner/Partner panellerinde.</div>
      </div>
      <div className="card" style={{marginTop:12}}>
        <form action={createTenant}>
          <div style={{display:'grid', gap:8}}>
            <input className="input" name="key" placeholder="Admin Key (dev için: dev)" />
            <input className="input" name="slug" placeholder="slug (ornek)" />
            <input className="input" name="name" placeholder="İsim (Örnek Firma)" />
            <input className="input" name="logo_url" placeholder="Logo URL (opsiyonel)" />
            <input className="input" name="cover_url" placeholder="Kapak URL (opsiyonel)" />
            <input className="input" name="theme_color" placeholder="#8b5cf6" />
            <button className="btn" type="submit">Müşteri Ekle</button>
          </div>
        </form>
      </div>

      <div style={{marginTop:16}}>
        <h3>Mevcut Müşteriler</h3>
        <ul>
          {tenants?.map((t: any) => (
            <li key={t.slug}>
              <a href={`/t/${t.slug}`}>{t.name} ({t.slug})</a>
            </li>
          ))}
          {!tenants?.length && <li className="muted">Kayıt yok.</li>}
        </ul>
      </div>
    </div>
  )
}
