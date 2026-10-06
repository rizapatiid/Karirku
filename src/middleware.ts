import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const secretKey = process.env.NEXTAUTH_SECRET || 'supersecret_for_development'
const key = new TextEncoder().encode(secretKey)

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value
  const path = request.nextUrl.pathname
  const isLoginPage = path.startsWith('/login')

  // Not logged in
  if (!session) {
    if (!isLoginPage && path !== '/') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }

  // Logged in
  try {
    const parsed = await jwtVerify(session, key)
    const role = parsed.payload.role as string || 'CASHIER'
    
    // Valid session but trying to access login page, redirect to dashboard
    if (isLoginPage || path === '/') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    
    // ROLE-BASED ACCESS CONTROL (RBAC)
    
    // Admin & Cashier cannot access Owner-only routes
    const ownerOnlyRoutes = ['/finance', '/reports', '/audit-logs', '/users', '/settings']
    if (ownerOnlyRoutes.some(r => path.startsWith(r))) {
      if (role !== 'OWNER') return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Cashier cannot access Admin routes
    const adminRoutes = ['/products', '/stock', '/purchases', '/suppliers']
    if (adminRoutes.some(r => path.startsWith(r))) {
      if (role === 'CASHIER') return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Admin cannot access Cashier/POS routes
    const cashierRoutes = ['/pos', '/customers']
    if (cashierRoutes.some(r => path.startsWith(r))) {
      if (role === 'ADMIN') return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return NextResponse.next()
  } catch (error) {
    // Invalid session token
    if (!isLoginPage) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
