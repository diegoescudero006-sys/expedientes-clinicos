import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AUTH_COOKIE_NAME } from '@/lib/auth-constants'
import { verifyUsuarioJwtEdge } from '@/lib/jwt-edge'

function isPublicPath(pathname: string): boolean {
  if (pathname === '/login') return true
  if (pathname === '/api/auth/login') return true
  if (pathname === '/api/auth/logout') return true
  return false
}

function isPatientAllowed(pathname: string): boolean {
  if (pathname === '/mi-expediente' || pathname.startsWith('/mi-expediente/')) return true
  if (pathname.startsWith('/api/mi-expediente')) return true
  return false
}

function jsonUnauthorized() {
  return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
}

function jsonForbidden() {
  return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
}

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone()
  url.pathname = '/login'
  url.search = ''
  return NextResponse.redirect(url)
}

function clearAuthCookie(response: NextResponse) {
  response.cookies.set(AUTH_COOKIE_NAME, '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
  })
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value

  if (!token) {
    if (pathname.startsWith('/api')) {
      return jsonUnauthorized()
    }
    return redirectToLogin(request)
  }

  const usuario = await verifyUsuarioJwtEdge(token)

  if (!usuario) {
    if (pathname.startsWith('/api')) {
      const res = jsonUnauthorized()
      clearAuthCookie(res)
      return res
    }
    const res = redirectToLogin(request)
    clearAuthCookie(res)
    return res
  }

  if (usuario.rol === 'paciente') {
    if (!isPatientAllowed(pathname)) {
      if (pathname.startsWith('/api')) {
        return jsonForbidden()
      }
      const url = request.nextUrl.clone()
      url.pathname = '/mi-expediente'
      url.search = ''
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  if (usuario.rol === 'admin') {
    return NextResponse.next()
  }

  if (usuario.rol === 'enfermero') {
    // Enfermero no puede acceder a la gestión de asignaciones (solo admin)
    if (pathname === '/asignaciones' || pathname.startsWith('/asignaciones/') ||
        pathname.startsWith('/api/asignaciones')) {
      if (pathname.startsWith('/api')) return jsonForbidden()
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      url.search = ''
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  if (pathname.startsWith('/api')) {
    return jsonForbidden()
  }
  return redirectToLogin(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
