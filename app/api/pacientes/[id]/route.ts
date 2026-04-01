import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUsuario } from '@/lib/auth'
import { requirePacienteAccess } from '@/lib/authz'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const usuario = getUsuario(req)
  if (!usuario) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await context.params
    const denied = await requirePacienteAccess(usuario, id)
    if (denied) return denied

    const result = await pool.query('SELECT * FROM pacientes WHERE id = $1', [id])
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 })
    }
    return NextResponse.json({ paciente: result.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener paciente' }, { status: 500 })
  }
}
