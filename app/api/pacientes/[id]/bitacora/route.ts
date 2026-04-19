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

    const { searchParams } = new URL(req.url)
    const LIMIT = 20
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const offset = (page - 1) * LIMIT

    const result = await pool.query(
      `SELECT b.id, b.observaciones, b.estado_paciente, b.created_at, u.nombre as enfermero_nombre,
              b.tension_arterial, b.frecuencia_cardiaca, b.frecuencia_respiratoria, b.temperatura,
              b.saturacion_oxigeno, b.glucosa, b.uresis, b.evacuaciones,
              b.ingresos_liquidos, b.egresos_liquidos, b.balance_liquidos,
              b.medicacion_turno, b.soluciones, b.dieta, b.escala_dolor, b.turno,
              COUNT(*) OVER() AS total_count
       FROM bitacora b
       LEFT JOIN usuarios u ON b.enfermero_id = u.id
       WHERE b.paciente_id = $1
       ORDER BY b.created_at DESC
       LIMIT $2 OFFSET $3`,
      [id, LIMIT, offset]
    )
    const total = parseInt(result.rows[0]?.total_count ?? '0', 10)
    const bitacoras = result.rows.map(({ total_count, ...b }) => b)
    return NextResponse.json({ bitacoras, total })
  } catch {
    return NextResponse.json({ error: 'Error al obtener bitácora' }, { status: 500 })
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

    const body = await req.json()
    const {
      observaciones,
      estado_paciente,
      tension_arterial,
      frecuencia_cardiaca,
      frecuencia_respiratoria,
      temperatura,
      saturacion_oxigeno,
      glucosa,
      uresis,
      evacuaciones,
      ingresos_liquidos,
      egresos_liquidos,
      balance_liquidos,
      medicacion_turno,
      soluciones,
      dieta,
      escala_dolor,
      turno,
    } = body

    if (!observaciones || !estado_paciente) {
      return NextResponse.json({ error: 'Observaciones y estado del paciente son requeridos' }, { status: 400 })
    }

    const result = await pool.query(
      `INSERT INTO bitacora (
         paciente_id, enfermero_id, observaciones, estado_paciente,
         tension_arterial, frecuencia_cardiaca, frecuencia_respiratoria, temperatura,
         saturacion_oxigeno, glucosa, uresis, evacuaciones,
         ingresos_liquidos, egresos_liquidos, balance_liquidos,
         medicacion_turno, soluciones, dieta, escala_dolor, turno
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
       RETURNING *`,
      [
        id, usuario.id, observaciones, estado_paciente,
        tension_arterial || null,
        frecuencia_cardiaca ? parseInt(frecuencia_cardiaca) : null,
        frecuencia_respiratoria ? parseInt(frecuencia_respiratoria) : null,
        temperatura ? parseFloat(temperatura) : null,
        saturacion_oxigeno ? parseInt(saturacion_oxigeno) : null,
        glucosa ? parseInt(glucosa) : null,
        uresis || null,
        evacuaciones || null,
        ingresos_liquidos || null,
        egresos_liquidos || null,
        balance_liquidos || null,
        medicacion_turno || null,
        soluciones || null,
        dieta || null,
        escala_dolor != null && escala_dolor !== '' ? parseInt(escala_dolor) : null,
        turno || null,
      ]
    )

    return NextResponse.json({ bitacora: result.rows[0] }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error al registrar bitácora' }, { status: 500 })
  }
}
