import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUsuario } from '@/lib/auth'
import { findPacienteByUsuarioId } from '@/lib/paciente-del-usuario'

export async function GET(req: NextRequest) {
  const usuario = getUsuario(req)
  if (!usuario || usuario.rol !== 'paciente') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const paciente = await findPacienteByUsuarioId(usuario.id)
  if (!paciente) {
    return NextResponse.json({ error: 'No se encontró expediente asociado' }, { status: 404 })
  }

  const result = await pool.query(
    `SELECT a.id, a.titulo, a.fecha, a.hora, a.lugar, a.descripcion,
            a.tipo, a.completado, a.created_at,
            u.nombre AS creado_por_nombre
     FROM agenda a
     LEFT JOIN usuarios u ON u.id = a.creado_por
     WHERE a.paciente_id = $1
     ORDER BY a.fecha ASC, a.hora ASC NULLS LAST`,
    [paciente.id]
  )

  return NextResponse.json({ eventos: result.rows })
}
