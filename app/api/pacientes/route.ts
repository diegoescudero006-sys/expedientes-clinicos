import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getUsuario } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const usuario = getUsuario(req)
  if (!usuario) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const verArchivados = searchParams.get('archivados') === 'true'
  const search = (searchParams.get('search') || '').trim()
  const searchLike = `%${search}%`
  const LIMIT = 20
  const page = Math.max(1, Math.min(parseInt(searchParams.get('page') || '1', 10), 10000))
  const offset = (page - 1) * LIMIT

  try {
    let result

    if (usuario.rol === 'admin') {
      if (search) {
        result = await pool.query(
          `SELECT id, nombre, edad, diagnostico, contacto, doctor_encargado, archivado,
                  COUNT(*) OVER() AS total_count
           FROM pacientes
           WHERE ((archivado = $1) OR (archivado IS NULL AND $1 = false))
           AND (nombre ILIKE $2 OR CAST(edad AS TEXT) ILIKE $2)
           ORDER BY created_at DESC
           LIMIT $3 OFFSET $4`,
          [verArchivados, searchLike, LIMIT, offset]
        )
      } else {
        result = await pool.query(
          `SELECT id, nombre, edad, diagnostico, contacto, doctor_encargado, archivado,
                  COUNT(*) OVER() AS total_count
           FROM pacientes
           WHERE (archivado = $1) OR (archivado IS NULL AND $1 = false)
           ORDER BY created_at DESC
           LIMIT $2 OFFSET $3`,
          [verArchivados, LIMIT, offset]
        )
      }
    } else if (usuario.rol === 'enfermero') {
      if (search) {
        result = await pool.query(
          `SELECT p.id, p.nombre, p.edad, p.diagnostico, p.contacto, p.doctor_encargado, p.archivado,
                  COUNT(*) OVER() AS total_count
           FROM pacientes p
           INNER JOIN enfermeros_pacientes ep
             ON ep.paciente_id = p.id AND ep.enfermero_id = $1 AND ep.activo = true
           WHERE ((p.archivado = $2) OR (p.archivado IS NULL AND $2 = false))
           AND (p.nombre ILIKE $3 OR CAST(p.edad AS TEXT) ILIKE $3)
           ORDER BY p.created_at DESC
           LIMIT $4 OFFSET $5`,
          [usuario.id, verArchivados, searchLike, LIMIT, offset]
        )
      } else {
        result = await pool.query(
          `SELECT p.id, p.nombre, p.edad, p.diagnostico, p.contacto, p.doctor_encargado, p.archivado,
                  COUNT(*) OVER() AS total_count
           FROM pacientes p
           INNER JOIN enfermeros_pacientes ep
             ON ep.paciente_id = p.id AND ep.enfermero_id = $1 AND ep.activo = true
           WHERE ((p.archivado = $2) OR (p.archivado IS NULL AND $2 = false))
           ORDER BY p.created_at DESC
           LIMIT $3 OFFSET $4`,
          [usuario.id, verArchivados, LIMIT, offset]
        )
      }
    } else if (usuario.rol === 'paciente') {
      if (search) {
        result = await pool.query(
          `SELECT id, nombre, edad, diagnostico, contacto, doctor_encargado, archivado,
                  COUNT(*) OVER() AS total_count
           FROM pacientes
           WHERE usuario_id = $1
           AND ((archivado = $2) OR (archivado IS NULL AND $2 = false))
           AND (nombre ILIKE $3 OR CAST(edad AS TEXT) ILIKE $3)
           LIMIT $4 OFFSET $5`,
          [usuario.id, verArchivados, searchLike, LIMIT, offset]
        )
      } else {
        result = await pool.query(
          `SELECT id, nombre, edad, diagnostico, contacto, doctor_encargado, archivado,
                  COUNT(*) OVER() AS total_count
           FROM pacientes
           WHERE usuario_id = $1
           AND ((archivado = $2) OR (archivado IS NULL AND $2 = false))
           LIMIT $3 OFFSET $4`,
          [usuario.id, verArchivados, LIMIT, offset]
        )
      }
    } else {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
    }

    const total = parseInt(result.rows[0]?.total_count ?? '0', 10)
    const pacientes = result.rows.map(({ total_count, ...p }) => p)
    return NextResponse.json({ pacientes, total })
  } catch {
    return NextResponse.json({ error: 'Error al obtener pacientes' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const usuario = getUsuario(req)
  if (!usuario || (usuario.rol !== 'enfermero' && usuario.rol !== 'admin')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const {
      nombre, edad, sexo, fecha_nacimiento, telefono, direccion, contacto,
      tipo_sangre, peso, altura, primera_visita, doctor_encargado,
      motivo_consulta, padecimiento_actual, diagnostico,
      alergias, antecedentes_medicos, antecedentes_heredofamiliares,
      antecedentes_patologicos, antecedentes_no_patologicos,
      usuario_id,
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
    } = body

    if (!nombre || !edad) {
      return NextResponse.json({ error: 'Nombre y edad son requeridos' }, { status: 400 })
    }

    if (usuario_id) {
      const u = await pool.query(
        `SELECT id FROM usuarios WHERE id = $1 AND rol = 'paciente'`,
        [usuario_id]
      )
      if (u.rows.length === 0) {
        return NextResponse.json(
          { error: 'El usuario asociado no existe o no es un paciente' },
          { status: 400 }
        )
      }
    }

    const client = await pool.connect()
    let paciente
    try {
      await client.query('BEGIN')

      const result = await client.query(
        `INSERT INTO pacientes (
          nombre, edad, sexo, fecha_nacimiento, telefono, direccion, contacto,
          tipo_sangre, peso, altura, primera_visita, doctor_encargado,
          motivo_consulta, padecimiento_actual, diagnostico,
          alergias, antecedentes_medicos, antecedentes_heredofamiliares,
          antecedentes_patologicos, antecedentes_no_patologicos,
          usuario_id, creado_por,
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
          vf_neurologico, vf_piel, vf_profesional, vf_fecha_evaluacion
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12,
          $13, $14, $15,
          $16, $17, $18, $19, $20,
          $21, $22,
          $23, $24, $25, $26,
          $27, $28, $29, $30,
          $31, $32, $33,
          $34, $35,
          $36, $37, $38, $39,
          $40, $41,
          $42, $43, $44,
          $45, $46, $47, $48, $49,
          $50, $51, $52, $53, $54, $55, $56,
          $57, $58, $59, $60, $61, $62, $63,
          $64, $65, $66, $67, $68, $69, $70, $71
        ) RETURNING *`,
        [
          nombre, edad, sexo || null, fecha_nacimiento || null, telefono || null, direccion || null, contacto || null,
          tipo_sangre || null, peso || null, altura || null, primera_visita || null, doctor_encargado || null,
          motivo_consulta || null, padecimiento_actual || null, diagnostico || null,
          alergias || null, antecedentes_medicos || null, antecedentes_heredofamiliares || null,
          antecedentes_patologicos || null, antecedentes_no_patologicos || null,
          usuario_id || null, usuario.id,
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
          vf_fecha || null, vf_ta || null, vf_fc ?? null, vf_fr ?? null, vf_temp ?? null, vf_spo2 ?? null, vf_glucosa ?? null,
          vf_cabeza_cuello || null, vf_cardiopulmonar || null, vf_abdomen || null, vf_extremidades || null,
          vf_neurologico || null, vf_piel || null, vf_profesional || null, vf_fecha_evaluacion || null,
        ]
      )

      paciente = result.rows[0]

      if (usuario.rol === 'enfermero') {
        await client.query(
          `INSERT INTO enfermeros_pacientes (enfermero_id, paciente_id, activo) VALUES ($1, $2, true)`,
          [usuario.id, paciente.id]
        )
      }

      await client.query('COMMIT')
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }

    return NextResponse.json({ paciente }, { status: 201 })
  } catch (error) {
    console.error('Error creando paciente:', error)
    return NextResponse.json({ error: 'Error al crear paciente' }, { status: 500 })
  }
}
