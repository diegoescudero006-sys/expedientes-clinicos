import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUsuario } from '@/lib/auth'
import { requirePacienteAccess } from '@/lib/authz'
import { generarUrlFirmada } from '@/lib/s3'
import { parsePositiveIntParam } from '@/lib/request-input'

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

    const { searchParams } = new URL(req.url)
    const limit = parsePositiveIntParam(searchParams, 'limit', 20, 50)
    const page = parsePositiveIntParam(searchParams, 'page', 1, 10000)
    const offset = (page - 1) * limit

    const result = await pool.query(
      `SELECT a.id, a.nombre_archivo, a.url, a.tipo, a.created_at, u.nombre as subido_por_nombre,
              COUNT(*) OVER() AS total_count
       FROM archivos a
       LEFT JOIN usuarios u ON a.subido_por = u.id
       WHERE a.paciente_id = $1
       ORDER BY a.created_at DESC
       LIMIT $2 OFFSET $3`,
      [id, limit, offset]
    )

    const archivos = []
    for (const a of result.rows) {
      const archivo = { ...a }
      delete archivo.total_count
      archivos.push({
        ...archivo,
        url: await generarUrlFirmada(a.url),
      })
    }

    return NextResponse.json({
      archivos,
      total: parseInt(result.rows[0]?.total_count ?? '0', 10),
      page,
      limit,
    })
  } catch {
    return NextResponse.json({ error: 'Error al obtener archivos' }, { status: 500 })
  }
}
