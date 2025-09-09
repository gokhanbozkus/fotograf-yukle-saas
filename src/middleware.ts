import { NextResponse, type NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const url = req.nextUrl
  const host = req.headers.get('host') || ''
  const base = (process.env.TENANT_DOMAIN_BASE || '').toLowerCase()

  if (base && host.endsWith(base)) {
    const sub = host.slice(0, -base.length).replace(/\.$/, '')
    if (sub && sub !== 'www') {
      if (!url.pathname.startsWith('/t/')) {
        url.pathname = `/t/${sub}${url.pathname}`
        return NextResponse.rewrite(url)
      }
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}
