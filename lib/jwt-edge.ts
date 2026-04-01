import { jwtVerify } from 'jose'
import type { UsuarioJwt } from '@/lib/auth-constants'

/**
 * Verificación HS256 compatible con tokens emitidos por `jsonwebtoken` en login.
 * Para usar en middleware (Edge); `jsonwebtoken` no es compatible con Edge.
 */
export async function verifyUsuarioJwtEdge(token: string): Promise<UsuarioJwt | null> {
  const secret = process.env.JWT_SECRET
  if (!secret) return null
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ['HS256'],
    })
    const id = String(payload.id ?? '')
    const email = String(payload.email ?? '')
    const rol = String(payload.rol ?? '')
    const nombre = String(payload.nombre ?? '')
    if (!id || !email || !rol) return null
    return { id, email, rol, nombre }
  } catch {
    return null
  }
}
