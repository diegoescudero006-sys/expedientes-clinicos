import { NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME } from '@/lib/auth'

export async function POST() {
  const response = NextResponse.json({ ok: true })
  // Los atributos deben coincidir exactamente con los del login para que el browser elimine la cookie
  response.cookies.set(AUTH_COOKIE_NAME, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
    maxAge: 0,
  })
  return response
}