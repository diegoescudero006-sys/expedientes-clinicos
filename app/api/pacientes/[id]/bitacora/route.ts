import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUsuario } from '@/lib/auth'
import { requirePacienteAccess } from '@/lib/authz'
import { parsePositiveIntParam } from '@/lib/request-input'

const SV_COLUMNS = `
  b.tension_arterial, b.frecuencia_cardiaca, b.frecuencia_respiratoria, b.temperatura,
  b.saturacion_oxigeno, b.glucosa, b.glucosa_nota, b.sv1_hora,
  b.sv2_ta, b.sv2_fc, b.sv2_fr, b.sv2_temp, b.sv2_spo2, b.sv2_glucosa, b.sv2_glucosa_nota, b.sv2_hora,
  b.sv3_ta, b.sv3_fc, b.sv3_fr, b.sv3_temp, b.sv3_spo2, b.sv3_glucosa, b.sv3_glucosa_nota, b.sv3_hora`

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
    const page = parsePositiveIntParam(searchParams, 'page', 1)
    const offset = (page - 1) * LIMIT

    const result = await pool.query(
      `SELECT b.id, b.observaciones, b.estado_paciente, b.created_at, u.nombre as enfermero_nombre,
              ${SV_COLUMNS},
              b.uresis, b.evacuaciones,
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
      [id, LIMIT, offset]
    )
    const total = parseInt(result.rows[0]?.total_count ?? '0', 10)
    const bitacoras = result.rows.map((row) => {
      const bitacora = { ...row }
      delete bitacora.total_count
      return bitacora
    })
    return NextResponse.json({ bitacoras, total })
  } catch {
    return NextResponse.json({ error: 'Error al obtener bitácora' }, { status: 500 })
  }
}

function toInt(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = parseInt(String(v), 10)
  return isNaN(n) ? null : n
}

function toFloat(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = parseFloat(String(v))
  return isNaN(n) ? null : n
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
      observaciones, estado_paciente,
      // Toma #1
      tension_arterial, frecuencia_cardiaca, frecuencia_respiratoria, temperatura,
      saturacion_oxigeno, glucosa, glucosa_nota, sv1_hora,
      // Toma #2
      sv2_ta, sv2_fc, sv2_fr, sv2_temp, sv2_spo2, sv2_glucosa, sv2_glucosa_nota, sv2_hora,
      // Toma #3
      sv3_ta, sv3_fc, sv3_fr, sv3_temp, sv3_spo2, sv3_glucosa, sv3_glucosa_nota, sv3_hora,
      // Balance y tratamiento
      uresis, evacuaciones, ingresos_liquidos, egresos_liquidos, balance_liquidos,
      medicacion_turno, soluciones, dieta, escala_dolor, turno,
      // Braden
      braden_percepcion, braden_humedad, braden_actividad,
      braden_movilidad, braden_nutricion, braden_lesiones, braden_total,
      reporte_enfermeria, supervision_enfermero, supervision_familiar,
    } = body

    if (!observaciones || !estado_paciente) {
      return NextResponse.json({ error: 'Observaciones y estado del paciente son requeridos' }, { status: 400 })
    }

    const result = await pool.query(
      `INSERT INTO bitacora (
         paciente_id, enfermero_id, observaciones, estado_paciente,
         tension_arterial, frecuencia_cardiaca, frecuencia_respiratoria, temperatura,
         saturacion_oxigeno, glucosa, glucosa_nota, sv1_hora,
         sv2_ta, sv2_fc, sv2_fr, sv2_temp, sv2_spo2, sv2_glucosa, sv2_glucosa_nota, sv2_hora,
         sv3_ta, sv3_fc, sv3_fr, sv3_temp, sv3_spo2, sv3_glucosa, sv3_glucosa_nota, sv3_hora,
         uresis, evacuaciones, ingresos_liquidos, egresos_liquidos, balance_liquidos,
         medicacion_turno, soluciones, dieta, escala_dolor, turno,
         braden_percepcion, braden_humedad, braden_actividad,
         braden_movilidad, braden_nutricion, braden_lesiones, braden_total,
         reporte_enfermeria, supervision_enfermero, supervision_familiar
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,
         $13,$14,$15,$16,$17,$18,$19,$20,
         $21,$22,$23,$24,$25,$26,$27,$28,
         $29,$30,$31,$32,$33,$34,$35,$36,$37,$38,
         $39,$40,$41,$42,$43,$44,$45,$46,$47,$48
       ) RETURNING *`,
      [
        id, usuario.id, observaciones, estado_paciente,
        tension_arterial || null,
        toInt(frecuencia_cardiaca), toInt(frecuencia_respiratoria),
        toFloat(temperatura), toInt(saturacion_oxigeno),
        toInt(glucosa), glucosa_nota || null, sv1_hora || null,
        sv2_ta || null, toInt(sv2_fc), toInt(sv2_fr), toFloat(sv2_temp), toInt(sv2_spo2),
        toInt(sv2_glucosa), sv2_glucosa_nota || null, sv2_hora || null,
        sv3_ta || null, toInt(sv3_fc), toInt(sv3_fr), toFloat(sv3_temp), toInt(sv3_spo2),
        toInt(sv3_glucosa), sv3_glucosa_nota || null, sv3_hora || null,
        uresis || null, evacuaciones || null,
        ingresos_liquidos || null, egresos_liquidos || null, balance_liquidos || null,
        medicacion_turno || null, soluciones || null, dieta || null,
        toInt(escala_dolor), turno || null,
        toInt(braden_percepcion), toInt(braden_humedad), toInt(braden_actividad),
        toInt(braden_movilidad), toInt(braden_nutricion), toInt(braden_lesiones),
        toInt(braden_total),
        reporte_enfermeria || null, supervision_enfermero || null, supervision_familiar || null,
      ]
    )

    return NextResponse.json({ bitacora: result.rows[0] }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error al registrar bitácora' }, { status: 500 })
  }
}
