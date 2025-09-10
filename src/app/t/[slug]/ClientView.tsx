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
          {photos?.map((p) => (
            <a key={p.id} href={p.public_url} target="_blank" rel="noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.public_url} alt="foto" style={{borderRadius: 8, border: '1px solid #1f2024'}} />
            </a>
          ))}
          {!photos?.length && <div className="muted">Henüz fotoğraf yok.</div>}
        </div>
      </div>
    </>
  )
}
