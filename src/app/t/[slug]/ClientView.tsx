'use client'
import { useState } from 'react'
import TenantUploader from './uploader'

export type PhotoRow = {
  id: string
  tenant_slug: string
  path: string
  public_url: string
  created_at: string
}

export default function ClientView({ tenantSlug, initialPhotos }: { tenantSlug: string; initialPhotos: PhotoRow[] }) {
  const [photos, setPhotos] = useState<PhotoRow[]>(initialPhotos || [])

  return (
    <>
      <div className="card" style={{marginTop: 12}}>
        <h3>Fotoğraf Yükle</h3>
        <TenantUploader
          tenantSlug={tenantSlug}
          onUploaded={(p) => setPhotos((prev) => [p, ...prev])}
        />
      </div>

      <div style={{marginTop: 16}}>
        <h3>Galeri</h3>
        <div className="grid">
    {photos?.map((p) => {
            const isVideo = /\.(mp4|mov|webm|mkv|avi)$/i.test(p.public_url)
            return (
              <a key={p.id} href={p.public_url} target="_blank" rel="noreferrer" className="thumb">
                {isVideo ? (
                  // eslint-disable-next-line jsx-a11y/media-has-caption
      <video src={p.public_url} style={{maxWidth: '100%'}} muted playsInline loop preload="metadata" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
      <img src={p.public_url} alt="görsel" loading="lazy" decoding="async" />
                )}
              </a>
            )
          })}
          {!photos?.length && <div className="muted">Henüz fotoğraf yok.</div>}
        </div>
      </div>
    </>
  )
}
