import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUsuario } from '@/lib/auth'
import { requirePacienteAccess } from '@/lib/authz'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const usuario = getUsuario(req)
  if (!usuario) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await context.params
    const denied = await requirePacienteAccess(usuario, id)
    if (denied) return denied

    const result = await pool.query(
      `SELECT b.*, u.nombre as enfermero_nombre 
       FROM bitacora b
       LEFT JOIN usuarios u ON b.enfermero_id = u.id
       WHERE b.paciente_id = $1
       ORDER BY b.created_at DESC`,
      [id]
    )
    return NextResponse.json({ bitacoras: result.rows })
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener bitácora' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const usuario = getUsuario(req)
  if (!usuario || usuario.rol !== 'enfermero') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await context.params
    const denied = await requirePacienteAccess(usuario, id)
    if (denied) return denied

    const { observaciones, estado_paciente } = await req.json()

    if (!observaciones || !estado_paciente) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 })
    }

    const result = await pool.query(
      `INSERT INTO bitacora (paciente_id, enfermero_id, observaciones, estado_paciente)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [id, usuario.id, observaciones, estado_paciente]
    )

    return NextResponse.json({ bitacora: result.rows[0] }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Error al registrar bitácora' }, { status: 500 })
  }
}
