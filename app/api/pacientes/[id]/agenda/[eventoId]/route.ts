import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUsuario } from '@/lib/auth'

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string; eventoId: string }> }
) {
  const usuario = getUsuario(req)
  if (!usuario || usuario.rol !== 'admin') {
    return NextResponse.json({ error: 'Solo administradores pueden marcar eventos como completados' }, { status: 403 })
  }

  const { id, eventoId } = await context.params

  const result = await pool.query(
    `UPDATE agenda SET completado = true
     WHERE id = $1 AND paciente_id = $2
     RETURNING id`,
    [eventoId, id]
  )

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
