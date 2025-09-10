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
  const [autoCompress, setAutoCompress] = useState(true)
  const [info, setInfo] = useState<string | null>(null)

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
        let file = files[i]
        if (file.size > maxBytes) {
          // Büyük ise ve fotoğrafsa, küçüklemeyi dene
          const canCompress = autoCompress && file.type.startsWith('image/') && !/image\/(heic|heif)/i.test(file.type)
          if (canCompress) {
            const maxDim = parseInt(process.env.NEXT_PUBLIC_IMAGE_MAX_DIM || '2000', 10)
            const quality = Math.min(1, Math.max(0.5, parseFloat(process.env.NEXT_PUBLIC_IMAGE_QUALITY || '0.82')))
            const before = file.size
            const compressed = await compressImage(file, { maxDim, quality })
            if (compressed && compressed.size < before) {
              file = compressed
              setInfo(`${files[i].name} küçültüldü: ${(before/1024/1024).toFixed(1)}MB → ${(compressed.size/1024/1024).toFixed(1)}MB`)
            }
          }
          if (file.size > maxBytes) {
            throw new Error(`Dosya çok büyük (> ${maxMb} MB): ${file.name}`)
          }
        }
        const ext = file.name.split('.').pop()?.toLowerCase() || 'dat'
        const now = new Date()
        const uuid = (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`)
        const path = `${tenantSlug}/${now.getFullYear()}/${(now.getMonth()+1).toString().padStart(2,'0')}/${now.getDate().toString().padStart(2,'0')}/${uuid}.${ext}`
        const { data, error } = await supabaseClient.storage.from('photos').upload(path, file, { upsert: false, contentType: file.type || 'application/octet-stream' })
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

  async function compressImage(file: File, opts: { maxDim: number; quality: number }): Promise<File | null> {
    try {
      const arrayBuf = await file.arrayBuffer()
      const blob = new Blob([arrayBuf], { type: file.type || 'image/jpeg' })
      const bitmap = 'createImageBitmap' in window ? await createImageBitmap(blob) : await loadHTMLImage(blob)
      const { width, height } = bitmap
      const { maxDim, quality } = opts
      const scale = Math.min(1, maxDim / Math.max(width, height))
      if (scale >= 1 && file.size < 0.9 * (parseInt(process.env.NEXT_PUBLIC_MAX_UPLOAD_MB || '25', 10) * 1024 * 1024)) {
        return null // zaten küçük, uğraşma
      }
      const w = Math.max(1, Math.round(width * scale))
      const h = Math.max(1, Math.round(height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      // @ts-ignore drawImage works for both ImageBitmap and HTMLImageElement
      ctx.drawImage(bitmap as any, 0, 0, w, h)
      const outType = 'image/jpeg'
      const blobOut: Blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b as Blob), outType, quality))
      if (!blobOut) return null
      return new File([blobOut], renameToJpg(file.name), { type: outType, lastModified: Date.now() })
    } catch {
      return null
    }
  }

  function renameToJpg(name: string) {
    return name.replace(/\.[^.]+$/,'') + '.jpg'
  }

  function loadHTMLImage(blob: Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob)
      const img = new Image()
      img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
      img.onerror = (e) => { URL.revokeObjectURL(url); reject(e) }
      img.src = url
    })
  }

  return (
    <div>
      <input className="input" type="file" multiple accept="image/*,video/*" onChange={(e) => handleFiles(e.target.files)} />
      <div style={{marginTop:8}}>
        <button className="btn" disabled={uploading} onClick={() => document.querySelector<HTMLInputElement>('input[type=file]')?.click()}>{uploading ? `Yükleniyor… (${uploaded}/${total})` : 'Foto/Video Seç (Çoklu)'}
        </button>
      </div>
      <div className="muted" style={{marginTop:8, fontSize:13}}>
        Maksimum boyut: {parseInt(process.env.NEXT_PUBLIC_MAX_UPLOAD_MB || '25', 10)} MB
      </div>
      <label style={{display:'flex', alignItems:'center', gap:8, marginTop:6}}>
        <input type="checkbox" checked={autoCompress} onChange={(e) => setAutoCompress(e.target.checked)} />
        Büyük fotoğrafları otomatik küçült (kalite ~{Math.round(100*parseFloat(process.env.NEXT_PUBLIC_IMAGE_QUALITY || '0.82'))}%).
      </label>
      {uploading && total > 1 && (
        <div className="muted" style={{marginTop:8}}>Toplu yükleme: {uploaded}/{total}</div>
      )}
      {info && <div className="muted" style={{marginTop:8}}>{info}</div>}
      {done && <div style={{color:'#4ade80', marginTop:8}}>Yükleme tamamlandı! Galeri anında güncellendi ✅</div>}
      {error && <div style={{color:'#f87171', marginTop:8}}>{error}</div>}
    </div>
  )
}
