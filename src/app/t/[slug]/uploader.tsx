'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase'

export default function TenantUploader({ tenantSlug }: { tenantSlug: string }) {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleFiles(files: FileList | null) {
    if (!files || !files.length) return
    setUploading(true)
    setError(null)
    setDone(false)
    try {
      const file = files[0]
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const now = new Date()
  const uuid = (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`)
  const path = `${tenantSlug}/${now.getFullYear()}/${(now.getMonth()+1).toString().padStart(2,'0')}/${now.getDate().toString().padStart(2,'0')}/${uuid}.${ext}`
  const { data, error } = await supabaseClient.storage.from('photos').upload(path, file, { upsert: false, contentType: file.type })
  if (error) throw new Error(`Storage upload failed: ${error.message}`)
  const { data: pub } = supabaseClient.storage.from('photos').getPublicUrl(data.path)

  const { error: dberr } = await supabaseClient.from('photos').insert({
        tenant_slug: tenantSlug,
        path: data.path,
        public_url: pub.publicUrl,
      })
  if (dberr) throw new Error(`DB insert failed: ${dberr.message}`)
      setDone(true)
  // Sayfayı yenilemeden galeriyi güncelle
  router.refresh()
    } catch (e: any) {
      setError(e?.message ?? 'Yükleme başarısız')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <input className="input" type="file" accept="image/*" onChange={(e) => handleFiles(e.target.files)} />
      <div style={{marginTop:8}}>
        <button className="btn" disabled={uploading} onClick={() => document.querySelector<HTMLInputElement>('input[type=file]')?.click()}>{uploading ? 'Yükleniyor…' : 'Fotoğraf Seç'}</button>
      </div>
      {done && <div style={{color:'#4ade80', marginTop:8}}>Yüklendi! Sayfayı yenileyince görünecek.</div>}
      {error && <div style={{color:'#f87171', marginTop:8}}>{error}</div>}
    </div>
  )
}
