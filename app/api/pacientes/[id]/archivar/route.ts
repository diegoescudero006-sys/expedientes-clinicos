import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUsuario } from '@/lib/auth'
import { requirePacienteAccess } from '@/lib/authz'

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const usuario = getUsuario(req)
  if (!usuario || usuario.rol !== 'admin') {
    return NextResponse.json({ error: 'Solo administradores pueden archivar pacientes' }, { status: 403 })
  }

  try {
    const { id } = await context.params
    const denied = await requirePacienteAccess(usuario, id)
    if (denied) return denied

    await pool.query(
      `WITH old_row AS (
         SELECT * FROM pacientes WHERE id = $1
       ), updated AS (
         UPDATE pacientes
         SET archivado = true, archivado_at = NOW()
         WHERE id = $1
         RETURNING *
       ), audit AS (
         INSERT INTO expediente_auditoria
           (paciente_id, usuario_id, accion, tabla, registro_id, antes, despues)
         SELECT $1, $2, 'ARCHIVE', 'pacientes', $1, to_jsonb(old_row), to_jsonb(updated)
         FROM old_row, updated
       )
       SELECT 1`,
      [id, usuario.id]
    )
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al archivar paciente' }, { status: 500 })
  }
}
