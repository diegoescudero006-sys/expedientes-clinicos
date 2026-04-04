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

  const soloMios = searchParams.get('solo_mios') === 'true'

  try {
    let result
    if (usuario.rol === 'enfermero') {
      if (soloMios) {
        result = await pool.query(
          `SELECT p.*, true AS es_mio
           FROM pacientes p
           INNER JOIN enfermeros_pacientes ep ON ep.paciente_id = p.id AND ep.enfermero_id = $1
           WHERE ((p.archivado = $2) OR (p.archivado IS NULL AND $2 = false))
           ${search ? 'AND (p.nombre ILIKE $3 OR CAST(p.edad AS TEXT) ILIKE $3)' : ''}
           ORDER BY p.created_at DESC`,
          search ? [usuario.id, verArchivados, searchLike] : [usuario.id, verArchivados]
        )
      } else if (search) {
        result = await pool.query(
          `SELECT p.*, (ep.enfermero_id IS NOT NULL) AS es_mio
           FROM pacientes p
           LEFT JOIN enfermeros_pacientes ep ON ep.paciente_id = p.id AND ep.enfermero_id = $1
           WHERE ((p.archivado = $2) OR (p.archivado IS NULL AND $2 = false))
           AND (p.nombre ILIKE $3 OR CAST(p.edad AS TEXT) ILIKE $3)
           ORDER BY es_mio DESC, p.created_at DESC`,
          [usuario.id, verArchivados, searchLike]
        )
      } else {
        result = await pool.query(
          `SELECT p.*, (ep.enfermero_id IS NOT NULL) AS es_mio
           FROM pacientes p
           LEFT JOIN enfermeros_pacientes ep ON ep.paciente_id = p.id AND ep.enfermero_id = $1
           WHERE (p.archivado = $2) OR (p.archivado IS NULL AND $2 = false)
           ORDER BY es_mio DESC, p.created_at DESC`,
          [usuario.id, verArchivados]
        )
      }
    } else if (usuario.rol === 'paciente') {
      if (search) {
        result = await pool.query(
          `SELECT * FROM pacientes
           WHERE usuario_id = $1
           AND ((archivado = $2) OR (archivado IS NULL AND $2 = false))
           AND (nombre ILIKE $3 OR CAST(edad AS TEXT) ILIKE $3)`,
          [usuario.id, verArchivados, searchLike]
        )
      } else {
        result = await pool.query(
          `SELECT * FROM pacientes
           WHERE usuario_id = $1
           AND ((archivado = $2) OR (archivado IS NULL AND $2 = false))`,
          [usuario.id, verArchivados]
        )
      }
    } else {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
    }
    return NextResponse.json({ pacientes: result.rows })
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener pacientes' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const usuario = getUsuario(req)
  if (!usuario || usuario.rol !== 'enfermero') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const {
      nombre, edad, sexo, fecha_nacimiento, telefono, direccion, contacto,
      tipo_sangre, peso, altura, primera_visita, doctor_encargado,
      motivo_consulta, padecimiento_actual, diagnostico,
      alergias, antecedentes_medicos, antecedentes_heredofamiliares,
      antecedentes_patologicos, antecedentes_no_patologicos,
      usuario_id
    } = await req.json()

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
          usuario_id
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12,
          $13, $14, $15,
          $16, $17, $18,
          $19, $20,
          $21
        ) RETURNING *`,
        [
          nombre, edad, sexo || null, fecha_nacimiento || null, telefono || null, direccion || null, contacto || null,
          tipo_sangre || null, peso || null, altura || null, primera_visita || null, doctor_encargado || null,
          motivo_consulta || null, padecimiento_actual || null, diagnostico || null,
          alergias || null, antecedentes_medicos || null, antecedentes_heredofamiliares || null,
          antecedentes_patologicos || null, antecedentes_no_patologicos || null,
          usuario_id || null
        ]
      )

      paciente = result.rows[0]

      await client.query(
        `INSERT INTO enfermeros_pacientes (enfermero_id, paciente_id) VALUES ($1, $2)`,
        [usuario.id, paciente.id]
      )

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