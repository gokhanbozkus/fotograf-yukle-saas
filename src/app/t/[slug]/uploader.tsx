'use client'
import { useState } from 'react'
import { supabaseClient } from '@/lib/supabase'

export type UploadedPhoto = { id: string; tenant_slug: string; path: string; public_url: string; created_at: string }
export default function TenantUploader({ tenantSlug, onUploaded }: { tenantSlug: string; onUploaded?: (p: UploadedPhoto) => void }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [total, setTotal] = useState(0)
  const [uploaded, setUploaded] = useState(0)

  async function handleFiles(files: FileList | null) {
    if (!files || !files.length) return
    setUploading(true)
    setError(null)
    setDone(false)
    setTotal(files.length)
    setUploaded(0)
    try {
      const maxMb = parseInt(process.env.NEXT_PUBLIC_MAX_UPLOAD_MB || '25', 10)
      const maxBytes = Math.max(1, maxMb) * 1024 * 1024
      // Process sequentially for reliability
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (file.size > maxBytes) {
          throw new Error(`Dosya çok büyük (> ${maxMb} MB): ${file.name}`)
        }
        const ext = file.name.split('.').pop()?.toLowerCase() || 'dat'
        const now = new Date()
        const uuid = (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`)
        const path = `${tenantSlug}/${now.getFullYear()}/${(now.getMonth()+1).toString().padStart(2,'0')}/${now.getDate().toString().padStart(2,'0')}/${uuid}.${ext}`
        const { data, error } = await supabaseClient.storage.from('photos').upload(path, file, { upsert: false, contentType: file.type })
        if (error) throw new Error(`Storage upload failed: ${error.message}`)
        const { data: pub } = supabaseClient.storage.from('photos').getPublicUrl(data.path)

        const res = await fetch('/api/photos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenant_slug: tenantSlug, path: data.path, public_url: pub.publicUrl, size: file.size, content_type: file.type })
        })
        if (!res.ok) {
          const j = await res.json().catch(() => ({}))
          throw new Error(`API insert failed: ${j?.error || res.statusText}`)
        }
        const inserted = await res.json().catch(() => null)
        setUploaded(i + 1)
        if (inserted && inserted.photo && onUploaded) onUploaded(inserted.photo)
      }
      setDone(true)
    } catch (e: any) {
      setError(e?.message ?? 'Yükleme başarısız')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <input className="input" type="file" multiple accept="image/*,video/*" onChange={(e) => handleFiles(e.target.files)} />
      <div style={{marginTop:8}}>
        <button className="btn" disabled={uploading} onClick={() => document.querySelector<HTMLInputElement>('input[type=file]')?.click()}>{uploading ? `Yükleniyor… (${uploaded}/${total})` : 'Foto/Video Seç (Çoklu)'}
        </button>
      </div>
      {uploading && total > 1 && (
        <div className="muted" style={{marginTop:8}}>Toplu yükleme: {uploaded}/{total}</div>
      )}
      {done && <div style={{color:'#4ade80', marginTop:8}}>Yükleme tamamlandı! Galeri anında güncellendi ✅</div>}
      {error && <div style={{color:'#f87171', marginTop:8}}>{error}</div>}
    </div>
  )
}
