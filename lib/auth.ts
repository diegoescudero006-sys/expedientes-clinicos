import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

export type UsuarioJwt = {
  id: string
  email: string
  rol: string
  nombre: string
}

export function getUsuario(req: NextRequest): UsuarioJwt | null {
  const token = req.cookies.get('token')?.value
  if (!token) return null
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as UsuarioJwt
  } catch {
    return null
  }
}
