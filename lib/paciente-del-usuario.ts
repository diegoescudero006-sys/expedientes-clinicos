import pool from '@/lib/db'

/** Expediente vinculado al usuario-paciente (usuario_id en pacientes). */
export async function findPacienteByUsuarioId(usuarioId: string) {
  const result = await pool.query(
    `SELECT * FROM pacientes
     WHERE usuario_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [usuarioId]
  )
  return result.rows[0] ?? null
}
