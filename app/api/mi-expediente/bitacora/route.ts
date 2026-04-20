import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUsuario } from '@/lib/auth'
import { findPacienteByUsuarioId } from '@/lib/paciente-del-usuario'

export async function GET(req: NextRequest) {
  const usuario = getUsuario(req)
  if (!usuario) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  if (usuario.rol !== 'paciente') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const paciente = await findPacienteByUsuarioId(usuario.id)
    if (!paciente) {
      return NextResponse.json(
        { error: 'No se encontró expediente asociado a tu cuenta' },
        { status: 404 }
      )
    }

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
              b.braden_percepcion, b.braden_humedad, b.braden_actividad,
              b.braden_movilidad, b.braden_nutricion, b.braden_lesiones, b.braden_total,
              b.reporte_enfermeria, b.supervision_enfermero, b.supervision_familiar,
              COUNT(*) OVER() AS total_count
       FROM bitacora b
       LEFT JOIN usuarios u ON b.enfermero_id = u.id
       WHERE b.paciente_id = $1
       ORDER BY b.created_at DESC
       LIMIT $2 OFFSET $3`,
      [paciente.id, LIMIT, offset]
    )
    const total = parseInt(result.rows[0]?.total_count ?? '0', 10)
    const bitacoras = result.rows.map(({ total_count, ...b }) => b)
    return NextResponse.json({ bitacoras, total })
  } catch (error) {
    console.error('Error en mi-expediente/bitacora GET:', error)
    return NextResponse.json(
      { error: 'Error al obtener bitácora' },
      { status: 500 }
    )
  }
}
