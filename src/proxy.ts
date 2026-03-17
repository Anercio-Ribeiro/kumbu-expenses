import { auth } from '@/lib/auth/config'
import { NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/login', '/register', '/api/auth']

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p))
  const isLoggedIn = !!req.auth

  if (!isLoggedIn && !isPublic) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  if (isLoggedIn && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
  if (pathname === '/') {
    return NextResponse.redirect(new URL(isLoggedIn ? '/dashboard' : '/login', req.url))
  }
  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}