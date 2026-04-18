import { NextRequest, NextResponse } from 'next/server'
import { getUsuario } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const usuario = getUsuario(req)
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  return NextResponse.json({ id: usuario.id, email: usuario.email, rol: usuario.rol, nombre: usuario.nombre })
}
