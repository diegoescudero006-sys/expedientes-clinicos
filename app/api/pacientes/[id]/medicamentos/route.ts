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
      `SELECT * FROM medicamentos WHERE paciente_id = $1 ORDER BY updated_at DESC`,
      [id]
    )
    return NextResponse.json({ medicamentos: result.rows })
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener medicamentos' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const usuario = getUsuario(req)
  if (!usuario || (usuario.rol !== 'enfermero' && usuario.rol !== 'admin')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await context.params
    const denied = await requirePacienteAccess(usuario, id)
    if (denied) return denied

    const { nombre, dosis, horario, fecha_inicio, fecha_fin, indeterminado, alto_riesgo } = await req.json()

    if (!nombre || !dosis || !horario || !fecha_inicio) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 })
    }

    const result = await pool.query(
      `INSERT INTO medicamentos (paciente_id, nombre, dosis, horario, fecha_inicio, fecha_fin, indeterminado, alto_riesgo, actualizado_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [id, nombre, dosis, horario, fecha_inicio, indeterminado ? null : fecha_fin, indeterminado ?? false, alto_riesgo ?? false, usuario.id]
    )

    return NextResponse.json({ medicamento: result.rows[0] }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Error al agregar medicamento' }, { status: 500 })
  }
}
