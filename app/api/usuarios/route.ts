import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import bcrypt from 'bcryptjs'
import { getUsuario } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const usuario = getUsuario(req)
  if (!usuario || (usuario.rol !== 'enfermero' && usuario.rol !== 'admin')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { nombre, email, password, rol } = await req.json()

    if (!nombre || !email || !password || !rol) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 })
    }

    if (rol !== 'enfermero' && rol !== 'paciente' && rol !== 'admin') {
      return NextResponse.json({ error: 'Rol no válido' }, { status: 400 })
    }

    if (rol === 'admin' && usuario.rol !== 'admin') {
      return NextResponse.json({ error: 'Solo un administrador puede crear otros administradores' }, { status: 403 })
    }

    if (rol === 'enfermero' && usuario.rol !== 'admin') {
      return NextResponse.json({ error: 'Solo un administrador puede crear enfermeros' }, { status: 403 })
    }

    const hash = await bcrypt.hash(password, 10)
    try {
      const result = await pool.query(
        `INSERT INTO usuarios (nombre, email, password, rol)
         VALUES ($1, $2, $3, $4) RETURNING id, nombre, email, rol`,
        [nombre, email, hash, rol]
      )
      return NextResponse.json({ usuario: result.rows[0] }, { status: 201 })
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && (err as { code?: string }).code === '23505') {
        return NextResponse.json({ error: 'Ya existe un usuario con ese correo' }, { status: 400 })
      }
      throw err
    }
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 })
  }
}
