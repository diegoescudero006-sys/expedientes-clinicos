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
      `UPDATE medicamentos SET activo = false, suspendido_at = NOW() WHERE id = $1 AND paciente_id = $2`,
      [medicamento_id, pacienteId]
    )
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al suspender medicamento' }, { status: 500 })
  }
}
