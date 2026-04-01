import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

export function getUsuario(req: NextRequest) {
  const token = req.cookies.get('token')?.value
  if (!token) return null
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string
      email: string
      rol: string
      nombre: string
    }
  } catch {
    return null
  }
}
