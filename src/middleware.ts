import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const secretKey = process.env.NEXTAUTH_SECRET || 'supersecret_for_development'
const key = new TextEncoder().encode(secretKey)

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value
  const path = request.nextUrl.pathname
  const isLoginPage = path.startsWith('/login')
  const isPublicRoute = path.startsWith('/queue/display') || path.startsWith('/api/queue')
  if (isPublicRoute) return NextResponse.next()

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
    
    // Valid session but trying to access login page or root, redirect to correct default page
    if (isLoginPage || path === '/') {
      const dest = role === 'OWNER' ? '/owner' : (role === 'ADMIN' ? '/admin' : '/kasir')
      return NextResponse.redirect(new URL(dest, request.url))
    }
    
    // ROLE-BASED ACCESS CONTROL (RBAC)
    
    // Admin & Cashier cannot access Owner-only routes
    const ownerOnlyRoutes = ['/owner', '/finance', '/reports', '/audit-logs', '/users', '/settings']
    if (ownerOnlyRoutes.some(r => path.startsWith(r))) {
      if (role !== 'OWNER') {
        const dest = role === 'ADMIN' ? '/admin' : '/kasir'
        return NextResponse.redirect(new URL(dest, request.url))
      }
    }

    // Cashier cannot access Admin routes
    const adminRoutes = ['/admin', '/products', '/stock', '/purchases', '/suppliers']
    if (adminRoutes.some(r => path.startsWith(r))) {
      if (role === 'CASHIER') return NextResponse.redirect(new URL('/kasir', request.url)) 
    }

    // Admin cannot access Cashier/POS routes
    const cashierRoutes = ['/kasir', '/customers']
    if (cashierRoutes.some(r => path.startsWith(r))) {
      if (role === 'ADMIN') return NextResponse.redirect(new URL('/admin', request.url))
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

