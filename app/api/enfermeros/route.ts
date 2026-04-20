import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUsuario } from '@/lib/auth'

const ADMIN_EMAILS = ['sam@angeldelosabuelos.com', 'admin@angeldelosabuelos.com']

export async function GET(req: NextRequest) {
  const usuario = getUsuario(req)
  if (!usuario || (!ADMIN_EMAILS.includes(usuario.email) && usuario.rol !== 'admin')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const result = await pool.query(
      `SELECT id, nombre, email, created_at
       FROM usuarios
       WHERE rol = 'enfermero'
       ORDER BY created_at ASC`
    )
    return NextResponse.json({ enfermeros: result.rows })
  } catch {
    return NextResponse.json({ error: 'Error al obtener enfermeros' }, { status: 500 })
  }
}
