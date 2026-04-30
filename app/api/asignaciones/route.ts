import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUsuario } from '@/lib/auth'
import { isUuid } from '@/lib/request-input'

export async function GET(req: NextRequest) {
  const usuario = getUsuario(req)
  if (!usuario || usuario.rol !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const result = await pool.query(
      `SELECT
         ep.id, ep.activo, ep.assigned_at,
         u.id  AS enfermero_id,  u.nombre AS enfermero_nombre,  u.email AS enfermero_email,
         p.id  AS paciente_id,   p.nombre AS paciente_nombre,   p.edad  AS paciente_edad
       FROM enfermeros_pacientes ep
       JOIN usuarios u ON ep.enfermero_id = u.id
       JOIN pacientes p ON ep.paciente_id = p.id
       WHERE ep.activo = true AND (p.archivado IS NOT TRUE)
       ORDER BY u.nombre, p.nombre`
    )
    return NextResponse.json({ asignaciones: result.rows })
  } catch {
    return NextResponse.json({ error: 'Error al obtener asignaciones' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const usuario = getUsuario(req)
  if (!usuario || usuario.rol !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const { enfermero_id, paciente_id } = await req.json()
    if (!enfermero_id || !paciente_id) {
      return NextResponse.json({ error: 'enfermero_id y paciente_id son requeridos' }, { status: 400 })
    }

    if (!isUuid(enfermero_id) || !isUuid(paciente_id)) {
      return NextResponse.json({ error: 'IDs de enfermero o paciente no validos' }, { status: 400 })
    }

    const targets = await pool.query(
      `SELECT
         EXISTS (SELECT 1 FROM usuarios WHERE id = $1 AND rol = 'enfermero') AS enfermero_valido,
         EXISTS (SELECT 1 FROM pacientes WHERE id = $2 AND archivado IS NOT TRUE) AS paciente_valido`,
      [enfermero_id, paciente_id]
    )

    if (!targets.rows[0]?.enfermero_valido) {
      return NextResponse.json({ error: 'El enfermero no existe o no tiene rol de enfermero' }, { status: 400 })
    }

    if (!targets.rows[0]?.paciente_valido) {
      return NextResponse.json({ error: 'El paciente no existe o esta archivado' }, { status: 400 })
    }

    const existing = await pool.query(
      'SELECT id, activo FROM enfermeros_pacientes WHERE enfermero_id = $1 AND paciente_id = $2',
      [enfermero_id, paciente_id]
    )

    if (existing.rows.length > 0) {
      if (existing.rows[0].activo) {
        return NextResponse.json({ error: 'El enfermero ya tiene acceso a este paciente' }, { status: 409 })
      }
      const result = await pool.query(
        'UPDATE enfermeros_pacientes SET activo = true WHERE id = $1 RETURNING *',
        [existing.rows[0].id]
      )
      return NextResponse.json({ asignacion: result.rows[0] })
    }

    const result = await pool.query(
      'INSERT INTO enfermeros_pacientes (enfermero_id, paciente_id, activo) VALUES ($1, $2, true) RETURNING *',
      [enfermero_id, paciente_id]
    )
    return NextResponse.json({ asignacion: result.rows[0] }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error al crear asignación' }, { status: 500 })
  }
}
