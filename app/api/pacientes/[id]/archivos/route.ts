import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUsuario } from '@/lib/auth'
import { requirePacienteAccess } from '@/lib/authz'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const usuario = getUsuario(req)
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { id } = await context.params
    const denied = await requirePacienteAccess(usuario, id)
    if (denied) return denied
    const result = await pool.query(
      `SELECT a.*, u.nombre as subido_por_nombre
       FROM archivos a
       LEFT JOIN usuarios u ON a.subido_por = u.id
       WHERE a.paciente_id = $1
       ORDER BY a.created_at DESC`,
      [id]
    )
    return NextResponse.json({ archivos: result.rows })
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener archivos' }, { status: 500 })
  }
}