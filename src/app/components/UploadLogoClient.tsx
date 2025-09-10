"use client"
import { useRef, useState } from 'react'

export default function UploadLogoClient({ type, slug, target }: { type: 'partner' | 'tenant'; slug?: string; target?: string }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) return
    // Slug öncelik: prop -> aynı formdaki name="slug" input -> prompt
    let s = slug || (document.querySelector<HTMLInputElement>('form [name=slug]')?.value ?? '')
    if (!s) s = window.prompt('Slug girin') || ''
    if (!s) return
    setBusy(true)
    setMsg(null)
    const form = new FormData()
    form.append('type', type)
    form.append('slug', s)
    form.append('file', file)
    const res = await fetch('/api/assets/upload', { method: 'POST', body: form })
    const j = await res.json().catch(() => ({} as any))
    if (!res.ok) {
      setMsg(j?.error || 'Yükleme hatası')
    } else {
      setMsg('Yüklendi')
      // Hedef input’u doldur
      const sel = target || 'input[name="logo_url"]'
      const input = (document.querySelector(sel) as HTMLInputElement | null)
      if (input && j?.url) input.value = j.url
    }
    setBusy(false)
  }

  return (
    <form onSubmit={onSubmit} style={{display:'flex', gap:8, alignItems:'center'}}>
      <input ref={fileRef} className="input" type="file" accept="image/*" />
      <button className="btn secondary" type="submit" disabled={busy}>{busy ? 'Yükleniyor…' : 'Dosyadan Logo Yükle'}</button>
      {msg && <span className="muted" style={{marginLeft:8}}>{msg}</span>}
    </form>
  )
}
