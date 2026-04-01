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

  try {
    let result
    if (usuario.rol === 'enfermero') {
      if (search) {
        result = await pool.query(
          `SELECT * FROM pacientes
           WHERE ((archivado = $1) OR (archivado IS NULL AND $1 = false))
           AND (nombre ILIKE $2 OR CAST(edad AS TEXT) ILIKE $2)
           ORDER BY created_at DESC`,
          [verArchivados, searchLike]
        )
      } else {
        result = await pool.query(
          `SELECT * FROM pacientes
           WHERE (archivado = $1) OR (archivado IS NULL AND $1 = false)
           ORDER BY created_at DESC`,
          [verArchivados]
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
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
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
    const { nombre, edad, diagnostico, contacto, doctor_encargado, usuario_id } = await req.json()

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

    const result = await pool.query(
      `INSERT INTO pacientes (nombre, edad, diagnostico, contacto, doctor_encargado, usuario_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [nombre, edad, diagnostico, contacto, doctor_encargado, usuario_id || null]
    )

    return NextResponse.json({ paciente: result.rows[0] }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear paciente' }, { status: 500 })
  }
}
