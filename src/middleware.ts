import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const secretKey = process.env.NEXTAUTH_SECRET || 'supersecret_for_development'
const key = new TextEncoder().encode(secretKey)

// ─────────────────────────────────────────────────────────────────
// ACCESS MATRIX
// ─────────────────────────────────────────────────────────────────
// OWNER:   semua route
// ADMIN:   /admin, /products, /stock, /purchases, /suppliers, /sales, /queue
// CASHIER: /kasir, /sales, /customers, /queue
// ─────────────────────────────────────────────────────────────────

const OWNER_ONLY = [
  '/owner', '/finance', '/reports', '/audit-logs', '/users', '/settings',
]

const ADMIN_AND_OWNER = [
  '/admin', '/products', '/stock', '/purchases', '/suppliers',
]

// Routes cashier CANNOT access (admin-only inventory routes)
const CASHIER_BLOCKED = [
  '/admin', '/products', '/stock', '/purchases', '/suppliers',
  '/finance', '/reports', '/audit-logs', '/users', '/settings', '/owner',
]

// Routes ADMIN cannot access (POS & customer-facing)
const ADMIN_BLOCKED = [
  '/kasir', '/owner', '/finance', '/reports', '/audit-logs', '/users', '/settings',
]

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value
  const path = request.nextUrl.pathname
  const isLoginPage = path.startsWith('/login')

  // Public routes — no auth needed
  const isPublicRoute =
    path.startsWith('/queue/display') ||
    path.startsWith('/api/queue')
  if (isPublicRoute) return NextResponse.next()

  // Not logged in
  if (!session) {
    if (!isLoginPage && path !== '/') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }

  try {
    const parsed = await jwtVerify(session, key)
    const role = (parsed.payload.role as string) || 'KASIR'

    // Redirect from login / root to correct home
    if (isLoginPage || path === '/') {
      const dest =
        role === 'OWNER' ? '/owner' :
        role === 'ADMIN' ? '/admin' :
        '/kasir'
      return NextResponse.redirect(new URL(dest, request.url))
    }

    // ── OWNER: unrestricted ──
    if (role === 'OWNER') return NextResponse.next()

    // ── ADMIN: block owner-only + cashier-only routes ──
    if (role === 'ADMIN') {
      if (ADMIN_BLOCKED.some(r => path.startsWith(r))) {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
      return NextResponse.next()
    }

    // ── CASHIER: only allow their routes ──
    if (role === 'KASIR') {
      if (CASHIER_BLOCKED.some(r => path.startsWith(r))) {
        return NextResponse.redirect(new URL('/kasir', request.url))
      }
      return NextResponse.next()
    }

    return NextResponse.next()
  } catch {
    if (!isLoginPage) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

