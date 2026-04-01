import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { AUTH_COOKIE_NAME, type UsuarioJwt } from '@/lib/auth-constants'

export { AUTH_COOKIE_NAME, type UsuarioJwt } from '@/lib/auth-constants'

export function getUsuario(req: NextRequest): UsuarioJwt | null {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value
  if (!token) return null
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as UsuarioJwt
  } catch {
    return null
  }
}
