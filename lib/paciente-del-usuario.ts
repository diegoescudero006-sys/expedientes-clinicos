import pool from '@/lib/db'

/** Expediente vinculado al usuario-paciente (usuario_id en pacientes). */
export async function findPacienteByUsuarioId(usuarioId: string) {
  const result = await pool.query(
    `SELECT p.*, uc.nombre AS creado_por_nombre
     FROM pacientes p
     LEFT JOIN usuarios uc ON uc.id = p.creado_por
     WHERE p.usuario_id = $1
     ORDER BY p.created_at DESC
     LIMIT 1`,
    [usuarioId]
  )
  return result.rows[0] ?? null
}
