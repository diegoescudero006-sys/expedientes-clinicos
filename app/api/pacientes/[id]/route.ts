import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUsuario } from '@/lib/auth'
import { requirePacienteAccess } from '@/lib/authz'

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const usuario = getUsuario(req)
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (usuario.rol !== 'enfermero' && usuario.rol !== 'admin') return NextResponse.json({ error: 'Prohibido' }, { status: 403 })

  try {
    const { id } = await context.params
    const body = await req.json() as Record<string, unknown>

    const {
      nombre, edad, sexo, fecha_nacimiento, telefono,
      diagnostico, contacto, doctor_encargado, direccion,
      tipo_sangre, peso, altura, primera_visita,
      motivo_consulta, padecimiento_actual,
      alergias, antecedentes_medicos, antecedentes_heredofamiliares,
      antecedentes_patologicos, antecedentes_no_patologicos,
      // Historia Clínica — nuevos campos
      estado_civil, escolaridad, religion, telefono_local,
      familiar_responsable, familiar_tel_local, familiar_tel_cel, segundo_numero_emergencia,
      tiene_servicio_medico, cual_servicio_medico, afiliacion,
      medicos_tratantes, motivo_atencion_domiciliaria,
      enfermedades_cronicas, ultima_hospitalizacion, cirugias, traumatismos,
      inmunizaciones, dispositivos_drenaje,
      estado_cognitivo, mini_mental_resultado, mini_mental_fecha,
      abvd_bano, abvd_vestido, abvd_alimentacion, abvd_continencia, abvd_movilidad,
      downton_caidas_previas, downton_medicamentos, downton_deficit_sensorial,
      downton_estado_mental, downton_deambulacion, downton_edad, downton_total,
      vf_fecha, vf_ta, vf_fc, vf_fr, vf_temp, vf_spo2, vf_glucosa,
      vf_cabeza_cuello, vf_cardiopulmonar, vf_abdomen, vf_extremidades,
      vf_neurologico, vf_piel, vf_profesional, vf_fecha_evaluacion,
      // Braden Historia Clínica
      braden_percepcion, braden_humedad, braden_actividad, braden_movilidad,
      braden_nutricion, braden_friccion, braden_total: braden_total_hc, braden_fecha,
    } = body

    if (!nombre || !edad) {
      return NextResponse.json({ error: 'Nombre y edad son obligatorios' }, { status: 400 })
    }

    const result = await pool.query(
      `UPDATE pacientes SET
        nombre = $1, edad = $2, sexo = $3, fecha_nacimiento = $4, telefono = $5,
        diagnostico = $6, contacto = $7, doctor_encargado = $8, direccion = $9,
        tipo_sangre = $10, peso = $11, altura = $12, primera_visita = $13,
        motivo_consulta = $14, padecimiento_actual = $15,
        alergias = $16, antecedentes_medicos = $17, antecedentes_heredofamiliares = $18,
        antecedentes_patologicos = $19, antecedentes_no_patologicos = $20,
        estado_civil = $21, escolaridad = $22, religion = $23, telefono_local = $24,
        familiar_responsable = $25, familiar_tel_local = $26, familiar_tel_cel = $27,
        segundo_numero_emergencia = $28,
        tiene_servicio_medico = $29, cual_servicio_medico = $30, afiliacion = $31,
        medicos_tratantes = $32, motivo_atencion_domiciliaria = $33,
        enfermedades_cronicas = $34, ultima_hospitalizacion = $35,
        cirugias = $36, traumatismos = $37,
        inmunizaciones = $38, dispositivos_drenaje = $39,
        estado_cognitivo = $40, mini_mental_resultado = $41, mini_mental_fecha = $42,
        abvd_bano = $43, abvd_vestido = $44, abvd_alimentacion = $45,
        abvd_continencia = $46, abvd_movilidad = $47,
        downton_caidas_previas = $48, downton_medicamentos = $49,
        downton_deficit_sensorial = $50, downton_estado_mental = $51,
        downton_deambulacion = $52, downton_edad = $53, downton_total = $54,
        vf_fecha = $55, vf_ta = $56, vf_fc = $57, vf_fr = $58,
        vf_temp = $59, vf_spo2 = $60, vf_glucosa = $61,
        vf_cabeza_cuello = $62, vf_cardiopulmonar = $63, vf_abdomen = $64,
        vf_extremidades = $65, vf_neurologico = $66, vf_piel = $67,
        vf_profesional = $68, vf_fecha_evaluacion = $69,
        braden_percepcion = $70, braden_humedad = $71, braden_actividad = $72,
        braden_movilidad = $73, braden_nutricion = $74, braden_friccion = $75,
        braden_total = $76, braden_fecha = $77
       WHERE id = $78
       RETURNING *`,
      [
        nombre, Number(edad),
        sexo || null, fecha_nacimiento || null, telefono || null,
        diagnostico || null, contacto || null, doctor_encargado || null, direccion || null,
        tipo_sangre || null, peso || null, altura || null, primera_visita || null,
        motivo_consulta || null, padecimiento_actual || null,
        alergias || null, antecedentes_medicos || null, antecedentes_heredofamiliares || null,
        antecedentes_patologicos || null, antecedentes_no_patologicos || null,
        estado_civil || null, escolaridad || null, religion || null, telefono_local || null,
        familiar_responsable || null, familiar_tel_local || null, familiar_tel_cel || null, segundo_numero_emergencia || null,
        tiene_servicio_medico ?? null, cual_servicio_medico || null, afiliacion || null,
        medicos_tratantes || null, motivo_atencion_domiciliaria || null,
        enfermedades_cronicas || null, ultima_hospitalizacion || null, cirugias || null, traumatismos || null,
        inmunizaciones || null, dispositivos_drenaje || null,
        estado_cognitivo || null, mini_mental_resultado || null, mini_mental_fecha || null,
        abvd_bano || null, abvd_vestido || null, abvd_alimentacion || null, abvd_continencia || null, abvd_movilidad || null,
        downton_caidas_previas ?? null, downton_medicamentos ?? null, downton_deficit_sensorial ?? null,
        downton_estado_mental ?? null, downton_deambulacion ?? null, downton_edad ?? null, downton_total ?? null,
        vf_fecha || null, vf_ta || null, vf_fc ?? null, vf_fr ?? null,
        vf_temp ?? null, vf_spo2 ?? null, vf_glucosa ?? null,
        vf_cabeza_cuello || null, vf_cardiopulmonar || null, vf_abdomen || null,
        vf_extremidades || null, vf_neurologico || null, vf_piel || null,
        vf_profesional || null, vf_fecha_evaluacion || null,
        braden_percepcion ?? null, braden_humedad ?? null, braden_actividad ?? null, braden_movilidad ?? null,
        braden_nutricion ?? null, braden_friccion ?? null, braden_total_hc ?? null, braden_fecha || null,
        id,
      ]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ paciente: result.rows[0] })
  } catch {
    return NextResponse.json({ error: 'Error al actualizar paciente' }, { status: 500 })
  }
}

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
      `SELECT p.*, u.email AS usuario_email, uc.nombre AS creado_por_nombre
       FROM pacientes p
       LEFT JOIN usuarios u ON u.id = p.usuario_id
       LEFT JOIN usuarios uc ON uc.id = p.creado_por
       WHERE p.id = $1`,
      [id]
    )
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 })
    }
    return NextResponse.json({ paciente: result.rows[0] })
  } catch {
    return NextResponse.json({ error: 'Error al obtener paciente' }, { status: 500 })
  }
}
