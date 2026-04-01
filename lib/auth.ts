import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

/** Misma cookie que establece `app/api/auth/login` — no renombrar sin actualizar login/logout. */
export const AUTH_COOKIE_NAME = 'token'

export type UsuarioJwt = {
  id: string
  email: string
  rol: string
  nombre: string
}

export function getUsuario(req: NextRequest): UsuarioJwt | null {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value
  if (!token) return null
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as UsuarioJwt
  } catch {
    return null
  }
}
