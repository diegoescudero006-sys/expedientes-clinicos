import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUsuario } from '@/lib/auth'

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const usuario = getUsuario(req)
  if (!usuario || usuario.rol !== 'admin') {
    return NextResponse.json({ error: 'Solo administradores pueden desarchivar pacientes' }, { status: 403 })
  }

  try {
    const { id } = await context.params

    const check = await pool.query('SELECT id FROM pacientes WHERE id = $1', [id])
    if (check.rows.length === 0) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 })
    }

    await pool.query(
      'UPDATE pacientes SET archivado = false, archivado_at = NULL WHERE id = $1',
      [id]
    )

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error al desarchivar paciente' }, { status: 500 })
  }
}
