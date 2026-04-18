import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUsuario } from '@/lib/auth'

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const usuario = getUsuario(req)
  if (!usuario || usuario.rol !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const { id } = await context.params
    const result = await pool.query(
      'UPDATE enfermeros_pacientes SET activo = false WHERE id = $1 RETURNING *',
      [id]
    )
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Asignación no encontrada' }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error al revocar asignación' }, { status: 500 })
  }
}
