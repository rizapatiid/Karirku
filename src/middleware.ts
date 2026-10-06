import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const secretKey = process.env.NEXTAUTH_SECRET || 'supersecret_for_development'
const key = new TextEncoder().encode(secretKey)

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value
  const isLoginPage = request.nextUrl.pathname.startsWith('/login')

  // Not logged in
  if (!session) {
    if (!isLoginPage && request.nextUrl.pathname !== '/') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }

  // Logged in
  try {
    const parsed = await jwtVerify(session, key)
    
    // Valid session but trying to access login page, redirect to dashboard
    if (isLoginPage || request.nextUrl.pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    
    // (Optional) Role-based access control can be added here
    // e.g. if (request.nextUrl.pathname.startsWith('/settings') && parsed.payload.role !== 'OWNER')

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
