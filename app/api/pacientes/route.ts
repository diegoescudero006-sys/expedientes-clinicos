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
      // Admin ve todos los pacientes
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
      // Enfermero solo ve sus pacientes asignados con asignación activa
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
          usuario_id, creado_por
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12,
          $13, $14, $15,
          $16, $17, $18,
          $19, $20,
          $21, $22
        ) RETURNING *`,
        [
          nombre, edad, sexo || null, fecha_nacimiento || null, telefono || null, direccion || null, contacto || null,
          tipo_sangre || null, peso || null, altura || null, primera_visita || null, doctor_encargado || null,
          motivo_consulta || null, padecimiento_actual || null, diagnostico || null,
          alergias || null, antecedentes_medicos || null, antecedentes_heredofamiliares || null,
          antecedentes_patologicos || null, antecedentes_no_patologicos || null,
          usuario_id || null, usuario.id
        ]
      )

      paciente = result.rows[0]

      // El enfermero se auto-asigna al crear; admin asigna manualmente desde /asignaciones
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
