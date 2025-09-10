'use client'
import { useEffect, useState } from 'react'
import * as QRCode from 'qrcode'

export default function QrShare({ slug }: { slug: string }) {
  const [uploadQr, setUploadQr] = useState<string>('')
  const [zipQr, setZipQr] = useState<string>('')
  const [uploadUrl, setUploadUrl] = useState('')
  const [zipUrl, setZipUrl] = useState('')

  useEffect(() => {
    const origin = window.location.origin
  // Guest QR should point to the dedicated guest upload page, not the owner gallery
  const u = `${origin}/t/${slug}/guest`
    const z = `${origin}/api/t/${slug}/download`
    setUploadUrl(u)
    setZipUrl(z)
    QRCode.toDataURL(u, { width: 320 }).then(setUploadQr).catch(() => {})
    QRCode.toDataURL(z, { width: 320 }).then(setZipQr).catch(() => {})
  }, [slug])

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text) } catch {}
  }

  return (
    <div style={{display:'grid', gap:16}}>
      <div className="card" style={{textAlign:'center'}}>
        <h3>Misafirler İçin Yükleme QR</h3>
        {uploadQr && <img src={uploadQr} alt="QR Upload" style={{background:'#fff', padding:8, borderRadius:8}} />}
        <div style={{marginTop:8}}>
          <a className="btn" href={uploadUrl} target="_blank">Linki Aç</a>
          <button className="btn" style={{marginLeft:8}} onClick={() => copy(uploadUrl)}>Kopyala</button>
          {uploadQr && <a className="btn" style={{marginLeft:8}} href={uploadQr} download={`upload-${slug}.png`}>QR İndir</a>}
        </div>
      </div>

      <div className="card" style={{textAlign:'center'}}>
        <h3>Sahip İçin Toplu İndirme QR</h3>
        {zipQr && <img src={zipQr} alt="QR Download" style={{background:'#fff', padding:8, borderRadius:8}} />}
        <div style={{marginTop:8}}>
          <a className="btn" href={zipUrl} target="_blank">ZIP Linkini Aç</a>
          <button className="btn" style={{marginLeft:8}} onClick={() => copy(zipUrl)}>Kopyala</button>
          {zipQr && <a className="btn" style={{marginLeft:8}} href={zipQr} download={`zip-${slug}.png`}>QR İndir</a>}
        </div>
      </div>
    </div>
  )
}
