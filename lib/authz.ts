import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import type { UsuarioJwt } from '@/lib/auth'

/**
 * admin: cualquier paciente existente (acceso total).
 * enfermero: solo pacientes con asignación activa en enfermeros_pacientes.
 * paciente: solo el expediente vinculado a su usuario_id.
 * Responde 404 si no hay acceso (no filtra información sobre si existe o no).
 */
export async function requirePacienteAccess(
  usuario: UsuarioJwt,
  pacienteId: string
): Promise<NextResponse | null> {
  if (usuario.rol === 'admin') {
    const r = await pool.query('SELECT id FROM pacientes WHERE id = $1', [pacienteId])
    if (r.rows.length === 0) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 })
    }
    return null
  }

  if (usuario.rol === 'enfermero') {
    const r = await pool.query(
      `SELECT p.id FROM pacientes p
       INNER JOIN enfermeros_pacientes ep
         ON ep.paciente_id = p.id AND ep.enfermero_id = $2 AND ep.activo = true
       WHERE p.id = $1`,
      [pacienteId, usuario.id]
    )
    if (r.rows.length === 0) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 })
    }
    return null
  }

  if (usuario.rol === 'paciente') {
    const r = await pool.query(
      'SELECT id FROM pacientes WHERE id = $1 AND usuario_id = $2',
      [pacienteId, usuario.id]
    )
    if (r.rows.length === 0) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 })
    }
    return null
  }

  return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
}

export async function medicamentoPerteneceAPaciente(
  medicamentoId: string,
  pacienteId: string
): Promise<boolean> {
  const r = await pool.query(
    'SELECT 1 FROM medicamentos WHERE id = $1 AND paciente_id = $2',
    [medicamentoId, pacienteId]
  )
  return r.rows.length > 0
}
