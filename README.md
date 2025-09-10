# Fotoğraf Yükle SaaS — Notlar

- Misafir QR’ları ve indirme linkleri için baz URL, `NEXT_PUBLIC_PUBLIC_BASE_URL` ile override edilebilir.
  - Örn: `https://sizin-domain.com`
  - Ayarlanmazsa, mevcut sayfanın origin’i (örn. `https://fotograf-yukle-saas.vercel.app`) kullanılır.
- Baz URL’yi özel bir alan adına yönlendirmek, bazı mobil operatörlerde görülen `ERR_SSL_PROTOCOL_ERROR` gibi hataları önlemeye yardımcı olur.

## Kurulum
- Vercel Projenize aşağıdaki env’i ekleyin (Production/Preview/Development):
  - `NEXT_PUBLIC_PUBLIC_BASE_URL = https://sizin-domain.com`
# Fotoğraf Yükle SaaS (Multi-tenant)

- Next.js 14 (app router) + Supabase (Auth opsiyonel, DB + Storage)
- Çoklu müşteri (tenant) için tema ve upload sayfası
- Admin paneli: müşteri ekle/düzenle, foto listeleme

## Hızlı Kurulum

1) Supabase projesi oluşturun. .env dosyasını `.env.local` olarak kopyalayın ve doldurun:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY (server-side için)
2) Supabase SQL -> Run aşağıdaki şemayı çalıştırın: `supabase/schema.sql`
3) Geliştirme:

```bash
npm install
npm run dev
```

## Çoklu Müşteri Ayrımı
- Alt alan adları: `<tenant>.<domain>` veya
- Yol parametresi: `/t/<tenant>`

`.env` içindeki `TENANT_DOMAIN_BASE` ile local subdomain testi yapılabilir.

## Depolama
- Supabase Storage bucket: `photos` (public read, authenticated write)
- Dosya yolu: `tenant_slug/yyyy/mm/dd/uuid.jpg`

## Notlar
- Admin için basit key tabanlı koruma var. Üretimde gerçek auth ekleyin.

***

Bu repo örnek bir başlangıçtır; ölçeklendirme, rate limit, CDN, optimize görüntü servisleri üretimde eklenmelidir.
 
---
CI test notu: Bu satır, otomatik deploy tetiklemek için eklenmiştir.