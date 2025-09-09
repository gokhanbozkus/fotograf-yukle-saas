import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Fotoğraf Yükle',
  description: 'Çoklu müşteri fotoğraf yükleme platformu',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  )
}
