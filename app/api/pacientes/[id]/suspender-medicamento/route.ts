import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUsuario } from '@/lib/auth'
import { requirePacienteAccess, medicamentoPerteneceAPaciente } from '@/lib/authz'

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const usuario = getUsuario(req)
  if (!usuario || (usuario.rol !== 'enfermero' && usuario.rol !== 'admin')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id: pacienteId } = await context.params
    const denied = await requirePacienteAccess(usuario, pacienteId)
    if (denied) return denied

    const { medicamento_id } = await req.json()
    if (!medicamento_id) {
      return NextResponse.json({ error: 'medicamento_id es requerido' }, { status: 400 })
    }

    const ok = await medicamentoPerteneceAPaciente(medicamento_id, pacienteId)
    if (!ok) {
      return NextResponse.json({ error: 'Medicamento no encontrado' }, { status: 404 })
    }

    await pool.query(
      `WITH old_row AS (
         SELECT * FROM medicamentos WHERE id = $1 AND paciente_id = $2
       ), updated AS (
         UPDATE medicamentos
         SET activo = false, suspendido_at = NOW(), actualizado_por = $3, updated_at = NOW()
         WHERE id = $1 AND paciente_id = $2
         RETURNING *
       ), audit AS (
         INSERT INTO expediente_auditoria
           (paciente_id, usuario_id, accion, tabla, registro_id, antes, despues)
         SELECT $2, $3, 'SUSPEND', 'medicamentos', $1, to_jsonb(old_row), to_jsonb(updated)
         FROM old_row, updated
       )
       SELECT 1`,
      [medicamento_id, pacienteId, usuario.id]
    )
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al suspender medicamento' }, { status: 500 })
  }
}
