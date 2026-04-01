import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import jwt from 'jsonwebtoken'

function getUsuario(req: NextRequest) {
  const token = req.cookies.get('token')?.value
  if (!token) return null
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as any
  } catch {
    return null
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const usuario = getUsuario(req)
  if (!usuario || usuario.rol !== 'enfermero') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await context.params
    await pool.query(
      `UPDATE pacientes SET archivado = true, archivado_at = NOW() WHERE id = $1`,
      [id]
    )
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al archivar paciente' }, { status: 500 })
  }
}